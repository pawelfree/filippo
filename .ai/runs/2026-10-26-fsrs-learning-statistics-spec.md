# Specyfikacja statystyk nauki FSRS

- **Data:** 2026-10-26
- **Status:** zakończony.
- **Cel:** przygotować specyfikację ekranu i mechanizmów statystyk nauki FSRS.
- **Specyfikacje:** [statystyki nauki FSRS](../specs/2026-10-26-fsrs-learning-statistics.md), [symulacja powtórek](../specs/2026-10-26-fsrs-future-review-simulation.md).
- **Działania:** sprawdzono istniejące tabele stanu i historii FSRS, ekran Nauka oraz API przypiętego ts-fsrs. Po szkicu i odpowiedziach użytkownika zapisano dwie pełne specyfikacje. Porównano miary z [Anki](https://docs.ankiweb.net/manual/stats) i symulator z [opcją Anki](https://docs.ankiweb.net/manual/deck-options), a zakres statystyk z [Mnemosyne](https://mnemosyne-proj.org/features). Osobny przegląd spójności zakresu wykazał i pomógł poprawić kontrakt błędu sekcji pamięci, etapowanie symulacji oraz źródło lokalnej kolejki.
- **Sprawdzenie:** obie specyfikacje mają problem, zakres, zachowania, kryteria, scenariusze błędów oraz kroki wdrożenia. Lokalne odnośniki istnieją; `git diff --check` bez uwag. Nie uruchamiano testów aplikacji ani nie zmieniano kodu. Graf modelu danych pominięto, ponieważ żadna specyfikacja nie dodaje ani nie zmienia encji.
- **Decyzje:** użytkownik wybrał dwie osobne specyfikacje: kalendarz rzeczywistych terminów i symulacja hipotetycznych przyszłych ocen. Rzeczywista skuteczność liczy pierwszą formalną ocenę znaczenia w dniu. Symulacja na 30 dni automatycznie losuje powodzenia i błędy według FSRS, a pozytywne oceny według proporcji z ostatnich 30 dni. Uwzględnia nowe znaczenia według ustawionej liczby rozpoczynanych dziennie.
- **Nierozstrzygnięte:** brak blokujących pytań produktowych; obie specyfikacje pozostają aktywne i niezrealizowane.
- **Wynik:** dwie osobno wdrażalne specyfikacje lokalne, bez zmian w aplikacji.
