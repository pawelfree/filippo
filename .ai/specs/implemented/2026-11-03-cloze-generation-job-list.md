# Lista rzeczywistych zleceń generowania cloze

Status: implemented. Utworzono: 2026-11-03. Przeniesiono do `implemented/` 2026-11-03 po spełnieniu kryteriów.

## Problem

Lista „Stan generowania ćwiczeń” pokazuje każdą sesję cloze, także sesję korzystającą wyłącznie z gotowych ćwiczeń bez zlecenia AI.

## Oczekiwane działanie i zakres

- Lista i jej liczniki obejmują wyłącznie sesje, które wymagały wygenerowania brakujących ćwiczeń.
- Pobranie gotowego ćwiczenia i rozpoczęcie nauki nie tworzy pozycji na liście generowania.
- Zlecenia oczekujące, wykonywane, zakończone i przerwane pozostają widoczne wraz z właściwym postępem.
- Jeśli zadanie oczekiwało na AI, ale przed uruchomieniem workera otrzymało gotowe ćwiczenie z innej sesji, po zakończeniu znika z listy zleceń AI.
- Istniejące rekordy należy zaklasyfikować na podstawie zapisanych dowodów generowania, bez przypisywania każdej gotowej sesji do zleceń AI.

## Kryteria akceptacji

- [x] Test odtwarza błędny wiersz po sesji korzystającej z gotowego ćwiczenia i potwierdza jego usunięcie.
- [x] Test potwierdza obecność sesji, która wygenerowała nowy zestaw.
- [x] Test potwierdza usunięcie z listy zadania rozwiązanego bez wywołania AI.
- [x] Kompilacja i pełny zestaw testów przechodzą (36/36).

## Otwarte pytania

Brak.

Powiązane: [przebieg pracy](../../runs/2026-11-03-cloze-generation-job-list.md).
