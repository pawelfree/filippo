# Szybsze wprowadzanie pozycji leksykalnych

Date: 2026-10-25
Status: completed
Objective: Umożliwić dodawanie kolejnego pola klawiszem Enter i zastąpić tekst usuwania ikoną kosza.
Related spec: [Szybsze wprowadzanie pozycji leksykalnych](../specs/2026-10-25-lexical-input-entry.md)

## Actions

- Enter w niepustym polu dodaje nowe pole i ustawia w nim fokus.
- Przycisk usunięcia jest ikoną `🗑` z nazwą dostępną „Usuń pozycję”.

## Checks

- `npm run build` zakończyło się kodem 0.
- Symulacja DOM potwierdziła dodanie pola i fokus po Enter oraz nazwę ikony kosza.

## Outcome

Wprowadzanie wielu słów i wyrażeń działa z klawiatury bez klikania „Dodaj pozycję”.
