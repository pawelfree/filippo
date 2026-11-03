# Widoczność i działanie odświeżania stanu cloze

Date: 2026-11-03
Status: completed
Objective: Wyjaśnić i poprawić przycisk „Odśwież stan”, który wygląda na nieaktywny.
Spec: [Nauka cloze](../specs/implemented/2026-11-03-cloze-study.md)

## Actions

- Przycisk miał klasę `secondary`, która dawała mu jasny, podobny do wyłączonego wygląd, choć atrybut `disabled` był fałszywy. `loadHistory()` pomijał kliknięcie podczas trwającego odczytu bez informacji dla użytkownika.
- Test interfejsu odtworzył niewłaściwy wygląd. Usunięto klasę `secondary`, a podczas odczytu przycisk pokazuje „Odświeżanie…”. Po korekcie użytkownika usunięto dodatkowy komunikat potwierdzający odświeżenie.
- Kliknięcie podczas innego odczytu zapamiętuje żądanie i uruchamia kolejny odczyt po zakończeniu bieżącego.

## Checks and outcome

- `npm run build`: passed.
- `node --import tsx --test tests/cloze-screen.test.ts`: 5/5 passed, w tym kliknięcie podczas trwającego odczytu.
- `git diff --check`: passed.
