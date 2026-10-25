# Aktualizacja profilu gramatycznego przez skrypt

Wersja algorytmu: `grammar-profile-update/1.0.0`.
Dotyczy przekazanego `profile.schema.json` w wersji `2.0.0`. Jedynym obsługiwanym formatem zadania jest `fill_blank`.

## 1. Podział odpowiedzialności

| Element | Odpowiedzialność |
| --- | --- |
| Mechanizm sprawdzania odpowiedzi | Ustala, czy pierwsza odpowiedź została zaliczona; przekazuje identyfikator zaakceptowanego rozwiązania, jeżeli istnieje. |
| Agent | Uruchamia się wyłącznie dla pierwszej odpowiedzi odrzuconej przez mechanizm sprawdzania. Zwraca diagnozę według `evaluation_rules.md`. |
| Skrypt | Tworzy profil, rejestruje ekspozycję, waliduje obserwacje, wykonuje obliczenia i zapisuje profil. |
| Generator zadania | Określa ćwiczone warianty oraz sprawdzone reguły, które można potwierdzić po zaakceptowaniu konkretnego rozwiązania. |
| FSRS | Ma osobny przepływ i stan. Ten algorytm go nie odczytuje i nie aktualizuje. |

Agent nie zwraca gotowego profilu ani wartości liczbowych. Skrypt nie interpretuje języka naturalnego, nie rozpoznaje reguł gramatycznych i nie dopasowuje semantycznie opisów błędów.

## 2. Zasada dotycząca poprawnych odpowiedzi

Ograniczenie wywołań agenta do błędnych odpowiedzi nie oznacza ograniczenia danych profilu do błędów. Pomijanie sukcesów w modelu Beta powodowałoby jednostronny spadek `mastery` i wzrost `confidence` oparty na wyselekcjonowanych porażkach.

Dlatego przy poprawnej pierwszej odpowiedzi skrypt stosuje **wcześniej zweryfikowaną mapę potwierdzanych kompetencji** z definicji zadania. Nie wykonuje dodatkowej oceny językowej. Mapa jest przygotowywana podczas generowania lub zatwierdzania zadania, nie po otrzymaniu poprawnej odpowiedzi. Samo pole „cel gramatyczny” nie wystarcza.

Każdy wpis mapy musi potwierdzać, że zaakceptowane rozwiązanie rzeczywiście wymagało rozstrzygnięcia danej reguły przez użytkownika. Jeżeli reguła występuje tylko w podanej części zdania albo jest pomijana przez poprawną alternatywę, nie umieszczaj jej w mapie tego rozwiązania.

Gdy mapy brakuje, skrypt zapisuje ekspozycję i próbę odpowiedzi, lecz nie tworzy obserwacji kompetencji. Nie wywołuje agenta dla poprawnej odpowiedzi i nie zgaduje ocen. Taki przypadek raportuje jako `missing_success_checks`. Regularne aktualizowanie opanowania wymaga zatem przygotowania tej mapy w zadaniach.

Przy odpowiedzi odrzuconej przez mechanizm sprawdzania agent może wykryć zarówno błędy, jak i poprawne zastosowania wariantów. Skrypt stosuje oba rodzaje ocenialnych obserwacji. `answer_classification` opisuje całą odpowiedź, ale nie jest oceną kompetencji: w szczególności `acceptable_alternative` nie jest problemem ani samoistnym powodem zmiany profilu. Dodatnie obserwacje wynikają z `observations[].result`, także gdy klasyfikacja całej odpowiedzi to `acceptable_alternative` lub `non_grammar_error`. Diagnoza nie zmienia pierwotnego wyniku sprawdzania ani stanu zapisanego przez osobny przepływ FSRS.

## 3. Dane wejściowe skryptu

### 3.1. Pliki

- `evaluation_config.json` — parametry liczbowe modelu oraz progi i limit dowodów trudności;
- `profile.schema.json` — przekazany schemat, bez zmian;
- aktualny `profile.json`, jeżeli już istnieje;
- dokładne bajty taksonomii wskazanej w `profile.taxonomy`;
- zdarzenie pokazania zadania lub udzielenia odpowiedzi, definicja zadania i ewentualny wynik agenta;
- trwały dziennik zdarzeń i zastosowanych obserwacji potrzebny do deduplikacji oraz korekty rozliczonych ocen.

Przy aktualizacji `config.bayesian_model` musi dokładnie odpowiadać `profile.bayesian_model` i stałym ze schematu. Nie nadpisuj istniejącej polityki nową konfiguracją ani nie resetuj parametrów. Niezgodność wymaga osobnej, jawnej migracji. Wagi `1`, `0.5`, prior `1/1`, skala `10` i parametry EMA pochodzą z dostarczonego schematu; nie są tutaj ponownie dobierane.

Konfiguracja ma tylko dwie sekcje: `bayesian_model` oraz `difficulty_parameters`. Nie zawiera szablonu profilu, wersji algorytmu, reguł wywoływania agenta, sposobu zapisu ani zasad walidacji. Te elementy określają skrypt i niniejszy dokument, a reguły diagnozy — `evaluation_rules.md`.

`VALIDATE_CONFIG` wymaga dokładnie tych dwóch sekcji. Sekcja `bayesian_model` musi odpowiadać definicji `$defs.bayesian_model` schematu. W `difficulty_parameters` wymagane są dokładnie trzy pola z pliku: dodatnie liczby całkowite, przy czym `medium_min_distinct_presentations >= 2`, `high_min_distinct_presentations > medium_min_distinct_presentations` i `max_evidence_per_difficulty >= high_min_distinct_presentations`. Nieznane pola i niezgodne wartości powodują błąd. Przy podanych wartościach jedna obserwacja oznacza `low`, od dwóch — `medium`, a od czterech — `high`; przechowywanych jest do pięciu najnowszych dowodów.

### 3.2. Tożsamość prezentacji i zdarzenia

Prezentację zadania identyfikuje `(profile_id, activity_id, item_id)`. `item_id` musi identyfikować konkretne wystąpienie zadania w aktywności. Jeżeli przechowywany identyfikator ćwiczenia jest ponownie wykorzystywany w tej samej aktywności, aplikacja nadaje osobny identyfikator wystąpienia i używa go tutaj jako `item_id`.

Każde zdarzenie ma niezmienny `event_id`. Zdarzenie odpowiedzi dodatkowo zawiera `attempt_number`, numerowany od 1 w ramach prezentacji, oraz czas `observed_at`. Tylko pierwsza odpowiedź może zmienić parametry modelu. Poprawianie odpowiedzi po informacji zwrotnej nie zwiększa liczby obserwacji ani `alpha`.

Wszystkie czasy są zaufanymi znacznikami RFC 3339 ze strefą. `shown_at` to czas pokazania, `observed_at` to czas odpowiedzi, a `committed_at` to czas zapisu. Nie zastępuj czasu obserwacji czasem wywołania agenta.

### 3.3. Metadane zadania

Poniższe pola są kontraktem skryptu z generatorem i mechanizmem sprawdzania odpowiedzi; nie są nowymi polami profilu:

```text
task_type: "fill_blank"
practice_variant_ids: unikalne identyfikatory faktycznie ćwiczonych wariantów
success_checks_by_answer_key:
  klucz zaakceptowanego rozwiązania:
    lista { taxonomy_node_id, evidence_class: direct | indirect }
```

Sprawdzający poprawną odpowiedź przekazuje `accepted_answer_key`, który wskazuje gotowy wpis mapy. Dopuszczalne warianty zapisu mogą współdzielić klucz tylko wtedy, gdy sprawdzają te same reguły. Nie normalizuj znaków istotnych gramatycznie. Swobodnej alternatywy bez zweryfikowanego mapowania nie traktuj jak rozwiązania potwierdzającego cele ćwiczenia.

`practice_variant_ids` nie obejmuje wszystkich struktur widocznych w zdaniu. Lista może być pusta, np. gdy zadanie jest wyłącznie leksykalne. Jeżeli diagnoza błędnej odpowiedzi ujawni dodatkowy wariant rzeczywiście użyty w odpowiedzi, skrypt może powiązać tę prezentację z tym wariantem i uzupełnić ekspozycję na podstawie zweryfikowanego zdarzenia pokazania.

## 4. Utworzenie profilu

Profil jest kompletny: jeden wpis na każdy wariant taksonomii, również niećwiczony. Nie twórz wpisów dla kategorii, konstrukcji ani aspektów CEFR.

```text
FUNCTION CREATE_PROFILE(config, schema, taxonomy_bytes, identity, created_at):
    VALIDATE_CONFIG(config, schema)
    taxonomy = PARSE_JSON(taxonomy_bytes)
    variant_ids = EXTRACT_ALL_VARIANT_IDS(taxonomy)
    REQUIRE variant_ids are nonempty and unique
    REQUIRE every ID matches schema.$defs.competency.properties.taxonomy_node_id
    REQUIRE identity.profile_id and identity.learner_id are nonempty
    REQUIRE identity.taxonomy_id and identity.taxonomy_uri are supplied

    profile = {
        schema_version: "2.0.0",
        profile_id: identity.profile_id,
        learner_id: identity.learner_id,
        language: "it",
        taxonomy: {
            id: identity.taxonomy_id,
            schema_version: taxonomy.schema_version,
            sha256: SHA256(taxonomy_bytes),
            uri: identity.taxonomy_uri
        },
        bayesian_model: DEEP_COPY(config.bayesian_model),
        estimated_user_level: {
            cefr_level: null, confidence: 0,
            assessment: {assessed_at: null, source: "none", method: "none",
                         evidence_count: 0, algorithm_version: null}
        },
        created_at: created_at,
        updated_at: created_at,
        competencies: []
    }

    FOR variant_id IN SORT(variant_ids):
        competency = NEW_COMPETENCY(variant_id, config.bayesian_model)
        APPEND profile.competencies, competency

    VALIDATE_PROFILE_AND_INVARIANTS(profile, schema, taxonomy_bytes, config)
    COMMIT_ATOMICALLY(profile, NEW_EXTERNAL_LEDGER())
    RETURN profile
```

Wartości początkowe są częścią implementacji zgodnej ze schematem, a nie szablonem danych w konfiguracji:

```text
FUNCTION NEW_COMPETENCY(variant_id, model):
    RETURN {
        taxonomy_node_id: variant_id,
        alpha: model.prior_alpha,
        beta: model.prior_beta,
        mastery: model.prior_alpha / (model.prior_alpha + model.prior_beta),
        confidence: 0,
        trend: "insufficient_data",
        trend_state: {
            previous_mastery: null, smoothed_delta: 0, assessable_updates: 0
        },
        exposure: {
            tasks_shown: 0, tasks_attempted: 0,
            last_shown_at: null, task_types_seen: []
        },
        performance: {
            first_attempts: 0, first_attempt_correct: 0, last_attempt_at: null
        },
        difficulties: [],
        assessment: {
            assessed_at: null, source: "none", method: "none",
            evidence_count: 0,
            evidence_window_start: null, evidence_window_end: null,
            algorithm_version: null
        }
    }
```

Początkowe `mastery=0.5` jest średnią prioru, a nie wynikiem użytkownika. O braku ocen świadczą `confidence=0`, zerowe liczniki oraz `assessment.source="none"`.

Poziom ogólny inicjalizuj jako nieznany zgodnie ze schematem i powyższym pseudokodem. Istniejącego CEFR nie zmieniaj w tym przepływie. Nie wyznaczaj go z pojedynczego błędu ani z poziomu CEFR wariantu.

## 5. Ekspozycja i próby odpowiedzi

Ekspozycja opisuje rzeczywiste zdarzenia, również poprawne odpowiedzi, pominięcia i nieocenialne próby. Nie jest licznikiem wywołań agenta. Potrzebne są zdarzenia pokazania zadań, ponieważ bez nich nie można poprawnie policzyć zadań pominiętych.

Stan deduplikacji jest przechowywany poza profilem, ponieważ schemat zabrania dodatkowych pól. Ledger przechowuje identyfikatory i skróty zdarzeń, powiązania prezentacja–wariant oraz znaczniki zastosowania ocen. Dla korekt rozliczonych zdarzeń przechowuje też niezmienny, uporządkowany dziennik danych potrzebnych do odtworzenia profilu: zweryfikowane zdarzenia cyklu zadania, migawkę istotnych metadanych zadania i taksonomii, zastosowane obserwacje z klasą dowodu i danymi błędów oraz identyfikatory rewizji diagnozy. Pełna pierwotna odpowiedź potrzebna do ponownej diagnozy może być przechowywana w osobnym, zaufanym źródle; do samego odtworzenia profilu wystarczają zapisane zdarzenia i obserwacje. Bez kompletnego dziennika automatyczna korekta starych ocen nie jest możliwa i wymaga jawnej migracji lub odtworzenia z innego wiarygodnego źródła.

```text
FUNCTION REGISTER_LIFECYCLE(profile, ledger, presentation, variant_ids):
    REQUIRE presentation has verified shown_at and task_type == "fill_blank"
    REQUIRE all variant_ids exist in profile

    FOR variant_id IN UNIQUE(variant_ids):
        c = FIND_COMPETENCY(profile, variant_id)
        key = (profile.profile_id, presentation.activity_id,
               presentation.item_id, variant_id)

        IF NOT ledger.shown.contains(key):
            c.exposure.tasks_shown += 1
            ledger.shown.add(key)
        c.exposure.last_shown_at = MAX_TIME(c.exposure.last_shown_at,
                                            presentation.shown_at)
        c.exposure.task_types_seen = SORTED_UNION(
            c.exposure.task_types_seen, [presentation.task_type])

        IF presentation has an actual answer attempt:
            IF NOT ledger.attempted.contains(key):
                c.exposure.tasks_attempted += 1
                ledger.attempted.add(key)
            c.performance.last_attempt_at = MAX_TIME(
                c.performance.last_attempt_at,
                presentation.latest_attempt_at)
```

Wywołuj tę funkcję przy pokazaniu dla `practice_variant_ids`, przy odpowiedzi dla tych samych wariantów oraz po diagnozie dla dodatkowych wariantów, których użycie przez użytkownika potwierdza ocenialna obserwacja. `not_assessable` samo w sobie nie uzasadnia dodania nowego wariantu do ekspozycji. Operacje muszą korzystać z tego samego ledgera, aby odpowiedź nie naliczyła ponownie pokazanego zadania.

Przy pominięciu nie zwiększaj `tasks_attempted`. Przy kolejnej próbie tej samej prezentacji aktualizuj tylko czas ostatniej próby dla powiązanych wariantów; nie zwiększaj liczby zadań, liczników ocen ani stanu Bayesa. Powiązania obejmują również warianty wcześniej wykryte przez agenta dla tej prezentacji.

## 6. Wybór ścieżki i zastosowanie oceny

Zdarzenia jednej prezentacji obsługuj w kolejności: pokazanie, pierwsza odpowiedź, dalsze próby. Zdarzenie otrzymane poza kolejnością kolejkuj do czasu dostępności wcześniejszych danych; nie uznawaj drugiej próby za pierwszą. Jeden profil powinien mieć uporządkowany strumień zapisów, także przy równoległych odpowiedziach interfejsu.

```text
FUNCTION HANDLE_EVENT(event):
    VALIDATE_TRUSTED_EVENT(event)
    REQUIRE canonical presentation identity and immutable task snapshot

    ATOMIC_TRANSACTION:
        profile, ledger = LOAD_CURRENT_STATE_AND_RECOVER_PENDING_COMMIT()
        VERIFY_SCHEMA_TAXONOMY_AND_CONFIG(profile)
        IF ledger.event_id_exists(event.event_id):
            REQUIRE ledger.payload_hash(event.event_id) == HASH(event)
            IF ledger.event_is_complete(event.event_id):
                RETURN stored processing status   # no writes, no agent call
            # Same pending event may resume; lifecycle operations are idempotent.
        ELSE:
            ledger.register_pending(event.event_id, HASH(event))

        presentation = GET_VERIFIED_PRESENTATION(event)
        ledger.record_verified_event_and_task_snapshot(event, presentation, task)
        ids = task.practice_variant_ids UNION ledger.linked_variants(presentation)
        REGISTER_LIFECYCLE(profile, ledger, presentation, ids)

        IF event.type == shown OR event.type == skipped:
            ledger.mark_complete(event.event_id)
            VALIDATE_AND_COMMIT_IF_CHANGED(profile, ledger)
            RETURN lifecycle_only

        IF event.attempt_number > 1:
            ledger.mark_complete(event.event_id)
            VALIDATE_AND_COMMIT_IF_CHANGED(profile, ledger)
            RETURN later_attempt_without_grade

        ledger.claim_first_answer(presentation, event.event_id)
        # A different event claiming the same first answer is a conflict,
        # not a second observation. A retry of this pending event may resume.
        SAVE_INPUT_REVISION_AND_TASK_FINGERPRINT(ledger, event)
        VALIDATE_AND_COMMIT_IF_CHANGED(profile, ledger)

    # Language analysis is outside the profile-write transaction.
    IF event.initial_grading == correct:
        REQUIRE accepted_answer_key comes from trusted checker
        checks = task.success_checks_by_answer_key[accepted_answer_key]
        IF checks do not exist:
            observations = []
            status = missing_success_checks
        ELSE:
            observations = [
                {taxonomy_node_id: x.taxonomy_node_id,
                 result: correct,
                 evidence_class: x.evidence_class,
                 reason: "prevalidated success check", errors: []}
                FOR x IN checks
            ]
            status = evaluated_without_agent
    ELSE:
        REQUIRE event.initial_grading == incorrect
        result = GET_CACHED_OR_CALL_AGENT_FOR(event.event_id)
        VALIDATE_AGENT_CONTRACT(result, event, taxonomy)
        IF result.status == cannot_evaluate:
            MARK_COMPLETE_WITHOUT_GRADE(event, result.reason)
            RETURN cannot_evaluate
        observations = result.observations
        status = evaluated_by_agent

    # Validate the entire observation batch before any model mutation.
    VALIDATE_OBSERVATIONS(observations, taxonomy, config)
    # On validation failure keep lifecycle data, leave the grade pending;
    # report the cause. Never apply a subset of an invalid response.

    ATOMIC_TRANSACTION:
        profile, ledger = LOAD_CURRENT_STATE_AND_RECOVER_PENDING_COMMIT()
        VERIFY_SCHEMA_TAXONOMY_AND_CONFIG(profile)
        REQUIRE saved task and taxonomy fingerprints still match
        REQUIRE event is the claimed first answer of this presentation
        IF ledger.event_is_complete(event.event_id):
            RETURN stored processing status

        REGISTER_LIFECYCLE(profile, ledger, presentation,
                           IDs(ASSESSABLE(observations)))

        FOR observation IN observations:
            IF observation.result == not_assessable:
                CONTINUE
            grade_key = (profile.profile_id, event.activity_id,
                         event.item_id, observation.taxonomy_node_id)
            REQUIRE grade_key not in ledger.applied_grades
            c = FIND_COMPETENCY(profile, observation.taxonomy_node_id)
            APPLY_ASSESSABLE_OBSERVATION(c, observation, event, config)
            ledger.applied_grades.add(grade_key)

        ledger.record_applied_batch(event.event_id, observations,
                                    result if status == evaluated_by_agent else null)
        ledger.mark_complete(event.event_id, status)
        VALIDATE_AND_COMMIT_IF_CHANGED(profile, ledger)
        RETURN status
```

`MARK_COMPLETE_WITHOUT_GRADE` również wykonuje atomowy zapis ledgera, zachowuje wynik agenta i nie zmienia parametrów ani metadanych oceny kompetencji. Błąd techniczny wywołania agenta pozostawia zdarzenie oczekujące do ponowienia; prawidłowy wynik `cannot_evaluate` kończy je bez oceny.

Poprawny wynik agenta można zachować przy oczekującym zdarzeniu, aby ponowienie zapisu nie wymagało kolejnej diagnozy. Nie łącz dwóch różnych diagnoz tej samej odpowiedzi. Dla rozliczonego zdarzenia zachowaj zastosowaną partię w dzienniku potrzebnym do korekt. Ponowna ocena rozliczonego zdarzenia wymaga procedury z § 10, a nie kolejnego dodania obserwacji.

### 6.1. Walidacja kontraktu agenta

`VALIDATE_AGENT_CONTRACT` sprawdza cały wynik przed zastosowaniem jakiejkolwiek obserwacji. Wymagaj dokładnie jednego obiektu JSON bez dodatkowych pól. W obiekcie głównym wymagane są dokładnie `contract_version`, `event_id`, `status`, `answer_classification`, `reason` i `observations`. `contract_version` musi mieć obsługiwaną wartość `2.0.0` i odpowiadać wejściu; `event_id` musi być identyczny ze zdarzeniem. `reason` jest niepustym tekstem. Dopuszczalne wartości `status` to `ok` i `cannot_evaluate`, a wartości `answer_classification` to `grammar_error`, `non_grammar_error`, `acceptable_alternative`, `not_assessable`.

Przy `cannot_evaluate` wymagaj `answer_classification="not_assessable"`, pustego `observations` i konkretnego `reason`. Taki wynik kończy zdarzenie bez oceny kompetencji. Przy `ok` pusta lista obserwacji jest dozwolona. `grammar_error` wymaga co najmniej jednej obserwacji `incorrect`; pozostałe klasyfikacje nie mogą zawierać `incorrect`. Nie wyprowadzaj obserwacji z klasyfikacji całej odpowiedzi. Nie zmieniaj na jej podstawie `initial_grading`, `accepted_answer_key` ani FSRS. Rozbieżność między klasyfikacją agenta a pierwotnym odrzuceniem można zgłosić mechanizmowi sprawdzania do osobnej weryfikacji, bez blokowania poprawnych obserwacji gramatycznych.

Każda obserwacja ma dokładnie pola `taxonomy_node_id`, `result`, `evidence_class`, `reason`, `errors`. Identyfikator musi wskazywać rzeczywiste `variants[].id` przypiętej taksonomii i wystąpić najwyżej raz w partii. `reason` jest niepusty. Dopuszczalne pary to `correct` lub `incorrect` z `direct` albo `indirect` oraz `not_assessable` wyłącznie z `not_assessable`. Dla `incorrect` wymagaj niepustej tablicy `errors`; dla pozostałych wyników `errors=[]`.

Każdy błąd ma dokładnie pola `code`, `description`, `grammar_context`, `communication_context`, `expected_answer`, `learner_answer`. Wszystkie są niepustymi tekstami; `code` spełnia wzorzec `^[a-z0-9]+(?:[._-][a-z0-9]+)*$`. W jednej obserwacji nie dopuszczaj powtórzenia kodu. Skrypt może sprawdzić strukturę, przynależność identyfikatorów i zgodność pól, ale nie rozstrzyga semantycznie, czy kod opisuje ten sam rodzaj błędu. Jawnie sprzeczne dane lub niezgodny kontrakt odrzuć w całości. Zachowaj zarejestrowaną ekspozycję, pozostaw ocenę oczekującą i zwróć błąd do poprawienia wyniku agenta; nie wybieraj arbitralnie części obserwacji.

`VALIDATE_OBSERVATIONS` stosuje te same ograniczenia do partii pochodzącej z mapy sukcesu, z wyjątkiem pól agenta: wpis mapy musi mieć istniejący `taxonomy_node_id`, unikalny w danym kluczu rozwiązania, oraz `evidence_class` równy `direct` lub `indirect`. Pusty wpis mapy nie tworzy oceny. Brak klucza mapy daje `missing_success_checks`; wadliwy istniejący wpis jest błędem danych zadania, a nie brakiem mapy.

## 7. Aktualizacja pojedynczej kompetencji

```text
FUNCTION APPLY_ASSESSABLE_OBSERVATION(c, o, event, config):
    REQUIRE o.result IN [correct, incorrect]
    REQUIRE o.evidence_class IN [direct, indirect]
    w = config.bayesian_model.diagnostic_weights[o.evidence_class]
    REQUIRE w > 0

    previous = c.mastery
    old_smoothed = c.trend_state.smoothed_delta

    IF o.result == correct:
        c.alpha += w
    ELSE:
        c.beta += w

    c.mastery = c.alpha / (c.alpha + c.beta)
    n = c.alpha + c.beta
        - config.bayesian_model.prior_alpha
        - config.bayesian_model.prior_beta
    c.confidence = n / (n + config.bayesian_model.confidence_scale)

    c.trend_state.previous_mastery = previous
    lambda = config.bayesian_model.trend_ema_factor
    c.trend_state.smoothed_delta =
        lambda * (c.mastery - previous) + (1 - lambda) * old_smoothed
    c.trend_state.assessable_updates += 1

    threshold = config.bayesian_model.trend_threshold
    IF n < config.bayesian_model.trend_min_effective_n:
        c.trend = insufficient_data
    ELSE IF c.trend_state.smoothed_delta > threshold:
        c.trend = improving
    ELSE IF c.trend_state.smoothed_delta < -threshold:
        c.trend = declining
    ELSE:
        c.trend = stable

    c.performance.first_attempts += 1
    IF o.result == correct:
        c.performance.first_attempt_correct += 1
    # last_attempt_at was already set by REGISTER_LIFECYCLE.

    IF o.result == incorrect:
        FOR error IN o.errors:
            MERGE_DIFFICULTY(c, error, event, config.difficulty_parameters)

    c.assessment.assessed_at = COMMIT_TIME()
    c.assessment.source = "practice"
    c.assessment.method = "automatic"
    c.assessment.evidence_count += 1
    c.assessment.evidence_window_start = MIN_TIME(
        c.assessment.evidence_window_start, event.observed_at)
    c.assessment.evidence_window_end = MAX_TIME(
        c.assessment.evidence_window_end, event.observed_at)
    c.assessment.algorithm_version = "grammar-profile-update/1.0.0"
```

`MIN_TIME` i `MAX_TIME` traktują `null` jako brak wartości. Źródło `practice` i metoda `automatic` opisują tę aktualizację; nie oznaczają, że skrypt sam wykonał diagnozę językową. Zmieniane pola `assessment` są metadanymi aktualnego oszacowania, nie listą wszystkich wcześniejszych źródeł.

Licznik `performance.first_attempt_correct` dotyczy poprawności **danego wariantu** w pierwszej odpowiedzi, nie zaliczenia całego zadania. Waga `0.5` nadal oznacza jedną surową obserwację: liczniki zwiększają się o `1`, a parametr Bayesa o `0.5`.

`not_assessable` nie zmienia `performance.first_attempts`, `first_attempt_correct`, `alpha`, `beta`, `mastery`, `confidence`, `trend`, `trend_state`, `difficulties` ani `assessment`. Ekspozycja i czas rzeczywistej próby mogą być już zaktualizowane przez zdarzenia cyklu zadania.

## 8. Scalanie trudności

W bieżącej polityce każdy jednoznacznie zdiagnozowany błąd tworzy trudność o niskim priorytecie; powtórzenia zwiększają priorytet. Jest to jawna polityka aplikacji, nie empiryczny pomiar znaczenia błędu. Agent dokonuje semantycznego wyboru kodu, skrypt wykonuje wyłącznie dopasowanie `(taxonomy_node_id, code)`.

```text
FUNCTION MERGE_DIFFICULTY(c, error, event, parameters):
    d = FIND_BY_CODE(c.difficulties, error.code)
    IF d does not exist:
        d = {code: error.code,
             description: error.description,
             severity: "low",
             contexts: [], evidence: []}
        APPEND c.difficulties, d

    context = {
        task_type: event.task_type,
        grammar_context: error.grammar_context,
        communication_context: error.communication_context
    }
    d.contexts = EXACT_TUPLE_UNION(d.contexts, [context])

    evidence = {
        activity_id: event.activity_id,
        item_id: event.item_id,
        observed_at: event.observed_at,
        task_type: event.task_type,
        expected_answer: error.expected_answer,
        learner_answer: error.learner_answer
    }
    merged = DEDUPLICATE_BY_ACTIVITY_AND_ITEM(d.evidence + [evidence])
    # A duplicate key with different content is a conflict, not an overwrite.
    count = LENGTH(merged)
    candidate = low
    IF count >= parameters.high_min_distinct_presentations:
        candidate = high
    ELSE IF count >= parameters.medium_min_distinct_presentations:
        candidate = medium

    d.severity = MAX_BY_ORDER(d.severity, candidate, [low, medium, high])
    d.evidence = TAKE_NEWEST(merged, parameters.max_evidence_per_difficulty,
                            order=[observed_at, activity_id, item_id])
    # Keep existing description; the new evidence records the current case.
```

Konfiguracja wymaga `max_evidence_per_difficulty >= high_min_distinct_presentations`. Dzięki temu ograniczona lista dowodów pozwala osiągnąć najwyższy próg bez nowego pola licznika w profilu. Zachowanie większej z dotychczasowej i nowej `severity` zapobiega utracie priorytetu po obcięciu listy. Po imporcie skróconej listy wcześniejsze nieudokumentowane powtórzenia nie są odtwarzane z domysłów.

Poprawne zastosowanie zwiększa `alpha` kompetencji, lecz w tej wersji nie usuwa konkretnej trudności i nie obniża jej `severity`. Schemat nie przechowuje stanu potwierdzonych sukcesów dla każdego typu błędu, potrzebnego do powtarzalnej automatycznej oceny jego przezwyciężenia. Priorytet trudności opisuje więc zarejestrowany problem do dalszego ćwiczenia; jej zamknięcie wymaga osobnej jawnej operacji. Nie dodawaj nieistniejących pól typu `resolved` lub `success_streak`.

## 9. Walidacja

Przed zapisem sprawdzaj cały profil walidatorem JSON Schema Draft 2020-12 z kontrolą formatów dat i URI oraz następujące inwarianty:

1. Zbiór `taxonomy_node_id` jest dokładnie zbiorem wariantów taksonomii, bez duplikatów. Skrót SHA-256 dotyczy dokładnych bajtów pliku, nie ponownie serializowanego JSON.
2. `profile.bayesian_model` odpowiada konfiguracji i stałym schematu. Parametry są skończonymi liczbami; nie dopuszczaj `NaN` ani nieskończoności.
3. `mastery = alpha/(alpha+beta)` oraz `confidence = n/(n+confidence_scale)` z tolerancją techniczną skryptu `1e-12`. Przechowuj pełną dostępną precyzję, zaokrąglaj dopiero przy wyświetlaniu.
4. `first_attempt_correct <= first_attempts <= tasks_attempted <= tasks_shown`.
5. `trend_state.assessable_updates = assessment.evidence_count = performance.first_attempts` dla profili obsługiwanych tym algorytmem. Import musi zachować te znaczenia albo przejść osobną migrację.
6. `alpha + beta - 2` mieści się pomiędzy `0.5 * evidence_count` a `evidence_count`; przy zerowych obserwacjach wynosi zero. Ponadto `alpha-1` mieści się pomiędzy `0.5 * first_attempt_correct` a `first_attempt_correct`, a `beta-1` pomiędzy połową a całością liczby błędnych ocen. Porównania liczb zmiennoprzecinkowych używają tej samej tolerancji technicznej `1e-12`.
7. `trend` wynika z efektywnego `n` i zapisanego `smoothed_delta`; przed pierwszą oceną stan odpowiada dokładnie wartościom początkowym.
8. Dla zerowych liczników ekspozycji i prób odpowiednie czasy są `null`; dodatnie liczniki wymagają czasów. Dodatnie `tasks_shown` wymaga niepustego `task_types_seen`. Okno dowodów jest uporządkowane, a jego koniec nie jest późniejszy niż `assessed_at`.
9. Kody trudności są unikalne w obrębie kompetencji. Dowody jednej trudności nie powtarzają pary `(activity_id, item_id)`. Trudności mają co najmniej jeden kontekst i dowód oraz poprawną strukturę.
10. Nowa partia obserwacji zawiera najwyżej jedną obserwację na wariant. Wszystkie identyfikatory istnieją; wyniki, klasy i listy błędów odpowiadają kontraktowi. Nie naprawiaj sprzecznych wyników agenta przez dowolne wybranie jednego z nich.

Nie można zweryfikować historycznego przebiegu EMA wyłącznie z bieżącego profilu. Skrypt weryfikuje poprawność bieżącego kroku na podstawie stanu przed zmianą oraz zgodność aktualnej etykiety z zapisanym stanem. Nie wylicza EMA ponownie z historii odpowiedzi.

Zmiana treści taksonomii jest wykrywana przez skrót. Ten przepływ jej nie migruje i nie interpretuje identyfikatorów według innej treści. Nie jest do tego potrzebne wersjonowanie treści taksonomii; wystarcza kontrola zgodności wymagana przez przekazany schemat.

## 10. Zapis i odporność na ponowienia

### 10.1. Korekta rozliczonej diagnozy

Korekta jest nowym, jawnie oznaczonym zdarzeniem z własnym `correction_id`, wskazującym rozliczone `event_id`, oczekiwaną rewizję diagnozy i powód zmiany. Zastępuje całą wcześniejszą partię diagnozy tego zdarzenia, także gdy nowy wynik ma `cannot_evaluate` lub `status="ok"` z pustymi obserwacjami. Nie wykonuj korekty przez ponowne podanie pierwotnego `event_id`; zwykły duplikat nadal zwraca zapisany status. Nowa diagnoza musi odnosić się do tej samej odpowiedzi, migawki zadania i taksonomii oraz przejść pełną walidację kontraktu z § 6.1. Zmiana pierwotnego wyniku sprawdzania lub danych zadania jest osobną korektą źródłowego zdarzenia i wymaga ponownego odtworzenia zależnego stanu.

Nie odejmuj samej wagi od `alpha` lub `beta`: późniejsze wartości `mastery` i EMA zależą od kolejności, a korekta może też zmienić liczniki, ekspozycję, trudności i okna dowodów. Odtwórz stan z niezmiennej bazy początkowej i kompletnego dziennika, w tym późniejszych zdarzeń. Jeżeli profil zawiera importowane lub ręcznie zmienione oceny, odtworzenie musi uwzględniać ich udokumentowane punkty bazowe i reguły; w przeciwnym razie odmów automatycznej korekty i wymagaj osobnej migracji. Nie zgaduj utraconej historii.

```text
FUNCTION CORRECT_DIAGNOSIS(correction, replacement_result):
    REQUIRE correction_id is immutable and identifies one correction

    ATOMIC_TRANSACTION WITH exclusive_profile_lock:
        current_profile, ledger = LOAD_CURRENT_STATE_AND_RECOVER_PENDING_COMMIT()
        IF ledger.correction_id_exists(correction.correction_id):
            REQUIRE stored correction payload hash == HASH(correction, replacement_result)
            RETURN stored correction status
        REQUIRE target is a completed first-answer event routed to agent
        REQUIRE expected_revision still matches current revision
        REQUIRE original answer, task snapshot and taxonomy fingerprint are available
        REQUIRE current_profile taxonomy and config match recorded values
        original_event, taxonomy = LOAD_VERIFIED_CORRECTION_INPUT(ledger, target)
        VALIDATE_AGENT_CONTRACT(replacement_result, original_event, taxonomy)
        revised_ledger = COPY(ledger)
        revised_ledger.replace_diagnosis(target, replacement_result)
        revised_ledger.advance_diagnosis_revision(target)
        candidate = COPY(VERIFIED_INITIAL_PROFILE)
        candidate.updated_at = current_profile.updated_at
        replay_ledger = NEW_EXTERNAL_LEDGER()
        FOR recorded_event IN revised_ledger.events_in_canonical_order:
            REPLAY_VERIFIED_EVENT(candidate, replay_ledger, recorded_event,
                                  revised_ledger.applied_batch_for(recorded_event))
        REQUIRE replay_ledger agrees with revised_ledger on completed events,
                presentation links and applied grades
        FOR competency changed by replayed assessment:
            IF competency.assessment.source != "none":
                competency.assessment.assessed_at = CORRECTION_COMMIT_TIME()
        candidate.updated_at = (CORRECTION_COMMIT_TIME()
                                IF candidate differs from current_profile
                                ELSE current_profile.updated_at)
        VALIDATE_PROFILE_AND_INVARIANTS(candidate, schema, taxonomy_bytes, config)
        revised_ledger.record_correction(correction, HASH(replacement_result))
        COMMIT_ATOMICALLY(candidate, revised_ledger)
        RETURN corrected
```

`REPLAY_VERIFIED_EVENT` stosuje te same reguły cyklu zadania i ocen co zwykłe przetwarzanie, bez ponownego wywoływania agenta, bez ponownej interpretacji językowej i bez wysyłania zmian do FSRS. Podczas odtwarzania używa pierwotnych czasów obserwacji i zapisów dla niezmienionych zdarzeń; czas zatwierdzenia korekty staje się `assessed_at` kompetencji, których oszacowanie się zmieniło. Kolejność wynika z niezmiennych danych zdarzeń i identyfikatora prezentacji, nie z czasu późniejszego dostarczenia diagnozy. Przy odtworzeniu nie powielaj ekspozycji ani ocen; usuń skutki starej partii przez zbudowanie nowego stanu, nie przez punktowe kasowanie. Przed zapisem sprawdź inwarianty oraz to, że zdarzenia nieobjęte korektą mają tę samą treść. Korekta wielokrotnie przesłana z tym samym identyfikatorem i zawartością jest bezskutecznym ponowieniem; ten sam identyfikator z inną zawartością lub nieaktualna rewizja jest konfliktem. Profil i ledger zapisuj atomowo także w tym przepływie.

### 10.2. Zapis atomowy

`VALIDATE_AND_COMMIT_IF_CHANGED` ustawia `profile.updated_at` na czas zapisu tylko wtedy, gdy zmieniła się treść profilu. Sam zapis potwierdzenia przetworzenia w ledgerze nie wymaga zmiany profilu. Nie zmienia `created_at`, tożsamości, CEFR, taksonomii ani kompetencji niezwiązanych ze zdarzeniem.

Nie zapisuj profilu i ledgera niezależnie bez możliwości odtworzenia transakcji. Awaria pomiędzy tymi zapisami mogłaby podwoić ocenę przy ponowieniu.

`COMMIT_ATOMICALLY` oznacza jedną transakcję stanu profilu i ledgera. W implementacji plikowej można zrealizować ją następująco:

```text
WITH exclusive_profile_lock:
    RECOVER_IF_PENDING_JOURNAL_EXISTS()
    REQUIRE loaded state revision still matches current revision
    WRITE complete target profile and ledger snapshots to temporary files
    FSYNC both files
    ATOMIC_RENAME journal containing target snapshot paths and hashes
    FSYNC parent directory
    # The durable journal is the commit decision.
    INSTALL_TARGET_SNAPSHOTS_WITH_ATOMIC_RENAMES()
    FSYNC affected directories
    REMOVE journal only after both target files are durable
    FSYNC journal directory
```

Migawki dziennika muszą pozostać dostępne do zakończenia odtwarzania, np. jako niezmienne kopie, z których tworzone są pliki do podmiany. Odtwarzanie sprawdza docelowe skróty: już zainstalowanego pliku nie podmienia ponownie, a brakujący instaluje z migawki. Nie wykonuje ponownie działań `alpha += w` i `beta += w`.

Wszystkie procesy czytające stan muszą respektować blokadę i zakończyć odtwarzanie przed odczytem. Sam `rename` jednego pliku nie zapewnia atomowości dwóch plików. Alternatywą jest transakcyjny magazyn stanu, z którego `profile.json` stanowi odtwarzalną projekcję.

Nieaktualny lub uszkodzony profil, niezgodna konfiguracja, błędny wynik agenta albo konflikt tożsamości zdarzenia nie mogą wywołać częściowej aktualizacji modelu. Zarejestrowana wcześniej rzeczywista ekspozycja pozostaje zachowana.

## 11. Przykład kontrolny

Dla nowej kompetencji pierwsza bezpośrednia błędna obserwacja daje:

| Pole | Wartość po aktualizacji |
| --- | --- |
| `alpha`, `beta` | `1`, `2` |
| `mastery` | `1/3` |
| `confidence` | `1/11` |
| `trend_state.previous_mastery` | `0.5` |
| `trend_state.smoothed_delta` | `0.2 * (1/3 - 0.5) = -1/30` |
| `trend` | `insufficient_data`, ponieważ `n=1 < 10` |
| `assessable_updates`, `evidence_count`, `first_attempts` | po `1` |
| `first_attempt_correct` | `0` |

Późniejsza, osobna prezentacja z poprawnym rozwiązaniem i bezpośrednim potwierdzeniem tej samej kompetencji daje `alpha=2`, `beta=2`, `mastery=0.5`, `confidence=2/12`. Agent nie jest wtedy uruchamiany. Ponowienie tego samego zdarzenia nie zmienia żadnej z tych wartości.

## 12. Znaczenie wyników i ograniczenia modelu

`confidence` jest wskaźnikiem objętości dowodów zdefiniowanym w schemacie, nie prawdopodobieństwem poprawności diagnozy ani miarą różnorodności kontekstów. Kolejne prezentacje tego samego zadania są kolejnymi obserwacjami zgodnie z tym modelem; nie stają się przez to niezależnym dowodem transferu umiejętności.

Model kumuluje obserwacje bez wygaszania. Nie obniżaj `mastery` za sam upływ czasu. Przy dużej liczbie wcześniejszych obserwacji reaguje wolniej na zmianę umiejętności, a przyrosty średniej maleją; z tego powodu trend oparty na stałym progu może stawać się `stable` mimo zmiany bieżących wyników. Jest to konsekwencja dostarczonego schematu, a nie dodatkowa reguła agenta.

Progi powtórzeń trudności w konfiguracji są jawnymi wartościami startowymi aplikacji. Zmiana stałych `bayesian_model`, sposobu liczenia albo znaczenia istniejących pól wymaga zgodnej zmiany polityki i ewentualnej migracji; nie może nastąpić potajemnie podczas oceny odpowiedzi.
