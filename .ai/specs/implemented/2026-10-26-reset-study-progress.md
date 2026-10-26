# Reset postępu nauki

Status: implemented
Created: 2026-10-26
Implemented: 2026-10-26 — wszystkie kryteria sprawdzono lokalnie.

## Problem

Na ekranie Nauka nie można rozpocząć prototypowego procesu od początku po zapisaniu ocen FSRS.

## Intended behavior and scope

- Ekran Nauka udostępnia działanie wyczyszczenia całego postępu nauki po świadomym potwierdzeniu.
- Reset atomowo usuwa karty i historię ocen FSRS oraz próby sesji, w tym lokalne utrwalenia. Zapisane `LexicalSense` i ustawienia algorytmu pozostają.
- Po resecie wszystkie zapisane znaczenia są znowu nowe, a liczniki i bieżący widok odświeżają się. Stare karty i oczekujące oceny nie mogą być zapisane po resecie.
- Błąd resetu pozostawia dotychczasowy stan i jest widoczny na ekranie.

## Acceptance criteria

- [x] Przycisk na ekranie Nauka pyta o potwierdzenie, zanim usunie postęp.
- [x] Reset usuwa wszystkie `FsrsState`, `FsrsReview` i `StudyAttempt` w jednej transakcji; zachowuje `LexicalSense` i konfigurację FSRS.
- [x] Po resecie liczniki pokazują 0 należnych powtórek i wszystkie zapisane znaczenia jako nowe; stary token oceny jest odrzucany.
- [x] Interfejs usuwa oczekujące lokalnie oceny i odświeża widok; błąd jest widoczny.

## Open questions

Brak. Reset dotyczy postępu nauki; konfiguracja algorytmu pozostaje aktywna.
