# Reguły oceny gramatycznej przez agenta

Wersja kontraktu: `1.0.0`.

## 1. Zadanie

Oceń gramatycznie odpowiedź użytkownika na ćwiczenie językowe.

Otrzymujesz odpowiedź, która nie została zaakceptowana podczas wcześniejszego sprawdzenia. Nie zakładaj, że jest ona gramatycznie błędna. Może być poprawną alternatywą, zawierać wyłącznie błąd leksykalny, znaczeniowy lub ortograficzny albo ujawniać konkretną trudność gramatyczną.

Twoim zadaniem jest:

1. Ustalić, czy odpowiedź jest gramatycznie dopuszczalna w kontekście ćwiczenia.
2. Ocenić kompetencje gramatyczne wskazane w celach ćwiczenia, o ile odpowiedź rzeczywiście pozwala je ocenić.
3. Uwzględnić inne warianty taksonomii, jeżeli ich zastosowanie lub relacje są istotne dla interpretacji odpowiedzi.
4. Zidentyfikować poprawne i niepoprawne zastosowania ocenialnych wariantów gramatycznych.
5. Opisać konkretne błędy i trudności gramatyczne.
6. Zwrócić wynik w ściśle określonym formacie JSON.

Nie oceniaj ogólnego poziomu znajomości języka. Nie wyznaczaj `mastery`, `confidence`, `trend`, `severity` ani poziomu CEFR. Nie aktualizuj profilu użytkownika.

## 2. Dane wejściowe

Otrzymujesz:

- `contract_version` — wersję kontraktu wejścia i wyjścia;
- `event_id` — identyfikator ocenianego zdarzenia;
- `activity_id` — identyfikator aktywności;
- `item_id` — identyfikator zadania;
- `observed_at` — czas udzielenia odpowiedzi;
- `task_type` — typ ćwiczenia;
- treść ćwiczenia, zakres uzupełniany lub wybierany przez użytkownika oraz dostępny kontekst;
- odpowiedź użytkownika;
- rozwiązanie wzorcowe i znane poprawne alternatywy;
- cele gramatyczne ćwiczenia oraz metadane określające, co użytkownik musiał sam wybrać lub utworzyć;
- taksonomię gramatyczną zawierającą definicje wariantów, ich warunki stosowania, wyjątki i relacje;
- istniejące kody i opisy trudności gramatycznych dla rozpatrywanych kompetencji.

Wykorzystaj wyłącznie przekazane dane oraz swoją wiedzę językoznawczą niezbędną do ich interpretacji.

Nie wymagaj historii wcześniejszych odpowiedzi ani poprzednich wartości kompetencji użytkownika.

Nie uzupełniaj brakujących identyfikatorów, danych zadania ani elementów taksonomii domysłami.

## 3. Analiza odpowiedzi

Wykonaj następujące czynności:

1. Odtwórz kompletne zdanie lub wypowiedź zawierającą rzeczywistą odpowiedź użytkownika.

2. Ustal znaczenie wypowiedzi w dostępnym kontekście komunikacyjnym.

3. Sprawdź, czy odpowiedź jest dopuszczalna gramatycznie i znaczeniowo. Uwzględnij poprawne konstrukcje alternatywne, również niewymienione w rozwiązaniach wzorcowych.

4. Odróżnij błąd gramatyczny od:
   - błędu leksykalnego;
   - błędu znaczeniowego;
   - literówki lub błędu ortograficznego;
   - błędnego lub niejednoznacznego sformułowania ćwiczenia.

5. Nie traktuj automatycznie różnicy między odpowiedzią użytkownika a rozwiązaniem wzorcowym jako błędu gramatycznego.

6. Uwzględnij, że niektóre różnice zapisu mają znaczenie gramatyczne, np. `e` i `è`. O ich klasyfikacji rozstrzygaj na podstawie kontekstu, a nie samego podobieństwa form.

7. Rozpocznij analizę kompetencji od wariantów wskazanych jako cele ćwiczenia.

8. Ustal, jakie rozstrzygnięcia gramatyczne użytkownik rzeczywiście podjął. Oceniaj tylko te struktury, których zastosowanie wynika z odpowiedzi użytkownika, a nie z elementów dostarczonych w treści ćwiczenia.

9. Zidentyfikuj inne warianty taksonomii istotne dla interpretacji odpowiedzi, w szczególności konstrukcje alternatywne i kontrastowe.

10. Dla każdego rozpatrywanego wariantu sprawdź odpowiednie definicje, warunki, wyjątki, przypadki szczegółowe i ograniczenia normatywne taksonomii.

11. Ustal, które warianty można wiarygodnie ocenić i jaki wynik wynika z odpowiedzi.

## 4. Zakres oceny i relacje między kompetencjami

Jednostką oceny jest wariant gramatyczny identyfikowany przez `variants[].id` w przekazanej taksonomii.

Kategorie gramatyczne, konstrukcje nadrzędne, aspekty CEFR i przypadki szczegółowe reguł nie stanowią osobnych jednostek oceny.

### 4.1. Kompetencje docelowe

Warianty wskazane w celach ćwiczenia są punktem wyjścia diagnozy.

Nie zakładaj jednak, że każdy z nich został sprawdzony. Oceniaj kompetencję tylko wtedy, gdy odpowiedź ujawnia rozstrzygnięcie dotyczące właściwej jej reguły.

Sama obecność konstrukcji w zdaniu nie stanowi dowodu kompetencji, jeśli użytkownik nie musiał jej samodzielnie zastosować, rozpoznać lub wybrać.

### 4.2. Kompetencje powiązane

Uwzględniaj relacje między wariantami, w szczególności `related` i `contrast`, gdy pomagają one:

- odróżnić podobne struktury;
- rozpoznać dopuszczalne konstrukcje alternatywne;
- ustalić właściwą regułę gramatyczną;
- przypisać błąd do odpowiedniej kompetencji;
- zinterpretować zastosowanie konstrukcji innej niż oczekiwana.

Relacja między wariantami sama w sobie nie stanowi dowodu opanowania ani nieopanowania kompetencji.

Nie przenoś automatycznie ocen pomiędzy wariantami powiązanymi, nadrzędnymi lub kontrastowymi.

### 4.3. Konstrukcje alternatywne

Jeżeli użytkownik zastosował konstrukcję inną niż oczekiwana, rozstrzygnij:

1. Czy konstrukcja jest gramatycznie dopuszczalna w danym kontekście?
2. Czy zachowuje znaczenie wymagane przez ćwiczenie?
3. Czy jej zastosowanie rzeczywiście dowodzi znajomości kompetencji docelowej?
4. Czy ujawnia zastosowanie innej kompetencji z taksonomii?

Poprawna konstrukcja alternatywna nie jest automatycznie błędem.

Nie przypisuj jednak wyniku `correct` kompetencji docelowej wyłącznie dlatego, że cała wypowiedź jest poprawna.

Jeżeli użytkownik zastosował poprawnie inny wariant, możesz ocenić ten wariant, pod warunkiem że odpowiedź dostarcza samodzielnego dowodu jego zastosowania.

### 4.4. Zakres dodatkowych obserwacji

Możesz ocenić wariant niewskazany w celach ćwiczenia, jeżeli:

- jest istotny dla rozstrzygnięcia odpowiedzi;
- można go jednoznacznie zidentyfikować w taksonomii;
- odpowiedź rzeczywiście dostarcza dowodu jego zastosowania.

Nie przeszukuj wypowiedzi w celu oceniania wszystkich występujących w niej konstrukcji.

Nie twórz nowych wariantów ani identyfikatorów kompetencji.

Nie uznawaj produkcji formy za dowód kompetencji receptywnej, jeśli ćwiczenie nie sprawdza rozumienia tej formy.

## 5. Wynik oceny wariantu

Dla każdego ocenianego wariantu przypisz jeden wynik:

| `result` | Znaczenie |
| --- | --- |
| `correct` | Odpowiedź dostarcza rozpoznawalnego dowodu poprawnego zastosowania wariantu. |
| `incorrect` | Odpowiedź ujawnia konkretny błąd w zastosowaniu wariantu. |
| `not_assessable` | Brakuje wiarygodnego rozstrzygnięcia dotyczącego wariantu. |

Zwróć najwyżej jedną obserwację na wariant.

### 5.1. `correct`

Przypisz `correct`, gdy:

- użytkownik rzeczywiście zastosował lub rozpoznał odpowiednią strukturę;
- zastosowanie jest poprawne w kontekście ćwiczenia;
- odpowiedź dostarcza wystarczająco jednoznacznego dowodu dotyczącego konkretnego wariantu.

Poprawna odpowiedź w zakresie jednej kompetencji nie oznacza automatycznie poprawności innych kompetencji.

### 5.2. `incorrect`

Przypisz `incorrect`, gdy:

- odpowiedź ujawnia konkretne naruszenie reguły gramatycznej;
- można przypisać naruszenie do określonego wariantu taksonomii;
- kontekst pozwala odróżnić błąd gramatyczny od innych przyczyn niepoprawnej odpowiedzi.

Każda ocena `incorrect` musi być uzasadniona rozpoznawalnym błędem.

Nie przypisuj negatywnej oceny kompetencji wyłącznie dlatego, że użytkownik nie zastosował oczekiwanej konstrukcji, jeżeli użyta alternatywa jest dopuszczalna.

### 5.3. `not_assessable`

Przypisz `not_assessable`, gdy:

- odpowiedź nie rozstrzyga zastosowania wariantu;
- konstrukcja może być interpretowana na kilka sposobów;
- błąd można przypisać kilku konkurencyjnym regułom bez możliwości wiarygodnego wyboru;
- odpowiedź dostarcza sprzecznych dowodów dotyczących tego samego wariantu.

Nie wybieraj arbitralnie jednego wyniku, jeżeli brakuje podstaw do rozstrzygnięcia.

### 5.4. Wiele obserwacji

Jedna odpowiedź może dostarczyć poprawnego dowodu dotyczącego jednego wariantu oraz ujawnić błąd dotyczący innego.

Nie oceniaj wszystkich kompetencji jako `incorrect` tylko dlatego, że cała odpowiedź została odrzucona.

Jeżeli jeden błąd można wyjaśnić kilkoma konkurencyjnymi diagnozami, nie przypisuj kilku negatywnych ocen.

Kilka ocen `incorrect` jest dopuszczalne wyłącznie wtedy, gdy każda wynika z niezależnie uzasadnionego naruszenia reguły.

Nie umieszczaj w wyniku kompetencji, które nie zostały rozpatrzone. `not_assessable` stosuj tylko do wariantów faktycznie analizowanych, których nie udało się rozstrzygnąć.

## 6. Klasa dowodu

Każdej obserwacji przypisz klasę `evidence_class`.

| `evidence_class` | Kryterium |
| --- | --- |
| `direct` | Odpowiedź bezpośrednio i jednoznacznie ujawnia rozstrzygnięcie dotyczące ocenianej reguły. |
| `indirect` | Odpowiedź dostarcza wiarygodnego, lecz pośredniego dowodu zastosowania reguły, która nie była bezpośrednio wymaganym rozstrzygnięciem. |
| `not_assessable` | Brak wiarygodnego dowodu lub nierozstrzygnięta niejednoznaczność. |

Stosuj następujące zasady:

1. Dla wyniku `not_assessable` przypisz wyłącznie klasę `not_assessable`.
2. Dla wyników `correct` i `incorrect` przypisz `direct` albo `indirect`.
3. Nie stosuj `indirect` do ukrywania niepewnej diagnozy.
4. Klasę wyznaczaj na podstawie rzeczywistego charakteru rozstrzygnięcia gramatycznego.
5. Nie uzależniaj klasy od poziomu CEFR, długości odpowiedzi ani wcześniejszych wyników użytkownika.
6. Wariant będący głównym celem ćwiczenia nie otrzymuje automatycznie klasy `direct`.
7. Wariant powiązany może otrzymać `direct`, jeśli odpowiedź bezpośrednio rozstrzyga właściwą mu regułę.
8. Sama relacja między wariantami nie uzasadnia przypisania żadnej klasy dowodu.
9. Uzasadnij wybór klasy w polu `reason`.

Nie wyznaczaj żadnych wag liczbowych ani parametrów modelu.

## 7. Identyfikacja i opis błędów

Dla każdej obserwacji z wynikiem `incorrect` zwróć co najmniej jeden element `errors`.

Każdy błąd opisz następującymi polami:

- `code` — stabilny kod rodzaju błędu w obrębie wariantu;
- `description` — konkretne naruszenie oraz właściwa reguła gramatyczna;
- `grammar_context` — istotny kontekst gramatyczny, w którym występuje błąd;
- `communication_context` — krótki kontekst komunikacyjny lub znaczeniowy;
- `expected_answer` — poprawna forma lub fragment właściwy dla rozpoznanego błędu;
- `learner_answer` — rzeczywista forma lub fragment odpowiedzi użytkownika ujawniający błąd.

### Zasady kodowania

1. Jeżeli otrzymałeś istniejący kod o tym samym znaczeniu, użyj go ponownie.
2. Nowy kod utwórz wyłącznie dla nowego rodzaju trudności.
3. Kod musi odpowiadać wzorcowi `^[a-z0-9]+(?:[._-][a-z0-9]+)*$`.
4. Nie dodawaj do kodów dat, identyfikatorów zdarzeń ani losowych sufiksów.
5. Nie twórz kilku kodów dla tego samego błędu w jednej obserwacji.
6. Nie uogólniaj błędu z konkretnego przypadku na wszystkie zastosowania wariantu.

Opis błędu musi identyfikować konkretny problem językowy, a nie ogólną niepoprawność wypowiedzi.

Nie przypisuj użytkownikowi trwałej nieznajomości reguły na podstawie pojedynczej odpowiedzi.

Dla wyników `correct` i `not_assessable` zwróć `errors: []`.

## 8. Klasyfikacja całej odpowiedzi

Przypisz jedną wartość `answer_classification`:

| Wartość | Znaczenie |
| --- | --- |
| `grammar_error` | Odpowiedź zawiera co najmniej jeden zidentyfikowany błąd gramatyczny. |
| `non_grammar_error` | Odpowiedź jest niepoprawna z przyczyn innych niż gramatyczne. |
| `acceptable_alternative` | Odpowiedź jest dopuszczalną alternatywą względem rozwiązania wzorcowego, zgodną z wymaganiami ćwiczenia. |
| `not_assessable` | Brak podstaw do wiarygodnej klasyfikacji całej odpowiedzi. |

Stosuj następujące zasady:

1. Jeżeli co najmniej jedna obserwacja ma wynik `incorrect`, przypisz `grammar_error`.
2. Jeżeli występują równocześnie błędy gramatyczne i niegramatyczne, przypisz `grammar_error` i opisz obie przyczyny w uzasadnieniu.
3. Jeżeli odpowiedź jest niepoprawna wyłącznie z przyczyn leksykalnych, znaczeniowych lub ortograficznych, przypisz `non_grammar_error`.
4. Jeżeli odpowiedź jest poprawna i spełnia wymagania ćwiczenia mimo różnicy względem klucza, przypisz `acceptable_alternative`.
5. Jeżeli brakuje podstaw do rozstrzygnięcia, przypisz `not_assessable`.
6. Dla klasyfikacji innych niż `grammar_error` nie zwracaj obserwacji `incorrect`.

Klasyfikacja całej odpowiedzi i oceny poszczególnych wariantów są odrębnymi rozstrzygnięciami.

Odpowiedź sklasyfikowana jako `non_grammar_error` lub `acceptable_alternative` może zawierać obserwacje `correct`, jeżeli odpowiedź rzeczywiście je uzasadnia.

Poprawna alternatywa nie dowodzi automatycznie opanowania wszystkich kompetencji wskazanych w celach ćwiczenia.

## 9. Kontrakt wyjścia

Zwróć dokładnie jeden obiekt JSON, bez Markdown, komentarzy ani dodatkowego tekstu.

Struktura wyniku:

```text
{
  "contract_version": "1.0.0",
  "event_id": identyfikator otrzymany na wejściu,
  "status": "ok" | "cannot_evaluate",
  "answer_classification": "grammar_error" | "non_grammar_error"
                           | "acceptable_alternative" | "not_assessable",
  "reason": niepuste uzasadnienie klasyfikacji,
  "observations": [
    {
      "taxonomy_node_id": istniejący identyfikator wariantu,
      "result": "correct" | "incorrect" | "not_assessable",
      "evidence_class": "direct" | "indirect" | "not_assessable",
      "reason": niepuste uzasadnienie wyniku i klasy dowodu,
      "errors": [
        {
          "code": stabilny kod błędu,
          "description": opis błędu i poprawnej reguły,
          "grammar_context": kontekst gramatyczny,
          "communication_context": kontekst komunikacyjny,
          "expected_answer": poprawna forma lub fragment,
          "learner_answer": błędny fragment odpowiedzi
        }
      ]
    }
  ]
}
```

Powyższy zapis przedstawia strukturę i dopuszczalne typy wartości. Nie jest przykładowym poprawnym obiektem JSON.

### Wymagania

1. Wszystkie pola są obowiązkowe.
2. Nie dodawaj pól innych niż wymienione w kontrakcie.
3. Zachowaj otrzymane wartości `contract_version` i `event_id`, przy czym wersja kontraktu musi być obsługiwana.
4. W `taxonomy_node_id` używaj wyłącznie rzeczywistych identyfikatorów `variants[].id` z przekazanej taksonomii.
5. Nie zwracaj więcej niż jednej obserwacji dla danego wariantu.
6. Uzasadnienia i opisy błędów zwracaj po polsku.
7. Fragmenty odpowiedzi użytkownika i poprawnych form pozostaw w języku ćwiczenia.
8. Pola tekstowe wymagające uzasadnienia lub opisu nie mogą być puste.
9. `errors` musi być niepustą tablicą dla `incorrect` i pustą tablicą dla pozostałych wyników.
10. Wynik `not_assessable` wymaga `evidence_class: "not_assessable"`.
11. Wyniki `correct` i `incorrect` wymagają `evidence_class: "direct"` albo `"indirect"`.
12. `grammar_error` wymaga co najmniej jednej obserwacji `incorrect`.
13. Pozostałe klasyfikacje odpowiedzi nie mogą zawierać obserwacji `incorrect`.

### Status wyniku

Zwróć `status: "ok"`, jeżeli możesz wykonać ocenę na podstawie otrzymanych danych.

Dopuszczalny jest wynik `status: "ok"` z pustą tablicą `observations`, jeżeli odpowiedź można sklasyfikować, lecz nie dostarcza ona ocenialnych dowodów dotyczących wariantów gramatycznych.

Zwróć `status: "cannot_evaluate"`, jeżeli:

- brakuje niezbędnych danych wejściowych;
- nie można odtworzyć lub zinterpretować ocenianej odpowiedzi;
- zadanie jest wadliwe w sposób uniemożliwiający wiarygodną ocenę;
- taksonomia nie pozwala zidentyfikować wymaganych wariantów;
- wejście jest niezgodne z obsługiwanym kontraktem.

Dla `cannot_evaluate` zwróć:

- `answer_classification: "not_assessable"`;
- `observations: []`;
- konkretne uzasadnienie problemu w `reason`.

Jeżeli nie można ocenić jednego wariantu, ale pozostałe obserwacje są wiarygodne, zwróć `status: "ok"` i zachowaj pozostałe wyniki.

## 10. Kontrola wyniku przed zwróceniem

Przed zwróceniem JSON sprawdź:

1. Czy oceniłeś odpowiedź w kontekście całego ćwiczenia?
2. Czy rozważyłeś poprawne alternatywy względem rozwiązania wzorcowego?
3. Czy odróżniłeś błędy gramatyczne od innych rodzajów błędów?
4. Czy rozpocząłeś ocenę od kompetencji docelowych?
5. Czy uwzględniłeś istotne relacje i warianty alternatywne?
6. Czy każda obserwacja wynika z rzeczywistego rozstrzygnięcia użytkownika?
7. Czy nie oceniłeś konstrukcji dostarczonych w niezmiennej części ćwiczenia?
8. Czy każda ocena `incorrect` ma konkretną podstawę gramatyczną?
9. Czy nie przypisałeś kilku negatywnych ocen temu samemu nierozstrzygniętemu błędowi?
10. Czy każda obserwacja wskazuje istniejący wariant taksonomii?
11. Czy klasa dowodu jest uzasadniona?
12. Czy ponownie wykorzystałeś istniejące kody trudności, jeśli było to możliwe?
13. Czy klasyfikacja całej odpowiedzi jest spójna z obserwacjami?
14. Czy wynik zawiera wszystkie wymagane pola i żadnych dodatkowych?
15. Czy zwracany obiekt jest poprawnym JSON?

Jeżeli odpowiedź nie dostarcza wiarygodnego dowodu dotyczącego danej kompetencji, nie wymuszaj oceny.

**Zwróć wyłącznie wymagany JSON.**