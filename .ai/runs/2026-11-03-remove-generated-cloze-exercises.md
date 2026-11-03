# Usunięcie wygenerowanych ćwiczeń cloze

Date: 2026-11-03
Status: completed
Objective: Usunąć wszystkie zapisane ćwiczenia wygenerowane przez cloze z lokalnej bazy.
Spec: [Nauka cloze](../specs/implemented/2026-11-03-cloze-study.md)

## Checks before deletion

- Aktywna konfiguracja wskazuje lokalne `prisma/dev.db`.
- `ClozeExercise`: 8 rekordów; `ClozeAttempt`: 0 rekordów.
- Nie ma prób rozwiązania, które blokowałyby usunięcie ćwiczeń przez klucz obcy.

## Actions and outcome

- W transakcji SQLite z włączonymi kluczami obcymi usunięto 8 rekordów `ClozeExercise`.
- Kontrola po operacji: `ClozeExercise` 0, `ClozeAttempt` 0, `GeneratedTask` 0; pozostawiono 1 historyczny rekord `ClozeSession`.
- Nie zmieniono ocen FSRS ani kodu aplikacji.
