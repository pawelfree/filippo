# Rotacja ćwiczeń cloze według rodzaju powtórki

Status: implemented. Utworzono: 2026-11-03. Przeniesiono do `implemented/` 2026-11-03 po spełnieniu kryteriów.

## Problem

Tryb powtórek używa ostatniego ćwiczenia również następnego dnia. Przez to zaplanowana powtórka nie sprawdza znaczenia w nowym kontekście.

## Oczekiwane działanie i zakres

- Nowe znaczenie otrzymuje niewykorzystane ćwiczenie; jeśli nie ma żadnego, powstaje nowy zestaw czterech przez AI.
- Utrwalenie po błędnej odpowiedzi cloze otrzymuje ostatnie ćwiczenie cloze tego znaczenia z tego dnia. Jeśli błędna ocena pochodzi z ekranu „Nauka” i nie ma dzisiejszego ćwiczenia cloze, używane jest dostępne ćwiczenie lub generowany zestaw.
- Zaplanowana powtórka FSRS używa ostatniego ćwiczenia cloze, jeśli było wykonane w tym samym dniu kalendarzowym strefy Europe/Warsaw co rozpoczęcie sesji.
- Jeśli ostatnie ćwiczenie cloze było wykonane przed bieżącym dniem, zaplanowana powtórka otrzymuje niewykorzystane ćwiczenie. Gdy pula się wyczerpała, AI tworzy kolejny zestaw czterech.
- Jeśli znaczenie było uczone poza cloze i nie ma wcześniejszej próby cloze, używane jest dostępne ćwiczenie lub generowany zestaw.
- Utrwalenie w obrębie już rozpoczętej sesji zachowuje jej przydział.

## Kryteria akceptacji

- [x] Testy odróżniają zaplanowaną powtórkę tego samego dnia i po wcześniejszym dniu.
- [x] Testy potwierdzają ponowne użycie ćwiczenia przy utrwaleniu i generowanie po wyczerpaniu puli.
- [x] Kompilacja i testy przechodzą (35/35).

## Otwarte pytania

Brak.

Powiązane: [oddzielenie trybów](2026-11-03-cloze-review-mode.md), [przebieg pracy](../../runs/2026-11-03-cloze-exercise-rotation.md).
