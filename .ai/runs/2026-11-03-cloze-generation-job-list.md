# Lista zleceń generowania cloze

Data: 2026-11-03. Status: zakończony.

Cel: usunąć z listy generowania sesje, które tylko pobrały gotowe ćwiczenia.

Specyfikacja: [lista zleceń generowania](../specs/implemented/2026-11-03-cloze-generation-job-list.md).

Odtworzenie: `node --import tsx --test tests/cloze-study.test.ts` — test „using an existing exercise must not appear as AI generation” jest czerwony; endpoint zwraca sesję bez wywołania AI.

Przyczyna: `listSessions()` pobierał wszystkie `ClozeSession`; gotowa sesja używająca istniejącego ćwiczenia nie różniła się trwałym znacznikiem od zlecenia generowania.

Działania: dodano `generationRequested` do sesji, ustawiane przy brakujących ćwiczeniach. Endpoint listy filtruje po tym polu przed ograniczeniem do 20 rekordów. Worker usuwa znacznik, jeśli brak został w międzyczasie uzupełniony bez wywołania AI. Migracja klasyfikuje starsze sesje na podstawie stanu, zapisanych niepowodzeń i daty powstania przypisanego ćwiczenia. Dodano regresję dla sesji używającej gotowego ćwiczenia, wyścigu między sesjami i migracji historycznych danych.

Sprawdzenie: `npm run db:generate`, `npm run build`, `npm test` 36/36 poprawnych. Migracja `20261103200000_cloze_generation_jobs` zastosowana do lokalnej bazy; 5 sesji, 1 zlecenie generowania. `git diff --check` bez błędów.

Wynik: lista pokazuje tylko zlecenia generowania. Brak otwartych problemów w tym zakresie.
