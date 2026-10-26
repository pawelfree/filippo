# Audyt stanu asynchronicznego generowania LexicalSense

- **Data:** 2026-10-26
- **Status:** zakończony
- **Cel:** porównać [specyfikację](../specs/implemented/2026-10-26-asynchronous-lexical-sense-generation.md) z wdrożeniem, zaznaczyć spełnione kryteria i przenieść ją tylko po pełnym wdrożeniu.
- **Działania:** sprawdzono kontroler, serwis workera, modele i migrację Prisma, stronę propozycji, formularz oraz testy. Zaznaczono 6 z 9 kryteriów.
- **Sprawdzenie:** `npm test` — 10/10 testów przechodzi. Testy nie pokrywają restartu, retry ani backfillu. `git diff --check` — przechodzi.
- **Decyzja:** specyfikacja pozostaje aktywna. Brakuje kodu `202 Accepted`, backfillu oraz wymaganych danych na kartach propozycji; stare endpointy pozostają dostępne.
- **Nierozstrzygnięte:** zakres ukończenia wykracza poza samą aktualizację statusu dokumentu; braków nie zmieniano w tym audycie.
- **Wynik:** potwierdzone kryteria oznaczono jako wykonane, pliku nie przeniesiono do `implemented`.
