# Log błędu połączenia z OpenAI

Date: 2026-10-25
Status: completed
Objective: Zapisać w konsoli serwera szczegóły błędu połączenia z OpenAI.
Related spec: [Audyt odpowiedzi generowania OpenAI](../specs/implemented/2026-10-25-openai-generation-audit.md)

## Actions

- Zastąpiono pusty `catch` oznaczonym logiem `console.error`; nie zawiera klucza API ani nagłówka autoryzacji.

## Checks

- `npm run build` zakończyło się kodem 0.
- `node --import tsx --test tests/lexical-senses-errors.test.ts` przeszedł: 2 testy.

## Outcome

Przy błędzie sieciowym lub przekroczeniu czasu serwer zapisuje szczegóły w konsoli, a przeglądarka nadal otrzymuje bezpieczny komunikat ogólny.
