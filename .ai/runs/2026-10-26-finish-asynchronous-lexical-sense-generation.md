# Domknięcie asynchronicznego generowania LexicalSense

- **Data:** 2026-10-26
- **Status:** zakończony
- **Cel:** domknąć [specyfikację](../specs/implemented/2026-10-26-asynchronous-lexical-sense-generation.md) po zmianie zakresu przez użytkownika, zweryfikować i przenieść ją do `implemented`.
- **Działania:** zmieniono odpowiedź utworzenia zadania na `202`; usunięto pamięciowy draft i stare endpointy; zapis propozycji z jej usunięciem objęto jedną transakcją; formularz po zleceniu przyjmuje kolejną partię; uzupełniono test przepływu, restartu i ponowienia; doprecyzowano oraz przeniesiono specyfikację.
- **Sprawdzenie:** `npm run build` i `npm test` przechodzą (10 testów); `git diff --check` bez błędów.
- **Decyzje:** wymagane `202`; backfill historycznych wyników i pełne dane kart propozycji są wyłączone z zakresu na wyraźne życzenie użytkownika.
- **Nierozstrzygnięte:** brak.
- **Wynik:** spełniono 8 kryteriów z aktualnego zakresu; specyfikacja ma status `implemented`.
