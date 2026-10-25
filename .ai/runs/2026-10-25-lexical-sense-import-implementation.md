# Implementacja importu LexicalSense

Data: 2026-10-25
Status: zakończony

## Cel

Zaimplementować [specyfikację importu LexicalSense](../specs/implemented/2026-10-25-lexical-sense-import.md) na bieżącej gałęzi i zweryfikować ją jednym automatycznym testem przepływu.

## Działania

- Przeczytano specyfikację, glosariusz, zasady `.ai/`, schemat Prisma, istniejące API i instrukcje skillów `implement`, `tdd` oraz `code-review`.
- Ustalono wcześniej z użytkownikiem jeden test pełnego przepływu; to potwierdzona granica testowania.
- Dodano stronę, API weryfikacji/generowania/zapisu, walidację schematu i reguł odpowiedzi oraz migrację klucza unikalności.
- Test przeszedł cykl czerwony → zielony. Używa strony w środowisku DOM, prawdziwego Nest API, migracji SQLite i kontrolowanej odpowiedzi OpenAI.
- Przegląd według skilla `code-review` wskazał powtórzoną logikę duplikatów, brak jawnej decyzji dla podobnych sensów, niepełną kontrolę dowodów i zbyt ogólny wynik zapisu. Poprawiono te punkty.
- Zapisano implementację w commicie `c79846d`; poprawki po przeglądzie zapisano na tej samej gałęzi.

## Sprawdzenia i wynik

- `npm run build`: przeszedł.
- Pojedynczy test przepływu: przeszedł po pierwszej implementacji i po poprawkach przeglądu.
- `npm test`: 4 testy przeszły po poprawkach przeglądu.
- `git diff --check`: bez błędów przed pierwszym commitem.

## Decyzje i ograniczenia

- Dane wygenerowanych propozycji pozostają po stronie serwera; klient przesyła wybrane indeksy i poprawione polskie definicje.
- Duplikaty o jednakowej znormalizowanej definicji włoskiej blokuje klucz unikalny. Podobne, lecz nieidentyczne definicje wymagają świadomego potwierdzenia użytkownika; automatyczne rozstrzygnięcie ich pełnej równoważności semantycznej nie jest gwarantowane.
- Nie wykonano żywego wywołania OpenAI, ponieważ wymagałoby klucza; test sprawdza kontrakt żądania i kontrolowaną odpowiedź.

## Wynik

Implementacja ukończona i zweryfikowana lokalnie. Specyfikację przeniesiono do `implemented/` po spełnieniu kryteriów.
