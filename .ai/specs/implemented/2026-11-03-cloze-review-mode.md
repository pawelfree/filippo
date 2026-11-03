# Powtórki cloze oddzielone od nowych znaczeń

Status: implemented. Utworzono: 2026-11-03. Przeniesiono do `implemented/` 2026-11-03 po spełnieniu kryteriów akceptacji.
Updated: 2026-11-03 — zasada ponownego użycia ćwiczenia przy każdej powtórce została zastąpiona regułą zależną od dnia; zobacz [rotację ćwiczeń](2026-11-03-cloze-exercise-rotation.md).

## Problem

Jedno pole liczby znaczeń uruchamia obecnie mieszankę zaległych powtórek, utrwaleń i nowych znaczeń. Użytkownik chce móc wykonać same powtórki przed rozpoczęciem nowych znaczeń i widzieć, co oznaczają liczniki.

## Oczekiwane działanie i zakres

- Osobna akcja rozpoczyna powtórki i oczekujące utrwalenia bez podawania liczby; obejmuje do 20 znaczeń w sesji.
- Osobna akcja z liczbą 1–20 rozpoczyna wyłącznie nowe znaczenia.
- Dla znaczenia z wcześniejszą próbą cloze w trybie powtórki używane jest ostatnio użyte ćwiczenie. Gdy takiego nie ma, pobierane jest dostępne ćwiczenie lub generowany zestaw.
- Powtórka lokalna w tej samej sesji zachowuje ćwiczenie przydzielone znaczeniu.
- Liczniki rozróżniają zaplanowane powtórki FSRS, utrwalenia po błędnej odpowiedzi i nowe znaczenia.

## Kryteria akceptacji

- [x] Start powtórek nie wymaga pola liczby i nie wybiera nowych znaczeń.
- [x] Start nowych znaczeń nie wybiera powtórek ani utrwaleń.
- [x] Powtórka cloze korzysta z ostatnio użytego ćwiczenia dla znaczenia.
- [x] Ekran pokazuje rozdzielone liczniki i dostępność właściwych akcji.
- [x] Testy (35/35) i kompilacja przechodzą.

## Otwarte pytania

Brak.

Powiązane: [wcześniejsza integracja FSRS](2026-11-03-cloze-fsrs-queue.md), [przebieg pracy](../../runs/2026-11-03-cloze-review-mode.md).
