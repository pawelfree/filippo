# Słowo lub fraza bezpośrednio w LexicalSense

Data: 2026-10-25  
Status: zakończony

## Cel

Usunąć wymóg osobnego rekordu i identyfikatora `LexicalItem`. Każdy `LexicalSense` ma zawierać słowo lub frazę, której znaczenie opisuje.

## Zakres

Schemat `LexicalSense`, reguły tworzenia, przykładowe JSON-y oraz bieżące dokumenty modelu i planu. Schemat ćwiczenia już odnosi się tylko do `lexical_sense_id`.

## Działania, kontrole i wynik

- Zmieniono [schemat znaczenia](../docs/lexical_sense/lexicalsense.schema.json): usunięto `lexical_item_id` i `canonical_form_it`, dodano wymagane `lexical_item_it` zawierające słowo lub frazę; wersja schematu wzrosła do 2.0.0 z powodu zmiany kontraktu.
- Zmieniono [reguły tworzenia](../docs/lexical_sense/creation.rules.md): wejście nie wymaga identyfikatora rodzica, deduplikacja porównuje słowo/frazę, część mowy i znaczenie, a `coverage` opisuje rozpoznane odczytania.
- Przepisano sześć przykładowych plików wejścia/wyniku (`vizioso`, `attraverso`, `distinzione`/`mantenere`/`systema`) na nowy kształt bez zmiany treści znaczeń i ich `lexical_sense_id`.
- Zaktualizowano [opis domeny](../docs/filippo.md), [plan P0.1](../docs/clozemaster_plan_prac.md), [notatkę badawczą](../docs/lexical-sense-research.md) i indeks lekcji. Starsze logi otrzymały adnotacje odróżniające ich historyczny stan od obecnych plików.
- Schemat ćwiczenia już wskazuje tylko `lexical_sense_id`; nie wymagał zmiany. Nie modyfikowano `generation_rules.md`.
- Sprawdzono odwołania do usuniętych pól w bieżących dokumentach i przykładach: brak. Przykładowe JSON-y zostały odczytane i przepisane przez parser JSON. Nie uruchamiano testów ani walidacji schematem, ponieważ użytkownik nie prosił o testy.
- Wynik: rekord `LexicalSense` sam zawiera włoskie słowo lub frazę; nie ma osobnego identyfikatora `LexicalItem`.
