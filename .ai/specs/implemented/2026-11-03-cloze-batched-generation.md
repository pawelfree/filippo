# Generowanie tylko brakujących zestawów cloze

Status: implemented. Utworzono: 2026-11-03. Przeniesiono do `implemented/` 2026-11-03 po spełnieniu kryteriów.

## Problem

Postęp generowania liczy wszystkie znaczenia w sesji, choć część ma już ćwiczenia. Worker wysyła każde brakujące znaczenie osobno do AI. Ekran sesji powtarza techniczny licznik, pozwala odejść do nowej sesji podczas generowania i pokazuje cztery identyczne błędy po awarii połączenia.

## Oczekiwane działanie

- Przed generowaniem przypisz dostępne ćwiczenia; licznik generowania obejmuje tylko znaczenia bez przydzielonego ćwiczenia.
- Wyślij brakujące znaczenia do AI w grupach po maksymalnie pięć. Zapisz wyniki osobno dla każdego znaczenia, zachowując cztery miejsca na zestaw i limit trzech prób na miejsce w instrukcjach skilla.
- W sesji nie pokazuj tekstu o przetworzonych zestawach. Podczas kolejki/generowania przycisk nowej sesji jest nieaktywny i ma napis „Poczekaj”.
- Po błędzie pokaż jedno zrozumiałe zgłoszenie na znaczenie oraz działanie umożliwiające ponowienie brakujących zestawów bez utraty dostępnych ćwiczeń.
- Historia zleceń pokazuje postęp liczony dla rzeczywiście brakujących zestawów.

## Zakres

Backend sesji i workera cloze, zapis licznika generowania, widok sesji i historia zleceń, testy i lokalna migracja. Bez zmian w profilu FSRS i treści pojedynczego ćwiczenia.

## Kryteria akceptacji

- [x] Dla dziesięciu znaczeń, z których pięć ma dostępne ćwiczenia, generator przetwarza tylko pięć i wykonuje jedno żądanie AI.
- [x] Wyniki i błędy dla każdej piątki są zapisane bez gubienia dostępnych ćwiczeń.
- [x] Sesja podczas generowania pokazuje „Poczekaj” i blokuje nową sesję.
- [x] Po błędzie jest jasna droga ponowienia brakujących zestawów.
- [x] Kompilacja i testy przechodzą (39/39).

## Otwarte pytania

Brak.

Powiązane: [przebieg pracy](../../runs/2026-11-03-cloze-batched-generation.md).
