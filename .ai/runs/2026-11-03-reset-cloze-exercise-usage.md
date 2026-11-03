# Zerowanie wykorzystania ćwiczeń cloze

Date: 2026-11-03
Status: completed
Objective: Dodać osobny reset informacji o wykorzystaniu ćwiczeń na ekranie „Nauka”.
Spec: [Zerowanie wykorzystania ćwiczeń](../specs/implemented/2026-11-03-reset-cloze-exercise-usage.md)

## Actions and decisions

- Dodano `ClozeExerciseUsage`, zasilony migracją z unikalnych ćwiczeń w dotychczasowych `ClozeAttempt`; lokalna baza miała po migracji tyle samo oznaczeń co różnych rozwiązanych ćwiczeń.
- Wybór ćwiczenia w nowej sesji i worker generowania korzystają z oznaczeń wykorzystania. Odpowiedź oznacza ćwiczenie w tej samej transakcji co zapis próby.
- `POST /api/cloze/exercise-usage/reset` usuwa tylko oznaczenia. Historia odpowiedzi, ćwiczenia i oceny FSRS pozostają. Trwająca sesja zachowuje przydział.
- Na ekranie „Nauka” dodano przycisk obok istniejącego resetu w przeglądzie i sesji. Anulowanie potwierdzenia nie wywołuje API.
- Pełny reset postępu nauki nadal czyści także wykorzystanie ćwiczeń, zgodnie z wcześniejszym zachowaniem, gdy usuwał wszystkie `ClozeAttempt`.

## Checks and outcome

- `npm run db:generate`, `npm run db:migrate`, `npm run build`: passed.
- Testy cloze i nauki: 10/10 passed.
- `npm test`: 34/34 passed poza ograniczeniem lokalnego portu sandboxa.
- `git diff --check`: passed.
