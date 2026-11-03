# Zerowanie wykorzystania ćwiczeń cloze

Status: implemented
Created: 2026-11-03
Implemented: 2026-11-03 — osobny zapis wykorzystania ćwiczeń z migracją dotychczasowych prób, reset w API i dwa przyciski na ekranie „Nauka”; testy 34/34.

## Problem

Przydział ćwiczeń w kolejnych sesjach jest wyliczany z historii odpowiedzi. Użytkownik potrzebuje osobnej akcji oznaczającej ćwiczenia jako ponownie dostępne bez czyszczenia postępu nauki FSRS.

## Intended behavior

- Na ekranie „Nauka”, obok „Wyczyść postęp nauki”, jest osobny przycisk zerujący wykorzystanie ćwiczeń cloze.
- Po potwierdzeniu wszystkie zapisane ćwiczenia cloze są ponownie dostępne do wyboru w kolejnych sesjach.
- Oceny i terminy FSRS, historia odpowiedzi, istniejące ćwiczenia i rozpoczęte sesje pozostają zapisane.
- Anulowanie potwierdzenia nie zmienia danych; błąd zapisu jest widoczny.

## Scope

Osobny zapis stanu wykorzystania ćwiczeń, migracja dotychczasowej historii, endpoint resetu i przyciski na ekranie „Nauka”.

## Acceptance criteria

- [x] Przydział ćwiczenia korzysta z osobnego stanu wykorzystania, uzupełnionego z dotychczasowych prób.
- [x] Reset sprawia, że wcześniej użyte ćwiczenie może zostać ponownie przydzielone, bez usuwania prób i ocen FSRS.
- [x] Oba przyciski na ekranie „Nauka” mają tę samą osobną akcję i wymagają potwierdzenia.
- [x] Build i istotne testy przechodzą.

## Open questions

Brak blokujących. Sesja już rozpoczęta zachowuje przydzielone ćwiczenie; reset wpływa na następne przydziały.
