# Ikony działań zapisanych LexicalSense

Status: implemented
Created: 2026-10-25
Implemented: 2026-10-26

## Problem

Karta zapisanego znaczenia pokazuje tekstowe przyciski działań pod polami, a zapis jest dostępny mimo braku zmian.

## Intended behavior

Działania są ikonami obok nazwy LexicalSense. Zapis jest nieaktywny do chwili zmiany włoskiego albo polskiego wyjaśnienia, a usunięcie jest ikoną kosza.

## Acceptance criteria

- [x] Ikony dyskietki i kosza są obok nazwy znaczenia oraz mają dostępne etykiety.
- [x] Zapis jest nieaktywny bez zmian i aktywuje się po zmianie dowolnego wyjaśnienia.
- [x] Po udanym zapisie przycisk ponownie jest nieaktywny.

## Open questions

Brak.

## 📋 Phasing

1. Przenieść akcje edycji do nagłówka karty bez zmiany kontraktów API.
2. Zweryfikować aktywację zapisu i dostępność w przeglądarce.

## 📋 Implementation Plan

1. W `src/browser/stored-lexical-senses.ts` umieścić przyciski zapisu i usunięcia w nagłówku karty; zastąpić ich tekst ikonami, zachowując `aria-label` i `title`.
2. Przechowywać po ostatnim odczycie/zapisie wartości obu pól definicji i włączać ikonę dyskietki wyłącznie, gdy którakolwiek wartość się różni; po udanym zapisie zaktualizować bazowy stan.
3. W `public/lexical-senses.css` dodać style nagłówka oraz kompaktowych przycisków ikon, bez zmiany układu pozostałych kart.
4. Dodać lub zaktualizować test DOM, który sprawdza położenie ikon, dostępne etykiety oraz przejścia stanu przycisku zapisu przed i po zmianie oraz udanym zapisie.
5. Uruchomić `npm run test` i `npm run build`, a następnie ręcznie zweryfikować ekran zapisanych LexicalSense w przeglądarce.

## Verification

- Test DOM potwierdza ikony, etykiety dostępności oraz stan zapisu przed zmianą, po zmianie i po udanym zapisie.
- 2026-10-26: npm run test — 8/8 poprawnych; npm run build — poprawny.
