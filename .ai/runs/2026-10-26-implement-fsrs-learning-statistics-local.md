# Lokalne wdrożenie statystyk nauki FSRS

- **Data:** 2026-10-26
- **Status:** zakończony.
- **Cel:** wdrożyć ekran i odczyt statystyk FSRS zgodnie ze specyfikacją, lokalnie bez PR.
- **Specyfikacja:** [statystyki nauki FSRS](../specs/implemented/2026-10-26-fsrs-learning-statistics.md).
- **Działania:** dodano dwa odczyty statystyk FSRS, nową stronę w stylu Filippo, wejście z ekranu Nauka oraz test na izolowanej bazie SQLite. Uporządkowano stany puste i przeniesiono ukończoną specyfikację do `implemented/`.
- **Sprawdzenie:** `npm run build` zakończone poprawnie; `npm test` — 19/19 testów przechodzi po udostępnieniu lokalnego portu; `git diff --check` poprawne. Chrome z tymczasową bazą pokazał stronę, liczniki, stan bez ocen i stan bez kart. Test SQLite objął strefę Warszawy, kilka ocen w dniu, podział due, terminy, rewizję konfiguracji, wadliwą kartę i reset.
- **Decyzje:** zgodnie z bezpośrednią instrukcją użytkownika pominięto część skilla wymagającą PR; wdrożenie pozostaje lokalne.
- **Nierozstrzygnięte:** brak w zakresie tej specyfikacji. Symulacja przyszłych ocen pozostaje odrębną funkcją.
- **Wynik:** wymagania specyfikacji wdrożono lokalnie; nie otwarto PR.
