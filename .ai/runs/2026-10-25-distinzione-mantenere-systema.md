# Wykonanie reguł LexicalSense: distinzione, mantenere, systema

Data: 2026-10-25  
Status: zakończony

## Cel

Wykonać [reguły tworzenia](../docs/lexical_sense/creation.rules.md) dla trzech surowych zapisów i zapisać wejście oraz wynik JSON.

## Działania i decyzje

- Odczytano reguły, schemat, notatkę o źródłach oraz wcześniejsze przykłady.
- Sprawdzono włoskie Wikizionario dla `distinzione`, `mantenere`, `systema`, `sistema`; pierwsze dwa hasła istnieją, `systema` nie ma tam hasła włoskiego, `sistema` jest osobnym hasłem i formą `sistemare`.
- Sprawdzono hasła angielskiego Wiktionary i strukturalne dane Wikidata Lexeme. Dla `systema` brak włoskiej sekcji w angielskim Wiktionary oraz włoskiego leksemu w wynikach wyszukiwania Wikidata; obecne są odczytania w innych językach.
- Zapisano [wejście](../docs/lexical_sense/examples/distinzione-mantenere-systema.input.json) i [wynik](../docs/lexical_sense/examples/distinzione-mantenere-systema.result.json). Nie zastąpiono `systema` przez `sistema` bez potwierdzenia intencji użytkownika.

## Kontrole, kwestie otwarte i wynik

- Walidacja lokalnym Ajv Draft 2020-12: siedem rekordów `LexicalSense` zgodnych ze schematem, identyfikatory unikalne; jedno odroczenie i trzy wpisy pokrycia.
- Wynik: trzy znaczenia `distinzione`, cztery `mantenere`; `systema` odroczono z propozycją `sistema`.
- Wcześniejsze przykłady nie stanowią produkcyjnego katalogu. Użyte identyfikatory `li-demo-*` i `ls-demo-*` odnoszą się do zapisanych artefaktów demonstracyjnych; przed importem do katalogu trzeba rozstrzygnąć odpowiednie identyfikatory produkcyjne oraz deduplikację.

Aktualizacja modelu z 2026-10-25: powiązane pliki przeniesiono na schemat 2.0.0. Każdy sens zawiera teraz `lexical_item_it`; identyfikatory `li-demo-*` opisują stan pierwotnego przebiegu i nie występują już w plikach. Identyfikatory `ls-demo-*` pozostały.
