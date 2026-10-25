# Format odpowiedzi LexicalSense dla OpenAI API

Data: 2026-10-25  
Status: zakończony

## Cel

Uzupełnić skill o format, który można przekazać bezpośrednio do `text.format` w OpenAI Responses API, zachowując zgodność gotowych rekordów z `lexicalsense.schema.json`.

## Działania i kontrole

- Odczytano obecny skill i jego schematy.
- Dodano [openai.response.format.json](../docs/create-lexical-senses/references/openai.response.format.json) jako pełny obiekt `text.format` z `strict: true`, listą `lexical_senses`, `deferred` i `coverage` oraz strukturą rekordów zgodną z podstawowymi polami `LexicalSense`.
- Zaktualizowano [SKILL.md](../docs/create-lexical-senses/SKILL.md) i [creation.rules.md](../docs/create-lexical-senses/references/creation.rules.md), aby kierowały użycie API do tego pliku i wymagały walidacji względem pełnych schematów.
- Zapisano poprawkę wcześniejszego wniosku w [lessons.md](../lessons.md). Nie uruchamiano testów ani walidatorów, ponieważ nie były wymagane.

## Decyzje i wynik

Format API używa obsługiwanych przez Structured Outputs słów kluczowych i lokalnych identyfikatorów dowodów `e1`–`e8`. Pełny schemat pozostaje kontraktem walidacji dla ograniczeń pominiętych w API, takich jak wzorce identyfikatorów, niepuste teksty i odwołania przykładów do dowodów. Jeśli potrzeba więcej niż osiem pozycji dowodowych dla jednego znaczenia, format trzeba rozszerzyć przed wywołaniem API.
