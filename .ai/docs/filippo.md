# Opis merytoryczny aplikacji do nauki języka włoskiego

## 1. Cel i zakres

Aplikacja pomaga uczyć się włoskich słów i wyrażeń w zdaniach. Celem aplikacji jest **czynne użycie** znaczenia przez uzupełnianie brakujących elementów włoskiego zdania. Użytkownik wpisuje tylko elementy, których się uczy, a nie całe zdanie. **FSRS** planuje powtórki ich konkretnych znaczeń (LexicalSense). **Profil gramatyczny** szacuje stopień opanowania struktur gramatycznych i pomaga dobierać kontekst zdań generowanych dla ćwiczonych słów i wyrażeń. Gramatyka nie jest osobnym rodzajem ćwiczenia. Nowe znaczenia wprowadza się zgodnie z wyborem użytkownika: może wskazać konkretny sens albo liczbę nieuczonych sensów.

Materiałem ćwiczeniowym są zdania lub krótkie konteksty z lukami obejmującymi ćwiczone elementy. Zdanie nie jest samo w sobie tożsame ani ze słowem, ani z regułą gramatyczną. Uzupełnienie luk może jednocześnie sprawdzać przypomnienie znaczenia wyrazu, dobór formy i użycie konstrukcji. Aby wyniki były interpretowalne, każde zadanie powinno mieć wskazany **główny cel sprawdzania** i opis pozostałych zjawisk, które mogą mieć wpływ na odpowiedź.

Opis określa znaczenie pojęć i przebieg nauki, bez rozstrzygania technologii, struktury bazy danych, formatów komunikatów czy szczegółów interfejsu.

## 2. Model pojęciowy słownictwa

### 2.1. LexicalItem: jednostka leksykalna

**LexicalItem** jest rozpoznawalną jednostką słownika, do której można przypisać jedno lub więcej znaczeń. Może nią być pojedynczy leksem, wyrażenie wielowyrazowe, czasownik z przyimkiem, utrwalony zwrot albo idiom. Jej granicę wyznacza to, czy użytkownik ma nauczyć się traktować całość jako jednostkę o własnej formie i zachowaniu, a nie wyłącznie jako przypadkową sumę sąsiadujących słów.

Przykłady:

- `banca` jako leksem rzeczownikowy;
- `andare` jako leksem czasownikowy, niezależnie od jego poszczególnych form odmiany;
- `prendere una decisione` jako osobna jednostka wielowyrazowa, a nie tylko użycie `prendere`;
- `avere bisogno di` jako jednostka wielowyrazowa o właściwej jej łączliwości;
- `in bocca al lupo` jako utrwalona formuła, której nie należy redukować do oddzielnych kart dla każdego słowa.

Zapis widoczny w zdaniu jest **wystąpieniem formy** jednostki. `vado`, `andavo` i `andrei` są formami powiązanymi z `andare`, lecz nie muszą być trzema LexicalItem. Rozróżnienie form ma znaczenie przy analizie odpowiedzi: błąd w `andrei` może świadczyć o problemie z trybem warunkowym, mimo że użytkownik zna sens `andare`.

### 2.2. LexicalSense: konkretne znaczenie lub użycie

**LexicalSense** oznacza jedno rozróżnialne znaczenie LexicalItem, uwzględniające kontekst, typowe połączenia i ograniczenia użycia. Jeden LexicalItem może mieć wiele LexicalSense. Sam fakt rozpoznania formy wyrazu nie dowodzi znajomości wszystkich jego znaczeń.

Przykładowo `banca` może oznaczać instytucję finansową; znaczenie konkretnego wyrażenia z tym wyrazem trzeba oceniać w jego kontekście. `Prendere una decisione` jest osobnym LexicalItem względem `prendere`, a „podjąć decyzję” jest jego LexicalSense. Poprawne użycie samego `prendere` nie dowodzi opanowania tego wyrażenia. `Prendere il treno` również byłoby osobnym LexicalItem, gdyby znalazło się w materiale do nauki; klasyfikacja wyrażenia nie przesądza o jego włączeniu do materiału.

LexicalSense może wiązać się z typową konstrukcją gramatyczną, ale nie jest nią samą. Znaczenie `avere bisogno di` obejmuje potrzebę, natomiast wymaganie przyimka `di` jest jednocześnie cechą konstrukcji, której poprawność może być analizowana odrębnie.

### 2.3. Relacje i granice pojęć

| Pojęcie | Na jakie pytanie odpowiada? | Przykład |
| --- | --- | --- |
| LexicalItem | Jaką jednostkę języka rozpoznajemy? | `prendere una decisione` |
| LexicalSense | Które jej znaczenie lub użycie? | „podjąć decyzję” jako znaczenie `prendere una decisione` |
| Forma lub wystąpienie | Jak jednostka została zrealizowana tutaj? | `prendo` w konkretnym zdaniu |
| Struktura gramatyczna | Jaki mechanizm tworzy lub ogranicza wypowiedź? | użycie czasu *passato prossimo* |
| Zadanie | Co użytkownik ma zrobić w danym kontekście? | uzupełnić brakującą formę w zdaniu |
| Jednostka FSRS | Pamięć czego dokładnie jest harmonogramowana? | LexicalSense słowa lub wyrażenia |

Relacja między LexicalItem a LexicalSense jest zasadniczo „jedna jednostka — wiele znaczeń”. Zadanie dotyczy określonego sensu słowa lub wyrażenia i umieszcza je w kontekście gramatycznym. Jeden sens może występować w różnych zadaniach w kolejnych sesjach; jego powtórki korzystają z jednego stanu FSRS. Profil gramatyczny opisuje kontekst, a nie osobną jednostkę powtórek.

Warto rozróżniać również **bierne rozpoznanie** i **czynne użycie**. Odczytanie włoskiego zdania i samodzielne uzupełnienie ćwiczonych elementów to różne działania poznawcze. Sukces w jednym jest przesłanką, lecz nie dowodem opanowania drugiego.

## 3. Zadanie i jednostka pamięci FSRS

**Ćwiczenie lub zadanie** to materiał przygotowany na potrzeby konkretnego pokazania użytkownikowi: kontekst zdania, luki w ćwiczonych elementach, polecenie, oczekiwany zakres odpowiedzi, dopuszczalne warianty oraz opis ćwiczonego sensu i użytego kontekstu gramatycznego. Nie ma puli gotowych zadań czekających na użycie. Użytkownik odpowiada tylko w lukach. Luki obejmują całe ćwiczone wyrażenie w formie wymaganej przez kontekst, także gdy jego składniki są rozdzielone innymi słowami i wymagają kilku luk. Użytkownik dobiera również odmianę wynikającą z czasu, trybu i innych cech zdania. Celem nauki pozostaje czynne użycie znaczenia słowa lub wyrażenia.

Stan **FSRS** należy do LexicalSense, a nie do całego LexicalItem, kategorii gramatycznej czy tekstu pojedynczego zadania. FSRS planuje powtórki czynnego użycia sensu w uzupełnianych elementach. Stopień opanowania struktur gramatycznych opisuje osobny profil gramatyczny.

Zmiana treści zadania nie tworzy nowej jednostki FSRS, jeśli nadal sprawdza ten sam LexicalSense. Zadanie, które zmienia sprawdzany sens, nie może być traktowane jako dalsze sprawdzenie poprzedniego sensu. Historia odpowiedzi pozostaje powiązana z materiałem faktycznie pokazanym użytkownikowi.

Jedno zadanie może dostarczyć **wielu sygnałów diagnostycznych** do aktualizacji profilu gramatycznego, ale wynik powtórkowy dotyczy ćwiczonego LexicalSense. Błąd w uzupełnieniu ćwiczonego wyrażenia obniża jego ocenę powtórkową; waga błędu może zależeć od oceny AI. Profil gramatyczny przechowuje oszacowanie opanowania struktur, a nie listę popełnionych błędów.

## 4. Hierarchiczna taksonomia gramatyczna

Taksonomia porządkuje zjawiska od ogólnych obszarów do sprawdzalnych, konkretnych użyć:

1. **Kategoria gramatyczna** — szeroki obszar, np. czas i aspekt, tryb i modalność, składnia zdania, zaimki, determinacja, przyimki, zgodność, szyk, struktura informacji.
2. **Struktura** — rozpoznawalny mechanizm w obrębie kategorii, np. okres warunkowy, zaimki dopełnienia bliższego, wybór *passato prossimo* i *imperfetto*.
3. **Podstruktura** — istotne rozróżnienie mechanizmu, np. okres warunkowy realny wobec hipotetycznego; umieszczenie zaimka przy formie osobowej wobec bezokolicznika.
4. **Konkretne użycie** — sytuacja, w której reguła działa i którą można osobno obserwować, np. opowiadanie o tle trwającej sytuacji przy użyciu *imperfetto* albo wyrażenie hipotetycznej teraźniejszości w konstrukcji `se + congiuntivo imperfetto, condizionale presente`.

Przykładowa ścieżka: **tryb i modalność → okresy warunkowe → warunek hipotetyczny dotyczący teraźniejszości → `Se avessi tempo, partirei.`**. Drugą ścieżką może być **czas i aspekt → opowiadanie o przeszłości → tło i zdarzenie punktowe → `Mentre studiavo, è arrivato Marco.`**. Ostatni poziom jest opisem użycia, nie sztywną listą zdań: wiele zdań może realizować ten sam przypadek.

Hierarchia umożliwia zarówno szczegółową diagnozę, jak i ostrożne podsumowanie. Nie należy jednak utożsamiać powodzenia w jednej podstrukturze z opanowaniem całej kategorii. Relacja rodzic–dziecko oznacza porządek pojęciowy, nie automatyczne przeniesienie wyniku. Poza główną hierarchią potrzebne są **powiązania przekrojowe**: jedno zadanie może dotyczyć zaimka, szyku i bezokolicznika; struktura może mieć wymagania wstępne lub być często mylona z inną. Taksonomia pomaga nazwać źródło błędu, lecz nie zastępuje analizy konkretnego zdania.

Jednostki leksykalne, sensy i taksonomia gramatyczna tworzą powiązane, ale odrębne porządki. Zadanie `Ho bisogno di aiuto` może ćwiczyć sens `avere bisogno di` oraz dopełnienie przyimkowe; błąd `*ho bisogno aiuto` jest bliższy łączliwości niż nieznajomości znaczenia „potrzebować”.

## 5. Schematy merytoryczne

### 5.1. Schemat treści ćwiczenia

Każde zadanie opisuje kontekst, luki w ćwiczonych elementach, polecenie, oczekiwaną czynność, odpowiedź lub zbiór odpowiedzi dopuszczalnych, uzasadnienie poprawności, ćwiczony LexicalSense, użyte struktury gramatyczne oraz poziom podpowiedzi. Materiał musi pozwalać odróżnić błąd użytkownika od niejednoznaczności zadania. Jeżeli kilka odpowiedzi jest naturalnych, ocena powinna to uwzględniać.

### 5.2. Schemat obserwacji odpowiedzi

Odpowiedź użytkownika jest zachowana w oryginalnej postaci wraz z treścią pokazanego zadania i wynikiem analizy. Obserwacja obejmuje poprawność, stopień samodzielności, ewentualną pewność użytkownika, rodzaj błędu, przypisanie go do sensu lub użycia gramatycznego oraz pewność tego przypisania. Ważne jest rozróżnienie błędu leksykalnego, morfologicznego, składniowego, semantycznego, pragmatycznego, literówki i odpowiedzi alternatywnej. Brak odpowiedzi albo korzystanie z podpowiedzi nie powinny być bezrefleksyjnie traktowane jak pełne przypomnienie.

### 5.3. Schemat stanu uczenia

Stan uczenia obejmuje dwie powiązane perspektywy: historię i plan powtórek **każdego LexicalSense** oraz **profil gramatyczny** opisujący stopień opanowania struktur. Historia odpowiedzi pozostaje podstawą obu ocen, dzięki czemu późniejsza korekta analizy błędu może zmienić profil bez udawania, że użytkownik udzielił innej odpowiedzi.

## 6. FSRS i powtórki

FSRS (*Free Spaced Repetition Scheduler*) jest modelem planowania powtórek na podstawie historii przypominania. Posługuje się trudnością materiału dla użytkownika, stabilnością pamięci i przewidywaną aktualną możliwością przypomnienia (*retrievability*). Po powtórce wynik i czas od poprzedniej obserwacji wpływają na nowy stan pamięci i termin kolejnego sprawdzenia. Docelowy poziom pamiętania wyraża kompromis między częstotliwością powtórek a ryzykiem zapomnienia. Nie jest oceną ogólnej biegłości językowej. [Opis algorytmu FSRS](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm).

Nowy LexicalSense nie ma jeszcze własnej historii FSRS. Pierwsze zadanie jest początkiem uczenia tego sensu, a nie „zaległą powtórką”. Aplikacja nie pokazuje osobno wyrażenia i jego znaczenia przed pierwszą próbą uzupełnienia luki; rozwiązanie i objaśnienie pojawiają się po odpowiedzi. Po odpowiedzi aplikacja przypisuje wynik pamięciowy zgodny z przyjętą skalą FSRS. Oceniane jest **czynne użycie** sensu w uzupełnionych elementach: odpowiedź poprawna po podpowiedzi nie jest równoważna swobodnemu przypomnieniu, a błąd gramatyczny w ćwiczonym wyrażeniu obniża wynik, choć AI może różnicować wagę błędu. Zasady przekładu obserwacji na ocenę powtórkową muszą być spójne i zrozumiałe dla użytkownika.

FSRS planuje termin dla znanego LexicalSense. Nie decyduje samodzielnie, które nowe znaczenie wprowadzić. Wymagane w danym momencie powtórki są domyślnym pierwszym etapem sesji, ale użytkownik może je przerwać w dowolnym momencie i rozpocząć naukę nowych jednostek. Niewykonane powtórki nadal wymagają wykonania. Sens, którego użytkownik jeszcze się nie uczył, pozostaje nowy bez stanu powtórek.

## 7. Probabilistyczny profil gramatyczny

Profil gramatyczny jest zbiorem **oszacowań z niepewnością** stopnia opanowania struktur, a nie listą etykiet „zna/nie zna”. Dla konkretnego użycia aplikacja może oceniać prawdopodobieństwo, że użytkownik poradzi sobie z nim w podobnym, nowym kontekście. Profil powinien oddzielać **poziom oszacowania** od **pewności oszacowania**. Jedna poprawna odpowiedź przy łatwym przykładzie daje słabszy dowód niż powtarzalne powodzenie w różnorodnych kontekstach.

Dowód z odpowiedzi ma wagę zależną od tego, czy zadanie rzeczywiście sprawdzało dane użycie, jak bardzo było podpowiedziane, czy odpowiedź była jednoznaczna i czy inne trudności mogły spowodować błąd. Niepewna analiza AI powinna dawać słabszą aktualizację niż oczywisty, powtarzalny wzorzec. Nie należy podwójnie liczyć kilku etykiet przypisanych do tej samej odpowiedzi jako niezależnych dowodów.

Profil może uogólniać dane po hierarchii, lecz ostrożnie: słabość w konkretnym użyciu zwiększa podejrzenie problemu w podstrukturze, natomiast dobra odpowiedź na poziomie kategorii nie potwierdza wszystkich jej dzieci. Oszacowania pomagają dobrać kontekst gramatyczny zdań generowanych dla słów i wyrażeń. Przy pierwszym zadaniu wprowadzającym nowy LexicalSense należy unikać struktur, które profil wskazuje jako słabo opanowane, aby użytkownik mógł skupić się na nowym wyrażeniu. Późniejsze powtórki tego sensu mogą już używać struktur ocenionych jako słabo opanowane. Gdy danych brakuje, stan jest **nieznany**, a nie „nieopanowany”. Wtedy pierwsze zadania korzystają z ustalonego zestawu podstawowych konstrukcji; późniejszy dobór zmienia się na podstawie odpowiedzi użytkownika. Położenie struktury w taksonomii nie określa jej trudności. Bez dowodów nie przypisuje się użytkownikowi słabości; kolejne odpowiedzi stopniowo zawężają niepewność.

Profil gramatyczny nie jest stanem FSRS. Można pamiętać znaczenie słowa, a słabo stosować strukturę gramatyczną w zdaniu. Można także znać strukturę, lecz zapomnieć znaczenie ćwiczonego słowa. Obie obserwacje muszą pozostać możliwe.

## 8. Rola AI i granice jego ocen

AI pomaga **tworzyć zadania dla słów i wyrażeń** na potrzeby ich konkretnego pokazania, dobierając kontekst zdań na podstawie profilu gramatycznego. Powinno przygotowywać naturalne konteksty, poprawne warianty odpowiedzi, objaśnienia i przypisania do sensów oraz użytych struktur. Zadanie powstaje przed pokazaniem użytkownikowi; generowanie nie jest częścią oceniania jego odpowiedzi. Termin powtórki należy do LexicalSense, a nie do wcześniej odłożonego zadania.

AI może także **analizować zapisaną odpowiedź**: wskazać dopuszczalną alternatywę, opisać błąd i zaproponować, jakiego sensu lub użycia dotyczy. Analiza jest ustrukturyzowanym dowodem dla dalszych procesów, a nie samodzielną decyzją o terminie FSRS lub o tym, że cała kategoria została opanowana. Przy odpowiedzi wieloznacznej albo niskiej pewności aplikacja powinna zachować niepewność i umożliwić korektę oceny. AI nie zmienia taksonomii przy każdej analizie; pracuje na przyjętym słowniku pojęć.

Okresowa analiza wielu obserwacji może pomagać interpretować wzorce błędów gramatycznych. Profil wynikający z tej analizy wpływa na kontekst zdań generowanych dla ćwiczonych słów i wyrażeń. Wybór nowych LexicalSense należy do użytkownika; może wskazać konkretne sensy albo ich liczbę. Przy wyborze liczby system bierze nieuczone sensy w kolejności wynikającej z implementacji; kolejność ta nie wyraża priorytetu dydaktycznego. Dobór kontekstu powinien dać się uzasadnić językiem zjawisk, np. „niska pewność w użyciu zaimków dopełnienia bliższego po bezokoliczniku”.

## 9. Algorytm uczenia jako proces merytoryczny

1. **Wybór użytkownika.** Użytkownik wskazuje konkretne nowe LexicalSense albo liczbę sensów, których jeszcze się nie uczył. W drugim przypadku system wybiera nieuczone sensy w kolejności wynikającej z implementacji, bez przypisywania jej znaczenia dydaktycznego.
2. **Odczyt stanu.** Aplikacja ustala wymagane powtórki LexicalSense z FSRS i odczytuje profil gramatyczny. Odróżnia brak danych od słabego wyniku.
3. **Przygotowanie materiału.** AI tworzy zadanie na potrzeby konkretnej prezentacji sensu, przed pokazaniem go użytkownikowi, dobierając kontekst gramatyczny na podstawie profilu; pierwsze zadanie dla nowego sensu unika struktur ocenionych jako słabo opanowane. Materiał przechodzi kontrolę jakości. Samo utworzenie zadania nie uruchamia FSRS sensu.
4. **Sesja — powtórki.** Użytkownik zaczyna od wymaganych powtórek znaczeń słów i wyrażeń wskazanych przez FSRS. Może przerwać je w dowolnym momencie; niewykonane powtórki pozostają wymagane.
5. **Sesja — nowe sensy.** Po powtórkach albo po ich przerwaniu przez użytkownika pojawiają się zadania wprowadzające sensy zgodne z jego wyborem. Przed pierwszą próbą aplikacja nie pokazuje osobno wyrażenia i jego znaczenia. Nieuczone wcześniej sensy nie mają jeszcze historii FSRS.
6. **Odpowiedź i interpretacja.** Przy każdym zadaniu zapisywana jest oryginalna odpowiedź. Następnie użytkownik otrzymuje rozwiązanie i objaśnienie, a analiza wskazuje znajomość znaczenia, ewentualne błędy gramatyczne i niepewność diagnozy.
7. **Dwie aktualizacje.** Wynik czynnego użycia ćwiczonego sensu aktualizuje FSRS danego LexicalSense i jego kolejny termin. Dowody dotyczące gramatyki aktualizują oszacowania w profilu gramatycznym. Każda aktualizacja ma własną logikę.
8. **Kolejny cykl.** Zmieniony profil wpływa na kontekst później generowanych zdań, a FSRS wyznacza późniejsze powtórki sensów. Nowe sensy nadal wynikają z wyboru użytkownika.

## 10. Przepływy szczególne i reguły interpretacji

**Start bez danych.** Brak profilu gramatycznego oznacza brak dowodów o stopniu opanowania struktur, a nie nieopanowanie gramatyki. Pierwsze zadania korzystają z ustalonego zestawu podstawowych konstrukcji. Po wykonaniu ewentualnych wymaganych powtórek albo po ich przerwaniu przez użytkownika sesja przechodzi do wybranych nowych sensów. Odpowiedzi tworzą pierwsze obserwacje dla profilu i FSRS.

**Błąd o kilku możliwych przyczynach.** Jeżeli użytkownik poda złą formę ćwiczonego wyrażenia, przyczyną może być czas, tryb, zgoda, niezrozumienie znaczenia zdania albo zwykła omyłka. Błąd obniża wynik czynnego użycia tego sensu w FSRS, lecz jego waga może zależeć od oceny AI. Aktualizacja oszacowań w profilu gramatycznym powinna uwzględniać niepewność co do przyczyny.

**Alternatywna poprawna odpowiedź.** Naturalne warianty nie mogą być traktowane jako błędne tylko dlatego, że różnią się od odpowiedzi wzorcowej. Ich akceptacja może zmienić zarówno wynik powtórki, jak i dowód dla profilu.

**Powtarzające się błędy.** Seria podobnych błędów w różnych zdaniach i przy różnym słownictwie jest mocniejszym argumentem za trudnością gramatyczną niż pomyłki skupione wokół jednego leksemu. Profil uwzględnia taki wzorzec przy doborze kontekstów zdań dla późniejszych zadań dotyczących słów i wyrażeń.

**Zadanie wycofane lub zasadniczo zmienione.** Jego dawne odpowiedzi pozostają dowodem historycznym przy interpretacji postępów, z uwzględnieniem jakości ówczesnego zadania. Stan FSRS należy nadal do ćwiczonego LexicalSense, nie do wycofanego tekstu zadania.

## 11. Kryterium powodzenia aplikacji

Aplikacja działa zgodnie z założeniem, gdy zaczyna sesję od wymaganych powtórek sensów z FSRS i pozwala użytkownikowi w dowolnym momencie przejść do wybranych nowych sensów. Niewykonane powtórki pozostają wymagane. Aplikacja odróżnia znajomość LexicalItem od znajomości jego poszczególnych LexicalSense i nie myli pamiętania znaczenia z opanowaniem gramatyki. Profil gramatyczny wpływa na kontekst generowanych zdań, bez osobnych ćwiczeń gramatycznych. Niepewność diagnozy pozostaje widoczna i maleje wraz z napływem różnorodnych odpowiedzi.
