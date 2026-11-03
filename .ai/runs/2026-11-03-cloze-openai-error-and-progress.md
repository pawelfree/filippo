# Błędy OpenAI i liczba znaczeń w generowaniu cloze

Data: 2026-11-03. Status: zakończony.

Cel: wyjaśnić pozornie cztery zestawy dla jednego znaczenia i rozróżnić brak środków od odrzuconego klucza API.

Ustalenia: zapis sesji wskazuje cztery różne znaczenia bez ćwiczeń (pagnotta, dwa znaczenia „vietare”, immenso). Licznik `4/4` dotyczył tych znaczeń, a nie czterech zestawów dla „pagnotta”. Jeden zestaw zawiera cztery ćwiczenia. Bezpłatne żądanie diagnostyczne do API OpenAI z kluczem z konfiguracji projektu zwróciło `401 invalid_api_key`. Nie ujawniono wartości klucza.

Działania: w historii generowania licznik opisuje znaczenia wymagające ćwiczeń, a informacja o błędzie pokazuje ich liczbę i nazwy. Obsługa błędów API cloze rozpoznaje odrzucony klucz, brak środków lub limit, ograniczenie tempa oraz błąd transportu. Logi błędów nie zawierają treści odpowiedzi API ani klucza.

Sprawdzenie: `npm run build`, `git diff --check` i 17 testów cloze zakończone powodzeniem. Test obejmuje odpowiedzi `401`, `429 insufficient_quota`, błąd transportu, timeout i brak wycieku treści błędu API do logu.

Wynik: widok i komunikaty błędu rozróżniają cztery znaczenia od czterech ćwiczeń i wskazują odrzucony klucz. Dalsze generowanie wymaga aktywnej wartości `OPENAI_API_KEY` w uruchomionym serwerze.
