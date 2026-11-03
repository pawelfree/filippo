# Integracja cloze z kolejką FSRS

Date: 2026-11-03
Status: completed
Objective: Użyć algorytmu ekranu „Nauka” do wyboru znaczeń i utrwaleń w cloze, dobierać kolejne ćwiczenia i pokazać liczniki.
Spec: [Cloze według kolejki FSRS](../specs/implemented/2026-11-03-cloze-fsrs-queue.md)

## Actions and decisions

- `StudyService` udostępnia wybór kilku różnych znaczeń z tej samej kolejki, zachowując priorytet należnych, utrwaleń i nowych.
- Sesja cloze zapisuje rodzaj próby oraz przydzielone ćwiczenie. Formalna ocena trafia do FSRS i wspólnej historii nauki; lokalne utrwalenie nie tworzy drugiej oceny FSRS.
- Po błędnej formalnej odpowiedzi znaczenie wraca raz w tej samej sesji na tym samym ćwiczeniu. Kolejna sesja bierze najstarsze poprawne, jeszcze nieużyte ćwiczenie.
- Gdy nie ma niewykorzystanego ćwiczenia, worker tworzy nowy zestaw czterech bez nadpisania poprzednich ćwiczeń i prób.
- Strona cloze pokazuje liczniki z tej samej kolejki co „Nauka”; przy braku dostępnych znaczeń nie pozwala rozpocząć sesji.
- Dodano i zastosowano migrację lokalnej bazy. Istniejące sesje zachowują obsługę starszego przydziału.

## Checks and outcome

- `npm run build`: passed.
- Testy cloze i kolejki FSRS: 11/11 passed.
- `npm test`: 32/32 passed poza ograniczeniem lokalnego portu sandboxa.
- `git diff --check`: passed.
- Generowanie AI zweryfikowano kontrolowaną odpowiedzią; rzeczywistego wywołania OpenAI nie wykonano.
