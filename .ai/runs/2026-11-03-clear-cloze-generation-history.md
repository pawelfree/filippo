# Wyczyszczenie historii generowania cloze

Data: 2026-11-03. Status: zakończony.

Cel: usunąć historię generowania z lokalnej bazy bez usuwania znaczeń, ćwiczeń i postępu nauki.

Stan przed zmianą: 5 sesji cloze, w tym 1 oznaczona jako zlecenie generowania (`failed`, bez odpowiedzi); 39 znaczeń, 20 ćwiczeń, 20 odpowiedzi cloze, 15 prób nauki i 15 ocen FSRS.

Decyzja: usunąć wyłącznie zakończone zlecenie generowania bez odpowiedzi. Pozostałe sesje są historią nauki, a nie pozycjami listy generowania.

Działanie: w transakcji usunięto 1 rekord `ClozeSession` oznaczony jako zlecenie generowania, ze stanem `failed` i bez odpowiedzi.

Sprawdzenie: po zmianie 0 zleceń generowania; nadal 39 znaczeń, 20 ćwiczeń, 20 odpowiedzi cloze, 15 prób nauki, 15 ocen FSRS i 4 sesje nauki. Testy kodu nie były potrzebne do jednorazowej operacji na danych.

Wynik: historia generowania widoczna w aplikacji jest pusta; znaczenia, ćwiczenia i postęp nauki zachowane. Brak nierozwiązanych kwestii.
