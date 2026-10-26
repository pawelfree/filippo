# Szkielet specyfikacji ekranu „Nauka”

- **Data:** 2026-10-26
- **Status:** zakończony.
- **Cel:** przygotować [specyfikację](../specs/implemented/2026-10-26-study-screen.md) ekranu nauki i powtórek `LexicalSense`.
- **Działania:** przejrzano integrację FSRS, model danych, widoki i słownik; zapisano szkielet, rozstrzygnięto pytania z użytkownikiem, porównano zachowanie Anki i Mnemosyne, opisano kontrakty, przypadki błędów i etapy wdrożenia. Dodano statyczny i interaktywny graf danych.
- **Sprawdzenie:** przypięty `ts-fsrs@6.0.0-beta.15` po `Again` o 12:00 wyznaczył `dueAt` na 12:01; `Good` o 12:01 wyznaczył kolejny termin tego samego dnia. Graf HTML wyrenderował trzy węzły, a podświetlanie relacji działa w JSDOM. `git diff --check` bez błędów. Nie uruchamiano testów aplikacji, ponieważ zmieniono tylko dokumentację.
- **Decyzje:** jedna specyfikacja obejmuje liczniki i sesję na życzenie użytkownika, choć przegląd zakresu potwierdził, że oba etapy mogą być dostarczane osobno. Ekran startowy pokazuje tylko dwie liczby, bez listy znaczeń. Sesja bez limitu przechodzi przez należne powtórki, utrwalenia po błędach i nowe znaczenia; można ją przerwać i wznowić według aktualnego stanu. Podczas sesji cały wpis i trzy aktualizowane liczniki są widoczne. Oceny nowego i należnego znaczenia trafiają do FSRS, a dodatkowe utrwalenie przed terminem zmienia tylko kolejkę aplikacji. Ćwiczenia generowane później pozostają poza zakresem.
- **Nierozstrzygnięte:** brak pytań blokujących. Strefa dnia została zapisana jako `Europe/Warsaw` zgodnie z kontekstem bieżącego użytkownika; jej przyszła zmiana wymaga osobnej decyzji.
- **Wynik:** aktywna, pełna specyfikacja gotowa do wdrożenia lokalnego.
