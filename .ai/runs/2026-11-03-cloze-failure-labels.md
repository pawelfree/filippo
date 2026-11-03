# Zrozumiały stan nieudanego przygotowania cloze

Data: 2026-11-03. Status: zakończony.

Cel: usunąć mylący licznik „0 z 10 znaczeń” z ekranu błędu i zastąpić „Znaczenie 1” nazwą znaczenia.

Przyczyna: `render()` ustawiał licznik ukończonych odpowiedzi przed rozróżnieniem stanu sesji. Dla sesji `failed` pozostawało `0 z 10`, choć nauka jeszcze się nie zaczęła. Widok grupował błędy po ID, lecz nie otrzymywał etykiety znaczenia, więc tworzył numer porządkowy.

Działania: API sesji zwraca `failureLabels` z włoskim wyrażeniem i krótkim polskim glossem, a przy jego braku z polską definicją lub definicją włoską. Widok używa etykiety w błędzie, w stanie `failed` pokazuje „Przygotowywanie przerwane”, a licznik nauki pojawia się dopiero podczas ćwiczeń. Usunięto zdublowany komunikat błędu nad jego szczegółami.

Sprawdzenie: `npm run build` oraz 16/16 testów cloze poprawnych. Odpowiedź działającego lokalnego API dla zgłoszonej sesji zawiera `pagnotta — utrzymanie`; dane ćwiczeń i sesji nie zostały zmienione.

Wynik: ekran przerwanego przygotowania wskazuje konkretne znaczenie i nie pokazuje licznika niezaczętej nauki.
