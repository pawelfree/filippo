# Zapis propozycji bez przykładu

- **Data:** 2026-10-26
- **Status:** zakończony.
- **Cel:** odblokować zapis oczekujących propozycji LexicalSense i pokazać przyczynę ewentualnego błędu w interfejsie.
- **Powiązane specyfikacje:** [generowanie asynchroniczne](../specs/implemented/2026-10-26-asynchronous-lexical-sense-generation.md), [import znaczeń](../specs/implemented/2026-10-25-lexical-sense-import.md).
- **Działania:** na kopii lokalnej bazy odtworzono `400` przy zapisie propozycji z `examples: []`; walidator Ajv wskazał `examples/minItems` dla sześciu propozycji. Ujednolicono schemat zapisu z formatem odpowiedzi OpenAI, pokazano braki na karcie i obsłużono błąd zapisu w interfejsie. Błędy schematu wskazują teraz pole.
- **Sprawdzenie:** test regresyjny początkowo nie przechodził, po zmianie przeszedł. Zapis przez usługę i przeglądarkę na kopii bazy zakończył się powodzeniem; propozycja zniknęła z listy. `npm test`: 16/16. Na działającym serwerze potwierdzono widoczność braków przy sześciu nadal oczekujących propozycjach.
- **Decyzje:** ostrzeżenia o dowodach i brak przykładu są informacją do decyzji użytkownika; nie wymagają dodatkowego pola wyboru. Nie zmieniono decyzji użytkownika na rzeczywistej bazie.
- **Nierozstrzygnięte:** brak.
- **Wynik:** zapis propozycji bez przykładu działa; ewentualne inne błędy są widoczne przy propozycji.
