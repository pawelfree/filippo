# Jeden format odpowiedzi dla OpenAI API

Data: 2026-10-25  
Status: zakończony

## Cel

Usunąć dodatkowy schemat odpowiedzi nieużywany przez OpenAI API i pozostawić jeden format wyniku partii w skillu.

## Działania i kontrole

- Odczytano instrukcje projektu, reguły skilla i odwołania do obu formatów odpowiedzi.
- Usunięto dodatkowy `response.schema.json`; jedynym formatem wyniku partii w skillu jest teraz [openai.response.format.json](../docs/create-lexical-senses/references/openai.response.format.json).
- Zaktualizowano [SKILL.md](../docs/create-lexical-senses/SKILL.md), [creation.rules.md](../docs/create-lexical-senses/references/creation.rules.md) i [lessons.md](../lessons.md), usuwając wskazania na drugi schemat odpowiedzi.
- Wcześniejsze logi zachowano jako zapis historyczny, zastępując niedziałające linki informacją o usunięciu pliku.
- Odczytem sprawdzono, że w bieżących instrukcjach skilla nie ma już odwołań do usuniętego pliku. Testów ani walidatorów nie uruchamiano.

## Decyzje i wynik

Skill ma jeden format odpowiedzi przygotowany dla OpenAI API oraz osobny, już istniejący schemat pojedynczego `LexicalSense`.
