# Integracja FSRS z LexicalSense

## 1. Cel i zakres

Aplikacja wykorzystuje **FSRS** do utrzymywania indywidualnego harmonogramu powtórek każdego `LexicalSense`. Implementacja jest oparta na bibliotece **`ts-fsrs`** w backendzie TypeScript.

Integracja odpowiada wyłącznie za:

- utworzenie stanu FSRS dla znaczenia rozpoczynającego naukę;
- przyjęcie jednej z czterech **gotowych ocen**: `Again`, `Hard`, `Good`, `Easy`;
- aktualizację stanu pamięci i terminu następnej powtórki;
- odczyt bieżącego stanu i terminu `dueAt`;
- trwałe przechowywanie stanu i historii zmian;
- konfigurację parametrów FSRS, początkowo równych ustawieniom standardowym biblioteki.

**Poza zakresem:** ustalanie, jak odpowiedź użytkownika przekłada się na jedną z czterech ocen, sprawdzanie poprawności odpowiedzi, generowanie ćwiczeń, dobór ćwiczeń i organizacja sesji. Integracja otrzymuje już wyznaczoną ocenę FSRS.

## 2. Biblioteka i wersja algorytmu

Biblioteka: [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs).

```bash
npm install ts-fsrs
```

Dla aktualnego API `ts-fsrs` **v6** wymagany jest **Node.js 24 lub nowszy**. Aktualny interfejs to asynchroniczne `DefaultScheduler()`, a następnie `newCard()` i `review()`; **nie** starsze `fsrs()`, `createEmptyCard()` i `next()`.

Przyjmujemy **FSRS-7**, który jest domyślnym modelem aktualnej biblioteki. Wersję modelu należy jawnie przypiąć w konfiguracji, a dokładną wersję zainstalowanej biblioteki utrzymywać w pliku blokady zależności. Zmiana modelu FSRS jest odrębną operacją od zwykłej zmiany parametrów harmonogramowania.

Przykład API:

```ts
import { DefaultScheduler, Rating } from 'ts-fsrs';

const scheduler = await DefaultScheduler({ version: 'FSRS-7' });
const now = new Date();
const card = scheduler.newCard({ cardId: 'lexical-sense-id', now });
const result = scheduler.review({ card, grade: Rating.Good, now });

// result.card — nowy stan FSRS
// result.revlog — dziennik pojedynczej powtórki
```

## 3. Powiązanie z LexicalSense

**Jednemu `LexicalSense` odpowiada jeden bieżący stan FSRS.** Stan ten nie jest przypisany do pojedynczego ćwiczenia ani formy fleksyjnej.

Nie trzeba modyfikować modelu treści `LexicalSense`; stan harmonogramowania jest przechowywany osobno i wiązany przez `lexical_sense_id`.

### 3.1. Bieżący stan

Logiczny rekord `lexical_sense_fsrs`:

| Pole | Znaczenie |
| --- | --- |
| `lexical_sense_id` | Klucz główny; zarazem powiązanie z `LexicalSense`. |
| `card` | Pełny, aktualny obiekt karty zwrócony przez bibliotekę FSRS. |
| `due_at` | Zdenormalizowany termin `card.dueAt`, ułatwiający odczyt i indeksowanie. |
| `config_revision` | Rewizja konfiguracji zastosowanej przy ostatniej aktualizacji. |
| `updated_at` | Czas zapisu ostatniego stanu. |

`card` jest traktowany jako stan biblioteki, a nie jako ręcznie przeliczany zestaw pól. FSRS-7 wykorzystuje m.in. `stability`, `stabilityFast`, `difficulty`, `dueAt`, `lastReviewAt`, `state`, `scheduleStatus`, `reps`, `lapses`, `scheduledDays` oraz pola bieżącego kroku nauki. Należy zachować **cały** obiekt, łącznie z polami dodanymi przez polityki harmonogramowania.

`due_at` musi zawsze odpowiadać `card.dueAt`. Nie wolno wyliczać go ponownie samodzielnie.

### 3.2. Historia powtórek

Logiczny rekord `lexical_sense_fsrs_review`:

| Pole | Znaczenie |
| --- | --- |
| `review_event_id` | Unikalny identyfikator zdarzenia ocenionej prezentacji. |
| `lexical_sense_id` | Powiązanie z jednostką uczenia. |
| `rating` | Jedna z wartości `Again`, `Hard`, `Good`, `Easy`. |
| `reviewed_at` | Czas, do którego odnosi się ocena. |
| `revlog` | Pełen dziennik powtórki zwrócony przez `scheduler.review()`. |
| `config_revision` | Rewizja konfiguracji użyta do tej aktualizacji. |
| `created_at` | Czas utrwalenia zdarzenia. |

Historia nie zastępuje bieżącej karty. Umożliwia audyt, rekonstrukcję stanu i bezpieczne obsługiwanie późniejszych korekt.

W systemie z jednym użytkownikiem nie trzeba dodawać odrębnego `user_id` do każdego rekordu FSRS, jeżeli identyfikatory `LexicalSense` są już jednoznaczne w obrębie aplikacji.

## 4. Konfiguracja FSRS

### 4.1. Zasada

Przy uruchomieniu aplikacji konfiguracja jest **pusta w zakresie nadpisań**. `DefaultScheduler` otrzymuje przypiętą wersję `FSRS-7` i korzysta ze **standardowych parametrów** tej wersji biblioteki.

Użytkownik może później zmieniać parametry. Aplikacja przechowuje wyłącznie jawne nadpisania oraz numer ich rewizji. Brak nadpisania oznacza zastosowanie standardowego ustawienia biblioteki dla przypiętej wersji.

Przykład logicznej konfiguracji na starcie:

```json
{
  "model_version": "FSRS-7",
  "revision": 1,
  "overrides": {}
}
```

Przykład po zmianie wybranych parametrów:

```json
{
  "model_version": "FSRS-7",
  "revision": 2,
  "overrides": {
    "desiredRetention": 0.92,
    "enableFuzz": true,
    "maximumInterval": 1825
  }
}
```

Powyższe wartości są **wyłącznie przykładem konfiguracji zmienionej przez użytkownika**, nie zaleceniem zmiany ustawień początkowych.

### 4.2. Parametry

Dostępne parametry `DefaultScheduler`:

| Parametr | Standardowa wartość w aktualnym `ts-fsrs` v6 | Znaczenie |
| --- | --- | --- |
| `desiredRetention` | `0.9` | Docelowy poziom zapamiętywania; większy zwykle oznacza częstsze powtórki. |
| `maximumInterval` | `36500` | Maksymalny odstęp między powtórkami w dniach. |
| `enableFuzz` | `false` | Włączenie zróżnicowania odstępów. |
| `enableShortTerm` | `true` | Użycie kroków nauki i ponownej nauki. |
| `learningSteps` | `['1m', '10m']` | Krótkie kroki nauki. |
| `relearningSteps` | `['10m']` | Krótkie kroki po niepowodzeniu. |
| `graduatingInterval` | `1` | Minimalny interwał w dniach po przejściu do stanu powtórek. |
| `allowModelOverride` | `true` dla FSRS-7 | Możliwość wcześniejszego zakończenia kroku, gdy model uzasadnia dłuższy interwał. |
| `clearStatsOnForget` | `true` | Zachowanie liczników przy operacji `forget`. |
| `weights` | Wagi standardowe FSRS-7 | Wagi modelu; brak nadpisania oznacza oficjalny zestaw dla FSRS-7. |

`weights` to parametr zaawansowany: własny zestaw musi być zgodny z wybraną wersją modelu; FSRS-7 wymaga **34 wag**. Początkowo nie zapisuje się własnych wag i nie wykonuje ich optymalizacji. Ewentualna optymalizacja na podstawie historii jest niezależnym procesem, nie warunkiem wdrożenia integracji.

### 4.3. Zastosowanie konfiguracji

```ts
import { DefaultScheduler } from 'ts-fsrs';

// config pochodzi z repozytorium ustawień i przeszedł walidację.
const scheduler = await DefaultScheduler({
  version: 'FSRS-7',
  ...config.overrides,
});
```

Należy walidować typy, dopuszczalne zakresy, formaty kroków i zgodność wag z modelem przed zapisaniem ustawień. Następnie konfiguracja musi przejść walidację samego `DefaultScheduler`. Nieprawidłowa konfiguracja nie może zostać aktywowana.

Zmiana parametrów:

1. Zapisuje nową, kompletną rewizję konfiguracji (wersja modelu + nadpisania).
2. Jest stosowana do **kolejnych** aktualizacji FSRS.
3. Nie nadpisuje historii wcześniej udzielonych ocen.
4. Nie zmienia automatycznie terminów już zapisanych kart; ich nowe harmonogramy powstaną przy kolejnych ocenianych powtórkach.

Ewentualne ponowne przeliczenie istniejących terminów jest odrębną, świadomie uruchamianą operacją, a nie skutkiem samej edycji ustawień.

Każde zdarzenie FSRS zapisuje identyfikator konfiguracji użytej przy jego przeliczeniu, dzięki czemu możliwa jest późniejsza analiza lub rekonstrukcja historycznych wyników.

## 5. Kontrakt wejściowy integracji

Warstwa FSRS otrzymuje **gotowe zdarzenie oceny**:

```ts
interface FsrsReviewInput {
  reviewEventId: string;
  lexicalSenseId: string;
  rating: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;
  reviewedAt: Date;
}
```

- `reviewEventId` — identyfikuje jedno oceniane zdarzenie i zapobiega podwójnemu naliczeniu.
- `lexicalSenseId` — wskazuje jednostkę FSRS.
- `rating` — jest już wyznaczoną oceną. Moduł FSRS jej **nie interpretuje ani nie oblicza**.
- `reviewedAt` — jest rzeczywistym czasem ocenianego zdarzenia; nie należy zastępować go czasem późniejszego przetwarzania.

Do biblioteki przekazywane są wszystkie cztery oceny bez zastępowania ich skalą `correct` / `incorrect`.

## 6. Przetworzenie oceny

### 6.1. Pierwsza ocena znaczenia

Sam fakt dodania `LexicalSense` do bazy nie tworzy historii powtórek.

Przy pierwszej ocenianej prezentacji znaczenia system tworzy nową kartę przez `scheduler.newCard({ cardId, now })`, przekazuje otrzymaną ocenę do `review()`, a następnie zapisuje nowy stan i dziennik.

### 6.2. Następna ocena

Przy kolejnej ocenianej prezentacji system odczytuje wcześniej zapisany stan karty, odtwarza typy dat i wywołuje `scheduler.review()` z nową oceną.

### 6.3. Przykładowa logika TypeScript

```ts
import { DefaultScheduler, Rating } from 'ts-fsrs';

type FsrsRating =
  | Rating.Again
  | Rating.Hard
  | Rating.Good
  | Rating.Easy;

type ReviewInput = {
  reviewEventId: string;
  lexicalSenseId: string;
  rating: FsrsRating;
  reviewedAt: Date;
};

// Repozytorium danych i walidacja konfiguracji są elementami aplikacji.
async function applyFsrsReview(input: ReviewInput) {
  return db.transaction(async (tx) => {
    const previous = await tx.fsrsReviews.findByEventId(input.reviewEventId);
    if (previous) {
      if (previous.lexicalSenseId !== input.lexicalSenseId ||
          previous.rating !== input.rating ||
          previous.reviewedAt.getTime() !== input.reviewedAt.getTime()) {
        throw new Error('reviewEventId reused with different input');
      }
      return previous; // To samo zdarzenie nie aktualizuje FSRS po raz drugi.
    }

    const stored = await tx.fsrsCards.lockByLexicalSenseId(input.lexicalSenseId);
    const config = await tx.fsrsConfig.readActiveRevision();
    const scheduler = await DefaultScheduler({
      version: 'FSRS-7',
      ...config.overrides,
    });

    const card = stored
      ? restoreFsrsCard(stored.card) // Odtworzenie Date i walidacja struktury.
      : scheduler.newCard({
          cardId: input.lexicalSenseId,
          now: input.reviewedAt,
        });

    const result = scheduler.review({
      card,
      grade: input.rating,
      now: input.reviewedAt,
    });

    await tx.fsrsCards.upsert({
      lexicalSenseId: input.lexicalSenseId,
      card: serializeFsrsCard(result.card),
      dueAt: result.card.dueAt,
      configRevision: config.revision,
    });

    await tx.fsrsReviews.insert({
      reviewEventId: input.reviewEventId,
      lexicalSenseId: input.lexicalSenseId,
      rating: input.rating,
      reviewedAt: input.reviewedAt,
      revlog: serializeFsrsRevlog(result.revlog),
      configRevision: config.revision,
    });

    return result;
  });
}
```

Kod pokazuje **kontrakt i kolejność operacji**, nie jest gotową implementacją repozytorium. Funkcje `restoreFsrsCard`, `serializeFsrsCard` i `serializeFsrsRevlog` są adapterami utrwalania danych. `db.transaction()` oraz operacja blokady muszą zostać dopasowane do faktycznie używanej bazy.

Dla współbieżnych zdarzeń tej samej jednostki wymagana jest blokada lub równoważna kontrola wersji. Unikalność `review_event_id` musi być zagwarantowana także przez bazę danych. Ochrona przed duplikatem i zapis nowej karty wraz z `revlog` stanowią **jedną transakcję**.

Nie należy przetwarzać starszej oceny po nowszej tak, jakby była aktualną powtórką. W przypadku opóźnionych lub korygowanych zdarzeń potrzebne jest kontrolowane odtworzenie historii we właściwej kolejności.

## 7. Serializacja i odczyt stanu

Daty zapisywać jednoznacznie, np. w UTC jako ISO 8601. Przy odczycie odtwarzać je do obiektów `Date`, zanim zostaną przekazane do biblioteki.

W aktualnym FSRS-7 dotyczy to m.in. pól:

- `card.dueAt`;
- `card.lastReviewAt` (może być `null`);
- `revlog.dueAt`, `revlog.lastReviewAt`, `revlog.reviewTime`.

Nie wystarczy samo `JSON.parse()` bez przywrócenia typów czasowych i walidacji danych karty.

Stan `Card` i struktura `revlog` powinny być przechowywane w całości. Ewentualne dodatkowe pola indeksowe w bazie są kopiami pomocniczymi, nie drugim źródłem prawdy.

## 8. Odczyt aktualnego harmonogramu

Źródłem terminu kolejnej powtórki jest `card.dueAt`, zwracane przez bibliotekę i zapisane w rekordzie FSRS.

Odczyt nie modyfikuje stanu karty. Nie wywołuje `review()` ani nie nadaje nowej oceny.

Samo porównanie `dueAt` z bieżącym czasem może służyć sprawdzeniu, czy termin już nadszedł; decyzje, co robić z takim wynikiem, należą do innych elementów aplikacji.

## 9. Zmiany wersji i odtwarzanie

Należy odróżniać:

- zmianę **parametrów** w obrębie FSRS-7;
- aktualizację **wersji pakietu `ts-fsrs`**;
- zmianę **wersji modelu FSRS**, np. z FSRS-7 na przyszły model.

Dwie ostatnie operacje nie powinny następować niejawnie. Wymagają weryfikacji zgodności istniejących kart i dzienników z nową wersją.

W szczególności przejście pomiędzy różnymi generacjami modeli może wymagać odtworzenia stanu z historii powtórek. Wag modeli o innej strukturze nie wolno przenosić bez odpowiedniej procedury.

Korekta dawnej oceny także nie jest zwykłą nową powtórką. Jeżeli po korygowanym zdarzeniu są późniejsze oceny, bieżący stan należy odtworzyć zgodnie z właściwą kolejnością historii, zamiast jedynie wywoływać `review()` dla starej daty.

## 10. Warunki poprawności integracji

Integracja jest kompletna, gdy:

1. `LexicalSense` może istnieć bez aktywnej historii FSRS.
2. Pierwsza przekazana ocena tworzy stan i wyznacza termin powtórki.
3. Każda z czterech wartości `Again`, `Hard`, `Good`, `Easy` jest przyjmowana i bezpośrednio przekazywana do `review()`.
4. Kolejna ocena aktualizuje dotychczasowy stan tego samego `LexicalSense`.
5. Stan karty oraz `revlog` są trwale zapisywane atomowo.
6. Ponowne przekazanie tego samego zdarzenia nie nalicza powtórki drugi raz.
7. Po restarcie aplikacji karty są prawidłowo odtwarzane, wraz z datami.
8. Edycja parametrów aktywuje nową rewizję konfiguracji bez utraty historii.
9. Instalacja bez własnych nadpisań działa z oficjalnymi parametrami FSRS-7.
10. Żaden komponent integracji nie wyznacza oceny FSRS na podstawie odpowiedzi użytkownika.

## 11. Dokumentacja biblioteki

- [ts-fsrs — repozytorium](https://github.com/open-spaced-repetition/ts-fsrs)
- [ts-fsrs — szybki start](https://open-spaced-repetition.github.io/ts-fsrs/guide/quick-start)
- [DefaultScheduler — API i standardowe parametry](https://open-spaced-repetition.github.io/ts-fsrs/guide/scheduler/default-scheduler)
- [Migracja do v6 i FSRS-7](https://open-spaced-repetition.github.io/ts-fsrs/guide/migration)
