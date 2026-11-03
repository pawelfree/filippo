# Stan generowania ćwiczeń cloze

Date: 2026-11-03
Status: completed
Objective: Pokazać trwały stan generowania ćwiczeń podobnie do historii generowania znaczeń.
Spec: [Nauka cloze](../specs/implemented/2026-11-03-cloze-study.md)

## Actions and decisions

- Dodano `GET /api/cloze/sessions` z podsumowaniem 20 ostatnich sesji, stanem, postępem i błędami.
- Na stronie cloze dodano tabelę historii z filtrami stanów i odświeżaniem.
- Po uwadze użytkownika usunięto otwieranie sesji nauki z tabeli stanu generowania: w tym miejscu nie ma zadania do wznowienia.
- Rozdzielono postęp generowania zestawów od postępu rozwiązywania znaczeń.
- Postęp zestawu obejmuje komplet czterech poprawnych ćwiczeń albo zapisane niepowodzenie dla znaczenia.

## Checks and outcome

- `npm run build`: passed.
- `node --import tsx --test tests/cloze-screen.test.ts tests/cloze-study.test.ts`: 6/6 passed.
- `npm test`: 29/29 passed po uruchomieniu poza ograniczeniem lokalnego portu sandboxa.
- `git diff --check`: passed.
- Rzeczywista usługa OpenAI nie była wywoływana w tym runie; testy używają kontrolowanej odpowiedzi.
