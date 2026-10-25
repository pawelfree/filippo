# Limit trzech źródeł w schemacie LexicalSense

Data: 2026-10-25  
Status: zakończony

## Cel

Uzgodnić schemat pojedynczego znaczenia z regułą skilla dopuszczającą najwyżej trzy wpisy `evidence`.

## Działania i kontrole

- Odczytano instrukcje projektu i miejsca definiujące `evidence` w schematach skilla.
- Dodano `maxProperties: 3` do pola `evidence` w [lexicalsense.schema.json](../docs/create-lexical-senses/references/lexicalsense.schema.json).
- Odczytem potwierdzono, że reguła skilla i format OpenAI dopuszczają od jednego do trzech wpisów. Testów ani walidatorów nie uruchamiano.

## Decyzje i wynik

Schemat pojedynczego znaczenia ma teraz ten sam limit źródeł co reguły i format odpowiedzi API.
