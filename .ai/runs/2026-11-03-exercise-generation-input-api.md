# API wejścia do generowania ćwiczeń

- Data: 2026-11-03
- Status: zakończony
- Cel: dodać metodę i endpoint składające wejście generatora z ID zapisanych `LexicalSense`.
- Specyfikacja: [wejście do generowania ćwiczeń](../specs/implemented/2026-11-03-exercise-generation-input.md).
- Działania: dodano `ExerciseGenerationInputService.prepare`, kontroler i rejestrację w module, testy oraz opis API w README.
- Kontrole: `npm run build`; trzy testy metody i kontrolera; próbny odczyt jednego znaczenia z lokalnej bazy (projekcja, 348 kompetencji, 348 wariantów). Próba testu przez lokalny port była niedostępna w sandboxie (`listen EPERM`), więc rejestrację trasy sprawdzono bez otwierania portu.
- Decyzje: oddzielny serwis odczytowy, endpoint POST z listą 1–100 unikalnych ID. Pierwotnie zwracał też profil i taksonomię; na prośbę użytkownika zakres odpowiedzi skorygowano w [kolejnym runie](2026-11-03-exercise-input-lexical-only.md). Brak częściowego wyniku przy błędnym ID lub danych znaczenia.
- Nierozstrzygnięte: brak blokujących; wywołanie skilla generującego ćwiczenia jest osobnym etapem.
- Wynik: metoda i endpoint przygotowały projekcje znaczeń; późniejsza korekta usunęła profil i taksonomię z odpowiedzi.
