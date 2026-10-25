# Układ listy istniejących znaczeń

Status: implemented
Created: 2026-10-25
Implemented: 2026-10-25. Wszystkie kryteria spełnione; specyfikację przeniesiono do `implemented/`.

## Problem

Sekcja sprawdzenia pokazuje przycisk generowania po liście i renderuje również pozycje bez wpisów w bazie, przez co lista zawiera puste informacyjnie wiersze.

## Intended behavior

Przycisk „Generuj propozycje” jest widoczny przed listą. Lista zawiera wyłącznie pozycje z istniejącymi znaczeniami; brak dopasowania nie tworzy wiersza ani komunikatu.

## Scope

- Sekcja „Istniejące znaczenia” na stronie LexicalSense.

## Acceptance criteria

- [x] Przycisk generowania znajduje się przed listą istniejących znaczeń.
- [x] Lista renderuje tylko wejścia mające co najmniej jeden wpis w bazie.
- [x] Brak dopasowania nie powoduje pustego wiersza ani komunikatu.
- [x] Gdy lista jest pusta, kontener listy jest ukryty, a nagłówek informuje „Brak istniejących znaczeń w bazie”; przycisk generowania pozostaje dostępny.
- [x] Sprawdzenie bazy i generowanie propozycji nadal działają.

## Open questions

Brak.
