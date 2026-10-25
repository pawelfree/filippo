# Schemat odpowiedzi skilla create-lexical-senses

Data: 2026-10-25  
Status: zakończony

## Cel

Dodać do skilla samodzielny schemat JSON odpowiedzi partii, zawierającej listę rekordów zgodnych z `lexicalsense.schema.json`, oraz wskazać go w instrukcji skilla.

## Działania i kontrole

- Odczytano instrukcję skilla, jego reguły, schemat rekordu i instrukcje projektu.
- Dodano wtedy `response.schema.json` z wymaganymi tablicami `lexical_senses`, `deferred` i `coverage`. Definicję `LexicalSense` osadzono w tym schemacie, aby nie wymagał ścieżki do drugiego pliku. Plik usunięto później; zob. [uproszczenie](2026-10-25-remove-duplicate-lexical-response-schema.md).
- Zaktualizowano [SKILL.md](../docs/create-lexical-senses/SKILL.md) i [creation.rules.md](../docs/create-lexical-senses/references/creation.rules.md), aby wskazywały schemat całej odpowiedzi.
- Zapisano w [lessons.md](../lessons.md) zasadę synchronizacji osadzonej definicji rekordu.
- Sprawdzono odwołania do nowego schematu przez odczyt plików. Nie uruchamiano testów ani walidatorów, ponieważ nie były wymagane.

## Decyzje i wynik

Schemat wyniku obejmuje gotowe znaczenia oraz raporty odroczeń i zakresu analizy, zgodnie z obecnymi regułami. Osadzona definicja rekordu wymaga synchronizacji przy przyszłej zmianie `lexicalsense.schema.json`. Bez nierozstrzygniętych kwestii w zakresie tego zadania.
