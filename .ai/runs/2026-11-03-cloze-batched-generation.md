# Generowanie brakujących zestawów cloze

Data: 2026-11-03. Status: zakończony.

Cel: poprawić licznik, grupować wywołania AI po maksymalnie pięć znaczeń i uprościć stan sesji.

Specyfikacja: [generowanie brakujących zestawów](../specs/implemented/2026-11-03-cloze-batched-generation.md).

Ustalenie z danych: bieżąca sesja wybrała 10 znaczeń; 5 miało zestawy przed jej utworzeniem. Szósta czwórka ćwiczeń powstała już podczas tej sesji. `generationProcessed` liczył również pobrania gotowych ćwiczeń.

Działania: `generationTotal` zapisuje liczbę brakujących zestawów, worker pomija przydzielone ćwiczenia i wysyła brakujące znaczenia do AI po maksymalnie pięć. Wyniki dla każdego znaczenia zapisuje w transakcji, postęp zwiększa o wielkość przetworzonej grupy. Sesja podczas generowania ukrywa techniczny licznik i blokuje nową sesję przyciskiem „Poczekaj”. Błędy czterech miejsc są grupowane według znaczenia; przy braku całego zestawu można ponowić generowanie w tej samej sesji przed rozpoczęciem nauki.

Migracja `20261103210000_cloze_missing_generation_total` została zastosowana w lokalnej bazie. Dla przerwanej sesji poprawiła licznik z 7/10 wybranych znaczeń na 2/5 zestawów wymagających generowania; sześć przypisanych zestawów i 39 znaczeń pozostało. Cztery brakujące znaczenia można ponowić przyciskiem w sesji.

Sprawdzenie: `npm run db:generate`, `npm run build`, `npm test` 39/39 poprawnych; test migracji sprawdza mieszankę gotowego i wygenerowanego ćwiczenia; `git diff --check` bez błędów.

Wynik: kryteria spełnione. Nie uruchamiano ponownego wywołania AI w imieniu użytkownika; może je uruchomić przyciskiem.
