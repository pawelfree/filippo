# Audyt odpowiedzi generowania OpenAI

Date: 2026-10-25
Status: completed
Objective: Zapisać odpowiedzi OpenAI do bazy i pokazać odrzuconą odpowiedź z diagnostyką w widoku LexicalSense.
Related spec: [Audyt odpowiedzi generowania OpenAI](../specs/2026-10-25-openai-generation-audit.md)

## Actions

- Backend loguje pełną kopertę Responses API wyłącznie w konsoli; nie przekazuje jej do widoku.
- Po pomyślnym sparsowaniu `output_text` i walidacji przez `openai.response.format.json` zapisuje do SQLite wyłącznie ten JSON wynikowy wraz z ostrzeżeniami o dowodach.
- Braki dowodów nie odrzucają już sensu: widok wyświetla go z ostrzeżeniem, a użytkownik może go wybrać do zapisu.

## Checks

- `npx prisma migrate deploy` zastosowało migrację `20261025174500_openai_generation_result` do lokalnej bazy.
- `npm run build` zakończyło się kodem 0.
- `node --import tsx --test tests/lexical-senses-errors.test.ts` przeszedł: 2 testy, w tym zapis i zwrot diagnostyki dla brakującego `part_of_speech`.

## Outcome

Koperta Responses API pozostaje wyłącznie w logach backendu. SQLite przechowuje wyłącznie wynik `output_text` zgodny z formatem odpowiedzi.
