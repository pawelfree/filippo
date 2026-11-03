# Implementacja nauki cloze

- Data: 2026-11-03
- Status: zakończony
- Cel: dodać generowanie, zapis i pierwszą sesję nauki cloze.
- Specyfikacja: [nauka cloze](../specs/implemented/2026-11-03-cloze-study.md).
- Działania: przeanalizowano istniejący przepływ nauki, FSRS, generowanie OpenAI i schemat bazy. Dodano migrację `ClozeExercise`, `ClozeSession`, `ClozeAttempt`, serwis i endpointy, stronę z polskim zdaniem oraz osobnymi lukami, asynchroniczne generowanie i ocenę FSRS. Poprawiono odczyt schematu wejściowego z kopii skilla; reset nauki usuwa sesje i próby cloze, zachowując ćwiczenia.
- Kontrole: `npm run db:generate`, `npm run db:migrate`, `npm run build`, pełne `npm test` (26/26) oraz start kontekstu Nest zakończyły się powodzeniem. Test z kontrolowaną odpowiedzią OpenAI sprawdza walidację serii. Próba rzeczywistego wywołania API została odrzucona przez automatyczną kontrolę uprawnień z powodu wysłania zapisanych danych znaczenia, profilu i taksonomii na zewnątrz.
- Decyzje: trwała lista znaczeń w sesji, asynchroniczne generowanie, cztery zapisane miejsca na znaczenie; pierwsze ćwiczenie służy do bieżącej oceny. Brakujące ćwiczenie nie powoduje dobrania kolejnego znaczenia. Odpowiedź porównywana jest dosłownie po usunięciu białych znaków z początku i końca.
- Nierozstrzygnięte: rzeczywista odpowiedź skonfigurowanego API OpenAI nie została zweryfikowana z powodu odrzucenia połączenia przez automatyczną kontrolę uprawnień.
- Wynik: funkcja wdrożona lokalnie i przetestowana; migracja zastosowana do lokalnej bazy.
