# Symulacja przyszłych powtórek FSRS

Status: active
Created: 2026-10-26

## 📝 TLDR

Kalendarz statystyk pokaże tylko terminy już wyznaczone przez FSRS. Uczący się chce osobno sprawdzić możliwy dalszy przebieg powtórek przy założonych przyszłych ocenach. Proponowana symulacja będzie odrębną funkcją do odczytu, opartą na bieżących kartach i ustawieniach FSRS, bez zmiany prawdziwego harmonogramu.

## 📝 Problem Statement

Zapisane terminy odpowiadają tylko następnej powtórce każdego znaczenia. Bez jawnych założeń o dalszych ocenach nie można z nich wywnioskować kolejnych terminów ani przyszłego obciążenia nauką. Taki scenariusz wymaga odróżnienia od [kalendarza terminów](implemented/2026-10-26-fsrs-learning-statistics.md).

## 📝 Intended Behavior and Scope

- Osobna funkcja na ekranie statystyk automatycznie losuje przyszłe przypomnienia z prawdopodobieństwa wyliczanego przez FSRS i wyraźnie ujawnia założenia dotyczące ocen oraz horyzontu.
- Gdy znaczenie zostanie zapamiętane, ocena `Hard`, `Good` lub `Easy` jest losowana według proporcji tych ocen w ostatnich 30 dniach historii użytkownika. Brak danych wymaga jawnie pokazanego założenia zastępczego.
- Horyzont symulacji wynosi 30 dni.
- Użytkownik ustawia liczbę nowych znaczeń rozpoczynanych dziennie. Symulacja nie może rozpocząć więcej znaczeń, niż aktualnie czeka bez karty FSRS.
- Obliczenia są hipotetyczne; nie zmieniają `FsrsState`, `FsrsReview`, `StudyAttempt` ani konfiguracji.
- Wynik symulacji nie jest obietnicą konkretnego harmonogramu; ekran odróżnia go od zapisanych terminów.

## 📝 Proposed Solution

Osobna zakładka „Symulacja” przy [statystykach rzeczywistych](implemented/2026-10-26-fsrs-learning-statistics.md) pokazuje możliwy rozkład pracy przez 30 dni. Użytkownik ustawia liczbę nowych znaczeń rozpoczynanych dziennie, także zero. Dla każdego już uczonego znaczenia punkt startowy stanowi bieżąca karta FSRS, a dla nowych — istniejące znaczenia bez karty, do wyczerpania ich liczby. Symulacja zakłada, że wszystkie należne powtórki są wykonane w dniu terminu, a następnie rozpoczynana jest zadana liczba nowych znaczeń. Zaległe terminy trafiają do pierwszego dnia; wiele terminów tego samego dnia jest obsługiwanych kolejno według godzin, a dopiero potem sumowanych do dziennego wyniku.

Każda przyszła formalna powtórka ma losowany wynik przypomnienia według prawdopodobieństwa z FSRS. Brak przypomnienia daje Again. Po przypomnieniu Hard, Good lub Easy są losowane według proporcji formalnych pozytywnych ocen w ostatnich 30 dniach. Pierwsza ocena nowego znaczenia korzysta z rozkładu pierwszych ocen nowych znaczeń z tego okresu. Jeżeli takiej próbki nie ma, używa się rozkładu wszystkich formalnych ocen z tego okresu; przy całkowitym braku historii jawnie przyjmuje się Good i oznacza wynik jako oparty na założeniu zastępczym. Lokalne utrwalenie po formalnym Again może być doliczone raz jako osobna próba pracy, zgodnie z bieżącą kolejką, bez zmiany karty FSRS.

Wiele przebiegów z tymi samymi danymi wejściowymi daje dla każdego dnia średnią liczbę formalnych powtórek, zakres między 10. a 90. percentylem, liczbę rozpoczynanych nowych znaczeń oraz szacowaną liczbę dodatkowych utrwaleń. Zakres pokazuje zmienność scenariuszy przy przyjętym modelu, nie gwarancję ani miarę trafności modelu. Użytkownik widzi źródło proporcji ocen, liczebność próbki, liczbę przebiegów i moment odczytu.

[Symulator Anki](https://docs.ankiweb.net/manual/deck-options) uwzględnia bieżące stany pamięci, parametry FSRS, liczbę nowych kart dziennie i liczbę dni. Filippo przejmuje rozróżnienie scenariusza od zapisanego harmonogramu, lecz pomija limit dziennych powtórek, talie i minuty pracy, których obecny produkt nie modeluje. Założenie wykonania wszystkich należnych powtórek jest widoczne przy wyniku.

## 📝 Architecture

Backendowy moduł symulacji bierze spójny, tylko do odczytu obraz kart FsrsState, znaczeń bez karty, aktywnej FsrsConfigRevision oraz historii FsrsReview i StudyAttempt. Kopie kart istnieją wyłącznie w pamięci obliczenia. Dalsze terminy wyznacza ten sam przypięty ts-fsrs i aktywna konfiguracja, których używa rzeczywista usługa ocen; nie zapisuje się hipotetycznych FsrsReview ani FsrsState. Biblioteczne API oblicza prawdopodobieństwo przypomnienia dla kolejnej chwili oceny. Po ocenie aktualizowana jest wyłącznie symulowana kopia karty i kolejka jej przyszłych terminów.

Przebiegi używają jawnego ziarna pseudolosowego oraz ograniczeń czasu i liczby zdarzeń. Te same dane wejściowe i ziarno dają te same wyniki testowe. Zmiana liczby nowych dziennie lub prawdziwego stanu FSRS wymaga nowej symulacji; brak trwałego cache i tabeli z wynikami. Gdy limit obliczeń zostanie osiągnięty, użytkownik dostaje błąd lub informację o niepełnym scenariuszu, nigdy po cichu ucięty wykres. Istniejące lokalne utrwalenia na starcie są rozpoznawane z ostatnich dzisiejszych StudyAttempt według tej samej reguły co StudyService: ostatnia formalna ocena Again bez późniejszego utrwalenia daje jedną próbę, chyba że termin FSRS już nadszedł. Przyszłe formalne Again dodaje jedną nietrwałą próbę lokalną; jej wynik nie zmienia symulowanej karty. Jeżeli przed nią nadejdzie następny termin FSRS, pierwszeństwo ma formalna powtórka.

## 📝 Data Model

Brak nowych tabel i migracji. Wejściem są istniejące FsrsState, FsrsConfigRevision, FsrsReview, StudyAttempt i LexicalSense. Próba wszystkich wariantów jest wyłącznie nietrwałą kopią bieżącego stanu. Nie zachowuje się losowych ocen ani listy symulowanych znaczeń. Przy przyszłej obsłudze wielu uczących się zakres danych musi być jawnie powiązany z uczącym się, zanim symulacja zostanie im udostępniona.

## 📝 API Contracts

POST /api/study/simulation w pierwszej fazie symuluje tylko rozpoczęte karty, z newPerDay równym zero. Druga faza dodaje opcjonalne newPerDay jako nieujemną liczbę całkowitą ograniczoną do bezpiecznego zakresu; brak pola nadal oznacza zero. Horyzont jest stały: 30 dni. Żądanie nie zmienia danych mimo metody POST, użytej dla kosztownego obliczenia. Niepoprawne wejście daje 400. Odpowiedź zawiera asOf, timeZone, assumptions, sampleSizes, actualNewAvailable i daily[] z datą, średnią oraz 10./90. percentylem formalnych powtórek. Druga faza rozszerza daily[] o liczbę rozpoczynanych nowych i osobną liczbę lokalnych utrwaleń. Dodatkowo zwraca liczbę symulowanych przebiegów i ostrzeżenia o założeniach zastępczych. Liczby dzienne są agregatami, bez surowych hipotetycznych rekordów.

Znaczenia z dueAt przed asOf są zaległe i trafiają do pierwszego dnia scenariusza. Granice dni i limit nowych dziennie stosują Europe/Warsaw. Nowe znaczenia są pobierane w istniejącym porządku kolejki Nauki; nie tworzy się więcej kart niż faktycznie dostępnych. Parametry i proporcje ocen są migawką na chwilę asOf. Po aktualizacji rzeczywistych kart lub konfiguracji kolejny request przelicza wynik.

## 📝 UI/UX

Zakładka jest wizualnie oddzielona od „Zaplanowanych terminów”. Kontrolka liczby nowych dziennie i przycisk „Oblicz scenariusz” uruchamiają obliczenie. Nagłówek wyniku mówi „Symulacja, nie zapisany harmonogram”; podaje horyzont, założenie wykonania wszystkich należnych powtórek, próbkę ocen z ostatnich 30 dni i ewentualne założenie zastępcze. Wykres obciążenia ma zakres zmienności i dostępną tabelę liczbową. Zmiana parametru oznacza poprzedni wynik jako nieaktualny do ponownego obliczenia. Układ, typografia i kolory kontynuują istniejący styl Filippo także na wąskim ekranie.

## 📝 Edge Cases & Failure Scenarios

- Zero rozpoczętych kart i newPerDay równe zero daje czytelny pusty scenariusz. Liczba nowych większa niż dostępna pula kończy rozpoczynanie nowych po jej wyczerpaniu.
- Brak ocen z ostatnich 30 dni uruchamia widoczne założenie zastępcze. Mała próbka jest podana z liczebnością, bez sugerowania wysokiej pewności prognozy.
- Wielokrotne krótkie terminy FSRS tego samego dnia są osobnymi formalnymi zdarzeniami; obliczenie respektuje ich czas. Ograniczenie liczby zdarzeń zapobiega pętli przy ekstremalnych danych.
- Niekompletna karta, brak aktywnej konfiguracji albo niezgodna wersja modelu nie daje pozornej prognozy. Użytkownik widzi błąd i może wrócić do faktycznych statystyk.
- Reset postępu, usunięcie znaczenia lub nowa ocena podczas obliczenia nie zmienia migawki trwającego requestu. Wynik ma asOf; ponowne uruchomienie odczytuje nowy stan.
- Błąd obliczenia nie zapisuje danych i nie zastępuje wcześniejszego wyniku nowym, częściowym wynikiem.

## 📝 Risks & Impact Review

Symulacja zależy od sposobu oceniania w przyszłości. Proporcje z ostatnich 30 dni mogą być nieodpowiednie dla nowego materiału lub małej próbki; ekran pokazuje próbkę i założenia. Gdy brakuje historii, Good jest jawnym uproszczeniem, a nie estymacją. 10./90. percentyl opisują rozrzut losowania przy modelu, nie niepewność samych parametrów FSRS. Koszt wielu przebiegów rośnie z liczbą znaczeń i krótkich terminów; trzeba ograniczyć wejście i policzyć test wydajności na realistycznym zbiorze. Wyłączenie funkcji nie wymaga migracji wstecznej ani czyszczenia danych.

## 📋 Phasing

1. Działająca symulacja dla już uczonych znaczeń, bez nowych dziennie; wyraźnie oddzielona od faktycznego kalendarza.
2. Ustawiana liczba nowych dziennie z oszacowaniem ich pierwszych ocen i osobnym licznikiem lokalnych utrwaleń.

## 📋 Implementation Plan

### Phase 1 — rozpoczęte karty

1. Zbudować kopię aktualnego stanu i mechanizm zdarzeń na 30 dni z tą samą biblioteką FSRS, aktywną konfiguracją, deterministycznym ziarnem i limitami pracy. Test porównuje pojedynczy krok z rzeczywistą usługą FSRS, kilka terminów jednego dnia i brak zapisu do bazy.
2. Dodać losowanie zapamiętania z R oraz pozytywnej oceny z proporcji ostatnich 30 dni; wykonać wiele przebiegów i agregować średnią oraz 10./90. percentyl. Test obejmuje zerową próbkę, skrajne prawdopodobieństwa i powtarzalność.
3. Udostępnić API i zakładkę z 30-dniowym wykresem, tabelą, założeniami, stanem ładowania i błędu. Zweryfikować brak pomylenia z kalendarzem zapisanych terminów oraz wygląd mobilny.

### Phase 2 — nowe znaczenia i pełna praca

4. Dodać newPerDay, ograniczenie do faktycznej puli nowych, losowanie pierwszych ocen z historii nowych i fallback. Test obejmuje brak nowych, wyczerpanie puli i granicę dnia Warszawy.
5. Doliczyć jedno lokalne utrwalenie po formalnym Again jako osobną pracę, bez zmiany FSRS, i pokazać je na wykresie oraz w tabeli. Test potwierdza brak pętli i rozdzielenie formalnych powtórek od utrwaleń.

## Acceptance Criteria

- [ ] Użytkownik może ustawić liczbę nowych znaczeń rozpoczynanych dziennie i zobaczyć 30-dniowy scenariusz osobny od zapisanych terminów.
- [ ] Symulacja używa bieżących kart i ustawień FSRS; przyszłe powodzenia i błędy są losowane z R, a pozytywne oceny z ostatnich 30 dni historii.
- [ ] Pierwsze oceny nowych znaczeń korzystają z dostępnej historii nowych; zastępcze założenie jest jawne i liczba nowych nie przekracza dostępnej puli.
- [ ] Wynik pokazuje średnią i zakres 10.–90. percentyla formalnych powtórek, nowe znaczenia i lokalne utrwalenia, z liczebnością próbki i opisem założeń.
- [ ] Powtórne uruchomienie z tym samym stanem i ziarnem daje ten sam wynik, a zmiana prawdziwych danych powoduje nową migawkę.
- [ ] Obliczenie nie zmienia kart, konfiguracji ani historii; brak danych, wadliwy stan i przekroczenie limitu mają jawny wynik lub błąd.
- [ ] Wykres ma dostępny odpowiednik liczbowy i zachowuje styl Filippo na szerokim i wąskim ekranie.

## Open Questions

Brak blokujących. Użytkownik wybrał automatyczne losowanie według FSRS, proporcje ocen z najwyżej ostatnich 30 dni, horyzont 30 dni i ustawianą liczbę nowych znaczeń dziennie.

## Related Records

- [Statystyki rzeczywiste](implemented/2026-10-26-fsrs-learning-statistics.md)
- [Ekran Nauka](implemented/2026-10-26-study-screen.md)
- [Integracja FSRS](implemented/2026-10-26-fsrs-integration.md)
