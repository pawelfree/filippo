# Jeden wybór dla zapisu odrębnego znaczenia

Date: 2026-10-25
Status: completed
Objective: Scalić wybór do zapisu i potwierdzenie odrębności znaczenia w jeden checkbox.
Related spec: [Jeden wybór dla zapisu odrębnego znaczenia](../specs/2026-10-25-single-save-selection.md)

## Actions

- Usunięto drugi checkbox potwierdzenia.
- Checkbox wyboru zmienia etykietę dla podobnych wpisów i przekazuje `confirmedDistinct` przy zapisie.

## Checks

- `npm run build` zakończyło się kodem 0.
- Wyszukanie kodu potwierdziło brak kontrolki `data-confirm-distinct` oraz tekstu drugiego potwierdzenia.

## Outcome

Wybór do zapisu jest pojedynczą decyzją użytkownika także dla znaczenia podobnego do istniejącego wpisu.
