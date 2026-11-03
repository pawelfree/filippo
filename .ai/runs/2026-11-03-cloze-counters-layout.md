# Układ liczników cloze

Data: 2026-11-03. Status: zakończony.

Cel: pokazać trzy liczniki przeglądu cloze w jednym rzędzie na szerokim ekranie.

Przyczyna: widok przejął klasę `.study-counters` z ekranu Nauka, która ma stałe dwie kolumny i ograniczenie szerokości do 600 px. Po dodaniu trzeciego licznika spadał on do drugiego wiersza.

Działanie: lokalna reguła w `cloze.css` ustawia trzy kolumny i pełną dostępną szerokość dla przeglądu cloze; poniżej 760 px są dwie kolumny, poniżej 480 px jedna. Układ ekranu Nauka pozostał bez zmian.

Sprawdzenie: `git diff --check` bez błędów; kolejność arkuszy w `cloze.html` zapewnia zastosowanie reguły po `study.css`. Nie uruchamiano testów kodu dla zmiany samego układu CSS.

Wynik: trzy liczniki mieszczą się obok siebie na szerokim ekranie. Brak nierozwiązanych kwestii.
