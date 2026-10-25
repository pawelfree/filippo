# Reguły i schemat wewnątrz skilla LexicalSense

Data: 2026-10-25  
Status: zakończony

## Cel

Wyposażyć [skill](../docs/lexical_sense/create-lexical-senses/SKILL.md) we własne kopie reguł tworzenia i schematu znaczenia, aby działał bez odwołań do ścieżek dokumentacji projektu.

## Działania i kontrole

- Skopiowano [reguły](../docs/lexical_sense/create-lexical-senses/references/creation.rules.md) i [schemat](../docs/lexical_sense/create-lexical-senses/references/lexicalsense.schema.json) do `references/` skilla.
- W kopii reguł usunięto trzy odwołania do dokumentów poza skillem; odwołanie do schematu pozostaje lokalne. Treść operacyjna reguł i schematu została zachowana.
- Zmieniono `SKILL.md`, aby wskazywał wyłącznie pliki w `references/` i traktował je jako kontrakt skilla.
- Oryginalnych `creation.rules.md` i `lexicalsense.schema.json` nie modyfikowano. Brak nierozstrzygniętych kwestii w zakresie tej zmiany.
