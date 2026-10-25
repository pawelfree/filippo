# Wynik skilla bez identyfikatorów znaczeń

Data: 2026-10-25  
Status: zakończony

## Cel

Usunąć `lexical_sense_id` z wyniku skilla `create-lexical-senses` i ograniczyć deduplikację do znaczeń tworzonych w bieżącym uruchomieniu.

## Działania i kontrole

- Odczytano instrukcje projektu, skill, reguły i oba schematy skilla. Sprawdzono odwołania do `lexical_sense_id` poza skillem, aby zachować zakres zmiany.
- Usunięto `lexical_sense_id` z [lexicalsense.schema.json](../docs/create-lexical-senses/references/lexicalsense.schema.json) i [openai.response.format.json](../docs/create-lexical-senses/references/openai.response.format.json). W obu ustawiono `schema_version` na `3.0.0`.
- W [creation.rules.md](../docs/create-lexical-senses/references/creation.rules.md) deduplikacja dotyczy tylko kandydatów w bieżącym uruchomieniu. Usunięto operacje na istniejącym katalogu, warstwie zapisu i migracji oraz kod `dedup_conflict`.
- Zaktualizowano [SKILL.md](../docs/create-lexical-senses/SKILL.md) i [lessons.md](../lessons.md). Odczytem sprawdzono, że w bieżących plikach skilla nie ma już `lexical_sense_id` ani `dedup_conflict`.
- Nie uruchamiano testów ani wywołania API.

## Decyzje i wynik

Wynik skilla zawiera znaczenia bez identyfikatorów i regułę usuwania semantycznych duplikatów z bieżącej odpowiedzi. Schemat ćwiczeń i plan aplikacji poza skillem nadal odwołują się do `lexical_sense_id`; to odrębny kontrakt, niezmieniony w tym zadaniu. Reguła modelowa nie stanowi deterministycznej gwarancji braku semantycznych duplikatów.
