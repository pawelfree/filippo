# Statystyki nauki FSRS

Status: active
Created: 2026-10-26

## 📝 TLDR

Uczący się widzi obecnie liczbę należnych powtórek i nowych znaczeń, ale nie może ocenić postępu ani obciążenia nauką w czasie. Proponowany ekran statystyk pokaże historię ocen, skuteczność zapamiętywania, kalendarz już zaplanowanych powtórek oraz rozkłady trudności, stabilności i prawdopodobieństwa przypomnienia na podstawie zapisanych danych FSRS. Symulacja przyszłych ocen należy do [osobnej specyfikacji](2026-10-26-fsrs-future-review-simulation.md).

## 📝 Problem Statement

Obecny ekran Nauka pokazuje tylko bieżącą pracę. `FsrsState`, `FsrsReview` i `StudyAttempt` zapisują stan, terminy oraz historię ocen, ale użytkownik nie ma widoku ich zagregowanych wyników. Miary muszą odróżniać faktycznie zapisane terminy od hipotez oraz formalne oceny od dodatkowych utrwaleń.

## 📝 Intended Behavior and Scope

- Jeden ekran statystyk nauki, zgodny z obecnym stylem aplikacji, pokazuje liczbę powtórek, historię formalnych ocen, skuteczność zapamiętywania oraz rozkłady trudności, stabilności i prawdopodobieństwa przypomnienia.
- Rzeczywista skuteczność liczy pierwszą formalną ocenę danego znaczenia w każdym dniu: `Again` to niepowodzenie, `Hard`, `Good` i `Easy` to powodzenie. Lokalne utrwalenia nie wchodzą do tej miary.
- Kalendarz pokazuje zapisane terminy FSRS. Nie symuluje przyszłych ocen ani kolejnych terminów po nich.
- Dane pochodzą z istniejących zapisów FSRS. Ekran jest tylko do odczytu; nie ocenia znaczeń ani nie zmienia harmonogramu.
- Czas odpowiedzi pozostaje poza zakresem, ponieważ aplikacja go obecnie nie mierzy.

## 📝 Proposed Solution

Strona „Statystyki nauki” ma pięć czytelnych części. Podsumowanie pokazuje liczbę znaczeń rozpoczętych, nowych i należnych teraz. Historia pokazuje liczby ocen Again, Hard, Good i Easy według dni. Rzeczywista skuteczność pokazuje liczbę udanych pierwszych formalnych ocen znaczenia w dniu, liczbę prób i ich iloraz. Kalendarz pokazuje jeden zapisany termin na każdą rozpoczętą kartę. Ostatnia część pokazuje rozkłady trudności, stabilności i prawdopodobieństwa przypomnienia.

Domyślny zakres historii to 30 dni; można wybrać 7, 30, 90 dni lub całą historię. Wszystkie dni liczy strefa Europe/Warsaw. Kalendarz ma osobny licznik zaległych znaczeń i 30 kolejnych dni zapisanych terminów. Nie zakłada przyszłych ocen ani dalszych terminów po nich. Symulacja to [odrębna funkcja](2026-10-26-fsrs-future-review-simulation.md).

W [Anki](https://docs.ankiweb.net/manual/stats) historia, true retention, przyszłe terminy i miary pamięci są wyraźnie rozdzielone; pierwsza ocena karty w dniu decyduje o true retention. [Mnemosyne](https://mnemosyne-proj.org/features) również rozdziela harmonogram i retencję. Filippo może pominąć talie, filtry i czas odpowiedzi: nie gromadzi takich danych i ma jednego uczącego się.

## 📝 Architecture

Backendowa usługa statystyk korzysta z istniejącego PrismaService, FsrsService i przypiętej biblioteki ts-fsrs. Odczytuje FsrsReview jako źródło formalnych ocen; StudyAttempt rozróżnia rodzaj oceny i lokalne utrwalenia. Bezpośrednio zapisany FsrsReview bez StudyAttempt nadal należy do ogólnej historii i skuteczności, ale nie do podziału na nowe i należne. Bieżące FsrsState są źródłem kalendarza i rozkładów. Jeden moment odczytu asOf i spójny widok bazy zapobiegają mieszaniu danych sprzed oceny i po niej.

Prawdopodobieństwo przypomnienia jest obliczane na moment asOf z pełnej zapisanej karty przez API zainstalowanego ts-fsrs i rewizję modelu powiązaną z kartą. Statystyki nie kopiują wzoru FSRS ani nie wywołują zapisu oceny. Karta bez ostatniej formalnej oceny nie otrzymuje sztucznego prawdopodobieństwa. Szacowana liczba obecnie pamiętanych znaczeń jest sumą prawdopodobieństw poszczególnych kart, oznaczoną jako szacunek.

Agregaty historii i terminów oraz obliczenia pamięci są dwoma niezależnymi odczytami. Każdy ma własny spójny moment asOf. Awaria lub niekompletna karta w części pamięci nie ukrywa historii i kalendarza.

## 📝 Data Model

Nie są potrzebne nowe encje ani migracja. Źródłami są LexicalSense, FsrsState, FsrsReview, StudyAttempt i FsrsConfigRevision. Dla obecnego pojedynczego uczącego się używany jest istniejący identyfikator local. FsrsReview nie ma własnego learnerId; przed dodaniem wielu uczących się statystyki będą wymagały jawnego zakresu danych. Funkcja nie zapisuje kopii wyników, danych osobowych ani dodatkowej historii.

## 📝 API Contracts

GET /api/study/statistics?history=30d jest odczytem z ograniczoną wartością history: 7d, 30d, 90d albo all. Nieznana wartość zwraca 400. Odpowiedź zawiera asOf, timeZone, summary, history, retention i scheduled. Każdy procent ma licznik i mianownik; przy mianowniku zero procent jest null. History zawiera dzienne liczby czterech formalnych ocen oraz osobną liczbę lokalnych utrwaleń. Retention zawiera wynik ogólny i osobny podzbiór należnych ocen, używany do porównania z docelową retencją FSRS. Bezpośredni FsrsReview bez powiązanego StudyAttempt nie trafia do podzbioru due, a jego liczba jest ujawniona. Scheduled zawiera zaległe, terminy jeszcze dziś, dni następnych 30 dni i terminy poza zakresem.

GET /api/study/statistics/memory, dodany w drugiej fazie, zwraca własne asOf, koszyki i liczebności dla trudności, stabilności oraz prawdopodobieństwa przypomnienia, a także sumę prawdopodobieństw jako szacowaną liczbę pamiętanych znaczeń. Błąd tego odczytu nie zmienia odpowiedzi pierwszego endpointu.

Pierwsza formalna ocena danego znaczenia w dniu Warszawy wchodzi do skuteczności: Again oznacza niepowodzenie, Hard/Good/Easy powodzenie. Przy remisie czasu rozstrzyga identyfikator zdarzenia. Wszystkie formalne oceny nadal są liczone w historii aktywności. Porównanie z docelową retencją dotyczy wyłącznie podzbioru due, ponieważ pierwsza prezentacja nowego znaczenia nie mierzy utrzymania pamięci.

## 📝 UI/UX

Strona jest dostępna z obszaru Nauka i kontynuuje nagłówek, typografię, paletę, karty i zachowanie mobilne istniejącego interfejsu. Krótkie objaśnienia przy każdej miarze mówią, co i w jakim zakresie jest liczone. Wykresy mają także tabelę lub liczby dostępne z klawiatury i dla czytnika ekranu; sam kolor nie rozróżnia ocen. Kalendarz nazywa się „Zaplanowane terminy” i pokazuje moment migawki. Część pamięci może pokazać własny błąd i własny czas odczytu bez zasłaniania pozostałych sekcji. Późniejsza symulacja otrzyma osobną sekcję z oznaczeniem „Scenariusz”, bez pustego miejsca przed jej wdrożeniem.

Przy braku ocen ekran nie pokazuje „0% skuteczności”, lecz „Brak danych”. Po resecie postępu następne wejście pokazuje stan pusty. Wybór zakresu aktualizuje historię i skuteczność; bieżące liczniki, zapisane terminy i rozkłady kart pozostają migawką chwili asOf.

## 📝 Edge Cases & Failure Scenarios

- Dwie formalne oceny jednego znaczenia w dniu zwiększają historię o dwa, ale skuteczność o jedną próbę. Lokalna próba utrwalająca nie zwiększa żadnej miary formalnej.
- Zaległy termin i termin później tego samego dnia nie są liczone podwójnie. Zmiana czasu letniego nie tworzy ani nie gubi dnia Warszawy.
- Brak kart, brak ocen w wybranym zakresie i brak terminów w horyzoncie mają odrębne stany puste.
- Niekompletna karta lub brak jej rewizji konfiguracji daje błąd sekcji pamięci z liczbą dotkniętych kart; aplikacja nie podstawia uproszczonego wzoru. Niezależne sekcje mogą pozostać widoczne.
- Błąd odczytu daje komunikat i ponowienie bez pokazywania częściowego wyniku jako kompletnego.

## 📝 Risks & Impact Review

Mała próba daje niestabilny procent, więc mianownik jest zawsze widoczny. Zapisane terminy mogą się zmienić po kolejnej ocenie; kalendarz jest migawką, a nie obietnicą obciążenia. Zmiana ustawień FSRS nie przestawia już zapisanych terminów, dlatego R obliczane z karty musi stosować jej rewizję konfiguracji. Czasu nauki nie można rzetelnie pokazać bez pomiaru czasu odpowiedzi. Wyłączenie tego ekranu nie wymaga migracji wstecznej, ponieważ jest tylko do odczytu.

## 📋 Phasing

1. Historia, skuteczność i kalendarz zapisanych terminów wraz z działającym ekranem.
2. Rozkłady stanu pamięci i prawdopodobieństwo przypomnienia na tym samym ekranie.

## 📋 Implementation Plan

### Phase 1 — faktyczna historia i terminy

1. Dodać agregaty formalnych ocen i pierwszej formalnej oceny znaczenia na dzień Warszawy. Test z SQLite obejmuje kilka ocen jednego dnia, lokalne utrwalenie, granicę dnia i brak historii.
2. Dodać migawkę liczników i koszyków aktualnych terminów FsrsState. Test obejmuje zaległości, termin jeszcze dziś, kolejne dni, strefę Warszawy i reset postępu.
3. Udostępnić ograniczony parametr zakresu historii oraz ekran z podsumowaniem, wykresami i dostępnymi tabelami. Sprawdzić szeroki i wąski układ oraz pustą bazę.

### Phase 2 — stan pamięci

4. Odtworzyć pełne karty i obliczać R z właściwą rewizją konfiguracji przez API ts-fsrs; agregować rozkłady. Test porównuje wynik z biblioteką, obejmuje zmianę konfiguracji i wadliwą kartę.
5. Dodać rozkłady i szacowaną liczbę pamiętanych znaczeń z objaśnieniami, mianownikami i stanem błędu danych. Sprawdzić dostępność i wykluczenie nieuczonego znaczenia.

## Acceptance Criteria

- [ ] Użytkownik otwiera ekran w stylu Filippo i widzi miary z objaśnieniem, zakresem czasu, mianownikiem i stanem pustym.
- [ ] Historia pokazuje formalne oceny według dni; lokalne utrwalenia są oddzielone.
- [ ] Skuteczność liczy najwyżej pierwszą formalną ocenę znaczenia w dniu Warszawy; tylko wynik due jest porównywany z docelową retencją.
- [ ] Kalendarz pokazuje bieżące zapisane terminy, osobno zaległości i przyszłość, bez symulowania kolejnych terminów.
- [ ] Trudność i stabilność pochodzą z kart; R jest obliczane przez bibliotekę na chwilę odczytu z rewizją karty. Suma R jest pokazana jako szacowana liczba pamiętanych znaczeń.
- [ ] Odczyt nie zmienia FSRS; po ocenie lub resecie kolejny odczyt pokazuje nowy stan.
- [ ] Wykresy mają dostępne odpowiedniki liczbowe, a brak historii nie jest przedstawiany jako 0% skuteczności.

## Open Questions

Brak blokujących dla tej specyfikacji. Użytkownik wybrał osobną specyfikację symulacji oraz skuteczność z pierwszej formalnej oceny znaczenia w dniu.

## Related Records

- [Ekran Nauka](implemented/2026-10-26-study-screen.md)
- [Integracja FSRS](implemented/2026-10-26-fsrs-integration.md)
- [Symulacja przyszłych powtórek](2026-10-26-fsrs-future-review-simulation.md)
