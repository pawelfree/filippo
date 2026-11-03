# Rotacja ćwiczeń cloze

Data: 2026-11-03. Status: zakończony.

Cel: dopasować przydział ćwiczenia do rodzaju powtórki i dnia ostatniej próby cloze.

Specyfikacja: [rotacja ćwiczeń](../specs/implemented/2026-11-03-cloze-exercise-rotation.md).

Decyzja: porównanie dni odbywa się w Europe/Warsaw, jak pozostałe liczniki dzienne nauki.

Działania: przydział w `ClozeService` zależy od `kind` i dnia ostatniej próby cloze. Dzisiejsze utrwalenie i powtórka używają poprzedniego ćwiczenia. Powtórka po wcześniejszym dniu pomija ostatnie ćwiczenie, wybiera niewykorzystane, a przy wyczerpaniu puli worker generuje cztery kolejne. Worker stosuje tę samą regułę również po odłożonym starcie. Tekst ekranu i testy dostosowano do reguły.

Sprawdzenie: `npm run build` poprawnie; `npm test` 35/35 poprawnych; `git diff --check` bez błędów.

Wynik: kryteria spełnione. Brak otwartych problemów w tym zakresie.
