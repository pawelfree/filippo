# Typografia zapisanych znaczeń

- **Data:** 2026-10-26
- **Status:** zakończony
- **Cel:** zachować tytuł karty, zmniejszyć i odciążyć tekst pól edycji oraz ustawić ich wysokość na dwie linie.
- **Powiązana specyfikacja:** brak.
- **Działania:** sprawdzono style kart i pól; nadpisano wagę, rozmiar i wysokość `textarea` tylko na kartach zapisanych znaczeń.
- **Sprawdzenie:** `git diff --check` — przechodzi.
- **Decyzje:** etykiety są mniejsze i lżejsze, tekst pól ma wagę 400, a pola stałą wysokość dwóch linii z przewijaniem dłuższej treści.
- **Nierozstrzygnięte:** brak.
- **Wynik:** zmiana wyglądu kart zapisywanych znaczeń bez zmiany tytułu i logiki edycji.
