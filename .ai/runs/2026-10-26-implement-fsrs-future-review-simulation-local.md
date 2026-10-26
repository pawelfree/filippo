# Lokalne wdrożenie symulacji powtórek FSRS

- **Data:** 2026-10-26
- **Status:** zakończono.
- **Cel:** wdrożyć symulację 30 dni jako drugą stronę obszaru „Statystyki”, lokalnie bez PR.
- **Specyfikacja:** [symulacja przyszłych powtórek](../specs/implemented/2026-10-26-fsrs-future-review-simulation.md).
- **Działania:** dodano odczytową symulację FSRS-7 na 30 dni z 100 deterministycznymi przebiegami, ograniczeniami obliczeń, scenariuszem nowych znaczeń i lokalnych utrwaleń. Dodano endpoint, drugą stronę w menu „Statystyki”, wykres z tabelą liczbową oraz stany ładowania, błędu i pustego wyniku. Zaktualizowano specyfikację i przeniesiono ją do `implemented/`.
- **Sprawdzenie:** `npm run build` i `git diff --check` przeszły. `npm test` przeszło 20/20 po uruchomieniu z możliwością lokalnego nasłuchu HTTP; sandbox bez tej możliwości blokował jeden istniejący test błędem `EPERM`. W Chrome sprawdzono przejście z menu, scenariusz z nowymi znaczeniami, zmianę parametrów i pusty wynik.
- **Decyzje:** bez PR zgodnie z bezpośrednim poleceniem użytkownika. Symulowane nowe znaczenia są rozpoczynane pod koniec dnia po należnych powtórkach; wynik pozostaje wyłącznie w pamięci żądania.
- **Nierozstrzygnięte:** brak blokujących.
- **Wynik:** implementacja lokalna gotowa.
