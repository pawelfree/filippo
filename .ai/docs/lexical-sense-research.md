# Research: tworzenie rekordów `LexicalSense` ze słów i wyrażeń

Data: 2026-10-25. Zakres tego badania kończy się na **zapisie danych znaczeń w JSON**. Generowanie zdań, luk i ćwiczeń jest późniejszym procesem i nie jest przedmiotem tego raportu. Lokalny punkt wyjścia stanowi [opis domeny i pozyskiwania słownictwa](filippo.md).

## Co potwierdzają źródła pierwotne

| Ustalenie | Źródło | Znaczenie dla tworzenia JSON |
| --- | --- | --- |
| Jednostka słownikowa może być pojedynczym słowem lub wyrażeniem wielowyrazowym; posiada formy i zbiór znaczeń. Forma jest jej realizacją gramatyczną. | [W3C OntoLex, §3.1 Lexical Entries](https://www.w3.org/2016/05/ontolex/#lexical-entries), [§3.2 Forms](https://www.w3.org/2016/05/ontolex/#forms) | Odmienione postacie nie powinny automatycznie stawać się osobnymi znaczeniami. Granicę wyrażenia trzeba ustalić przed opisaniem jego znaczeń. Jest to zgodne z [lokalnym opisem słowa lub frazy](filippo.md#21-słowo-lub-fraza-w-lexicalsense). |
| `LexicalSense` opisuje konkretne znaczenie jednostki, a do znaczenia można dołączyć warunki użycia, np. domenę, kontekst lub rejestr. W modelu OntoLex sens łączy jednostkę z referentem ontologicznym. | [W3C OntoLex, §3.4 Lexical Sense & Reference](https://www.w3.org/2016/05/ontolex/#lexical-sense-reference), [§3.5 Usage](https://www.w3.org/2016/05/ontolex/#usage) | Sama lista polskich tłumaczeń może nie wystarczyć do odróżnienia sensów. Projekt może używać własnej glosy i informacji o użyciu; źródło nie wymaga od tej aplikacji identyfikatora zewnętrznej ontologii. |
| Wikidata rozdziela `Lexeme`, `Sense` i `Form`: lemat, język i kategorię leksykalną przypisuje do lexeme; sens ma własny identyfikator, glosy i twierdzenia; forma ma zapis i cechy gramatyczne. Dokument podaje włoski bezokolicznik jako przykład lematu czasownika. | [Wikidata, dokumentacja danych leksykograficznych: Lexeme lemmata, Lexeme senses, Lexeme forms](https://www.wikidata.org/wiki/Wikidata:Lexicographical_data/Documentation) | To model źródła, nie wymóg lokalnego repozytorium. Lokalny rekord zapisuje lemat w `lexical_item_it` i ma własny `lexical_sense_id`; identyfikator zewnętrznego sensu może pozostać informacją o źródle. |
| Hasło włoskiego `banca` w Wikizionario podaje m.in. znaczenie instytucji finansowej, oznaczenia dziedzinowe i formę liczby mnogiej; jedna z pozostałych pozycji ma niepełny opis. | [Wikizionario, hasło `banca`](https://it.wiktionary.org/wiki/banca) | Hasło może dać kandydatów i dowody dla jednego sensu, lecz samo istnienie podpunktu nie jest gwarancją, że da się z niego utworzyć pełny rekord. |
| W projekcie jedno słowo lub wyrażenie może mieć wiele `LexicalSense`; import ma odróżniać nowy sens od istniejącego, wariant zapisu i podobne wyrażenie. Korekta opisu nie powinna przypadkowo usunąć powiązanego stanu nauki. | [filippo.md, §2–3](filippo.md) | Deduplikacja porównuje zapis, część mowy i znaczenie. Trwały lokalny `lexical_sense_id` powinien przetrwać redakcyjną poprawę opisu sensu. |

## Źródła włoskie i ograniczenia ponownego użycia

- Ustrukturyzowane dane Wikidata w przestrzeni `Lexeme` mają licencję **CC0** według [Wikidata:Copyright](https://www.wikidata.org/wiki/Wikidata:Copyright). Mogą być źródłem kandydatów, glos i zewnętrznych identyfikatorów. Dokumentacja opisuje strukturę, ale nie gwarantuje kompletności ani poprawności każdego wpisu: [Wikidata, dokumentacja](https://www.wikidata.org/wiki/Wikidata:Lexicographical_data/Documentation).
- Treść włoskiego Wikizionario jest objęta **CC BY-SA**, co wskazuje stopka [hasła `banca`](https://it.wiktionary.org/wiki/banca). Automatyczne kopiowanie definicji do aplikacji wymaga zgodności z tą licencją. Hasło może być użyte jako wskazówka do weryfikacji sensu, a opis zapisany w produkcie powinien mieć ustalone pochodzenie i prawa użycia.
- [Treccani Vocabolario](https://www.treccani.it/vocabolario/) może służyć do sprawdzenia znaczeń przez człowieka. Jego [warunki](https://www.treccani.it/footer/termine-condizioni/) zastrzegają treść, zakazują reprodukcji bez uprzedniej pisemnej zgody oraz wyraźnie zakazują TDM bez takiej zgody. Nie jest to otwarty zbiór definicji do automatycznego wydobywania i zapisywania w JSON.

## Wniosek projektowy: granica procesu

Poniższa kolejność jest propozycją dla przyszłych reguł tworzenia danych, wyprowadzoną z powyższych źródeł i [lokalnego procesu importu](filippo.md). Nie jest dodatkowym wymaganiem W3C lub Wikidata.

1. Zachować zapis wejściowy i kontekst jego pochodzenia; ustalić język, lemat, kategorię leksykalną i granicę jednostki, szczególnie dla wyrażeń wielowyrazowych.
2. Zebrać kandydatów sensów z dozwolonych źródeł. Dla każdego kandydata zapisać osobny opis znaczenia oraz dostępne informacje rozróżniające użycie: dziedzinę, typową łączliwość, rejestr lub ograniczenie. Nie dopisywać tych właściwości bez dowodu.
3. Porównać kandydata z istniejącymi sensami. Rozstrzygnąć, czy to istniejący sens, nowe znaczenie tego samego słowa lub frazy, wariant zapisu, czy inne wyrażenie.
4. Jeśli sama lista haseł nie określa zamierzonego znaczenia, zachować kandydatów jako nierozstrzygniętych albo zastosować jawną politykę wyboru. Nie przedstawiać zgadniętego sensu jako sensu wskazanego przez użytkownika. Lokalny opis mówi o rozpoznaniu właściwych jednostek i sensów przed dalszym użyciem: [filippo.md, §3](filippo.md).
5. Zwrócić i zapisać rekordy `LexicalSense` w JSON ze słowem lub frazą wpisanymi w każdy rekord, stabilną lokalną tożsamością znaczenia i informacją o pochodzeniu. Kontrola końcowa dotyczy zgodności schematu JSON, rozróżnialności sensów, języka, dowodów oraz deduplikacji. **Na tym kończy się ta operacja.**

## Granice ustaleń

- Nie wykonano pomiaru pokrycia ani jakości danych dla listy włoskich słów. Żadne z opisanych źródeł nie zostało tu uznane za samodzielnie wystarczające dla wszystkich sensów.
- W chwili rozpoczęcia badania repozytorium nie zawierało schematu znaczenia. Zaprojektowany później [schemat `LexicalSense`](lexical_sense/lexicalsense.schema.json) i [reguły tworzenia](lexical_sense/creation.rules.md) są lokalnymi decyzjami projektowymi; nie wynikają wprost z OntoLex lub Wikidata. Obecny schemat przechowuje słowo lub frazę bezpośrednio w znaczeniu, bez osobnego `LexicalItem`.
- Źródła nie narzucają, czy lista wejściowa oznacza wszystkie poświadczone sensy czy tylko wybrane z kontekstu. [Reguły tworzenia](lexical_sense/creation.rules.md) ustalają osobną politykę dla obu przypadków; jej trafność dydaktyczną trzeba ocenić na rzeczywistych listach. [Lokalny opis importu](filippo.md).
