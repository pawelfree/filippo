# Tworzenie JSON `LexicalSense` z listy włoskich słów i wyrażeń

## Zadanie agenta

Dla przekazanej listy włoskich słów i wyrażeń przygotuj **rekordy konkretnych znaczeń lub użyć**. Każdy gotowy rekord jest obiektem JSON zgodnym z [lexicalsense.schema.json](lexicalsense.schema.json). Nie twórz zdań z lukami, kluczy odpowiedzi, celów gramatycznych ani stanu nauki. Późniejsze systemy mogą używać `lexical_sense_id`, lecz nie są częścią tej procedury. Lokalny [opis domeny](../filippo.md#2-model-pojęciowy-słownictwa) rozdziela zapis słowa lub frazy, jego formy i znaczenia.

Jedno słowo lub wyrażenie może dać wiele `LexicalSense`. Każdy rekord zawiera jego postać hasłową bezpośrednio w `lexical_item_it`; nie wymaga osobnego rekordu ani identyfikatora `LexicalItem`. Gotowy rekord oznacza udokumentowane znaczenie w katalogu; nie oznacza, że użytkownik już je wybrał do nauki lub rozpoczął powtórki.

## Dane wejściowe

Otrzymujesz `items[]` jako listę włoskich zapisów lub obiektów z `lexical_item_it`. Obiekt może dodatkowo zawierać zapis wejściowy, zdanie źródłowe, polski odpowiednik, część mowy, rejestr i intencję użytkownika. Otrzymujesz także istniejące `LexicalSense` do porównania duplikatów oraz listę źródeł, których warunki dopuszczają użycie w tym procesie. Brak pola oznacza brak informacji, nie wartość domyślną.

Jeżeli wejście nie ma ustalonej kategorii i lematu, najpierw rozpoznaj wszystkie poświadczone analizy zapisu: samodzielne hasła oraz formy fleksyjne innych lematów. Dla każdej analizy użyj właściwej postaci hasłowej w `lexical_item_it` i części mowy w `part_of_speech`. Jeżeli wejście wskazuje już konkretny lemat i kategorię, opracuj wskazany odczyt. Zachowaj oryginalny zapis i kontekst importu w danych wejściowych oraz raporcie `coverage`, aby dało się wrócić do decyzji.

Jeżeli żadna analiza zapisu nie znajduje potwierdzenia w dostępnych, dozwolonych źródłach, nie twórz znaczenia. Zwróć oryginalny zapis jako `deferred` z kodem `not_found_in_sources`. Nie twierdź, że słowo na pewno nie istnieje w języku; wynik oznacza brak potwierdzenia w sprawdzonych źródłach. Gdy źródło jest niedostępne albo niekompletne, użyj `insufficient_evidence` zamiast `not_found_in_sources`. Możesz podać sprawdzoną propozycję poprawnej pisowni, ale nie zastępuj nią wejścia automatycznie.

## Procedura

### 1. Ustal słowo lub wyrażenie

1. Rozpoznaj lemat, kategorię, formy fleksyjne, homografy i granice wyrażenia. `vado`, `andavo` i `andrei` są formami `andare`, a `prendere una decisione` może być odrębną frazą od `prendere`, jak określa [model projektu](../filippo.md#21-słowo-lub-fraza-w-lexicalsense). Nie twórz osobnego znaczenia dla każdej odmiany. Jeśli goły zapis jest zarówno samodzielnym hasłem, jak i formą innego lematu, opracuj **każde** poświadczone odczytanie; znaczenia formy fleksyjnej zapisz z jej lematem w `lexical_item_it` i zachowaj powiązanie z formą wejściową. Na przykład `attraverso` może dać znaczenia przyimka, przysłówka i czasownika `attraversare`. Nie odrzucaj analizy czasownikowej tylko dlatego, że jej lemat ma inny zapis.
2. Zachowaj frazę jako jedną jednostkę, gdy użytkownik podał ją jako cel nauki i ma własne utrwalone znaczenie albo łączliwość. Nie uznawaj przypadkowego sąsiedztwa słów w zdaniu za frazę słownikową. Jeśli granicy nie da się ustalić, odrocz wejście.
3. Porównaj zapis i kategorię z istniejącymi znaczeniami. Wariant pisowni może odpowiadać istniejącemu odczytowi; identyczny zapis może też oznaczać różne leksemy. Nie rozstrzygaj tożsamości samym podobieństwem liter.

### 2. Ustal zakres znaczeń, których dotyczy wejście

1. Jeżeli użytkownik podał polską glosę, zdanie lub opis sytuacji, wyszukaj tylko współczesne znaczenia zgodne z tą intencją. Glosa jest wskazówką wyboru; włoskie znaczenie i ograniczenia sprawdź osobno. Gdy kontekst wskazuje wyłącznie dawne znaczenie, pomiń je i wyjaśnij to w `coverage.notes_pl`.
2. Dla gołego hasła bez wskazówki zbierz dobrze udokumentowane **współczesne użycia ogólne**, które stanowią osobne cele leksykalne. Nie dodawaj znaczeń historycznych ani przestarzałych; znaczenia regionalne lub specjalistyczne dodawaj tylko wtedy, gdy wskazuje je materiał lub polecenie i nadal są współczesne. Samo występowanie znaczenia w słowniku, zwłaszcza tylko w wykazie synonimów albo tłumaczeń, nie wystarcza do uznania go za współczesne użycie ogólne. Jeżeli jego aktualność lub ogólny zasięg budzi wątpliwość, sprawdź dodatkowe źródło opisujące użycie albo rzeczywisty współczesny kontekst. Bez takiego potwierdzenia nie dodawaj kandydata do `lexical_senses`; gdy może być współczesny, lecz dostępne źródła nie pozwalają tego rozstrzygnąć, wpisz go do `deferred` jako `insufficient_evidence`. Lista nie jest obietnicą pełnego opisu słownika; zapisz, jaki zakres przejrzano i co pominięto.
3. Jeżeli źródła pokazują kilka możliwych użyć, lecz nie pozwalają wiarygodnie opisać ich granicy lub użytkownik wymaga wyboru jednego bez kontekstu, zwróć kandydatów do rozstrzygnięcia w raporcie `deferred`. Nie przedstawiaj arbitralnego wyboru jako intencji użytkownika.

### 3. Zbierz dowody dla każdego kandydata

1. Sprawdź znaczenie, część mowy, wymaganą składnię i przyimki, rejestr oraz istotne ograniczenia w dopuszczonym źródle. W `evidence` zapisz dla każdej wykorzystanej pozycji typ źródła, konkretny lokalizator i tylko te właściwości, które naprawdę potwierdza. Własny przykład zdania nie jest dowodem znaczenia.
2. Domyślne źródło kandydatów to strukturalne dane Wikidata Lexeme na CC0 i kontekst podany przez użytkownika; ich trafność trzeba sprawdzić. Tekst Wikizionario jest na CC BY-SA, a warunki Treccani ograniczają automatyczne pozyskiwanie i użycie treści. Używaj dodatkowych źródeł tylko zgodnie z ich warunkami; szczegóły i źródła pierwotne są w [notatce badawczej](../lexical-sense-research.md). Nie kopiuj definicji ani przykładów, jeśli zasady ich ponownego użycia nie zostały obsłużone.
3. Gdy źródło nie rozstrzyga granicy znaczenia, łączliwości, rejestru albo tego, czy użycie jest współczesne i ogólne, szukaj niezależnego potwierdzenia. Jeśli konflikt pozostaje istotny dla opisu, odrocz kandydata. Jedno źródło wystarcza, gdy jasno potwierdza potrzebne właściwości; nie wymagaj mechanicznie dwóch źródeł ani poświadczonego zdania dla każdego sensu. Znaczenia wywnioskowanego wyłącznie z listy synonimów lub przekładów nie traktuj jak wprost opisanego znaczenia. Nie twórz fikcyjnych cytatów, etykiet rejestru ani twierdzeń o częstotliwości. Jeżeli rejestru nie da się ustalić, użyj `unknown`.

### 4. Rozdziel lub połącz znaczenia

1. Utwórz osobne sensy, gdy inna interpretacja zmienia objaśnienie, poprawny kontekst, wymagany wzorzec lub ograniczenia użycia w sposób ważny dla przyszłej nauki. Sprawdź, czy jedna precyzyjna definicja i przykład nadal uczciwie opisują oba użycia. Jeśli nie, rozdziel.
2. Nie rozdzielaj znaczeń z powodu czasu, osoby, liczby, rodzaju, wariantu pisowni ani samego tematu zdania. Numeracja w słowniku jest materiałem do analizy, a nie automatycznym podziałem lokalnych sensów.
3. W przypadkach granicznych porównaj własne definicje, wzorce i przykłady dwóch kandydatów: jeśli różnica sprowadza się do tematu przykładu albo wymiennego polskiego przekładu, połącz je; jeśli zmienia warunki poprawnego użycia lub interpretację, rozdziel. Zapisz krótkie uzasadnienie takiej decyzji w `coverage.notes_pl`. To ma zwiększyć szansę spójnego wyniku, a nie narzucać stałą liczbę sensów.
4. Wiele polskich odpowiedników może należeć do jednego `glosses_pl` tylko wtedy, gdy wszystkie odpowiadają temu samemu włoskiemu użyciu. Samo podobne tłumaczenie nie jest dowodem, że dwa włoskie użycia są jednym sensem.
5. Znaczenie utrwalonej frazy zapisuj z całą frazą w `lexical_item_it`. Nie przypisuj go automatycznie pojedynczemu słowu, które jest jej składnikiem.

### 5. Zbuduj JSON

1. `lexical_item_it` zawiera włoską postać hasłową słowa lub całej frazy opisywanej w tym rekordzie. `definition_it` ma krótko parafrazować włoskie znaczenie; `definition_pl` objaśniać dokładnie to samo znaczenie po polsku. `glosses_pl` zawiera krótkie odpowiedniki, bez mieszania sensów.
2. `usage.patterns_it` zapisuje wymagane przyimki, ramy argumentowe i niezmienne części frazy. `collocations_it` zawiera tylko przykłady typowych połączeń. `constraints_pl` zapisuje granice użycia, które mogą zmienić interpretację znaczenia. Pusta lista oznacza, że sprawdzono daną własność i nie znaleziono szczególnego ograniczenia.
3. Dodaj co najmniej jeden naturalny włoski przykład z polskim tłumaczeniem. Własne zdanie oznacz `origin: "authored"`; przykład poświadczony oznacz `attested` i połącz przez `evidence_id` z konkretnym źródłem. Nie udawaj, że zdanie wymyślone przez model pochodzi z korpusu.
4. Nie dodawaj do rekordu ćwiczeń, luk, kluczy odpowiedzi, tagów kompetencji ani parametrów FSRS. `LexicalSense` opisuje znaczenie i jego użycie.

### 6. Deduplikuj i nadaj identyfikatory

1. Dla każdego kandydata porównaj z istniejącymi znaczeniami o tym samym lub podobnym `lexical_item_it`: definicje, przykłady, część mowy, konstrukcje oraz ograniczenia. Jeżeli to ten sam sens, umieść w wyniku pełny istniejący rekord z jego `lexical_sense_id`; ewentualną korektę opisu rozpatrz osobno, bez tworzenia duplikatu.
2. Dla nowego sensu nadaj niezmienny `lexical_sense_id` w warstwie zapisu, po ponownej kontroli duplikatów. Agent może posługiwać się tymczasowym `candidate_id` w toku pracy, lecz finalny JSON ma prawdziwy, unikalny identyfikator. Zmiana opisu nie zmienia tego identyfikatora.
3. Nie scalaj ani nie rozszczepiaj automatycznie istniejącego sensu z historią nauki. Zgłoś konflikt i wymagane rozstrzygnięcie migracji, aby nie zgubić powiązań.

## Kontrola przed zapisem

Gotowy JSON musi:

- odpowiadać [schematowi](lexicalsense.schema.json), a `lexical_item_it` musi zawierać właściwe słowo lub całą frazę w postaci hasłowej;
- mieć dowód znaczenia, a dla podanych szczególnych wzorców, rejestru i ograniczeń także dowód tych twierdzeń;
- zawierać włoski przykład rzeczywiście pokazujący ten sens i polskie tłumaczenie o tym samym znaczeniu;
- odróżniać się od najbliższych istniejących sensów albo ponownie użyć ich identyfikatorów;
- mieć poprawne odwołania `examples[].evidence_id` i brak sprzeczności między definicjami, glosami oraz wzorcami;
- zachowywać dotychczasowe identyfikatory i powiązania po ponownym imporcie.

Walidacja JSON Schema sprawdza kształt danych. Poprawność postaci hasłowej, jakość językową, źródła, zgodność przykładów i brak duplikatów sprawdza proces według powyższych reguł.

## Wynik partii

Zwróć jeden obiekt JSON z polami:

| Pole | Zawartość |
| --- | --- |
| `lexical_senses` | Tablica wszystkich gotowych znaczeń rozpoznanych dla wejścia, nowych i wcześniej istniejących. Każdy sens występuje raz jako pełny rekord zgodny z `lexicalsense.schema.json`. |
| `deferred` | Tablica obiektów z `input_form_it`, `reason_code` i `needed_evidence_or_decision`. Jeśli odczyt ustalono, można dodać `lexical_item_it` i `part_of_speech`. Opcjonalne są `candidate_label_pl` i źródłowo potwierdzone `suggested_forms_it`. `reason_code` to `ambiguous_item`, `insufficient_evidence`, `not_found_in_sources`, `source_rights` albo `dedup_conflict`. |
| `coverage` | Po jednym obiekcie na rozpoznany odczyt: `lexical_item_it`, `part_of_speech`, `selection_basis` (`provided_context` albo `general_use`), opcjonalne `matched_input_form_it` gdy forma wejściowa różni się od lematu, i `notes_pl` wyjaśniające przejrzany zakres oraz świadome pominięcia. Dla zapisu bez rozpoznanego odczytu zwróć `input_form_it`, `selection_basis: "unresolved_input"` i `notes_pl` z listą sprawdzonych źródeł. |

Można następnie zapisać `lexical_senses` jako jeden plik `.json` albo osobne pliki rekordów. Nie umieszczaj w tej tablicy odroczonych kandydatów. Jeśli `deferred` jest niepuste, wynik partii jest częściowy; pozostałe poprawne znaczenia zachowaj. Warstwa zapisu zwraca identyfikatory nowych sensów po transakcyjnej kontroli duplikatów, zanim ten końcowy obiekt zostanie oddany jako wynik.

Reguły obowiązują niezależnie od konkretnej listy. Każde uruchomienie ma jednak udokumentować, które wejścia przeanalizowano, jakie źródła sprawdzono oraz które znaczenia zostały odroczone.

Przykład dla niepotwierdzonego zapisu `xzyqpl`: `lexical_senses: []`, `deferred: [{"input_form_it":"xzyqpl","reason_code":"not_found_in_sources","needed_evidence_or_decision":"Sprawdzić pisownię lub podać kontekst."}]`. `coverage` ma wówczas wpis z `input_form_it` i sprawdzonymi źródłami. Ten przykład pokazuje kształt odpowiedzi, a nie twierdzi, że wykonano wyszukiwanie tego zapisu.
