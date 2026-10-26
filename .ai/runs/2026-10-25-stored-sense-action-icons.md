# Ikony działań zapisanych LexicalSense

Date: 2026-10-25
Status: complete
Objective: Przenieść działania karty do nagłówka i aktywować zapis wyłącznie po edycji.
Related spec: [Ikony działań zapisanych LexicalSense](../specs/implemented/2026-10-25-stored-sense-action-icons.md)

## Actions

- Uzupełniono specyfikację o fazy i testowalny plan wdrożenia wymagany przez automatyczny silnik PR.
- Potwierdzono istniejącą implementację ikon na main.
- Dodano test DOM dla ikon oraz aktywacji zapisu.
- Naprawiono przygotowanie testowej SQLite: test stosuje istniejące migracje SQL bez zawodnego w tym środowisku Prisma Schema Engine.

## Checks

- npm run test: 8/8 poprawnych.
- npm run build: poprawny.
