# Filippo — przegląd spójności i kompletności projektu

- Data: 2026-10-24
- Pytanie: czy opis planowanej aplikacji i dostępne schematy są spójne oraz czy plan obejmuje pozostałe projektowanie?
- Zakres: przegląd dokumentów, schematów i aktualnego kodu w repozytorium. `./ai/docs` nie istnieje; właściwy katalog to `.ai/docs`.
- Ograniczenia: nie uruchamiałem testów ani nie weryfikowałem merytorycznie wszystkich opisów gramatycznych względem zewnętrznych źródeł. To audyt spójności i zakresu dokumentacji, nie walidacja potrzeb uczących się.

## Wniosek

Podstawy są mocne. Model domeny i przepływu nauki jest opisany znacznie dokładniej niż typowy wstępny plan: odróżnia znaczenie słowa od ćwiczenia, FSRS od profilu gramatycznego, a diagnozę AI od aktualizacji profilu. Plan prac obejmuje większość technicznych obszarów potrzebnych do pełnego cyklu i ma zależności, kryteria ukończenia oraz scenariusze end-to-end.

Nie uznałbym jednak planu za kompletny opis całego produktu. Pozostają decyzje o mierzalnym wyniku dla uczącego się, granicy lokalnej/sieciowej i obsłudze danych przesyłanych do AI. Są też konkretne niespójności dokumentów, które mogą zmienić dobór ćwiczeń. Aktualna aplikacja w kodzie pozostaje tylko lokalnie opisanym przeglądarkowym podglądem taksonomii i profilu; pełny cykl jest planem, nie istniejącą funkcją. ([README.md](../../README.md#L1-L18), [plan](clozemaster_plan_prac.md#L7-L11), [moduł aplikacji](../../src/app.module.ts))

## Co jest dobrze opracowane

- Opis rozdziela `LexicalItem`, `LexicalSense`, ćwiczenie i prezentację; stan FSRS należy do znaczenia, a profil gramatyczny ocenia warianty taksonomii. Rozdziela też diagnozę językową AI od deterministycznego skryptu aktualizującego profil. ([filippo.md](filippo.md#L22-L76), [profile_update.md](profile_update.md#L6-L28))
- Reguły generowania i oceniania zawierają konkretne zabezpieczenia przed oceną bez dowodu, automatycznym przenoszeniem ocen między wariantami oraz odrzucaniem poprawnych alternatyw. Plan wymienia obsługę wieloznaczności, wznowienia sesji, duplikatów zdarzeń, braków ćwiczeń, korekt i migracji. ([generation_rules.md](generation_rules/generation_rules.md#L21-L61), [evaluation_rules.md](evaluation_rules/evaluation_rules.md#L75-L189), [plan](clozemaster_plan_prac.md#L281-L317))
- Taksonomia ma metadane źródeł i zakresu źródeł. Polityka CEFR jawnie określa przypisania jako redakcyjne szacunki i stwierdza, że 348 mapowań nie przeszło walidacji empirycznej; to właściwie ogranicza ich interpretację. ([taxonomy.json](grammar_taxonomy/taxonomy.json#L10344-L10412))
- Plan poprawnie wskazuje, że schematy jednostek leksykalnych i ćwiczenia, integracja FSRS, selektor paczek, cykl sesji, generowanie oraz migracje pozostają do domknięcia. Ma dla nich osobne kryteria i kolejność. ([plan](clozemaster_plan_prac.md#L45-L149), [plan](clozemaster_plan_prac.md#L233-L279))

## Znalezione problemy i decyzje

### Średni priorytet: kryterium ukończenia jest techniczne, a wynik dla uczącego się pozostaje ogólny

`filippo.md` opisuje, co aplikacja ma umożliwiać, a plan podaje techniczne kryteria działania pełnego cyklu. Nie określają jednak, jaki obserwowalny rezultat w Twojej nauce uzasadni kontynuację, ani co skłoni do zmiany kierunku. Dla własnego narzędzia nie trzeba wymyślać dużych metryk: wystarczy ustalić konkretną próbę lub obserwację, która pokaże, czy przepływ pomaga w Twoim zadaniu. ([filippo.md](filippo.md#L570-L586), [plan](clozemaster_plan_prac.md#L302-L325))

### Średni priorytet: zasady przetwarzania danych przez AI i retencji nie są opisane

Plan dobrze obejmuje transakcje, niezmienny dziennik, kopie zapasowe, odtwarzanie, koszty AI i wersjonowanie reguł. Nie określa jednak, czy odpowiedzi uczącego się i importowany tekst trafiają do zewnętrznej usługi, jak długo są przechowywane ani które logi mogą je zawierać. `profile_update.md` dopuszcza przechowanie pełnej odpowiedzi w osobnym zaufanym źródle do ponownej diagnozy, a schemat profilu zaleca ograniczanie zapisanych fragmentów i usuwanie danych osobowych. Ustal te granice razem z decyzją o pracy lokalnej lub sieciowej. ([plan](clozemaster_plan_prac.md#L233-L263), [profile_update.md](profile_update.md#L151-L160), [profile.schema.json](competence_profile/profile.schema.json#L180-L205))

## Czy lista pozostałego projektowania jest kompletna?

**Dla logiki pełnego cyklu — jest szeroka i stanowi dobry plan rozpoczęcia pracy. Dla całego produktu — jeszcze nie.** Lista P0–P2, zależności, kryteria i 16 testowych przebiegów pokrywają większość zasad uczenia, generowania, oceniania i niezawodności. W repozytorium są schematy taksonomii i profilu, ale brak schematów `LexicalItem`/`LexicalSense` i ćwiczenia, które plan sam słusznie wymienia jako otwarte. ([plan](clozemaster_plan_prac.md#L45-L80), [plan](clozemaster_plan_prac.md#L281-L317); inwentarz: `grammar_taxonomy/taxonomy.schema.json`, `competence_profile/profile.schema.json`; brak schematów domenowych w `.ai/docs`.)

Przed uznaniem planu za kompletny dopisałbym lub jawnie rozstrzygnął:

1. **Wynik dla uczącego się i kryterium zmiany kierunku** — co konkretnie ma się poprawić i jak to zaobserwujesz.
2. **Model uruchomienia i granicę danych** — lokalnie czy przez sieć, gdzie leży baza, jakie odpowiedzi/teksty trafiają do AI, oraz zasady retencji i usuwania. Kopie zapasowe i odtwarzanie są już uwzględnione.
3. **Kontrakty domenowe i konfigurację** — schematy jednostek i ćwiczeń są wpisane w P0; uzupełnij decyzję o schemacie/walidacji konfiguracji oceniania.

Na koniec uporządkuj nazewnictwo: plan nazywa się „Clozemaster”, podczas gdy reszta repozytorium nazywa produkt „Filippo”. Jeśli pierwsza nazwa jest celowa, zapisz relację między nazwami. ([clozemaster_plan_prac.md](clozemaster_plan_prac.md#L1-L5), [README.md](../../README.md#L1-L3))

## Źródła sprawdzone

- [Opis aplikacji](filippo.md)
- [Plan domknięcia cyklu](clozemaster_plan_prac.md)
- [Reguły generowania](generation_rules/generation_rules.md)
- [Reguły oceny](evaluation_rules/evaluation_rules.md)
- [Aktualizacja profilu](profile_update.md)
- [Schemat profilu](competence_profile/profile.schema.json) i [przykładowy profil](competence_profile/profile.json)
- [Schemat i dane taksonomii](grammar_taxonomy/taxonomy.schema.json), [taxonomy.json](grammar_taxonomy/taxonomy.json)
- [README](../../README.md), [main.ts](../../src/main.ts), [app.module.ts](../../src/app.module.ts), [zaimplementowane specyfikacje podglądu](../specs/implemented/)

Niezależny audyt materiałów potwierdził rozbieżność `mastery=null` kontra prior-only `0.5` oraz niejasny status profilu i kilku istniejących dokumentów. Decyzja cloze-only została później potwierdzona i wprowadzona do aktualnych kontraktów. ([generation_rules.md](generation_rules/generation_rules.md#L18), [profile.schema.json](competence_profile/profile.schema.json#L20), [plan](clozemaster_plan_prac.md#L64-L80))
