# Opis merytoryczny aplikacji do nauki języka włoskiego

## 1. Cel i zakres

Aplikacja pomaga jednemu użytkownikowi uczyć się włoskich słów i wyrażeń w zdaniach. Jej celem jest **czynne użycie konkretnych znaczeń słów i wyrażeń** poprzez samodzielne uzupełnianie brakujących elementów włoskiego zdania. Użytkownik wpisuje wyłącznie elementy objęte lukami, a nie całe zdanie.

Proces nauki opiera się na dwóch odrębnych, lecz współpracujących mechanizmach:

- **FSRS** planuje powtórki konkretnych znaczeń słów i wyrażeń, reprezentowanych przez `LexicalSense`.
- **Profil gramatyczny** opisuje stopień opanowania struktur gramatycznych i wpływa na dobór kontekstów zdań generowanych dla ćwiczonych znaczeń.

Gramatyka nie stanowi osobnego rodzaju ćwiczenia. Jest rozwijana przy okazji nauki słownictwa, ponieważ poprawne użycie wyrazu w zdaniu często wymaga zastosowania odpowiednich form i konstrukcji gramatycznych.

Materiałem ćwiczeniowym są włoskie zdania lub krótkie konteksty zawierające luki. Ich uzupełnianie może jednocześnie sprawdzać przypomnienie znaczenia, dobór formy fleksyjnej oraz zastosowanie określonej konstrukcji gramatycznej.

Każde ćwiczenie ma określony cel leksykalny oraz opis kompetencji gramatycznych, których zastosowanie może być obserwowane na podstawie odpowiedzi użytkownika.

Ćwiczenia są generowane przez AI i zapisywane w bazie danych przed ich udostępnieniem użytkownikowi. Nauka odbywa się poprzez prezentowanie zapisanych ćwiczeń w paczkach po 20 zadań.

Aplikacja obejmuje także pozyskiwanie i porządkowanie słownictwa, ocenianie odpowiedzi, aktualizowanie stanu nauki oraz okresową analizę postępów. Wyniki tej analizy wpływają na gramatyczny charakter kolejnych generowanych ćwiczeń.

## 2. Model pojęciowy słownictwa

### 2.1. LexicalItem — jednostka leksykalna

**LexicalItem** jest rozpoznawalną jednostką słownika, do której można przypisać jedno lub więcej znaczeń.

Może nią być pojedynczy leksem, wyrażenie wielowyrazowe, czasownik z przyimkiem, utrwalony zwrot albo idiom. Jej granicę wyznacza to, czy użytkownik ma nauczyć się traktować całość jako jednostkę o własnej formie i zachowaniu, a nie wyłącznie jako przypadkową sumę sąsiadujących słów.

Przykłady:

- `banca` jako leksem rzeczownikowy;
- `andare` jako leksem czasownikowy, niezależnie od jego poszczególnych form odmiany;
- `prendere una decisione` jako osobna jednostka wielowyrazowa, a nie tylko użycie `prendere`;
- `avere bisogno di` jako jednostka wielowyrazowa o właściwej jej łączliwości;
- `in bocca al lupo` jako utrwalona formuła, której nie należy redukować do oddzielnych kart dla każdego słowa.

Zapis widoczny w konkretnym zdaniu jest **wystąpieniem formy** jednostki.

`vado`, `andavo` i `andrei` są formami powiązanymi z `andare`, lecz nie muszą stanowić trzech osobnych LexicalItem.

Rozróżnienie form ma znaczenie przy analizie odpowiedzi: niepoprawne użycie `andrei` może wskazywać problem z trybem warunkowym, mimo że użytkownik zna znaczenie czasownika `andare`.

### 2.2. LexicalSense — konkretne znaczenie lub użycie

**LexicalSense** oznacza jedno rozróżnialne znaczenie lub użycie LexicalItem, uwzględniające kontekst, typowe połączenia i ograniczenia zastosowania.

Jeden LexicalItem może mieć wiele LexicalSense.

Sam fakt rozpoznania formy wyrazu nie dowodzi znajomości wszystkich jego znaczeń.

Przykładowo `prendere una decisione` jest osobnym LexicalItem względem `prendere`, natomiast „podjąć decyzję” stanowi jego LexicalSense.

Poprawne zastosowanie samego czasownika `prendere` nie dowodzi opanowania wyrażenia `prendere una decisione`.

Podobnie `prendere il treno` może być osobnym LexicalItem, jeżeli zostało wyodrębnione jako jednostka przeznaczona do nauki.

LexicalSense może wiązać się z charakterystyczną konstrukcją gramatyczną, ale nie jest z nią tożsamy.

Znaczenie `avere bisogno di` obejmuje potrzebę, natomiast wymaganie przyimka `di` jest jednocześnie właściwością konstrukcji, której zastosowanie może dostarczać obserwacji gramatycznej.

### 2.3. Relacje i granice pojęć

| Pojęcie             | Znaczenie                              | Przykład                        |
| ------------------- | -------------------------------------- | ------------------------------- |
| LexicalItem         | Jednostka słownika                     | `prendere una decisione`        |
| LexicalSense        | Konkretne znaczenie jednostki          | „podjąć decyzję”                |
| Forma               | Realizacja morfologiczna jednostki     | `prendo`                        |
| Wystąpienie         | Forma w konkretnym kontekście          | `prendo` w określonym zdaniu    |
| Wariant gramatyczny | Sprawdzalne zastosowanie reguły        | użycie `condizionale presente`  |
| Ćwiczenie           | Konkretne zadanie z lukami             | uzupełnienie wyrażenia w zdaniu |
| Jednostka FSRS      | To, czego pamięć jest harmonogramowana | LexicalSense                    |

Relacja między LexicalItem a LexicalSense jest zasadniczo relacją „jedna jednostka — wiele znaczeń”.

Jedno znaczenie może być ćwiczone w wielu różnych zdaniach. Wszystkie te ćwiczenia odnoszą się do tego samego LexicalSense i jego stanu FSRS.

Jednostki leksykalne mogą mieć również relacje semantyczne i formalne, takie jak synonimia, antonimia, warianty zapisu czy powiązania między wyrażeniami. Relacje te pomagają interpretować znaczenia i tworzyć ćwiczenia, ale nie powodują automatycznego przenoszenia wyników uczenia.

Należy rozróżniać **bierne rozpoznanie** i **czynne użycie**. Rozumienie gotowego włoskiego zdania oraz samodzielne wpisanie odpowiedniego wyrażenia są różnymi działaniami poznawczymi. Aplikacja koncentruje się na drugim z nich.

## 3. Pozyskiwanie słów i wyrażeń

Użytkownik może dodawać do bazy pojedyncze słowa, wyrażenia oraz większe zbiory słownictwa.

Materiał może pochodzić z ręcznego wprowadzania, importowanych list lub tekstów, z których identyfikowane są jednostki potencjalnie przydatne do nauki.

Przed wykorzystaniem materiału należy rozpoznać właściwe LexicalItem oraz odpowiadające im LexicalSense.

AI może wspierać ten proces poprzez identyfikowanie podstawowej postaci jednostki, wyodrębnianie znaczeń, rozpoznawanie wyrażeń wielowyrazowych, określanie części mowy, charakterystycznej łączliwości, ograniczeń użycia i kontekstów znaczeniowych.

Dla znaczeń można przechowywać polskie odpowiedniki, definicje, przykłady i informacje niezbędne do prawidłowego generowania ćwiczeń.

Przed dodaniem jednostki należy sprawdzić, czy nie występuje ona już w bazie.

Deduplikacja musi odróżniać:

- ponowne dodanie istniejącego LexicalSense;
- nowe znaczenie istniejącego LexicalItem;
- wariant zapisu tej samej jednostki;
- inne wyrażenie złożone z podobnych słów;
- jednostki podobne formalnie, ale różne znaczeniowo.

Dodanie LexicalSense do bazy nie oznacza automatycznego rozpoczęcia jego nauki.

Znaczenie pozostaje nieuczone do momentu jego pierwszej prezentacji w ćwiczeniu. Samo przygotowanie ćwiczeń również nie tworzy historii FSRS.

Dane leksykalne mogą być uzupełniane i korygowane. Korekta ich opisów nie powinna powodować przypadkowej utraty powiązanego stanu nauki.

## 4. Zadanie i jednostka pamięci FSRS

**Ćwiczenie** jest przygotowaną realizacją określonego LexicalSense w kontekście zdania.

Obejmuje:

- zdanie lub krótki kontekst;
- jedną lub więcej luk;
- polecenie i oczekiwany zakres odpowiedzi;
- rozwiązanie wzorcowe i znane poprawne alternatywy;
- wskazanie ćwiczonego LexicalSense;
- opis istotnych wariantów gramatycznych;
- informacje określające, jakie kompetencje rzeczywiście potwierdzają poszczególne zaakceptowane odpowiedzi;
- objaśnienia potrzebne do przekazania informacji zwrotnej.

Luki obejmują ćwiczone wyrażenie w postaci wynikającej z kontekstu, także wtedy, gdy jego składniki są rozdzielone innymi słowami i wymagają kilku luk.

Użytkownik dobiera również odpowiednią odmianę wynikającą z czasu, trybu, liczby, rodzaju i innych właściwości zdania.

Ćwiczenie nie jest tożsame ani z LexicalItem, ani z LexicalSense, ani z wariantem gramatycznym.

**Stan FSRS należy do LexicalSense**, a nie do treści zadania.

Ten sam LexicalSense może być sprawdzany w kolejnych ćwiczeniach o różnej treści i z wykorzystaniem różnych konstrukcji gramatycznych. Wszystkie te ćwiczenia korzystają z tego samego stanu pamięci.

Jedno ćwiczenie może dostarczyć wielu obserwacji gramatycznych, ale wynik harmonogramowania powtórki dotyczy ćwiczonego LexicalSense.

Treść zapisanego ćwiczenia należy odróżniać od jego konkretnej prezentacji użytkownikowi. Ta sama treść może zostać wykorzystana ponownie, natomiast każda prezentacja stanowi osobne zdarzenie nauki.

## 5. Hierarchiczna taksonomia gramatyczna

Taksonomia porządkuje zjawiska języka włoskiego od ogólnych obszarów do konkretnych, sprawdzalnych zastosowań.

Jej podstawowe poziomy pojęciowe to:

1. **Kategoria gramatyczna** — szeroki obszar, np. czas i aspekt, tryb i modalność, składnia zdania, zaimki, determinacja, przyimki, zgodność, szyk i struktura informacji.
2. **Konstrukcja** — rozpoznawalny mechanizm gramatyczny w obrębie kategorii, np. okres warunkowy, zaimki dopełnienia bliższego albo wybór między *passato prossimo* i *imperfetto*.
3. **Wariant konstrukcji** — konkretne zastosowanie lub rozróżnienie mechanizmu, które może być przedmiotem niezależnej obserwacji.
4. **Przypadki szczegółowe wariantu** — warunki, wyjątki, konteksty i ograniczenia pozwalające interpretować jego użycie.

Przykładowa ścieżka pojęciowa:

**Tryb i modalność → okresy warunkowe → warunek hipotetyczny dotyczący teraźniejszości → `Se avessi tempo, partirei.`**

Inna ścieżka:

**Czas i aspekt → wybór form przeszłych → tło i zdarzenie punktowe → `Mentre studiavo, è arrivato Marco.`**

Przykładowe zdanie ilustruje zastosowanie wariantu, ale nie stanowi jego definicji.

**Jednostką oceny w profilu gramatycznym jest wariant taksonomii.** Kategorie i konstrukcje są poziomami porządkującymi, a przypadki szczegółowe nie stanowią automatycznie osobnych kompetencji.

Taksonomia zawiera również relacje między wariantami, w szczególności relacje powiązania i kontrastu.

Relacje pomagają:

- rozpoznawać konstrukcje alternatywne;
- rozróżniać podobne struktury;
- interpretować źródła błędów;
- identyfikować właściwe kompetencje;
- dobierać odpowiednie konteksty do ćwiczeń.

Samo powiązanie wariantów nie oznacza równoważności kompetencji ani automatycznego przenoszenia ocen.

Taksonomia może zawierać referencyjne informacje o poziomach CEFR. Opisują one typowy zakres zastosowań danej konstrukcji, a nie aktualny poziom konkretnego użytkownika.

## 6. Schematy merytoryczne

### 6.1. Schemat treści ćwiczenia

Każde ćwiczenie opisuje kontekst, luki w ćwiczonych elementach, polecenie, oczekiwaną czynność, odpowiedź wzorcową, dopuszczalne warianty, ćwiczony LexicalSense oraz wymagania gramatyczne.

W opisie ćwiczenia należy odróżnić:

- warianty gramatyczne będące celami ćwiczenia;
- warianty występujące jedynie w kontekście;
- warianty, których zastosowanie jest rzeczywiście potwierdzane przez konkretne zaakceptowane rozwiązanie.

Samo wskazanie celu gramatycznego nie oznacza, że każda poprawna odpowiedź dostarcza dowodu opanowania tego celu.

Opis zaakceptowanych rozwiązań powinien umożliwiać przypisanie odpowiednich obserwacji gramatycznych bez ponownej interpretacji językowej przez AI.

Materiał musi umożliwiać odróżnienie błędu użytkownika od niejednoznaczności samego zadania.

### 6.2. Schemat obserwacji odpowiedzi

Odpowiedź użytkownika jest zachowywana w oryginalnej postaci wraz z informacją o konkretnym ćwiczeniu i jego prezentacji.

Obserwacja gramatyczna dotyczy określonego wariantu taksonomii i może wskazywać:

- `correct` — poprawne zastosowanie;
- `incorrect` — niepoprawne zastosowanie;
- `not_assessable` — brak możliwości wiarygodnego rozstrzygnięcia.

Obserwacja zawiera również określenie klasy dowodu oraz uzasadnienie.

W przypadku rozpoznanego błędu gramatycznego identyfikowany jest jego konkretny rodzaj, naruszona reguła, kontekst i rzeczywista odpowiedź użytkownika.

Należy rozróżniać błąd gramatyczny od błędu leksykalnego, znaczeniowego, ortograficznego, literówki oraz dopuszczalnej odpowiedzi alternatywnej.

Nie każda odrzucona odpowiedź stanowi dowód braku kompetencji gramatycznej.

### 6.3. Schemat stanu uczenia

Stan uczenia obejmuje dwie odrębne perspektywy:

1. Stan pamięci i harmonogram powtórek każdego LexicalSense.
2. Profil kompetencji gramatycznych opisujący opanowanie wariantów taksonomii.

Przechowywane są również informacje o wykonanych ćwiczeniach i odpowiedziach, umożliwiające odtworzenie rzeczywistego przebiegu nauki, analizowanie postępów i korygowanie nieprawidłowych diagnoz.

Bieżąca aktualizacja profilu gramatycznego nie wymaga ponownego przetwarzania całej historii odpowiedzi. Korzysta z aktualnego stanu profilu i nowej obserwacji.

## 7. FSRS i powtórki

FSRS (*Free Spaced Repetition Scheduler*) jest algorytmem planowania powtórek na podstawie wyników przypominania.

Posługuje się między innymi trudnością materiału dla użytkownika, stabilnością pamięci i przewidywaną możliwością przypomnienia.

Po powtórce wynik i czas od poprzedniej obserwacji wpływają na nowy stan pamięci oraz termin kolejnego sprawdzenia.

Docelowy poziom pamiętania określa kompromis między częstotliwością powtórek a ryzykiem zapomnienia.

FSRS nie jest oceną ogólnej biegłości językowej ani miarą opanowania gramatyki.

### 7.1. Początek nauki znaczenia

Nowy LexicalSense nie posiada jeszcze indywidualnej historii powtórek.

Pierwsza prezentacja ćwiczenia dotyczącego tego znaczenia rozpoczyna jego naukę.

Przed pierwszą próbą aplikacja nie przedstawia użytkownikowi osobno ćwiczonego wyrażenia i jego znaczenia jako gotowej odpowiedzi. Zadaniem użytkownika jest samodzielne uzupełnienie luki.

Rozwiązanie i objaśnienie pojawiają się po odpowiedzi.

### 7.2. Ocena pamięciowa

Wynik pierwszej odpowiedzi stanowi podstawę oceny czynnego użycia LexicalSense.

Ocena zostaje przełożona na odpowiednią wartość wykorzystywaną przez FSRS.

Nie należy utożsamiać poprawnej odpowiedzi po uzyskaniu informacji zwrotnej z samodzielnym przypomnieniem podczas pierwszej próby.

Kolejne próby poprawienia tego samego zadania nie są nowymi powtórkami FSRS.

Ocena pamięciowa i ocena gramatyczna pozostają odrębne. Jedna odpowiedź może mieć różne znaczenie dla pamięci leksykalnej i diagnozy gramatycznej.

### 7.3. Planowanie powtórek

FSRS wyznacza termin kolejnej powtórki LexicalSense.

Nie decyduje natomiast samodzielnie, które nowe znaczenie użytkownik ma rozpocząć.

Wymagane powtórki stanowią domyślny pierwszy etap nauki. Użytkownik może jednak przerwać wykonywanie powtórek i przejść do nowych znaczeń.

Niewykonane powtórki zachowują swój stan i nadal pozostają wymagane.

## 8. Probabilistyczny profil gramatyczny

Profil gramatyczny jest zbiorem oszacowań stopnia opanowania konkretnych wariantów taksonomii.

Nie jest listą etykiet „zna” i „nie zna”.

Dla każdego wariantu profil rozróżnia:

- **mastery** — oszacowanie opanowania kompetencji;
- **confidence** — stopień pewności tego oszacowania;
- **trend** — kierunek zmian;
- **performance** — informacje o wynikach ocenialnych prób;
- **exposure** — informacje o prezentacji i ćwiczeniu wariantu;
- **difficulties** — konkretne zidentyfikowane trudności.

Profil zawiera również stan matematyczny pozwalający aktualizować oszacowania bez ponownego analizowania historii wszystkich wcześniejszych odpowiedzi.

### 8.1. Aktualizacja kompetencji

Każda wiarygodna obserwacja może zmienić stan odpowiedniej kompetencji.

Obserwacja `correct` stanowi dodatni dowód, a `incorrect` — ujemny.

Obserwacja `not_assessable` nie powoduje zmiany oszacowania opanowania.

Siła aktualizacji zależy od klasy dowodu, aktualnego stanu kompetencji i przyjętych parametrów modelu.

Wartości liczbowe są wyznaczane według ustalonych reguł matematycznych. AI nie nadaje ich samodzielnie.

### 8.2. Niepewność

Niewielka liczba obserwacji oznacza ograniczone podstawy do oceny kompetencji.

Wraz z kolejnymi wiarygodnymi obserwacjami zmieniają się zarówno oszacowanie opanowania, jak i poziom pewności.

W przyjętym modelu pewność zależy od skumulowanej liczby ważonych obserwacji. Nie jest bezpośrednim pomiarem różnorodności kontekstów ani prawdopodobieństwem poprawności diagnozy AI.

Dlatego przy interpretacji profilu należy uwzględniać również rodzaje błędów, konteksty i zakres dotychczasowego ćwiczenia.

Brak obserwacji oznacza brak wiedzy o kompetencji użytkownika, a nie jej nieopanowanie.

### 8.3. Trudności gramatyczne

Profil przechowuje rozpoznane trudności przypisane do konkretnych wariantów taksonomii.

Trudność opisuje określony rodzaj błędu, a nie ogólną ocenę użytkownika.

Powtarzające się wystąpienia tego samego błędu mogą zwiększać znaczenie trudności przy planowaniu kolejnych ćwiczeń.

Poprawne zastosowanie wariantu poprawia oszacowanie kompetencji, ale nie musi automatycznie usuwać wcześniej rozpoznanej trudności.

### 8.4. Wykorzystanie profilu

Profil wpływa na dobór konstrukcji gramatycznych w przyszłych ćwiczeniach.

Przy pierwszej prezentacji nowego LexicalSense należy unikać nadmiernego obciążania zadania strukturami, które profil wskazuje jako słabo opanowane.

W kolejnych ćwiczeniach tego znaczenia można wprowadzać bardziej wymagające konteksty, w tym konstrukcje związane z rozpoznanymi trudnościami.

Gdy danych brakuje, wykorzystywany jest ustalony zestaw podstawowych konstrukcji. Nie zakłada się automatycznie, że użytkownik ich nie zna.

Profil gramatyczny nie zmienia samodzielnie harmonogramu FSRS.

## 9. Rola AI

AI wykonuje trzy odrębne zadania merytoryczne:

1. Generuje ćwiczenia dla słów i wyrażeń.
2. Diagnozuje odpowiedzi wymagające interpretacji językowej.
3. Okresowo analizuje postępy użytkownika i identyfikuje potrzeby dydaktyczne.

AI może również wspierać analizę i porządkowanie jednostek leksykalnych wprowadzanych do bazy.

### 9.1. Generowanie ćwiczeń

AI przygotowuje naturalne zdania, odpowiednie luki, poprawne odpowiedzi, objaśnienia oraz powiązania z LexicalSense i wariantami gramatycznymi.

Uwzględnia przy tym profil kompetencyjny i reguły generowania.

Ćwiczenia są generowane przed ich użyciem, sprawdzane pod względem jakości i zapisywane w bazie.

### 9.2. Diagnoza odpowiedzi

AI jest wykorzystywane do interpretacji pierwszych odpowiedzi, które nie zostały zaakceptowane podczas sprawdzenia względem znanych rozwiązań.

Zadaniem AI jest ustalenie, czy odpowiedź jest mimo to dopuszczalna, a także identyfikacja rzeczywiście zaobserwowanych poprawnych i niepoprawnych zastosowań struktur gramatycznych.

AI rozpoczyna diagnozę od celów gramatycznych zadania, ale uwzględnia także istotne warianty powiązane i kontrastowe.

Może wskazać poprawną realizację innego wariantu, jeżeli odpowiedź dostarcza odpowiedniego dowodu.

Nie przypisuje automatycznie ocen wariantom występującym jedynie w treści zdania lub powiązanym z kompetencją docelową.

Wynikiem diagnozy są ustrukturyzowane obserwacje, a nie bezpośrednio zmodyfikowany profil.

AI nie wyznacza wartości `mastery`, `confidence`, `trend`, `severity` ani parametrów FSRS.

### 9.3. Okresowa analiza postępów

AI może okresowo analizować aktualny profil i zgromadzone dane o nauce, aby rozpoznawać szersze wzorce błędów.

Analiza ma identyfikować przede wszystkim problemy dotyczące struktur gramatycznych i ich wzajemnych relacji.

Przykładowo seria błędów w zastosowaniu zaimków dopełnienia w różnych zdaniach może wskazywać potrzebę częstszego wykorzystywania określonych konstrukcji w kolejnych ćwiczeniach.

Wynik analizy stanowi podstawę do dostosowania przyszłego materiału.

Okresowa analiza nie zastępuje bieżącej aktualizacji kompetencji po odpowiedziach i nie wyznacza terminów powtórek FSRS.

## 10. Generowanie i przechowywanie ćwiczeń

Ćwiczenia są generowane przez AI oraz zapisywane w bazie danych.

Baza zawiera zarówno ćwiczenia przygotowane do pierwszego pokazania, jak i ćwiczenia wcześniej prezentowane użytkownikowi.

Dla każdego ćwiczenia zachowywane są informacje o ćwiczonym LexicalSense, treści zadania, poprawnych rozwiązaniach i istotnych wariantach gramatycznych.

Generator wykorzystuje:

- dane leksykalne;
- taksonomię;
- profil kompetencyjny;
- reguły generowania;
- wnioski z okresowej analizy postępów, jeżeli są dostępne.

Podstawową zasadą jest naturalność i poprawność językowa ćwiczeń.

Potrzeba ćwiczenia określonej konstrukcji gramatycznej nie uzasadnia tworzenia zdań nienaturalnych ani semantycznie nieodpowiednich dla danego LexicalSense.

System może przygotowywać wiele różnych ćwiczeń dla jednego znaczenia.

Zróżnicowanie zdań i kontekstów pozwala sprawdzać czynne użycie tego samego znaczenia bez utożsamiania zapamiętania konkretnego zdania z opanowaniem LexicalSense.

Ćwiczenia wadliwe lub niejednoznaczne mogą zostać wycofane z dalszego użycia.

Wycofanie ćwiczenia nie oznacza usunięcia jednostki leksykalnej ani jej stanu FSRS.

## 11. Algorytm uczenia jako proces merytoryczny

### 11.1. Przygotowanie słownictwa

Użytkownik dodaje słowa i wyrażenia do bazy.

Materiał zostaje przeanalizowany, znormalizowany i przypisany do odpowiednich LexicalItem oraz LexicalSense.

Znaczenia gotowe do nauki są dostępne do wykorzystania podczas generowania ćwiczeń.

### 11.2. Wybór nowych znaczeń

Użytkownik wskazuje konkretne nowe LexicalSense albo określa liczbę znaczeń, których chce się uczyć.

W przypadku podania liczby system wybiera nieuczone znaczenia według ustalonej kolejności, bez przypisywania jej automatycznie znaczenia dydaktycznego.

### 11.3. Przygotowanie materiału

AI generuje ćwiczenia dla LexicalSense, korzystając z aktualnego profilu gramatycznego i reguł generowania.

Zadania są zapisywane w bazie.

Samo wygenerowanie ćwiczenia nie rozpoczyna uczenia i nie aktualizuje FSRS.

### 11.4. Wybór powtórek

Aplikacja ustala, które LexicalSense wymagają powtórzenia zgodnie z FSRS.

Dla tych znaczeń wybierane są odpowiednie ćwiczenia zapisane w bazie.

Wybór ćwiczenia nie zmienia jednostki pamięci FSRS.

### 11.5. Przygotowanie paczki

Aplikacja przygotowuje paczkę po 20 ćwiczeń.

W zależności od bieżącego stanu i wyboru użytkownika paczka zawiera zadania powtórkowe oraz nowe ćwiczenia, które nie były jeszcze prezentowane.

Powtórki są domyślnym pierwszym etapem nauki, ale użytkownik może przejść do nowych znaczeń przed ich zakończeniem.

Niewykonane powtórki pozostają wymagane.

### 11.6. Prezentacja zadania

Użytkownik otrzymuje zdanie z lukami oraz niezbędny kontekst.

Nie otrzymuje gotowego znaczenia ani rozwiązania przed pierwszą próbą.

Samodzielnie wpisuje odpowiednią formę słowa lub wyrażenia.

### 11.7. Sprawdzenie odpowiedzi

Odpowiedź jest porównywana ze znanymi zaakceptowanymi rozwiązaniami.

Jeżeli jest poprawna, wynik może zostać rozliczony bez AI, z wykorzystaniem kompetencji przypisanych do zaakceptowanego rozwiązania.

Jeżeli pierwsza odpowiedź zostaje odrzucona, AI przeprowadza diagnozę językową.

Analiza może ujawnić poprawną alternatywę, błąd gramatyczny, błąd niegramatyczny albo brak podstaw do jednoznacznej oceny.

### 11.8. Aktualizacja stanu nauki

Na podstawie wyniku odpowiedzi aktualizowany jest stan FSRS dotyczący ćwiczonego LexicalSense.

Niezależnie aktualizowany jest profil gramatyczny na podstawie zaobserwowanych, ocenialnych zastosowań wariantów taksonomii.

Oceny dotyczące jednego ćwiczenia nie są naliczane ponownie przy kolejnych próbach odpowiedzi w ramach tej samej prezentacji.

### 11.9. Informacja zwrotna

Użytkownik otrzymuje poprawne rozwiązanie i odpowiednie objaśnienie.

W przypadku błędu gramatycznego wyjaśnienie może wskazywać naruszoną regułę i właściwą konstrukcję.

W przypadku poprawnej alternatywy system powinien odróżniać ją od rzeczywistego błędu językowego.

### 11.10. Analiza postępów

Okresowo AI analizuje profil i zgromadzone dane dotyczące nauki.

Wyniki analizy wskazują konstrukcje i rozróżnienia wymagające dodatkowego utrwalenia lub lepszego sprawdzenia.

### 11.11. Kolejne ćwiczenia

Zmodyfikowany profil oraz wnioski z analizy postępów wpływają na gramatyczny charakter przyszłych zadań.

FSRS nadal wyznacza terminy powtórek LexicalSense.

Cykl jest powtarzany w kolejnych sesjach.

## 12. Przepływy szczególne i reguły interpretacji

### 12.1. Start bez danych

Na początku nauki użytkownik nie ma historii odpowiedzi ani indywidualnych oszacowań gramatycznych opartych na obserwacjach.

Pierwsze zadania korzystają z ustalonego zestawu podstawowych konstrukcji.

Brak danych nie jest interpretowany jako nieopanowanie tych konstrukcji.

Pierwsze odpowiedzi dostarczają początkowych obserwacji dla profilu i stanu FSRS.

### 12.2. Błąd o kilku możliwych przyczynach

Jeżeli użytkownik poda niepoprawną formę wyrażenia, przyczyną może być czas, tryb, zgoda, niezrozumienie znaczenia lub zwykła omyłka.

Nie należy automatycznie przypisywać błędu wszystkim potencjalnie powiązanym wariantom.

Jeżeli przyczyny nie można wiarygodnie rozstrzygnąć, właściwa kompetencja pozostaje bez nowej oceny.

### 12.3. Alternatywna poprawna odpowiedź

Naturalne i poprawne warianty nie mogą być uznawane za błędne wyłącznie dlatego, że różnią się od odpowiedzi wzorcowej.

AI uwzględnia kontekst i znaczenie wypowiedzi.

Poprawna alternatywa może dostarczyć dodatnich obserwacji dotyczących kompetencji rzeczywiście zastosowanych przez użytkownika.

Nie musi jednak automatycznie potwierdzać każdej kompetencji wskazanej pierwotnie jako cel ćwiczenia.

### 12.4. Błąd leksykalny i poprawna gramatyka

Odpowiedź może być niepoprawna leksykalnie, a jednocześnie zawierać poprawne zastosowanie określonej struktury gramatycznej.

Nieznajomość słowa nie stanowi automatycznie dowodu nieznajomości gramatyki.

Możliwe jest zatem uzyskanie negatywnego wyniku w nauce leksykalnej i dodatniej obserwacji gramatycznej.

### 12.5. Powtarzające się błędy

Powtarzające się błędy w podobnych konstrukcjach mogą ujawniać systematyczną trudność.

Ich znaczenie należy interpretować z uwzględnieniem kontekstu oraz tego, czy rzeczywiście dotyczą tej samej reguły.

Profil przechowuje konkretne rodzaje trudności, a okresowa analiza AI może identyfikować ich szersze wzorce.

### 12.6. Brak ćwiczeń

Jeżeli w bazie brakuje odpowiednich ćwiczeń, aplikacja musi uzyskać dodatkowy materiał przed jego udostępnieniem.

Nie należy zastępować wymaganego ćwiczenia przypadkowym zadaniem, które sprawdza inne znaczenie lub nie odpowiada warunkom nauki.

### 12.7. Przerwanie sesji

Przerwanie sesji nie powoduje utraty zapisanych odpowiedzi ani stanu FSRS lub profilu gramatycznego.

Użytkownik może wrócić do niezakończonej nauki.

Ponowne przetworzenie tego samego zdarzenia nie może spowodować ponownej aktualizacji kompetencji lub pamięci leksykalnej.

### 12.8. Zadanie wycofane lub zmienione

Wcześniejsze odpowiedzi pozostają powiązane z materiałem faktycznie pokazanym użytkownikowi.

Wycofanie albo zasadnicza zmiana ćwiczenia nie oznacza automatycznie utraty historii nauki LexicalSense.

Jeżeli wcześniejsza diagnoza była błędna, jej korekta powinna odnosić się do pierwotnego zdarzenia, a nie tworzyć fikcyjną nową odpowiedź.

### 12.9. Zmiana taksonomii

AI ocenia odpowiedzi w odniesieniu do aktualnej, spójnej taksonomii gramatycznej.

Zmiany w taksonomii nie oznaczają automatycznie, że wcześniejsze wyniki kompetencji należy przenieść na inne warianty.

Powiązanie profilu z taksonomią musi zapewniać jednoznaczną interpretację ocenianych struktur.

## 13. Kryterium powodzenia aplikacji

Aplikacja działa zgodnie z założeniami, gdy użytkownik może dodawać słowa i wyrażenia, wybierać konkretne znaczenia do nauki oraz ćwiczyć je poprzez samodzielne uzupełnianie włoskich zdań.

System odróżnia LexicalItem od jego poszczególnych LexicalSense, a FSRS planuje powtórki właśnie na poziomie znaczeń.

Ćwiczenia są generowane przez AI, zapisywane w bazie i udostępniane użytkownikowi w paczkach, z rozróżnieniem zadań nowych i powtórkowych.

Poprawne odpowiedzi są rozliczane na podstawie znanych rozwiązań, a odpowiedzi odrzucone mogą być interpretowane przez AI z uwzględnieniem alternatywnych konstrukcji i relacji między wariantami gramatycznymi.

Profil kompetencyjny jest aktualizowany na podstawie rzeczywistych obserwacji, bez utożsamiania pamięci leksykalnej z opanowaniem gramatyki.

Okresowa analiza postępów rozpoznaje systematyczne problemy gramatyczne. Jej wyniki, wraz z aktualnym profilem, wpływają na konteksty kolejnych generowanych ćwiczeń.

**Podstawową zasadą aplikacji jest uczenie znaczeń słów i wyrażeń poprzez czynne użycie w zdaniach, przy jednoczesnym rozwijaniu kompetencji gramatycznych.**

FSRS określa, kiedy należy powtórzyć dany LexicalSense. Profil gramatyczny i analiza postępów wpływają na to, w jakich kontekstach należy go ćwiczyć.
