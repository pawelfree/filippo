# Odbiór długiej odpowiedzi generatora cloze

Data: 2026-11-03. Status: zakończony.

Cel: ustalić, dlaczego odpowiedź widoczna w logu OpenAI nie została zapisana jako ćwiczenia.

Powiązane: [specyfikacja generowania grupowego](../specs/implemented/2026-11-03-cloze-batched-generation.md).

Ustalenia: ostatnia sesja 15 znaczeń miała 9 znaczeń bez ćwiczeń. Po próbach generowania wszystkie 9 otrzymały błąd przekroczenia 180 sekund, a liczba rekordów ćwiczeń pozostała 24. Serwer wymagał gotowego wyniku w jednym żądaniu HTTP. Zrzut użytkownika pokazuje treść odpowiedzi w logu OpenAI, lecz brak identyfikatora odpowiedzi uniemożliwia powiązanie jej z konkretnym żądaniem po stronie aplikacji. Przyczyną odrzucenia w aplikacji był timeout, a nie walidacja ćwiczeń.

Działania: generowanie cloze korzysta z trybu `background` API Responses. Po otrzymaniu identyfikatora aplikacja pobiera stan aż do wyniku końcowego, z limitem 15 minut. Chwilowy błąd odczytu jest ponawiany do trzech razy bez nowego żądania generowania. Osobne komunikaty opisują niepełną odpowiedź i osiągnięcie limitu długości.

Sprawdzenie: test odtwarzający odpowiedź `in_progress` był czerwony przed zmianą i zielony po niej. Test obejmuje chwilową awarię pierwszego odczytu. `npm run build` oraz 18 testów cloze przeszły. Nie wysyłano płatnego żądania do OpenAI i nie zmieniono istniejących ćwiczeń.

Wynik: przyszłe generowania mogą odebrać wynik dłuższy niż 180 sekund bez utraty całej partii. Odpowiedzi z poprzednich żądań, których identyfikator nie został zapisany, nie da się automatycznie odzyskać z bazy aplikacji.
