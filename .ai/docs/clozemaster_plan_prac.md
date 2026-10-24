# Clozemaster — plan prac do zamknięcia pełnego cyklu nauki

**Status:** plan merytoryczny i integracyjny  
**Zakres:** jednoosobowa aplikacja do nauki języka włoskiego metodą cloze  
**Data:** 2026-10-24

## 1. Cel i granice zakresu

Celem jest zamknięcie pełnego cyklu: **pozyskanie słów i fraz → utworzenie jednostek leksykalnych → wybór materiału → wygenerowanie i zapisanie ćwiczeń → udostępnienie paczki 20 ćwiczeń → przyjęcie i sprawdzenie odpowiedzi → aktualizacja FSRS i profilu gramatycznego → okresowa analiza postępów → adaptacja kolejnych generowanych ćwiczeń**.

Dokument jest listą prac i decyzji do domknięcia, a nie nową specyfikacją już ustalonych algorytmów. W miejscach, w których brak potwierdzonego schematu lub kontraktu, wskazano **do weryfikacji**, a nie założono, że element nie istnieje.

## 2. Ustalenia, których nie należy projektować od nowa

1. Aplikacja służy **jednemu użytkownikowi**.
2. Jednostkami leksykalnymi są m.in. **LexicalItem** i **LexicalSense**. Należy zachować rozróżnienie formy/jednostki od jej znaczenia.
3. **FSRS** działa na poziomie jednostki leksykalnej/znaczenia zgodnie z przyjętym wcześniej modelem, a nie pojedynczego zdania czy wygenerowanego ćwiczenia. Precyzyjną relację kluczy należy potwierdzić w istniejącym schemacie.
4. Ćwiczenia generuje AI **przed prezentacją użytkownikowi** i zapisuje do bazy. Nie generuje się ich na żądanie przy sprawdzaniu odpowiedzi.
5. Użytkownik otrzymuje **paczki po 20 ćwiczeń**. W ich skład wchodzą ćwiczenia dla jednostek wymagających powtórki według FSRS oraz nowe ćwiczenia, których jeszcze nie prezentowano. Nie należy przyjmować nieustalonej sztywnej proporcji tych dwóch źródeł.
6. Odpowiedź jest najpierw sprawdzana przez mechanizm deterministyczny. **Agent diagnostyczny** jest potrzebny w razie odrzucenia pierwszej odpowiedzi, ponieważ klucz nie wyczerpuje wszystkich dopuszczalnych konstrukcji i niuansów gramatycznych.
7. AI dokonuje **diagnozy językowej**, zwracając obserwacje wariantów gramatycznych; skrypt aktualizuje liczniki i parametry profilu. Nie należy mieszać roli agenta z rolą skryptu.
8. Oceniane kompetencje odpowiadają **wariantom taksonomii**; relacje między wariantami mogą służyć interpretacji odpowiedzi, ale nie powodują automatycznego przenoszenia ocen.
9. Profil gramatyczny jest oddzielny od stanu FSRS. **Okresowa analiza postępów przez AI** wpływa na sposób generowania kolejnych ćwiczeń, przede wszystkim na struktury gramatyczne i rozpoznane trudności.
10. Dalsze próby po pierwszej odpowiedzi w tej samej prezentacji nie są kolejnymi niezależnymi obserwacjami kompetencji; ponowna prezentacja to odrębne zdarzenie.

## 3. Istniejące opracowania i status weryfikacji

| Obszar / materiał | Stan wynikający z rozmów | Co pozostaje sprawdzić |
|---|---|---|
| Taksonomia gramatyczna | Opracowana; warianty i relacje | Kompletność względem scenariuszy generowania, wersja i spójność identyfikatorów |
| Profil kompetencyjny i `profile.schema.json` | Opracowany, wersja 1.3.0 wskazana w `profile_update.md` | Aktualny plik, zgodność z końcowymi kontraktami |
| `generation_rules.md` | Opracowane reguły generowania | Czy zawierają wszystkie metadane potrzebne sprawdzaniu i profilowi |
| `evaluation_rules.md` | Przeredagowane jako instrukcja wejście → diagnoza → JSON dla agenta | Zgodność końcowego kontraktu ze skryptem i zestawem testów |
| `profile_update.md` | Opracowany; docelowa wersja dopracowywana w Work | Weryfikacja wersji finalnej po zakończeniu prac |
| `evaluation_config.json` | Parametry modelu przewidziane w `profile_update.md` | Istnienie rzeczywistego pliku, zgodność ze schematem i wersją profilu |
| LexicalItem / LexicalSense | Model pojęciowy ustalony | Czy kompletne schematy, import i deduplikacja są już opisane |
| FSRS | Jednostka harmonogramowania i rozdzielenie od ćwiczeń ustalone | Kontrakt zdarzeń i operacje konkretnej implementacji |

**Zasada kontroli zakresu:** nie należy pisać nowych dokumentów, jeśli odpowiednia część istniejącej dokumentacji już realizuje dany kontrakt; wtedy wystarczy audyt i ewentualna korekta.

## 4. Rejestr prac — priorytety

**P0 — konieczne do działania pełnego cyklu; P1 — konieczne do adaptacji i niezawodności; P2 — rozwój i doskonalenie.**

### P0.1. Repozytorium jednostek leksykalnych i dodawanie słów/fraz

**Cel:** użytkownik może doprowadzić nowy materiał leksykalny do stanu umożliwiającego generowanie ćwiczeń.

**Prace:**

- Zweryfikować/ukończyć schematy `LexicalItem`, `LexicalSense` oraz ich identyfikatory i relacje.
- Określić operacje: dodanie pojedynczego słowa/frazy, dodanie wielu pozycji, import, podgląd, poprawa, odrzucenie, połączenie duplikatów.
- Zdefiniować rolę AI w lematyzacji, rozpoznaniu jednostek wielowyrazowych, identyfikacji znaczeń, części mowy, rejestru i ograniczeń użycia.
- Określić, jak rozdzielać różne znaczenia jednego wyrazu oraz jak traktować synonimy, warianty zapisu i formy fleksyjne.
- Ustalić wymaganą minimalną kompletność danych przed dopuszczeniem jednostki do generowania.
- Zdefiniować deduplikację: klucz/strategia wyszukania kandydata, rozstrzyganie homonimii i polisemii, scalanie bez gubienia powiązań.
- Ustalić źródło i status danych: proponowane, zweryfikowane, gotowe do nauki, zablokowane (nazwy statusów do uzgodnienia z istniejącymi schematami).
- Ustalić powiązanie importowanych jednostek z użytkownikiem, kolejką nowych pozycji i ewentualnym stanem FSRS.

**Rezultat:** kontrakt dodawania/importu i model repozytorium leksykalnego; w razie braku istniejących dokumentów: `lexical_repository.md`, `lexical_import_rules.md` i odpowiednie schematy JSON.

**Kryterium ukończenia:** dodanie frazy lub słowa o kilku znaczeniach tworzy prawidłowe jednostki, ponowny import nie generuje niekontrolowanych duplikatów, a jednostka ma jednoznaczny status gotowości do generowania.

### P0.2. Kanoniczny model ćwiczenia

**Cel:** jeden trwały obiekt ćwiczenia obsługiwany przez generator, repozytorium, UI, checker, FSRS i ocenę gramatyczną.

**Prace:**

- Zweryfikować/ustalić schemat ćwiczenia i jego powiązanie z docelowym `LexicalSense`/jednostką FSRS.
- Zdefiniować treść i kontekst, fragment uzupełniany, rozwiązanie wzorcowe, akceptowane odpowiedzi oraz zasady ich normalizacji.
- Ująć cele gramatyczne i identyfikatory wariantów taksonomii, wersję taksonomii, a także metadane dotyczące wyboru dokonanego przez użytkownika.
- Zapewnić **`success_checks_by_answer_key`**: dla każdego zaakceptowanego rozwiązania gotową mapę wariantów rzeczywiście potwierdzanych jego użyciem; samo pole „cel ćwiczenia” nie wystarcza.
- Ustalić tożsamość ćwiczenia jako treści oraz osobną tożsamość **prezentacji/wystąpienia** ćwiczenia.
- Określić wersję generatora, status jakości, możliwość wycofania i poprawy zadania oraz zachowanie istniejących powiązań.
- Uzgodnić zakres typów ćwiczeń: jeśli aplikacja pozostaje przy wpisywaniu odpowiedzi cloze, nie projektować nieużywanych typów wyboru.

**Rezultat:** `exercise.schema.json` (jeśli jeszcze nie ma) i jednoznaczny kontrakt generowania/odczytu ćwiczenia.

**Kryterium ukończenia:** każde ćwiczenie ma wystarczające dane do prezentacji, deterministycznego sprawdzenia, zbudowania wejścia dla agenta i poprawnej aktualizacji profilu po zaakceptowanym rozwiązaniu.

### P0.3. Proces generowania, walidowania i zapisywania ćwiczeń

**Cel:** AI produkuje gotowe, przechowywane ćwiczenia dla wskazanych jednostek i priorytetów gramatycznych.

**Prace:**

- Uzgodnić wejście generatora: lista jednostek/znaczeń, profil, taksonomia, reguły, zamierzone konteksty i limity.
- Zweryfikować `generation_rules.md` pod kątem zgodności z modelem ćwiczenia, w szczególności map poprawnych rozstrzygnięć dla każdej odpowiedzi.
- Ustalić format wyniku, walidację strukturalną i językową oraz politykę powtórzenia/odrzucenia błędnego wyniku AI.
- Określić wykrywanie zduplikowanych lub prawie identycznych ćwiczeń.
- Zdefiniować zapis do bazy, powiązania z jednostkami leksykalnymi, statusem publikacji i wersją użytej taksonomii.
- Rozstrzygnąć generowanie dla nowych jednostek i generowanie nowych realizacji istniejącej jednostki przed powtórką.

**Rezultat:** kontrakt procesu `generate → validate → persist` i testy jakości; osobny `exercise_generation_pipeline.md` tylko jeśli brakuje tych zasad.

**Kryterium ukończenia:** z zadanej listy jednostek AI zapisuje zestaw poprawnych, jednoznacznie opisanych zadań, a błędne nie trafiają do aktywnego zasobu.

### P0.4. Integracja FSRS z jednostką leksykalną

**Cel:** każda ocenialna prezentacja dostarcza właściwemu obiektowi FSRS zdarzenie uczenia, a harmonogram zwraca jednostki do powtórki.

**Prace:**

- Potwierdzić klucz jednostki FSRS i zależność od `LexicalSense`, nie od konkretnego ćwiczenia.
- Wybrać/zweryfikować wersję implementacji FSRS i sposób przechowywania stanu.
- Określić inicjalizację nowego materiału, oceny odpowiedzi i mapowanie wyniku ćwiczenia na wejście FSRS.
- Uzgodnić, jak działają pierwsza próba, późniejsza poprawa tej samej prezentacji, wielokrotna prezentacja jednostki oraz pominięcie zadania.
- Określić zachowanie dla odpowiedzi odrzuconej przez checker, ale uznanej za dopuszczalną przez AI — osobno względem stanu FSRS i diagnozy gramatycznej.
- Ustalić reguły dat, terminów i priorytetów przy zaległych powtórkach.

**Rezultat:** `fsrs_integration.md` lub zweryfikowana istniejąca specyfikacja i testowe sekwencje zmian stanu.

**Kryterium ukończenia:** kilka różnych ćwiczeń dotyczących tego samego znaczenia aktualizuje jeden właściwy stan FSRS; nie występuje podwójne naliczanie prób w jednej prezentacji.

### P0.5. Algorytm doboru materiału i składania paczek po 20

**Cel:** system wybiera w sposób jednoznaczny ćwiczenia do bieżącej sesji.

**Prace:**

- Zdefiniować źródła kandydatów: jednostki z powtórką wymaganą przez FSRS i nowe, nieprezentowane ćwiczenia.
- Ustalić priorytety zaległych powtórek, zasady ograniczania wprowadzania nowego materiału i postępowania przy niedoborze ćwiczeń.
- Określić, jak dobierać z repozytorium konkretną realizację jednostki (nie mylić wyboru jednostki z wyborem zdania).
- Określić kolejność w paczce, unikanie nadmiernego zagęszczenia tego samego znaczenia lub struktury, reguły rezerwacji i prezentacji.
- Ustalić, kiedy nowa jednostka otrzymuje stan FSRS i kiedy ćwiczenie przestaje być „nieprezentowane”.
- Rozstrzygnąć niepełną paczkę, zaległe sesje, powtórzenie już przydzielonego zadania i konflikt dostępu.

**Rezultat:** `learning_selection.md` i kontrakt `build_batch(20)`.

**Kryterium ukończenia:** paczka zawiera 20 prawidłowo wybranych ćwiczeń, o ile tyle dostępnych; reguły zapobiegają utracie powtórek i przypadkowemu wielokrotnemu przydziałowi tego samego wystąpienia.

### P0.6. Sesja uczenia, odpowiedź i aktualizacja stanu

**Cel:** pełen przebieg pojedynczego ćwiczenia i paczki jest jednoznaczny oraz odporny na przerwania.

**Prace:**

- Zdefiniować zdarzenia: utworzenie paczki, pokazanie zadania, pierwsza odpowiedź, wynik wstępny, diagnoza AI (gdy potrzebna), informacja zwrotna, kolejne próby, zakończenie lub porzucenie.
- Zdefiniować wejście/wyjście checkera i przekazywanie zaakceptowanego klucza rozwiązania.
- Zweryfikować kontrakt wejścia/wyjścia `evaluation_rules.md` oraz końcowy `profile_update.md`.
- Rozdzielić aktualizację FSRS od aktualizacji kompetencji; nie blokować całej sesji bez potrzeby przy niedostępności pojedynczej diagnozy.
- Zapewnić identyfikatory zdarzeń, prezentacji i prób, idempotencję oraz bezpieczne ponowienia.
- Określić stan sesji po ponownym uruchomieniu aplikacji, niedokończonym zadaniu, błędzie połączenia i chwilowym braku AI.
- Ustalić podstawową informację zwrotną dla użytkownika, w szczególności poprawną odpowiedź i wyjaśnienie błędu.

**Rezultat:** `learning_flow.md`, kontrakt zdarzeń i zestaw testów scenariuszowych.

**Kryterium ukończenia:** każda pierwsza odpowiedź powoduje co najwyżej jedną aktualizację odpowiednich stanów, kolejne próby nie podwajają oceny, a przerwana sesja może być wznowiona bez utraty danych.

### P1.1. Domknięcie oceniania gramatycznego

**Cel:** wynik AI i aktualizacja profilu są zgodne z taksonomią, schematem i zdarzeniem.

**Prace:**

- Odebrać i zweryfikować końcowy `profile_update.md` przygotowywany w Work.
- Potwierdzić zgodność kontraktu JSON agenta z walidatorem wyników i algorytmem aktualizacji.
- Potwierdzić aktualny `profile.schema.json` 1.3.0 oraz `evaluation_config.json` (priory, wagi, progi, EMA, trudności).
- Zweryfikować semantykę `correct`, `incorrect`, `not_assessable`, `direct`, `indirect`, `acceptable_alternative` i `cannot_evaluate` na przykładach włoskich.
- Przetestować powiązane/kontrastowe warianty, poprawne alternatywy, literówki, błędy znaczeniowe i brak wystarczających danych.
- Zdefiniować tryb korekty źle ocenionego zdarzenia bez podwójnej aktualizacji.

**Rezultat:** zestaw wzorcowych wejść/wyjść agenta i testy przejść profilu.

**Kryterium ukończenia:** profil aktualizuje się prawidłowo dla sukcesów obsłużonych deterministycznie oraz dla obserwacji `correct`/`incorrect` zwróconych przez AI; wynik nieweryfikowalny nie zmienia parametrów kompetencji.

### P1.2. Polityka zapasu i cykl życia ćwiczeń w bazie

**Cel:** baza ma stale odpowiedni zasób wartościowych ćwiczeń, a materiał wadliwy jest kontrolowany.

**Prace:**

- Ustalić minimalny zapas zadań dla nowych jednostek i jednostek zbliżających się do terminu powtórki.
- Wyznaczyć zdarzenia wyzwalające kolejne generowanie (np. niedobór zapasu, nowe jednostki, zmiana priorytetów gramatycznych).
- Określić statusy ćwiczeń: kandydat, zatwierdzone, dostępne, wycofane oraz politykę zmian po prezentacji.
- Ustalić okres użyteczności ćwiczenia wobec zmienionego profilu lub taksonomii.
- Zapobiec duplikatom i nadmiernej powtarzalności zdań/kontekstów.

**Rezultat:** `exercise_repository.md` lub uzupełnienie schematu i procesu generowania.

**Kryterium ukończenia:** system wykrywa niedobór zadań, może go uzupełnić i nie prezentuje wycofanego lub wadliwego ćwiczenia.

### P1.3. Adaptacyjne generowanie oparte na profilu gramatycznym

**Cel:** nowe ćwiczenia systematycznie adresują rozpoznane braki, nie zmieniając funkcji FSRS.

**Prace:**

- Określić politykę wyboru celów gramatycznych na podstawie `mastery`, `confidence`, `trend`, `difficulties`, pokrycia wariantów i ich relacji.
- Uwzględnić sytuacje początkowe, gdy większość kompetencji nie została jeszcze oceniona.
- Zdefiniować różnorodność kontekstów i stopniowanie złożoności przy tej samej jednostce leksykalnej.
- Rozróżnić ćwiczenia diagnostyczne, naprawcze, utrwalające i eksploracyjne, jeśli taka klasyfikacja jest użyteczna.
- Ustalić, jak priorytety gramatyczne wpływają na **przyszłą generację**, ale nie nadpisują terminów powtórek FSRS.
- Określić zachowanie, gdy wymagania leksykalne i gramatyczne nie dają się połączyć w naturalne zadanie.

**Rezultat:** `adaptive_generation.md` lub rozszerzenie istniejących `generation_rules.md`.

**Kryterium ukończenia:** dwa różne profile prowadzą do uzasadnionych różnic w doborze struktur przyszłych ćwiczeń przy tej samej liście słów, bez generowania sztucznych przykładów.

### P1.4. Okresowa analiza postępów przez AI

**Cel:** analiza wzorców postępów wpływa na plan kolejnego materiału ponad pojedynczą obserwacją.

**Prace:**

- Ustalić moment uruchamiania analizy (np. po określonej liczbie paczek lub na żądanie), bez zakładania stałej wartości przed decyzją.
- Zdefiniować wejście: aktualny profil, statystyki zagregowane, trudności, pokrycie taksonomii, ewentualne próbki błędów potrzebne do analizy.
- Określić wynik: uporządkowane cele, hipotezy o systematycznych problemach, zalecane kontrasty i rodzaje kontekstów oraz ograniczenia diagnozy.
- Rozstrzygnąć, gdzie zapisywać raport/zalecenia i jak długo obowiązują.
- Ustalić jak zalecenia są łączone z zasadami generowania i kiedy tracą ważność.
- Zabezpieczyć przed bezpośrednią, niekontrolowaną zmianą parametrów profilu przez raport okresowy.

**Rezultat:** `progress_analysis.md`, schemat raportu i instrukcja agenta analizującego postępy.

**Kryterium ukończenia:** raport wskazuje konkretne warianty i działania generacyjne, a generator potrafi je wykorzystać w następnych zadaniach.

### P1.5. Zasady progresji i pomiar pokrycia materiału

**Cel:** rozwój trudności jest kontrolowany, szczególnie przy małej liczbie obserwacji.

**Prace:**

- Zdefiniować dobór nowych struktur na podstawie poziomu referencyjnego, hierarchii i relacji taksonomii, bez uznawania CEFR wariantu za wynik użytkownika.
- Ustalić zasady eksploracji słabo obserwowanych kompetencji i utrwalania tych już opanowanych.
- Rozstrzygnąć metodę okresowego szacowania `estimated_user_level`, jeżeli to pole ma być aktualizowane automatycznie.
- Ustalić mierniki pokrycia leksyki, wariantów gramatycznych i różnorodności kontekstów.

**Rezultat:** `progression_rules.md` i testy scenariuszy startu, postępu i regresji.

**Kryterium ukończenia:** aplikacja potrafi rozstrzygnąć, co wprowadzać przy braku danych, a czego nie uznawać za opanowane mimo niewielkiej liczby sukcesów.

### P1.6. Integralność danych i migracje

**Cel:** aktualizacje taksonomii, ćwiczeń i jednostek nie uszkadzają postępów.

**Prace:**

- Zweryfikować spójność identyfikatorów i referencji: jednostka → znaczenie → ćwiczenie → prezentacja → obserwacja → stan nauki.
- Zdefiniować procedury korekty lub scalenia `LexicalItem`/`LexicalSense` przy istniejącym FSRS.
- Zdefiniować skutki zmiany taksonomii i schematu profilu; nie zakładać automatycznego przeniesienia ocen między innymi wariantami.
- Ustalić zachowanie starych ćwiczeń i raportów powiązanych ze starszą wersją taksonomii.
- Przyjąć reguły transakcji, niezmienności zdarzeń, backupu i odtwarzania.

**Rezultat:** kontrakt integralności/migracji i testy odtwarzania stanu.

**Kryterium ukończenia:** korekta jednostki lub wersji taksonomii nie powoduje cichego przypisania stanu nauki do innego znaczenia czy wariantu.

### P2.1. Interfejs do zarządzania materiałem i nauki

**Cel:** wszystkie operacje z pełnego cyklu są dostępne użytkownikowi.

**Prace:** dodawanie/import i przegląd jednostek; edycja analiz AI; podgląd ćwiczeń; sesja 20 zadań; informacja zwrotna; widok kolejki; postęp leksykalny i gramatyczny; obsługa wadliwych ćwiczeń i ręcznych korekt.

**Kryterium ukończenia:** użytkownik może od importu frazy przejść przez naukę i powtórkę, a także zweryfikować, dlaczego system ponownie ją prezentuje.

### P2.2. Obserwowalność, koszty i jakość AI

**Cel:** koszty i błędy modeli są kontrolowane.

**Prace:** wersjonowanie instrukcji agentów, walidacja odpowiedzi JSON, logowanie przyczyn odrzucenia, monitorowanie kosztu generacji/diagnozy/analizy, testy regresji na stałych przykładach, zbiór przypadków problematycznych.

**Kryterium ukończenia:** można odtworzyć przyczynę konkretnej decyzji diagnostycznej oraz zidentyfikować wersję reguł i modelu.

## 5. Zależności i sugerowana kolejność

| Etap | Co domknąć | Od czego zależy | Wynik |
|---|---|---|---|
| 1 | Model `LexicalItem` / `LexicalSense`, dodawanie i import | Istniejący model pojęciowy | Jednostki gotowe do nauki |
| 2 | Kanoniczny model ćwiczenia | Etap 1, taksonomia | Kompletny kontrakt zadania |
| 3 | Generowanie, walidacja i repozytorium | Etapy 1–2, `generation_rules.md` | Ćwiczenia w bazie |
| 4 | Integracja FSRS | Etap 1, definicja zdarzeń | Harmonogram jednostek |
| 5 | Dobór i paczki po 20 | Etapy 3–4 | Gotowa sesja |
| 6 | Sprawdzanie i aktualizacja profilu | Etapy 2, 5; finalne `evaluation_rules.md`, `profile_update.md` | Wiarygodny stan po odpowiedzi |
| 7 | Adaptacyjne generowanie | Etapy 3, 6 | Lepsze kolejne ćwiczenia |
| 8 | Okresowa analiza postępów | Etapy 6–7 | Cele korekcyjne dla generatora |
| 9 | Progresja, migracje, interfejs i testy systemowe | Wszystkie potrzebne kontrakty | System gotowy do stałego użycia |

Etapy 3 i 4 można prowadzić równolegle po zamknięciu wymaganych modeli. Nie należy czekać na analizę okresową, aby przetestować podstawowy cykl uczenia.

## 6. Testy akceptacyjne całego cyklu

Minimum scenariuszy end-to-end:

1. **Nowe słowo:** dodaj → rozpoznaj znaczenie → zapisz → wygeneruj ćwiczenie → umieść w paczce → odpowiedz → zainicjalizuj/zmień właściwy stan nauki.
2. **Fraza wielowyrazowa:** import → rozpoznaj jako jednostkę → deduplikuj → wygeneruj naturalne zdanie.
3. **Wieloznaczność:** dwa znaczenia jednego wyrazu pozostają oddzielnymi jednostkami nauki i nie dzielą bez podstaw jednego stanu FSRS.
4. **Poprawna pierwsza odpowiedź:** checker akceptuje odpowiedź → właściwe `success_checks` aktualizują odpowiednie kompetencje → bez agenta.
5. **Poprawna alternatywa odrzucona przez checker:** agent klasyfikuje odpowiedź jako dopuszczalną i zwraca odpowiednie obserwacje → profil aktualizuje się tylko na podstawie tych obserwacji.
6. **Błąd gramatyczny:** agent przypisuje błąd właściwemu wariantowi, także gdy wymaga rozróżnienia relacji kontrastowych → pojawia się lub aktualizuje właściwa trudność.
7. **Błąd leksykalny bez gramatycznego:** agent nie obniża dowolnych kompetencji gramatycznych.
8. **Nieocenialna odpowiedź:** brak fikcyjnej aktualizacji `mastery` i `confidence`.
9. **Druga próba tej samej prezentacji:** brak drugiego naliczenia obserwacji.
10. **Powtórka:** FSRS wskazuje tę samą jednostkę, ale system może wybrać jej inną poprawną realizację zdaniową.
11. **Paczka 20:** prawidłowe połączenie powtórek i nieprezentowanych ćwiczeń bez duplikowania wystąpień.
12. **Brak zapasu:** system identyfikuje niedobór ćwiczeń i ma jednoznaczną politykę uzupełnienia lub zwrotu krótszej paczki.
13. **Zmiana priorytetów gramatycznych:** nowe ćwiczenia ukierunkowane na zdiagnozowaną trudność; harmonogram FSRS nie jest samowolnie zmieniany.
14. **Niedokończona sesja:** wznowienie zachowuje tożsamość prezentacji i nie podwaja aktualizacji.
15. **Powtórzenie zdarzenia po awarii:** stan profilu, FSRS i ledgera pozostaje idempotentny.
16. **Zmiana taksonomii lub scalenie znaczeń:** system nie łączy cicho niezgodnych tożsamości i stanów.

## 7. Definicja ukończenia pełnego cyklu (Definition of Done)

Projekt merytoryczny pełnego cyklu jest domknięty, jeżeli:

- [ ] Można dodać słowo lub frazę do repozytorium, wraz z prawidłowym rozpoznaniem jednostek i znaczeń.
- [ ] Każda jednostka dopuszczona do nauki ma jednoznaczną tożsamość i status.
- [ ] Generator otrzymuje listę jednostek, profil i taksonomię oraz zapisuje zwalidowane ćwiczenia do bazy.
- [ ] Każde ćwiczenie zawiera komplet informacji wymaganych przez checker i obie ścieżki oceny gramatycznej.
- [ ] FSRS operuje na właściwej jednostce leksykalnej, nie na pojedynczym zadaniu.
- [ ] Selektor składa paczki po 20 z powtórek i ćwiczeń nowych według jawnej polityki.
- [ ] Każde zdarzenie odpowiedzi jest obsługiwane najwyżej raz dla danego wystąpienia.
- [ ] Poprawne odpowiedzi obsługiwane są deterministycznie; odrzucone odpowiedzi mogą uzyskać diagnozę agenta.
- [ ] Profil gramatyczny jest aktualizowany zgodnie z taksonomią, schematem i konfiguracją, bez nieuzasadnionych ocen.
- [ ] Po pewnym okresie nauki można wygenerować raport trendów i trudności oraz użyć go do planowania nowych ćwiczeń.
- [ ] Adaptacja wpływa na generowanie ćwiczeń, pozostając oddzielona od harmonogramu FSRS.
- [ ] Przetestowano przypadki alternatywnych rozwiązań, awarii, powtórzeń zdarzeń i zmian danych.

## 8. Najbliższe decyzje i działania

**Najpierw:** (1) sprawdzić dostępność i kompletność schematów `LexicalItem`/`LexicalSense`, (2) zamknąć proces dodawania słów/fraz, (3) zweryfikować model ćwiczenia wraz z `success_checks_by_answer_key`. Równolegle można odebrać końcowy `profile_update.md` i zweryfikować jego kontrakt z agentem.

**Następnie:** zamknąć FSRS i dobór paczek po 20; wykonać pełny test od nowej jednostki do pierwszej powtórki.

**Dopiero potem:** domknąć adaptacyjne generowanie i okresową analizę postępów jako pętlę sterującą kolejnymi ćwiczeniami.

**Uwaga:** nazwy proponowanych dokumentów to organizacja prac, a nie obowiązek tworzenia wielu plików. Liczą się jednoznaczne, niesprzeczne kontrakty i testowalny cykl.
