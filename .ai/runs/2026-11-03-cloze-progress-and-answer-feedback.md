# Postęp zleceń cloze i informacja po odpowiedzi

Date: 2026-11-03
Status: completed
Objective: Utrwalić postęp osobno dla każdego zlecenia generowania oraz pokazać rozwiązanie i ocenę przed przejściem do kolejnego ćwiczenia.
Spec: [Nauka cloze](../specs/implemented/2026-11-03-cloze-study.md)

## Actions and findings

- Testy regresji odtworzyły oba objawy: postęp przerwanego zlecenia zmienił się z 1/2 na 2/2 po nowszym generowaniu, a karta znikała bezpośrednio po ocenie.
- Przyczyną pierwszego błędu było liczenie postępu z obecnych `ClozeExercise`. Dodano `generationProcessed` do `ClozeSession`, aktualizowany atomowo po każdym znaczeniu. Starsze gotowe zlecenia uzupełniono do pełnego postępu; starsze przerwane pokazują brak zapisanego postępu.
- API odpowiedzi zwraca pełne poprawne zdanie i ocenione ćwiczenie bez kluczy odpowiedzi. Strona zachowuje poprzednią kartę, pokazuje ocenę i rozwiązanie, a kolejne ćwiczenie otwiera osobnym przyciskiem. Informacja zwrotna przetrwa odświeżenie strony.
- Migracje zastosowano w lokalnym `prisma/dev.db`; sprawdzenie po migracji: gotowe zlecenie 5/5, starsze przerwane z nieznanym postępem.

## Checks and outcome

- Przed poprawką testy cloze: 2 z 6 nie przeszły z dokładnie zgłoszonymi objawami.
- `npm run build`: passed.
- Testy cloze: 7/7 passed, w tym błędna odpowiedź, przejście dalej i wznowienie widoku po odświeżeniu.
- `npm test`: 30/30 passed poza ograniczeniem lokalnego portu sandboxa.
- Bez wywołania rzeczywistego OpenAI; testy generowania używają kontrolowanej odpowiedzi.
