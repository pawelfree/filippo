# Zarządzanie zapisanymi LexicalSense

Date: 2026-10-25
Status: completed
Objective: Dodać stronę przeglądania, edycji i usuwania zapisanych LexicalSense.
Related spec: [Zarządzanie zapisanymi LexicalSense](../specs/2026-10-25-manage-lexical-senses.md)

## Actions

- Dodano API listowania, edycji wyjaśnień i usuwania rekordów.
- Dodano stronę `stored-lexical-senses.html` oraz linki w nawigacji wszystkich widoków.
- Edycja synchronizuje włoskie wyjaśnienie w kolumnie `definition`, oba wyjaśnienia w `detailsJson` i `identityKey`.

## Checks

- `npm run build` zakończyło się kodem 0.
- `node --import tsx --test tests/stored-lexical-senses.test.ts` przeszedł: lista, edycja obu wyjaśnień, spójność JSON-a i klucza oraz usunięcie wpisu.
- Uruchomienie serwera na pomocniczym porcie było zablokowane przez sandbox (`EPERM`), po tym jak Nest potwierdził zarejestrowanie nowych tras.

## Outcome

Strona zapisanych LexicalSense umożliwia ich przegląd, edycję wyjaśnień i usunięcie z ochroną rekordów mających powiązane dane.
