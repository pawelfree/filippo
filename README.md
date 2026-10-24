# Filippo · taksonomia gramatyki

Prosty, tylko do odczytu atlas włoskiej taksonomii gramatycznej oraz profilu kompetencyjnego, zbudowany w NestJS. Dane źródłowe znajdują się w `.ai/docs/`.

## Uruchomienie

Wymagany Node.js 20 lub nowszy.

```sh
npm install
npm run start:dev
```

Otwórz `http://localhost:3000`. Strona główna pokazuje kategorie, konstrukcje, warianty, ich definicje, orientacyjny poziom CEFR, dostępne przykłady i relacje. Druga strona, `http://localhost:3000/profile.html`, pokazuje szacowany poziom użytkownika CEFR osobno od szacunków opanowania wariantów, a także wyniki ćwiczeń i zidentyfikowane trudności. Wyszukiwarka filtruje elementy wybranej kategorii.

## Walidacja

Podczas uruchamiania serwer waliduje taksonomię względem `.ai/docs/grammar_taxonomy/taxonomy.schema.json`, a profil względem `.ai/docs/competence_profile/profile.schema.json`, według JSON Schema draft 2020-12. Sprawdza też skrót SHA-256 taksonomii, zgodność zestawu ID wariantów oraz ograniczenia liczników opisane w schemacie profilu. Jeśli kontrola się nie powiedzie, aplikacja nie startuje i wypisuje szczegóły błędu. Serwer nasłuchuje lokalnie pod adresem `127.0.0.1`.

```sh
npm test
npm run build
npm start
```

Endpoint `/api/taxonomy` zwraca zwalidowane dane. Serwer zakłada uruchomienie z katalogu głównego repozytorium. Domyślny port to 3000; można go ustawić zmienną `PORT`.
