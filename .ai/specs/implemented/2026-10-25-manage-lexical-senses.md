# Zarządzanie zapisanymi LexicalSense

Status: implemented
Created: 2026-10-25
Implemented: 2026-10-25. Wszystkie kryteria spełnione; specyfikację przeniesiono do `implemented/`.

## Problem

Zapisane znaczenia nie mają widoku zarządzania. Nie można ich przejrzeć, poprawić włoskiego albo polskiego wyjaśnienia ani usunąć błędnego wpisu.

## Intended behavior

Nowa strona pokazuje wszystkie zapisane włoskie LexicalSense. Każdy rekord umożliwia zmianę włoskiego i polskiego wyjaśnienia oraz usunięcie po świadomym kliknięciu. Zmiana zachowuje spójność kolumn bazy i pełnego JSON-a znaczenia.

## Scope

- Strona listy zapisanych znaczeń i jej nawigacja.
- Odczyt, edycja obu wyjaśnień oraz usuwanie przez API.

## Acceptance criteria

- [x] Nawigacja prowadzi do strony zapisanych znaczeń.
- [x] Strona pokazuje wszystkie zapisane włoskie LexicalSense.
- [x] Można zapisać edycję włoskiego i polskiego wyjaśnienia.
- [x] Można usunąć rekord bez powiązanych danych; blokada relacji jest wyjaśniona.
- [x] Edycja aktualizuje `definition`, `detailsJson` i `identityKey` spójnie.
- [x] Strona filtruje zapisane znaczenia po haśle oraz włoskim i polskim wyjaśnieniu.

## Open questions

Brak. Rekord bez poprawnego pełnego JSON-a można wyświetlić, lecz edycja polskiego wyjaśnienia wymaga danych zgodnych z kontraktem LexicalSense.
