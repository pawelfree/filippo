# Szybsze wprowadzanie pozycji leksykalnych

Status: implemented
Created: 2026-10-25
Implemented: 2026-10-25. Wszystkie kryteria zostały spełnione; specyfikację przeniesiono do `implemented/`.

## Problem

Dodawanie kolejnych słów i wyrażeń do sprawdzenia wymaga użycia osobnego przycisku, a przycisk usunięcia zajmuje miejsce tekstem zamiast rozpoznawalną ikoną.

## Intended behavior

Naciśnięcie Enter w niepustym polu tworzy następne pole i przenosi do niego fokus. Usunięcie pozycji jest reprezentowane ikoną kosza, dostępną z klawiatury i z czytelnikiem ekranu.

## Scope

- Formularz pozycji wejściowych na stronie LexicalSense.

## Acceptance criteria

- [x] Enter w niepustym polu dodaje nowe pole bez wysyłania formularza i ustawia w nim fokus.
- [x] Enter w pustym polu nie tworzy pustej pozycji.
- [x] Przycisk usunięcia używa ikony kosza i ma dostępną nazwę „Usuń pozycję”.

## Open questions

Brak.
