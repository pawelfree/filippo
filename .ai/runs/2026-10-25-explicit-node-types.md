# Jawne typy Node dla TypeScript

Date: 2026-10-25
Status: completed
Objective: Usunąć diagnostykę `ts(2591)` dla importów `node:*` w serwisie LexicalSense.

## Actions

- Dodano `"types": ["node"]` do serwerowego `tsconfig.json`, aby projekt jawnie ładował deklaracje Node.

## Checks

- `npx tsc -p tsconfig.json --noEmit` zakończyło się kodem 0.
- Rozwinięta konfiguracja TypeScript zawiera `"types": ["node"]`.

## Outcome

Projekt serwerowy jawnie ładuje deklaracje Node używane przez importy `node:*`.
