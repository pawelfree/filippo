# Stary serwer pokazywał 2 z 10 zamiast 2 z 5

Data: 2026-11-03. Status: zakończony.

Cel: wyjaśnić i usunąć błędny mianownik postępu generowania na działającym ekranie.

Ustalenie: lokalna baza zapisała `generationProcessed=2` i `generationTotal=5` dla sesji z 10 znaczeniami. Działający serwer na porcie 3000 zwracał jednak `generation.processed=2` bez `generation.total`, ponieważ proces `tsx watch` nadal używał starszego kodu. Przeglądarka podstawiała wówczas `requestedCount=10` jako mianownik.

Działania: przeładowano proces `tsx watch` przez zmianę czasu modyfikacji `src/main.ts`; odczyt lokalnego API potwierdził odpowiedź `generation: {processed: 2, total: 5}`. Usunięto w przeglądarce zastępowanie brakującego `generation.total` liczbą znaczeń w sesji. Dodano regresję dla starszej odpowiedzi API bez `total`.

Sprawdzenie: `npm run build:browser` i 9/9 testów ekranu cloze poprawnych; lokalny endpoint po przeładowaniu zwraca 2/5. Nie zmieniano danych sesji ani ćwiczeń.

Wynik: po odświeżeniu strony historia pokazuje 2 z 5 zestawów; starsza odpowiedź bez mianownika pokazuje „Brak zapisanego postępu”.
