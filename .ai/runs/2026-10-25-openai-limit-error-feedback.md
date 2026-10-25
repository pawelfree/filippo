# Zrozumiałe błędy limitów OpenAI

Date: 2026-10-25
Status: completed
Objective: Pokazać w interfejsie konkretną przyczynę błędu OpenAI 401 lub 429 przy generowaniu LexicalSense.

## Actions

- Odpowiedzi błędów Responses API są odczytywane przed utworzeniem wyjątku Nest.
- Znane kody 429 są mapowane na polskie wskazówki: wyczerpane środki, limit wydatków organizacji lub projektu, limit użycia oraz chwilowe ograniczenie liczby żądań.
- Dodano scenariusz przepływu HTTP dla `credit_balance_exhausted`.

## Checks

- `npx tsc -p tsconfig.json --noEmit` zakończyło się kodem 0.
- `node --import tsx --test tests/lexical-senses-errors.test.ts` zakończyło się powodzeniem i potwierdziło komunikat dla `credit_balance_exhausted`.
- Pełny test przepływu wymaga migracji tymczasowej bazy. W lokalnym Node 25.9.0 Prisma 6.19.3 kończy tę migrację błędem silnika schematu bez szczegółów, mimo że `prisma validate` potwierdza poprawność schematu.

## Outcome

Widok LexicalSense otrzymuje użyteczny komunikat i właściwy status HTTP dla znanych błędów uwierzytelnienia i limitów OpenAI.
