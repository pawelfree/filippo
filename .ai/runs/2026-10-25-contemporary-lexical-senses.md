# Doprecyzowanie wyboru współczesnych znaczeń

Data: 2026-10-25  
Status: zakończony

## Cel

Dostosować wyłącznie [reguły tworzenia](../docs/lexical_sense/creation.rules.md) do preferencji: tylko współczesne znaczenia, z dużą szansą trafnego wyboru, bez wymogu identycznego wyniku przy każdym uruchomieniu. Użytkownik wyraźnie wyłączył ponowną ocenę wcześniejszego JSON.

## Działania

- Odczytano reguły, wcześniejszy wynik, notatkę o źródłach i lekcje.
- Sprawdzono we włoskiej Wikipedii wyrażenia z `distinzione`; liczne wyniki `con distinzione` dotyczą wyróżnienia za zasługi, a jedyny wynik `eleganza e distinzione` cytuje dawną recenzję. Nie potwierdza to współczesnego ogólnego użycia w sensie „wytworność”.
- Zmieniono tylko `creation.rules.md`: zakres ograniczono do współczesnych znaczeń także przy wejściu z kontekstem; przy niejasnej aktualności wymaga się dalszego potwierdzenia; dodano wskazówkę dla rozdzielania przypadków granicznych bez sztywnej liczby sensów.

## Kontrole, decyzje i wynik

- Odczytano zmienione fragmenty reguł. Nie uruchamiano testów, bo zmieniono tylko dokument.
- Wcześniejszy wynik JSON pozostał bez zmian zgodnie z poleceniem użytkownika. Ustalenia dotyczące `distinzione` nie są ponowną oceną tego wyniku.
- Brak nierozstrzygniętych kwestii w zakresie tej aktualizacji.
