# Implementacja integracji FSRS

- **Data:** 2026-10-26
- **Status:** zakończony
- **Cel:** wdrożyć [specyfikację](../specs/implemented/2026-10-26-fsrs-integration.md) i [opis źródłowy](../docs/fsrs_integration.md) przez publiczną usługę backendu z testową bazą SQLite.
- **Ustalenie:** użytkownik wybrał przypiętą wersję `ts-fsrs` v6 beta dla FSRS-7, ponieważ stabilne v6 nie jest jeszcze opublikowane. Granica testów usługi backendu była wcześniej potwierdzona.
- **Działania:** dodano przypiętą zależność, migrację `FsrsState`, historię ocen, rewizje konfiguracji i usługę FSRS; sprawdzono ponowienia, starsze zdarzenia, konkurencję i atomowość zapisu. Przegląd kodu wskazał potrzebę walidacji odtwarzanego JSON i testu dwóch instancji usługi; obie poprawki wprowadzono.
- **Sprawdzenie:** `npm run build` przeszedł; `npm test` zakończył się 11/11 zaliczonych testów; obecna lokalna baza ma 0 starszych rekordów `FsrsState` i `Review`.
- **Nierozstrzygnięte:** przyszłe przejście z beta na stabilne v6 wymaga osobnej kontroli zgodności. Stary niepełny rekord FSRS, jeśli wystąpi w innej bazie, wymaga osobnej migracji danych.
- **Wynik:** dziewięć kryteriów aktualnej specyfikacji spełnionych; specyfikacja przeniesiona do `implemented`.
