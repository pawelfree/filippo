# Oddzielenie powtórek cloze

Data: 2026-11-03. Status: zakończony.

Cel: oddzielić powtórki i utrwalenia od nauki nowych znaczeń oraz ponownie używać wcześniejszego ćwiczenia w trybie powtórek.

Specyfikacja: [cloze review mode](../specs/implemented/2026-11-03-cloze-review-mode.md).

Ustalenie: licznik FSRS „do powtórki” może obejmować znaczenia z poprzednich dni; utrwalenia po błędnej odpowiedzi są liczone osobno.

Działania: rozdzielono wybór FSRS na powtórki i nowe znaczenia; tryb powtórek przydziela ostatnie zapisane ćwiczenie cloze dla znaczenia, a brakujące ćwiczenia pobiera z dostępnej puli lub generuje. Na ekranie dodano osobny przycisk powtórek i licznik utrwaleń. Dodano testy selekcji, przydziału i żądań ekranu.

Sprawdzenie: `npm run build` zakończone poprawnie; `npm test` 35/35 poprawnych po uruchomieniu z dostępem do lokalnego portu testu HTTP; `git diff --check` bez błędów. Pierwsze uruchomienie testów w sandboxie nie mogło nasłuchiwać na 127.0.0.1 (`EPERM`).

Wynik: kryteria spełnione. Brak otwartych problemów w tym zakresie.
