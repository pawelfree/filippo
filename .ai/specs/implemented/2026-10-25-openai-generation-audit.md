# Audyt odpowiedzi generowania OpenAI

Status: implemented
Created: 2026-10-25
Implemented: 2026-10-25. Wszystkie kryteria akceptacji zostały zweryfikowane; specyfikację przeniesiono do `implemented/`.

## Problem

Gdy odpowiedź OpenAI nie przechodzi walidacji `LexicalSense`, aplikacja pokazuje jedynie ogólny komunikat. Osoba utrzymująca materiał nie może sprawdzić odpowiedzi modelu ani ustalić, które wymaganie ją odrzuciło.

## Intended behavior

Po otrzymaniu odpowiedzi Responses API backend parsuje `output_text`. Jeżeli wynik spełnia `openai.response.format.json`, zapisuje wyłącznie ten wynikowy JSON w SQLite wraz z ostrzeżeniami o dowodach. Nie zapisuje koperty Responses API, wywołań narzędzi ani nagłówków. Każdy strukturalnie poprawny LexicalSense trafia do widoku; użytkownik decyduje o jego zapisie mimo ostrzeżeń.

## Scope

- Zapis sparsowanego wyniku zgodnego z `openai.response.format.json` w SQLite przez Prisma.
- Logowanie koperty odpowiedzi i diagnostyki walidacji wyłącznie na backendzie.
- Rejestrowanie także nieudanych odpowiedzi HTTP OpenAI.

## Acceptance criteria

- [x] SQLite przechowuje wyłącznie sparsowany wynik spełniający `openai.response.format.json`.
- [x] Braki dowodów są przekazywane jako ostrzeżenia przy odpowiednim LexicalSense i nie blokują jego wyświetlenia ani wyboru do zapisu.
- [x] Błąd zapisu wyniku nie zmienia wyniku generowania.
- [x] Test sprawdza zapis JSON-a wyniku bez koperty Responses API oraz widoczność LexicalSense z ostrzeżeniem o brakującym dowodzie.

## Open questions

Brak. Log jest lokalnym narzędziem audytowym; przechowuje treść odpowiedzi i wejścia, lecz nigdy nagłówek autoryzacji ani sekret API.
