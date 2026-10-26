# Szkic specyfikacji: asynchroniczne generowanie LexicalSense

Date: 2026-10-26  
Status: complete

## Objective

Przygotować interaktywny szkic specyfikacji dla trwałego, asynchronicznego generowania propozycji LexicalSense.

## Related spec

- [Asynchroniczne generowanie LexicalSense](../specs/implemented/2026-10-26-asynchronous-lexical-sense-generation.md)

## Actions and evidence

- Sprawdzono obecne endpointy oraz przepływ przeglądarki: `POST /generate` oczekuje na OpenAI, a gotowe rekordy są trzymane w pamięci procesu.
- Sprawdzono istniejące modele Prisma i wcześniejsze specyfikacje importu oraz audytu wyniku.
- Utworzono wyłącznie szkic z trzema pytaniami blokującymi, bez zmian kodu.

## Decisions

- Po restarcie serwera niewykonane zadania nie będą wznawiane automatycznie.
- Użytkownik ręcznie sprawdza osobną stronę wyników do przetworzenia.
- Kolejka i widok wyników są jednym zakresem wdrożenia.

## Decisions

- Każdy wygenerowany sens bez decyzji pozostaje trwałą propozycją oczekującą.
- Zapis usuwa tylko tę propozycję; odrzucenie przenosi ją do osobnej tabeli.
- Historyczne wyniki z audytu są objęte jednorazowym backfillem, jeśli nie odpowiadają zapisanemu sensowi.

## Checks and outcome

- Sprawdzono synchroniczny endpoint, pamięciowe drafts, modele Prisma i test przepływu.
- Zbadano rozwiązania kolejkowe: BullMQ wymaga Redis, Graphile Worker PostgreSQL; obecny SQLite uzasadnia worker Nest o współbieżności 1.
- Przygotowano pełną aktywną specyfikację i graf danych; nie zmieniono kodu aplikacji.
- Niezależny przegląd spójności zakresu wskazał niejasny cel tabeli odrzuconych; doprecyzowano, że utrwala decyzję i wyklucza ponowne pojawienie się propozycji, bez widoku historii w tym wdrożeniu.
