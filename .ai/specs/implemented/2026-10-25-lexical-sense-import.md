# Strona tworzenia i zapisu LexicalSense

Status: implemented
Created: 2026-10-25
Implemented: 2026-10-25; wszystkie kryteria akceptacji spełnione. Przeniesiono do `implemented/` po weryfikacji implementacji.

## Problem Statement

Osoba uzupełniająca materiał w Filippo nie ma w aplikacji miejsca, w którym może podać listę włoskich jednostek leksykalnych, sprawdzić istniejące znaczenia, wygenerować nowe `LexicalSense`, skorygować polskie objaśnienia i świadomie zapisać wybrane znaczenia. Ręczne użycie skilla oraz ręczny zapis do bazy rozrywają ten przepływ i zwiększają ryzyko duplikatów.

## Solution

Nowa strona prowadzi użytkownika przez cztery etapy: wprowadzenie osobnych zapisów słów lub wyrażeń, sprawdzenie istniejących `LexicalSense`, wygenerowanie propozycji przez serwerowe wywołanie OpenAI według skilla `create-lexical-senses`, a potem przegląd, korektę polskiego objaśnienia, wybór i zapis. Istniejące znaczenia są wyraźnie oznaczone i można usunąć odpowiadające im pozycje z bieżącej listy. Generowanie jest dostępne po udanym sprawdzeniu pozostałej listy. Nic nie trafia do bazy przed osobnym zatwierdzeniem wybranych propozycji.

## User Stories

1. Jako osoba uzupełniająca materiał, chcę otworzyć stronę importu z nawigacji aplikacji, żeby rozpocząć pracę bez użycia narzędzi developerskich.
2. Jako osoba uzupełniająca materiał, chcę wpisać włoskie słowo lub wyrażenie w osobnym polu, żeby widzieć granice każdej pozycji.
3. Jako osoba uzupełniająca materiał, chcę dodawać kolejne pola, żeby przygotować partię wejść.
4. Jako osoba uzupełniająca materiał, chcę usuwać pojedyncze pola, żeby poprawiać listę przed wysłaniem.
5. Jako osoba uzupełniająca materiał, chcę zachować pełną frazę w jednym polu, żeby jej znaczenie nie zostało rozbite na pojedyncze słowa.
6. Jako osoba uzupełniająca materiał, chcę otrzymać informację o pustych pozycjach, żeby wiedzieć, co zostanie pominięte.
7. Jako osoba uzupełniająca materiał, chcę zobaczyć powtórzenia w bieżącej liście, żeby nie generować tego samego wejścia dwa razy.
8. Jako osoba uzupełniająca materiał, chcę sprawdzić każdą pozycję względem zapisanych `LexicalSense`, żeby rozpoznać materiał już obecny w bazie.
9. Jako osoba uzupełniająca materiał, chcę zobaczyć istniejące znaczenia dla dopasowanej jednostki, żeby odróżnić powtórkę od nowego znaczenia tego samego zapisu.
10. Jako osoba uzupełniająca materiał, chcę widzieć wyraźne oznaczenie dopasowanych pozycji, żeby móc zdecydować, które usunąć z bieżącej partii.
11. Jako osoba uzupełniająca materiał, chcę móc zachować pozycję mimo istniejącego znaczenia, żeby dodać inny `LexicalSense` tej samej jednostki.
12. Jako osoba uzupełniająca materiał, chcę ponownie sprawdzić listę po zmianie pola, żeby generowanie korzystało z aktualnych danych.
13. Jako osoba uzupełniająca materiał, chcę uruchomić generowanie dopiero po udanej weryfikacji niepustej listy, żeby nie wysyłać nieprzejrzanego wejścia.
14. Jako osoba uzupełniająca materiał, chcę widzieć stan trwającego generowania, żeby nie uruchomić go przypadkowo ponownie.
15. Jako osoba uzupełniająca materiał, chcę zobaczyć każdą wygenerowaną propozycję `LexicalSense` osobno, żeby wybrać znaczenia, które mają trafić do bazy.
16. Jako osoba uzupełniająca materiał, chcę zobaczyć włoską postać hasłową, część mowy, definicję i przykład, żeby ocenić znaczenie propozycji.
17. Jako osoba uzupełniająca materiał, chcę zobaczyć polskie objaśnienie i glosy, żeby ocenić poprawność przekładu.
18. Jako osoba uzupełniająca materiał, chcę poprawić polskie objaśnienie przed zapisem, żeby baza zawierała zaakceptowany przeze mnie opis.
19. Jako osoba uzupełniająca materiał, chcę zaznaczać i odznaczać poszczególne propozycje, żeby zapisać tylko przydatne znaczenia.
20. Jako osoba uzupełniająca materiał, chcę zobaczyć propozycje odroczone przez skill wraz z powodem, żeby nie mylić ich z gotowymi sensami.
21. Jako osoba uzupełniająca materiał, chcę zobaczyć zakres analizy wejścia, żeby zrozumieć, które odczytania zostały sprawdzone lub pominięte.
22. Jako osoba uzupełniająca materiał, chcę wiedzieć, czy propozycja odpowiada znaczeniu już zapisanemu, żeby nie utworzyć duplikatu.
23. Jako osoba uzupełniająca materiał, chcę zatwierdzić zapis tylko wybranych, poprawnych propozycji, żeby kontrolować zawartość bazy.
24. Jako osoba uzupełniająca materiał, chcę otrzymać wynik zapisu dla każdej wybranej propozycji, żeby rozpoznać sukces i konflikt.
25. Jako osoba uzupełniająca materiał, chcę móc ponowić nieudane sprawdzenie, generowanie lub zapis, żeby błąd sieci albo API nie wymuszał ponownego wpisywania listy.
26. Jako osoba uzupełniająca materiał, chcę zachować poprawki i wybór po błędzie zapisu, żeby móc bezpiecznie ponowić operację.

## Scope

- Jedna nowa strona w istniejącej aplikacji, dostępna z jej nawigacji.
- Odczyt istniejących `LexicalSense`, generowanie propozycji, walidacja, przegląd i zapis wybranych rekordów.
- Dane wejściowe: włoskie słowa i wyrażenia; dane wyjściowe: oddzielne znaczenia zgodne z bieżącym kontraktem skilla.

## Acceptance Criteria

- [x] Strona pozwala dodać, edytować i usunąć osobne pola; fraza pozostaje jedną pozycją, a puste pola i duplikaty w partii są obsługiwane czytelnie.
- [x] Sprawdzenie pokazuje istniejące `LexicalSense` powiązane z każdą pozycją i wyraźnie oznacza trafienia; użytkownik może usunąć pozycję albo pozostawić ją do analizy nowych znaczeń.
- [x] Zmiana listy po sprawdzeniu unieważnia wynik sprawdzenia i blokuje generowanie do ponownej weryfikacji.
- [x] Generowanie można uruchomić po udanym sprawdzeniu co najmniej jednej pozycji; aplikacja wyświetla stan pracy i nie uruchamia równoległych żądań z tej samej strony.
- [x] Serwer wywołuje OpenAI zgodnie z aktualnym skillem `create-lexical-senses`, używa Structured Outputs i `web_search`, weryfikuje odpowiedź względem schematu oraz maszynowo sprawdzalnych reguł skilla; błędna odpowiedź nie jest zapisywana.
- [x] Strona pokazuje wszystkie gotowe propozycje oddzielnie oraz `deferred` i `coverage`; odroczone pozycje nie są wybieralne do zapisu.
- [x] Użytkownik może zmienić `definition_pl` każdej gotowej propozycji i niezależnie wybierać znaczenia do zapisu; puste objaśnienie nie przechodzi walidacji.
- [x] Przed zapisem aplikacja ponownie wykrywa równoważne istniejące znaczenia; konflikt jest pokazany i nie prowadzi do drugiego rekordu, także przy zmianie bazy od czasu wstępnego sprawdzenia. Przy podobnym znaczeniu wymagane jest jawne potwierdzenie odrębności.
- [x] Zapis dotyczy wyłącznie zatwierdzonych, poprawnych propozycji, zachowuje ich dane źródłowe oraz skorygowany polski opis, a wynik wyraźnie rozróżnia zapisane i pominięte pozycje.
- [x] Błędy sprawdzenia, OpenAI, walidacji i bazy są czytelne; lista, poprawki i wybór pozostają dostępne do ponowienia działania.
- [x] Sekret OpenAI pozostaje po stronie serwera i nie jest wysyłany do przeglądarki.

## Implementation Decisions

- Zachować pojęcia z glosariusza: `LexicalItem` to jednostka słownika, a `LexicalSense` to konkretne znaczenie; jeden zapis wejściowy może dać kilka sensów, czasem pod innym lematem.
- Dodać serwerowy moduł przepływu `LexicalSense` obejmujący sprawdzenie istniejących wpisów, wywołanie OpenAI i zapis; strona korzysta z jego API. Nie mieszać tego przepływu z istniejącymi API profilu i taksonomii.
- Wstępna weryfikacja wyszukuje powiązane wpisy według zapisu jednostki i pokazuje ich znaczenia. Samo dopasowanie zapisu nie oznacza duplikatu sensu i nie blokuje dalszej analizy.
- Propozycje porównywać z bazą na poziomie znaczenia, uwzględniając lemat, część mowy i znaczenie, również po normalizacji wejścia przez skill; decyzja o równoważności ma być sprawdzona ponownie przy zapisie.
- Wywołanie OpenAI odbywa się wyłącznie na serwerze. Używa instrukcji i dołączonych reguł skilla, `text.format` z jego kontraktu Structured Outputs oraz narzędzia `web_search`; weryfikuje każdy rekord zgodnie ze schematem `LexicalSense` i regułami merytorycznymi.
- Odpowiedź `lexical_senses`, `deferred`, `coverage` trafia do UI bez utożsamiania wyniku częściowego z błędem całej partii. Gotowy rekord jest propozycją, nie automatycznym wpisem w bazie.
- Przy zapisie utrzymać obecny model Prisma, jeśli pozwala bezstratnie przechować kontrakt skilla: `definition` zawiera włoską definicję, a pełne dane rekordu, w tym skorygowane `definition_pl`, znajdują się w `detailsJson`. Jeśli istniejące dane używają `definition` inaczej, migracja lub mapowanie wymaga ponownej oceny przed implementacją.
- Walidować dane wejściowe i wybrane rekordy po stronie serwera. Stan sprawdzenia jest związany z konkretną wersją listy, aby zmiana wejścia nie korzystała ze starego wyniku.
- Zachować idempotencję zapisu z perspektywy użytkownika: ponowienie tego samego zatwierdzenia nie tworzy drugiej kopii znaczenia.
- Dla propozycji o tej samej jednostce i części mowy co istniejący rekord, lecz z inną definicją, wymagać jawnego potwierdzenia odrębności. Po zmianie bazy między generowaniem a zapisem pokazać nowe wpisy i ponownie zażądać potwierdzenia. Dokładny duplikat zawsze blokować.

## Testing Decisions

- Zgodnie z decyzją użytkownika powstaje jeden automatyczny test całego przepływu przez stronę i publiczne API. Jest to najwyższa użyteczna granica testu: ocenia to, co użytkownik widzi i co zapisano w bazie, bez sprawdzania prywatnych funkcji.
- Jeden scenariusz używa tymczasowej bazy SQLite z istniejącym znaczeniem i kontrolowanej odpowiedzi OpenAI zawierającej nowy sens, odroczone wejście oraz dane `coverage`. Sprawdza oznaczenie istniejącego wpisu, uruchomienie generowania, korektę `definition_pl`, wybór sensu, zapis i brak zapisu pozycji niezaznaczonej lub odroczonej.
- Test nie korzysta z żywego OpenAI ani z wyszukiwania w sieci. Podczas implementacji potrzebna jest przeglądarka testowa albo równoważny test interfejsu; obecne testy `node:test` sprawdzają tylko start kontenera Nest i ładowanie danych, więc nie są wystarczającym wzorcem dla tego przepływu.
- Pozostałe warunki akceptacji, w tym błędy usług i konflikt powstały między sprawdzeniem a zapisem, wymagają ręcznej kontroli podczas odbioru. Nie dodawać osobnych automatycznych testów bez zmiany tej decyzji.

## Out of Scope

- Automatyczny zapis wszystkich wygenerowanych znaczeń bez wyboru użytkownika.
- Edycja włoskiej definicji, źródeł, przykładów lub innych pól skilla na tej stronie.
- Generowanie zadań, planowanie FSRS i rozpoczynanie nauki zapisanych sensów.
- Masowe usuwanie istniejących rekordów z bazy; usunięcie pola dotyczy bieżącej partii.
- Zarządzanie kontami lub rolami użytkowników.

## Open Questions

Brak blokujących. Przyjęto Structured Outputs, obowiązkowe wyszukiwanie i walidację maszynowo sprawdzalnych reguł jako znaczenie „zaostrzonego API”. Niepewne podobieństwo sensów rozstrzyga użytkownik przez jawne potwierdzenie. W repozytorium nie było istniejącej bazy z danymi; starsze wpisy bez pełnego JSON nadal są pokazywane i wymagają potwierdzenia przy podobnym zapisie.

## Further Notes

- Źródłem zasad generowania jest obecny skill `create-lexical-senses`, a nie osobny uproszczony prompt. Jego `coverage` łączy zapis wejściowy z rozpoznanymi lematami; `deferred` dokumentuje brak danych lub nierozstrzygnięcie.
- Powiązane zapisy: [przygotowanie specyfikacji](../../runs/2026-10-25-lexical-sense-import-spec.md) i [implementacja](../../runs/2026-10-25-lexical-sense-import-implementation.md).
