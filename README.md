# Filippo · taksonomia gramatyki

Prosty, tylko do odczytu atlas włoskiej taksonomii gramatycznej zbudowany w NestJS. Dane źródłowe znajdują się w [`.ai/docs/grammar_taxonomy/taxonomy.json`](.ai/docs/grammar_taxonomy/taxonomy.json), a ich schemat w [`.ai/docs/grammar_taxonomy/taxonomy.schema.json`](.ai/docs/grammar_taxonomy/taxonomy.schema.json).

## Uruchomienie

Wymagany Node.js 20 lub nowszy.

```sh
npm install
npm run start:dev
```

Otwórz `http://localhost:3000`. Aplikacja pokazuje kategorie, konstrukcje, warianty, ich definicje, orientacyjny poziom CEFR, dostępne przykłady i relacje. Wyszukiwarka filtruje warianty w wybranej kategorii.

## Walidacja

Podczas uruchamiania serwer czyta oba pliki z `.ai/docs/grammar_taxonomy` i sprawdza dane według JSON Schema draft 2020-12. Jeśli walidacja się nie powiedzie, aplikacja nie startuje i wypisuje ścieżki błędnych pól. Walidacja dotyczy reguł zapisanych w schemacie; nie dopisuje kontroli semantycznych relacji lub poprawności językowej.

```sh
npm test
npm run build
npm start
```

Endpoint `/api/taxonomy` zwraca zwalidowane dane. Serwer zakłada uruchomienie z katalogu głównego repozytorium. Domyślny port to 3000; można go ustawić zmienną `PORT`.
