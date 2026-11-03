# Nauka cloze

Status: implemented
Created: 2026-11-03
Implemented: 2026-11-03 — dodano stronę, trwałą sesję, asynchroniczne generowanie, zapis ćwiczeń i ocenę FSRS; weryfikacja w testach z kontrolowaną odpowiedzią API. Próbę połączenia z rzeczywistym OpenAI odrzuciła automatyczna kontrola uprawnień, więc nie jest ona częścią potwierdzenia działania.

## Problem

Ćwiczenia cloze można przygotować według skilla, ale aplikacja nie generuje ich dla zapisanych znaczeń, nie przechowuje ich i nie pozwala rozwiązać ustalonej partii.

## Intended behavior

- Nowa strona obok „Nauka” przyjmuje liczbę znaczeń i tworzy trwałą sesję z dokładnie tyloma wybranymi znaczeniami, o ile są dostępne.
- Dla znaczeń bez czterech zapisanych poprawnych ćwiczeń system generuje brakującą serię asynchronicznie i zapisuje poprawne wyniki. Niepowodzenia po maksymalnie trzech próbach na miejsce są jawne; sesja nie czeka bez końca.
- Strona pokazuje po kolei pierwsze ćwiczenie każdego wybranego znaczenia. Każda luka ma osobne pole. Polskie pełne zdanie jest widoczne przed odpowiedzią.
- Po „Gotowe” serwer porównuje każde pole z zaakceptowanym kluczem jako tekst. Poprawna cała odpowiedź daje FSRS Easy, błędna Again. Ocena zapisywana jest raz, następnie sesja przechodzi do kolejnego wybranego znaczenia.
- Sesja kończy się po przejściu całej wybranej listy; brakujące ćwiczenie jest pomijane z widocznym powodem i nie powoduje wyboru dodatkowego znaczenia.

## Scope

Strona, API, kolejka generowania, walidacja wyniku AI, trwałe ćwiczenia i sesje, zapis ocen FSRS. Kolejne trzy ćwiczenia są zapisywane na przyszłość, lecz w tej iteracji rozwiązywane jest tylko pierwsze.

## Acceptance criteria

- [x] Nawigacja i strona „Nauka cloze” działają na komputerze i małym ekranie.
- [x] Wybrana lista znaczeń jest trwała i nie rośnie po błędzie generowania.
- [x] Zapisane ćwiczenia są ponownie używane; brakujące są generowane w tle i walidowane względem schematów oraz identyfikatorów.
- [x] Każda pozycja ma ograniczoną liczbę prób i jawny stan niepowodzenia.
- [x] Odpowiedzi w oddzielnych lukach są oceniane po stronie serwera; ponowione żądanie nie dubluje oceny FSRS.
- [x] Poprawna odpowiedź zapisuje Easy, błędna Again; koniec zależy od liczby wybranych znaczeń.
- [x] Build i testy istotne dla nowego przepływu przechodzą.

## Open questions

Brak blokujących. Dobór znaczeń w pierwszej wersji używa kolejności należne FSRS, następnie nowe, potem przyszłe, bez losowania.
