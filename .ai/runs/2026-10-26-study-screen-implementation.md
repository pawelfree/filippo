# Implementacja ekranu „Nauka”

- **Data:** 2026-10-26
- **Status:** zakończony.
- **Cel:** wdrożyć lokalnie [specyfikację](../specs/implemented/2026-10-26-study-screen.md) bez otwierania PR.
- **Działania:** dodano model i migrację `StudyAttempt`, trzy endpointy `/api/study`, transakcyjny zapis oceny z FSRS, kolejkę według priorytetu oraz ekran „Nauka” w istniejącym stylu. Dodano wejście do ekranu ze wszystkich stron i poprawiono wspólną nawigację na wąskich ekranach. Migrację wdrożono do lokalnej bazy `dev.db`.
- **Sprawdzenie:** `npm run build` i pełne `npm test` przeszły (14/14). Testy obejmują kolejkę, idempotencję, równoległe oceny, rollback, lokalne utrwalenie, promocję do należnej powtórki, dzień warszawski, wznowienie i ponowienie po błędzie połączenia. W Chrome sprawdzono ekran startowy i sesję na szerokim ekranie oraz oba widoki przy szerokości 400 px; liczniki pozostają widoczne przy przewijaniu. Sprawdzono też nagłówek istniejącego ekranu „Zapisane znaczenia” przy 400 px. Endpointy odpowiedziały poprawnie na lokalnej bazie.
- **Decyzje:** wdrożenie lokalne bez PR; sesja nie zapisuje osobnej kolejki, a `presentationToken` jest przechowywany przy próbie, by rozpoznać identyczne ponowienie żądania.
- **Nierozstrzygnięte:** brak.
- **Wynik:** wymagania wdrożone lokalnie; [specyfikacja](../specs/implemented/2026-10-26-study-screen.md) oznaczona jako wykonana.
