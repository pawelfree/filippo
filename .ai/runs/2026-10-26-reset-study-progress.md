# Reset postępu nauki

- **Data:** 2026-10-26
- **Status:** zakończony.
- **Cel:** dodać na ekranie Nauka bezpieczny reset całego postępu FSRS.
- **Specyfikacja:** [reset postępu](../specs/implemented/2026-10-26-reset-study-progress.md).
- **Działania:** dodano przyciski resetu w przeglądzie i sesji, potwierdzenie, endpoint oraz transakcyjne usunięcie `StudyAttempt`, `FsrsReview` i `FsrsState`. Nowa rewizja tej samej konfiguracji unieważnia stare tokeny prezentacji.
- **Sprawdzenie:** `npm test`: 17/17; `npm run build`: poprawny. Test z wymuszoną awarią usuwania potwierdził wycofanie całej transakcji. Przeglądarka na `localhost:3000` pokazała nowy przycisk; nie resetowano rzeczywistych danych.
- **Decyzje:** zachować znaczenia i parametry FSRS; reset dotyczy postępu. Zachować rewizje konfiguracji jako mechanizm unieważniania starszych ocen.
- **Nierozstrzygnięte:** brak.
- **Wynik:** użytkownik może wyczyścić postęp i rozpocząć naukę od nowa.
