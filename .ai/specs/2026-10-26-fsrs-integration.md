# Integracja FSRS z LexicalSense

Status: active  
Created: 2026-10-26  
Źródło: [opis integracji FSRS](../docs/fsrs_integration.md)

## Problem Statement

Uczący się może zapisać znaczenia i rozwiązywać dotyczące ich zadania, ale aplikacja nie utrzymuje jeszcze działającego harmonogramu powtórek. Różne zadania dla tego samego `LexicalSense` muszą aktualizować jeden stan nauki. Powtórzona lub opóźniona ocena nie może podwójnie naliczyć próby ani zepsuć terminu następnej powtórki.

## Solution

Backend przyjmuje ocenione zdarzenie dotyczące `LexicalSense` z jedną z czterech gotowych ocen FSRS. Dla pierwszej oceny tworzy kartę, dla kolejnych aktualizuje istniejącą. Zapisuje pełny stan karty, termin następnej powtórki i dziennik zdarzenia w jednej transakcji. Odczyt pozwala pobrać bieżący stan bez jego zmiany. Parametry algorytmu początkowo pochodzą z przypiętej wersji biblioteki; późniejsze jawne zmiany ustawień tworzą rewizje i dotyczą następnych ocen.

## User Stories

1. Jako uczący się chcę zapisać `LexicalSense` bez rozpoczynania powtórek, aby sam zapis znaczenia nie był traktowany jako nauka.
2. Jako uczący się chcę, by pierwsza oceniona prezentacja utworzyła mój stan FSRS, aby harmonogram zaczął się od rzeczywistej próby.
3. Jako uczący się chcę, by kolejne ocenione prezentacje tego samego znaczenia aktualizowały jeden stan, aby zadania dla tego znaczenia nie tworzyły oddzielnych harmonogramów.
4. Jako uczący się chcę, by terminy powtórek pochodziły z FSRS, aby aplikacja nie stosowała drugiego algorytmu.
5. Jako uczący się chcę widzieć bieżący termin powtórki znaczenia, aby wiedzieć, kiedy wróci do nauki.
6. Jako uczący się chcę, by sam odczyt terminu nie zmieniał harmonogramu, aby podgląd nie liczył się jako próba.
7. Jako uczący się chcę zachować harmonogram po restarcie aplikacji, aby nie tracić postępów.
8. Jako uczący się chcę, by ponowne przesłanie tej samej oceny nie naliczało jej drugi raz, aby awaria sieci nie zmieniała wyniku nauki.
9. Jako uczący się chcę, by ten sam identyfikator zdarzenia z inną treścią został odrzucony, aby sprzeczne dane nie zostały uznane za ponowienie.
10. Jako uczący się chcę, by opóźniona starsza ocena nie nadpisała nowszego stanu, aby kolejność dostarczenia zdarzeń nie psuła harmonogramu.
11. Jako uczący się chcę, by oceny `Again`, `Hard`, `Good` i `Easy` zachowały swoje różne znaczenie, aby wynik odpowiedzi nie był sprowadzany do skali poprawna/niepoprawna.
12. Jako uczący się chcę, by różne znaczenia jednego wyrażenia miały osobne stany, aby powtórki odzwierciedlały opanowanie konkretnego `LexicalSense`.
13. Jako uczący się chcę, by dwa jednoczesne zdarzenia dla tego samego znaczenia nie zgubiły aktualizacji, aby harmonogram pozostał spójny.
14. Jako uczący się chcę, by zapis stanu i historii był nierozdzielny, aby nie powstał termin bez odpowiadającej mu oceny.
15. Jako uczący się chcę, by historia zawierała czas faktycznej oceny, aby późniejsze przetwarzanie nie zmieniało znaczenia odstępu między próbami.
16. Jako uczący się chcę móc prześledzić zmiany harmonogramu, aby korektę oceny dało się bezpiecznie rozpatrzyć.
17. Jako uczący się chcę zacząć z oficjalnymi ustawieniami wybranej wersji FSRS, aby aplikacja nie narzucała arbitralnych parametrów.
18. Jako uczący się chcę zmienić dopuszczalne parametry FSRS, aby dostosować harmonogram do własnych potrzeb.
19. Jako uczący się chcę otrzymać błąd przy niepoprawnym ustawieniu, aby nie aktywować niespójnej konfiguracji.
20. Jako uczący się chcę, by zmiana parametrów nie przepisywała moich dawnych ocen, aby historia pozostała wiarygodna.
21. Jako uczący się chcę, by zapisane terminy nie zmieniały się samoczynnie po edycji parametrów, aby zmiana ustawień nie przestawiała niejawnie istniejących powtórek.
22. Jako uczący się chcę, by każdą aktualizację można było powiązać z zastosowaną rewizją ustawień, aby dało się wyjaśnić różnice w terminach.
23. Jako uczący się chcę, by zmianę wersji modelu FSRS traktowano jako osobną migrację, aby nie odczytywać starych kart według niezgodnego formatu.
24. Jako użytkownik aplikacji chcę, by integracja przyjmowała już gotową ocenę, aby nie mieszała harmonogramu ze sprawdzaniem odpowiedzi i doborem ćwiczeń.

## Implementation Decisions

- Jednostką harmonogramowania jest `LexicalSense`, nie zadanie, luka ani forma fleksyjna. Aplikacja ma jednego użytkownika. Powiązanie uczącego się ze stanem pozostaje w warstwie FSRS, bez pola użytkownika w `LexicalSense`.
- Warstwa FSRS przyjmuje `reviewEventId`, `lexicalSenseId`, jedną z czterech ocen i rzeczywisty czas oceny. Nie wyznacza oceny z odpowiedzi użytkownika.
- Dla znaczenia bez stanu pierwsza oceniona prezentacja tworzy kartę; sam zapis `LexicalSense` nie tworzy historii powtórek.
- Bieżący rekord zachowuje pełną kartę biblioteki i indeksowany `dueAt` skopiowany z karty. Historia zachowuje pełny dziennik oceny, unikalny identyfikator zdarzenia, ocenę, czas i rewizję konfiguracji.
- Powtórzenie identycznego zdarzenia zwraca jego wcześniejszy wynik; ponowne użycie identyfikatora z innymi danymi kończy się konfliktem. Odczyt nie wywołuje ponownego przeliczenia.
- Zapis karty, terminu i historii odbywa się atomowo. Współbieżne oceny tej samej jednostki są serializowane lub kontrolowane przez wersję rekordu; starsze zdarzenie dostarczone po nowszym nie jest dopisywane jako bieżąca powtórka.
- Pełne obiekty biblioteki są serializowane z jednoznacznymi datami UTC i odtwarzane z walidacją do typów wymaganych przez bibliotekę. Dodatkowe kolumny w bazie są kopiami do odczytu/indeksowania, nie źródłem niezależnych obliczeń.
- Istniejące modele trwałego stanu nauki i ocen są punktem migracji. Kontrakt danych trzeba uzupełnić o pełną kartę, pełny dziennik, tożsamość zdarzenia i rewizję konfiguracji; nie tworzyć drugiego konkurencyjnego bieżącego stanu.
- Konfiguracja przypina wersję modelu i dokładną wersję pakietu. Na starcie nie ma nadpisań parametrów; zmiana ustawień tworzy nową kompletną rewizję po walidacji typów, zakresów, kroków i wag. Nowa rewizja działa dla kolejnych ocen i nie przesuwa automatycznie istniejących terminów.
- Docelowy model opisany w źródle to FSRS-7 przez `ts-fsrs` v6. Przed implementacją trzeba potwierdzić stabilną publikację, rzeczywisty kontrakt API i wymagania Node dla przypinanej wersji; nie opierać wdrożenia na przykładach z nieprzypiętej wersji beta. Wersję modelu i wersję pakietu zmienia się wyłącznie w kontrolowanej operacji migracyjnej.
- Osobna operacja korekty wcześniejszej oceny albo migracji modelu wymaga odtworzenia historii w porządku czasowym. Nie wolno symulować korekty jako nowej oceny ze starą datą.

## Testing Decisions

- Główną granicą testów jest publiczna usługa integracji FSRS z rzeczywistym schedulerem i testową bazą SQLite. Testy sprawdzają zachowanie widoczne dla wywołującego oraz zapisany stan, a nie wewnętrzną kolejność wywołań metod biblioteki. Użytkownik potwierdził tę granicę; nowe endpointy HTTP nie są wymagane.
- Jeden scenariusz obejmuje brak stanu przed nauką, pierwszą ocenę, odczyt terminu, drugą ocenę tego samego znaczenia i odtworzenie po nowej instancji usługi.
- Osobne scenariusze obejmują każdą z czterech ocen, różne `LexicalSense`, identyczne ponowienie zdarzenia, konflikt identyfikatora, błąd zapisu w transakcji, równoległe oceny i spóźnione starsze zdarzenie.
- Test konfiguracji obejmuje start bez nadpisań, odrzucenie niepoprawnych ustawień, nową rewizję dla następnej oceny oraz brak niejawnego przeliczenia już zapisanej karty.
- Do przygotowania bazy i testów przepływu można użyć istniejącego wzorca testów integracyjnych aplikacji opartego na migracjach SQLite i prawdziwym Prisma Client.

## Acceptance Criteria

- [ ] `LexicalSense` może istnieć bez stanu i historii FSRS.
- [ ] Pierwsza gotowa ocena tworzy stan, dziennik i termin powtórki; każda kolejna aktualizuje ten sam stan dla tego znaczenia.
- [ ] Wszystkie cztery oceny są obsługiwane bez mapowania poprawna/niepoprawna.
- [ ] Stan, historia i termin są spójne po zapisie, ponowieniu i restarcie.
- [ ] To samo zdarzenie nie nalicza powtórki ponownie; sprzeczny duplikat jest odrzucany.
- [ ] Równoległe lub opóźnione zdarzenia nie nadpisują nowszego stanu.
- [ ] Pusta konfiguracja używa parametrów przypiętej wersji; poprawna nowa rewizja działa dla następnych ocen, a niepoprawna jest odrzucana.
- [ ] Odczyt stanu nie zmienia karty i zwraca termin pochodzący z karty FSRS.
- [ ] Wybrana wersja pakietu i modelu jest stabilna, przypięta i zgodna z wersją Node używaną przez aplikację.

## Out of Scope

- Sprawdzanie odpowiedzi, wyliczanie oceny FSRS, generowanie i wybór zadań, paczki oraz sesje.
- Optymalizacja wag na podstawie historii i automatyczne przeliczanie już zapisanych terminów po zmianie parametrów.
- Interfejs użytkownika do ustawień i ręcznych korekt, jeśli nie zostanie objęty odrębną specyfikacją.
- Scalanie `LexicalSense`.

## Further Notes

- Słownik domenowy rozróżnia `LexicalSense`, zadanie i jednostkę FSRS; nazewnictwo w implementacji powinno zachować te znaczenia.
- Aktualny model danych ma już stan FSRS powiązany z uczącym się i `LexicalSense` oraz oceny powiązane z zadaniem, ale nie utrwala jeszcze pełnego kontraktu karty i zdarzenia opisanego powyżej.
- Na dzień 2026-10-26 `ts-fsrs` v6 figuruje w npm jako beta, a stabilna wersja jest planowana przez autorów na 2026-10-28. Repozytorium deklaruje Node `>=20`; dokument źródłowy zakłada dla v6 Node `>=24`. Przed rozpoczęciem implementacji zweryfikować aktualną stabilną wersję i uaktualnić środowisko, jeżeli wymaga tego wybrana wersja biblioteki. Źródła: [wydania npm](https://www.npmjs.com/package/ts-fsrs?activeTab=versions), [plan wydania autorów](https://github.com/open-spaced-repetition/ts-fsrs/issues/373), [oficjalne README](https://github.com/open-spaced-repetition/ts-fsrs/blob/main/README.md).

## Open Questions

- Jaką dokładnie stabilną wersję `ts-fsrs` v6 oraz minimalną wersję Node wybrać po publikacji stabilnego pakietu?
