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

## Polecenia

- `npm test`
- `npm run build`
- `npm start` (po zbudowaniu)
