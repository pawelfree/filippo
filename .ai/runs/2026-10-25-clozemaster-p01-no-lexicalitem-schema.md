# Aktualizacja P0.1 bez osobnego schematu LexicalItem

Data: 2026-10-25  
Status: zakończony

## Cel

Zaktualizować [plan prac](../docs/clozemaster_plan_prac.md) zgodnie z decyzją użytkownika, że nie potrzebuje osobnego schematu `LexicalItem`.

## Działania, kontrole i wynik

- Odczytano `.ai/README.md`, `.ai/lessons.md` i cały plan; wyszukano wszystkie odniesienia do schematu `LexicalItem`.
- Zmieniono tabelę statusu, prace i rezultat P0.1 oraz najbliższe działania. Plan nie wymaga już osobnego schematu `LexicalItem` ani dokumentu `lexical_repository.md`.
- Zachowano pojęcie jednostki nadrzędnej i jej identyfikatora potrzebnego do powiązania rekordów `LexicalSense`.
- Sprawdzono zmienione fragmenty wyszukiwaniem tekstu. Nie uruchamiano testów, ponieważ zmiana dotyczy tylko planu.
- Brak nierozstrzygniętych kwestii w zakresie tej korekty.
