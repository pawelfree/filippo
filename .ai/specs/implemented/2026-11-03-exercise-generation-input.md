# Wejście do generowania ćwiczeń z zapisanych znaczeń

- Status: implemented
- Utworzono: 2026-11-03
- Zaimplementowano: 2026-11-03; po korekcie zakresu endpoint zwraca wyłącznie projekcje znaczeń.

## Problem

Skill generujący ćwiczenia wymaga projekcji zapisanych `LexicalSense`. Aplikacja nie udostępnia odczytu tych projekcji z listy ID znaczeń.

## Zamierzone zachowanie

Odczytowy endpoint przyjmuje niepustą listę ID zapisanych znaczeń i zwraca JSON zawierający wyłącznie `lexical_senses`. Projekcje znaczeń są zgodne z [kontraktem wejścia](../../docs/generation_rules/lexical_sense_input.schema.json), zachowują kolejność żądania i nie zawierają pól źródłowych.

## Zakres

Przygotowanie danych wejściowych. Bez wywołania AI, generowania ćwiczeń lub zapisywania wyniku.

## Kryteria akceptacji

- [x] Jedno lub wiele poprawnych ID daje JSON zawierający wyłącznie projekcje znaczeń w kolejności wejścia.
- [x] Niepoprawna, pusta, zduplikowana lub zbyt duża lista ID jest odrzucana.
- [x] Nieistniejące ID i zapisane znaczenie bez wymaganych danych dają czytelny błąd, bez częściowego wyniku.
- [x] Projekcje przechodzą walidację schematu i nie ujawniają `evidence`, pochodzenia przykładów ani metadanych zapisu.
- [x] Testy nowej metody i kompilacja projektu przechodzą.

## Otwarte pytania

Brak blokujących.
