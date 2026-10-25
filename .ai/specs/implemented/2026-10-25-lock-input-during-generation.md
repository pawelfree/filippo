# Blokada wejścia po rozpoczęciu generowania

Status: implemented
Created: 2026-10-25
Implemented: 2026-10-25. Wszystkie kryteria spełnione; specyfikację przeniesiono do `implemented/`.

## Problem

Po rozpoczęciu generowania formularz nadal pokazuje listę sprawdzonych słów i pozwala korzystać z części przycisków, mimo że żądanie używa już utrwalonej partii wejściowej.

## Intended behavior

Kliknięcie „Generuj propozycje” czyści widoczną listę słów i wyrażeń oraz blokuje jej przyciski. Przycisk generowania także pozostaje zablokowany, aby nie rozpocząć drugiej partii.

## Scope

- Sterowanie formularzem wejściowym i przyciskiem generowania na stronie LexicalSense.

## Acceptance criteria

- [x] Po kliknięciu generowania widoczna lista pól wejściowych jest pusta.
- [x] Dodawanie, sprawdzenie i usuwanie pozycji są zablokowane.
- [x] Przycisk generowania jest zablokowany.
- [x] Zapis otrzymanych propozycji nadal jest dostępny po zakończeniu generowania.

## Open questions

Brak.
