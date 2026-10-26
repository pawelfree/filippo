# Jedna dodatkowa próba utrwalenia

- **Data:** 2026-10-26
- **Status:** zakończony.
- **Cel:** usunąć pętlę `Again` w lokalnych utrwaleniach i dopuścić przejście do nowych znaczeń.
- **Specyfikacja:** [ekran Nauka](../specs/implemented/2026-10-26-study-screen.md).
- **Działania:** odtworzono w teście ponowne dodawanie utrwalenia po drugim `Again`. Kolejka rozpoznaje teraz oczekiwanie tylko po ostatniej formalnej ocenie `new` lub `due`; ocena lokalnego utrwalenia nie tworzy kolejnego wpisu.
- **Sprawdzenie:** test przed poprawką był czerwony (`reinforcementCount` pozostawał 1 po drugiej ocenie `Again`). Po poprawce test nowego znaczenia oraz test należnej powtórki po wznowieniu przeszły. `npm run build` poprawny; `npm test`: 18/18.
- **Decyzje:** zachować historię drugiej błędnej odpowiedzi; nie przekazywać lokalnego utrwalenia do FSRS przed `dueAt`.
- **Nierozstrzygnięte:** brak.
- **Wynik:** po jednej dodatkowej próbie błędnie ocenione znaczenie nie blokuje dalszej nauki; kolejny termin formalny pozostaje pod kontrolą FSRS.
