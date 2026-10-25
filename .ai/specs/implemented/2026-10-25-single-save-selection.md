# Jeden wybór dla zapisu odrębnego znaczenia

Status: implemented
Created: 2026-10-25
Implemented: 2026-10-25. Wszystkie kryteria spełnione; specyfikację przeniesiono do `implemented/`.

## Problem

Przy podobnym istniejącym znaczeniu widok wymaga zaznaczenia „Wybierz do zapisu” i drugiego pola „Potwierdzam”, choć oba odnoszą się do tego samego zapisu.

## Intended behavior

Jeden checkbox wybiera znaczenie do zapisu. Gdy istnieje podobny wpis, jego etykieta jasno komunikuje zapis jako odrębnego znaczenia, a wybór stanowi wymagane potwierdzenie.

## Scope

- Wybór i ponawianie zapisu propozycji LexicalSense.

## Acceptance criteria

- [x] Każda propozycja ma najwyżej jeden checkbox wyboru do zapisu.
- [x] Dla podobnego wpisu checkbox ma etykietę „Zapisz jako odrębne znaczenie”.
- [x] Wybranie tego checkboxa przekazuje potwierdzenie odrębności do serwera.

## Open questions

Brak.
