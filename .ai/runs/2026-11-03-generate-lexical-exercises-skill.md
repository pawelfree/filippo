# Skill generowania ćwiczeń leksykalnych

- Data: 2026-11-03
- Status: zakończony
- Cel: utworzyć w `.ai/docs/` skill generujący ćwiczenia z projekcji `LexicalSense`, profilu i taksonomii.
- Specyfikacje: brak nowej specyfikacji; podstawą są [reguły generowania](../docs/generation_rules/generation_rules.md).
- Działania: utworzono [SKILL.md](../docs/generate-lexical-exercises/SKILL.md) i lokalne kopie reguł oraz pięciu schematów w `references/`.
- Kontrole: `git diff --check`; frontmatter sprawdzony parserem YAML w Ruby; odnośniki istnieją; wszystkie lokalne schematy kompilują się w Ajv 2020 z `ajv-formats`; przykładowy profil i taksonomia przechodzą walidację. Standardowy `quick_validate.py` nie uruchomił się, ponieważ systemowy Python nie ma modułu `yaml`.
- Decyzje: skill ma krótki `SKILL.md` i lokalne referencje, analogicznie do `create-lexical-senses`. Dane profilu, taksonomii i znaczeń są przekazywane przy wywołaniu; kopie referencji wymagają świadomej synchronizacji przy zmianie źródeł.
- Nierozstrzygnięte: nie przeprowadzono próby generowania pełnego zestawu ćwiczeń na rzeczywistym znaczeniu; zachowanie skilla wymaga weryfikacji przy pierwszym użyciu.
- Wynik: skill przygotowany w `.ai/docs/generate-lexical-exercises/`; kod aplikacji i integracja Responses API pozostają bez zmian.
