# Puste liczniki nauki na ekranie cloze

Date: 2026-11-03
Status: completed
Objective: Usunąć puste liczniki FSRS na ekranie cloze przed sesją i po odpowiedziach.
Spec: [Cloze według kolejki FSRS](../specs/implemented/2026-11-03-cloze-fsrs-queue.md)

## Findings and actions

- Lokalny `StudyService.overview()` zwrócił poprawne liczniki z bazy. Nie znaleziono niepełnych stanów FSRS.
- Test widoku odtworzył puste liczniki (`—`), gdy dodatkowy adres `/api/cloze/overview` odpowiadał 404, mimo że `/api/study/overview` działał. To zgodne z rozbieżnością wersji strony i działającego backendu; brak dostępu do przeglądarki użytkownika nie pozwolił potwierdzić dokładnej odpowiedzi jego serwera.
- Widok cloze pobiera liczniki bezpośrednio z `/api/study/overview`, używanego przez ekran „Nauka”. Usunięto zbędny adres pośredni w cloze.
- Przy nieudanym odczycie liczniki pokazują „Błąd” i wiadomość o przyczynie. Starsza, wolniejsza odpowiedź nie może nadpisać nowszych liczników po ocenie.
- W otwartej karcie Chrome po odświeżeniu widoczne były liczniki sesji oraz „Dziś do nauki”. Poprawiono też stary opis sugerujący, że każde znaczenie pojawia się tylko raz.

## Checks and outcome

- Przed poprawką test pustych liczników nie przeszedł (`—` zamiast `1`).
- `npm run build`: passed.
- Testy cloze i nauki: 12/12 passed.
- `npm test`: 33/33 passed poza ograniczeniem lokalnego portu sandboxa.
- `git diff --check`: passed.
