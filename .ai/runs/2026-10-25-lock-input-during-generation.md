# Blokada wejścia po rozpoczęciu generowania

Date: 2026-10-25
Status: completed
Objective: Wyczyścić i zablokować wejście po kliknięciu generowania.
Related spec: [Blokada wejścia po rozpoczęciu generowania](../specs/2026-10-25-lock-input-during-generation.md)

## Actions

- Po rozpoczęciu generowania wyczyszczono widoczne pola i ustawiono trwałą blokadę wejścia oraz przycisku generowania.

## Checks

- `npm run build` zakończyło się kodem 0.
- Symulacja DOM potwierdziła, że pola znikają, a przyciski dodawania, sprawdzenia i generowania są zablokowane przed nadejściem odpowiedzi.

## Outcome

Jedna sprawdzona partia może uruchomić tylko jedno generowanie, po którym użytkownik przechodzi do wyboru otrzymanych propozycji.
