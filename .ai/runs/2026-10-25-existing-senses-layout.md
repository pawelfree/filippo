# Układ listy istniejących znaczeń

Date: 2026-10-25
Status: completed
Objective: Umieścić generowanie przed listą i ukryć wejścia bez istniejących znaczeń.
Related spec: [Układ listy istniejących znaczeń](../specs/2026-10-25-existing-senses-layout.md)

## Actions

- Przeniesiono przycisk generowania nad listę.
- Renderowanie pomija wpisy bez istniejących znaczeń.
- Gdy nie ma żadnego dopasowania, kontener listy jest ukryty, a nagłówek zmienia się na „Brak istniejących znaczeń w bazie”; przycisk generowania pozostaje widoczny.

## Checks

- `npm run build` zakończyło się kodem 0.
- Symulacja DOM potwierdziła, że lista zawiera tylko dopasowaną pozycję i następuje po przycisku generowania.

## Outcome

Sekcja sprawdzenia pokazuje wyłącznie istniejące znaczenia, bez pustych wierszy dla brakujących pozycji.
