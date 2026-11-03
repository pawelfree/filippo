# Kontrakt generowania czterech ćwiczeń na znaczenie

- Data: 2026-11-03
- Status: zakończony
- Cel: dostosować istniejące dokumenty do czterech ćwiczeń na zapisany `LexicalSense` i jawnych wskazówek izolujących gramatykę.
- Specyfikacje: brak nowej specyfikacji; zmiana istniejącego kontraktu dokumentacyjnego.
- Działania: zmieniono [reguły generowania](../docs/generation_rules/generation_rules.md) i [schemat ćwiczenia](../docs/generation_rules/exercise.schema.json). Wprowadzono identyfikator znaczenia z bazy, cztery zadania z różnymi `exercise_id`, dobór różnych celów i trudności, pole `hints` oraz jawne `intent` i `difficulty`.
- Kontrole: `git diff --check`; schemat JSON kompiluje się w Ajv 2020; wyszukanie starych wymogów liczby ćwiczeń w bieżących dokumentach.
- Decyzje: cztery zadania są zestawem dla jednego znaczenia; samo ich wygenerowanie nie tworzy czterech ocen FSRS. Wskazówki mogą izolować gramatykę, lecz nie ujawniają rozwiązania.
- Nierozstrzygnięte: implementacja skilla i zapis zestawów w aplikacji pozostają osobnymi zadaniami.
- Wynik: dokumenty kontraktowe zaktualizowane; bez zmian w kodzie aplikacji.
