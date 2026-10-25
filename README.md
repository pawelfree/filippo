# Filippo

Przeglądarka tylko do odczytu dla włoskiej taksonomii gramatycznej i profilu kompetencyjnego.

## Uruchomienie

Wymagany Node.js 20 lub nowszy. Uruchom z katalogu głównego repozytorium:

```sh
npm install
npm run start:dev
```

Otwórz `http://localhost:3000/`, aby przeglądać taksonomię, lub `http://localhost:3000/profile.html`, aby zobaczyć profil. Domyślny port to `3000`; zmienisz go przez `PORT`. Serwer nasłuchuje na wszystkich interfejsach (`0.0.0.0`).

## Dane i walidacja

Dane źródłowe i schematy JSON znajdują się w `.ai/docs/`. Przy uruchomieniu aplikacja waliduje taksonomię i profil, a następnie sprawdza zgodność profilu z taksonomią oraz wyliczeniami Beta-Binomial. Błędne dane uniemożliwiają start i powodują komunikat błędu.

## API

- `GET /api/taxonomy`
- `GET /api/profile`

## Baza danych

Aplikacja używa SQLite przez Prisma. Skopiuj `.env.example` do `.env`, a następnie wygeneruj klienta i utwórz bazę:

```sh
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
```

Domyślny plik bazy to `prisma/dev.db`. Schemat przechowuje sensy leksykalne, wygenerowane zadania, stan FSRS per użytkownik i sens oraz historię powtórek. Zmiany modelu wprowadzaj przez `npm run db:migrate:dev -- --name opis-zmiany`, a wdrożone migracje stosuj przez `npm run db:migrate`.

## Polecenia

- `npm test`
- `npm run build`
- `npm start` (po zbudowaniu)
