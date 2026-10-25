# Wyszukiwanie internetowe w skillu LexicalSense

Data: 2026-10-25  
Status: zakończony

## Cel

Ustawić samodzielne wyszukiwanie i sprawdzanie źródeł internetowych jako część działania skilla, bez przypisywania mu jednego dostawcy danych.

## Działania i kontrole

- Odczytano instrukcję skilla, reguły i instrukcje projektu.
- Potwierdzono w oficjalnej dokumentacji OpenAI, że Responses API udostępnia `web_search` przez pole `tools` wywołania.
- Po doprecyzowaniu użytkownika zrezygnowano z kierowania skilla do konkretnego dostawcy danych. Nie dodano skryptu wyszukującego w pojedynczym źródle.
- Zmieniono [SKILL.md](../docs/create-lexical-senses/SKILL.md) oraz [creation.rules.md](../docs/create-lexical-senses/references/creation.rules.md): skill sam wyszukuje i otwiera strony, sprawdza znaczenia oraz zapisuje lokalizatory w `evidence`.
- W instrukcji wywołania API wskazano wymagane narzędzie `web_search`. Odczytem sprawdzono, że reguły nie wskazują już domyślnego dostawcy. Testów ani wywołania API nie uruchamiano.
- Utrwalono zależność między skillem a udostępnieniem narzędzia w [lessons.md](../lessons.md).

## Decyzje i wynik

Skill ma procedurę samodzielnego wyszukiwania web. Dostęp do narzędzia musi zostać nadany przez wywołanie Responses API; sam plik skilla nie może zmienić dostępnych narzędzi. Jeśli narzędzie jest niedostępne, reguły odraczają odpowiedni sens zamiast podawać niezweryfikowane źródło.
