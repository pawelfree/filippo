# Cloze według kolejki FSRS

Status: implemented
Created: 2026-11-03
Implemented: 2026-11-03 — współdzielona kolejka FSRS, przydział kolejnych ćwiczeń, utrwalenia na tym samym ćwiczeniu, liczniki i migracja bazy; testy 32/32.

## Problem

Cloze wybiera znaczenia według własnej kolejności, generuje pełne zestawy również wtedy, gdy istnieje niewykorzystane ćwiczenie, i nie obsługuje utrwaleń tak jak ekran „Nauka”.

## Intended behavior

- Lista znaczeń do sesji cloze pochodzi z tej samej kolejki FSRS co ekran „Nauka”: należne, utrwalenia, nowe, z jej regułami priorytetu.
- Strona pokazuje liczniki „Dziś do nauki” i liczniki sesji zgodne z ekranem „Nauka”.
- Przy pierwszym pokazaniu znaczenia w sesji wybierane jest jego najstarsze poprawne, jeszcze nieużyte w żadnej sesji ćwiczenie.
- Jeśli wybrane znaczenie nie ma niewykorzystanego ćwiczenia, generator tworzy następny zestaw czterech i używa pierwszego poprawnego ćwiczenia.
- Błędna formalna odpowiedź powoduje jedno utrwalenie w tej samej sesji na identycznym ćwiczeniu, zgodnie z regułami kolejki FSRS. Utrwalenie nie zapisuje drugiej formalnej oceny FSRS.
- W kolejnej sesji to samo znaczenie otrzymuje kolejne niewykorzystane ćwiczenie. Starsze ćwiczenia i próby pozostają zapisane.
- Sesja kończy się po wyczerpaniu wybranych znaczeń i ich utrwaleń. Ponowienie żądania odpowiedzi nie dubluje zapisu.

## Scope

Wybór FSRS, zapis przydziału ćwiczenia do sesji, kolejne zestawy ćwiczeń, utrwalenia, liczniki API i widoku. Bez zmiany skilla generowania treści pojedynczego zestawu.

## Acceptance criteria

- [x] Cloze wybiera znaczenia według tych samych reguł priorytetu co „Nauka”.
- [x] Niewykorzystane ćwiczenie wyklucza generowanie; wyczerpanie puli uruchamia nowy zestaw czterech.
- [x] Utrwalenie w tej samej sesji używa tego samego ćwiczenia i nie tworzy nowej oceny FSRS.
- [x] Kolejna sesja używa kolejnego ćwiczenia; próby i rozwiązania są nadal odtwarzalne.
- [x] Strona pokazuje liczniki „Dziś do nauki” i bieżące liczniki kolejki.
- [x] Kompilacja i istotne testy przechodzą.

## Open questions

Brak blokujących. Jeśli kolejka zawiera mniej znaczeń niż żądana liczba, sesja obejmuje dostępne znaczenia i jasno pokazuje rzeczywistą liczbę.
