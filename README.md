# Filippo

Przeglądarka włoskiej taksonomii gramatycznej i profilu kompetencyjnego oraz strona tworzenia znaczeń leksykalnych.

## Uruchomienie

Wymagany Node.js 20 lub nowszy. Uruchom z katalogu głównego repozytorium:

```sh
npm install
npm run start:dev
```

Otwórz `http://localhost:3000/`, aby przeglądać taksonomię, lub `http://localhost:3000/profile.html`, aby zobaczyć profil. Domyślny port to `3000`; zmienisz go przez `PORT`. Serwer nasłuchuje na wszystkich interfejsach (`0.0.0.0`).

Strona `http://localhost:3000/lexical-senses.html` pozwala sprawdzić istniejące znaczenia, wygenerować propozycje i zapisać wybrane `LexicalSense`. Generowanie wymaga `OPENAI_API_KEY` w `.env`; opcjonalne `OPENAI_MODEL` domyślnie wskazuje `gpt-5`. Klucz pozostaje na serwerze. Odpowiedź OpenAI korzysta ze skilla `create-lexical-senses`, Structured Outputs i wyszukiwania w sieci.

## Dane i walidacja

Dane źródłowe i schematy JSON znajdują się w `.ai/docs/`. Przy uruchomieniu aplikacja waliduje taksonomię i profil, a następnie sprawdza zgodność profilu z taksonomią oraz wyliczeniami Beta-Binomial. Błędne dane uniemożliwiają start i powodują komunikat błędu.

## API

- `GET /api/taxonomy`
- `GET /api/profile`
- `POST /api/lexical-senses/check` — `{ "items": ["casa"] }`; zwraca istniejące znaczenia i `checkId`.
- `POST /api/lexical-senses/generate` — `{ "items": ["casa"], "checkId": "..." }`; zwraca propozycje, `deferred`, `coverage` i `draftId`.
- `POST /api/lexical-senses/save` — `{ "draftId": "...", "selected": [{ "index": 0, "definition_pl": "..." }] }`; zwraca wynik zapisu dla każdego wyboru.

## Baza danych

Aplikacja używa SQLite przez Prisma. Skopiuj `.env.example` do `.env`, a następnie wygeneruj klienta i utwórz bazę:

```sh
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
```

Domyślny plik bazy to `prisma/dev.db`. Schemat przechowuje sensy leksykalne, wygenerowane zadania, stan FSRS per użytkownik i sens oraz historię powtórek. Zmiany modelu wprowadzaj przez `npm run db:migrate:dev -- --name opis-zmiany`, a wdrożone migracje stosuj przez `npm run db:migrate`.

Propozycje i identyfikatory weryfikacji są przechowywane w pamięci serwera przez ograniczony czas. Po restarcie trzeba ponowić weryfikację i generowanie. Ponowny zapis tego samego znaczenia nie tworzy drugiego rekordu.

## Polecenia

- `npm test`
- `npm run build`
- `npm start` (po zbudowaniu)

Kod przeglądarki jest w `src/browser/*.ts`. `npm run build` kompiluje go do `dist/browser/*.js`, a Nest udostępnia wynik pod `/assets/`. `npm run start:dev` kompiluje skrypty przy starcie; po zmianie kodu przeglądarki uruchom to polecenie ponownie.
