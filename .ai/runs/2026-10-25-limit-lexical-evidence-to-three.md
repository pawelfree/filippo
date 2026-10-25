# Limit trzech źródeł dla LexicalSense

Data: 2026-10-25  
Status: zakończony

## Cel

Ograniczyć liczbę wpisów `evidence` na jedno znaczenie do trzech w regułach skilla oraz obu schematach odpowiedzi.

## Działania i kontrole

- Odczytano instrukcje projektu, reguły skilla i miejsca definiujące `evidence` w schematach.
- W [creation.rules.md](../docs/create-lexical-senses/references/creation.rules.md) ustalono od jednego do trzech źródeł dla jednego gotowego sensu. Sens wymagający większej liczby źródeł do uzasadnienia jest odraczany.
- W istniejącym wtedy `response.schema.json` dodano `maxProperties: 3` dla `evidence`. Plik usunięto później; zob. [uproszczenie](2026-10-25-remove-duplicate-lexical-response-schema.md).
- W [openai.response.format.json](../docs/create-lexical-senses/references/openai.response.format.json) pozostawiono warianty z `e1`, `e1`–`e2` i `e1`–`e3`; usunięto `e4`–`e8` z listy `evidence_id` i wariantów `evidence`.
- Zaktualizowano [SKILL.md](../docs/create-lexical-senses/SKILL.md). Odczytem sprawdzono, że nowe reguły i oba schematy wskazują ten sam limit; testów ani walidatorów nie uruchamiano.

## Decyzje i wynik

Limit dotyczy wpisów dowodowych na jeden `LexicalSense`, a nie liczby źródeł przeglądanych podczas analizy. Samodzielny `lexicalsense.schema.json` pozostał bez zmian, zgodnie z zakresem żądania dotyczącym reguł i schematów odpowiedzi.
