# Zmiana układu statystyk nauki

- **Data:** 2026-10-26
- **Status:** zakończony.
- **Cel:** dodać zakres zaplanowanych terminów 7/30 dni, zwijane listy dni i zmienić kolejność sekcji zgodnie z życzeniem użytkownika.
- **Specyfikacja:** [statystyki nauki FSRS](../specs/implemented/2026-10-26-fsrs-learning-statistics.md).
- **Działania:** przeniesiono rozkłady i skuteczność pod stan nauki oraz wybór zakresu historii do sekcji historii; listy dni umieszczono w zwijanych `details`. Dodano wybór 7/30 dni terminów w UI i API, a licznik poza zakresem dostosowano do wyboru. Uaktualniono ukończoną specyfikację.
- **Sprawdzenie:** `npm run build`, `git diff --check` i `npm test` przeszły (19/19). Test SQLite obejmuje oba zakresy i odrzucenie nieznanej wartości. W Chrome na tymczasowej bazie sprawdzono kolejność sekcji, oba zwijane zestawienia i wybór 7 dni.
- **Decyzje:** historia i zaplanowane terminy mają niezależne zakresy; listy dni są domyślnie zwinięte.
- **Nierozstrzygnięte:** brak.
- **Wynik:** zmiana wdrożona lokalnie.
