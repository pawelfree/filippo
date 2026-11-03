# Ograniczone próby generowania ćwiczeń

- Data: 2026-11-03
- Status: zakończony
- Cel: ograniczyć liczbę prób AI przy generowaniu ćwiczeń i ujawnić niepowodzenia w odpowiedzi.
- Specyfikacje: brak nowej specyfikacji; rozwinięcie [kontraktu generowania](../docs/generation_rules/generation_rules.md).
- Działania: dodano limit trzech prób na każde z czterech miejsc, zasadę wcześniejszego zakończenia przy braku kandydatów, wynik częściowy oraz [schemat odpowiedzi](../docs/generation_rules/generation_result.schema.json).
- Kontrole: `git diff --check`; schemat odpowiedzi i schemat ćwiczenia kompilują się w Ajv 2020; przykład akceptuje 3 próby i odrzuca 4.
- Decyzje: próba obejmuje wygenerowanie i pełną kontrolę jednego kandydata; zmiana celu nie odnawia limitu. Każde miejsce zwraca ćwiczenie albo powód braku z liczbą wykorzystanych prób 0–3.
- Nierozstrzygnięte: implementacja skilla i integracja aplikacji pozostają odrębne.
- Wynik: bieżący kontrakt dokumentacyjny opisuje zakończenie po skończonej liczbie prób i jawny wynik częściowy.
