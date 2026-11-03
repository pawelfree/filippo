# Odpowiedź endpointu ograniczona do LexicalSense

- Data: 2026-11-03
- Status: zakończony
- Cel: poprawić endpoint wejścia do ćwiczeń, aby zwracał wyłącznie dane wybranych `LexicalSense`.
- Specyfikacja: [wejście do generowania ćwiczeń](../specs/implemented/2026-11-03-exercise-generation-input.md).
- Działania: usunięto profil i taksonomię z serwisu i typu odpowiedzi; zaktualizowano test i README.
- Kontrole: trzy testy metody i kontrolera przechodzą; `npm run build` przechodzi; odczyt lokalnej bazy dla `cmvzt331p000dmspo5q12o5t5` zwrócił tylko klucz `lexical_senses`; `git diff --check` przechodzi.
- Decyzje: zachowano obiekt `{ lexical_senses: [...] }` i istniejącą trasę.
- Nierozstrzygnięte: brak.
- Wynik: endpoint zwraca wyłącznie projekcje wybranych znaczeń.
