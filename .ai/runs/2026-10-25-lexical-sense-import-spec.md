# Specyfikacja strony importu LexicalSense

Data: 2026-10-25
Status: zakończony

## Cel

Przygotować specyfikację strony do sprawdzania, generowania, korekty i zapisu włoskich `LexicalSense`; opublikować ją w skonfigurowanym trackerze, jeśli jest dostępny.

## Powiązana specyfikacja

[Specyfikacja importu LexicalSense](../specs/implemented/2026-10-25-lexical-sense-import.md)

## Działania i ustalenia

- Przeczytano zasady `.ai/`, glosariusz, schemat bazy, istniejące API i skill `create-lexical-senses`.
- Istniejący model Prisma przechowuje `LexicalSense`, ale aplikacja nie ma jeszcze API ani strony do ich tworzenia.
- Skill zwraca `lexical_senses`, `deferred` i `coverage`; wymaga Structured Outputs, `web_search` oraz walidacji rekordów i reguł pozastrukturalnych.
- Użytkownik potwierdził jeden automatyczny test przepływu przez stronę i API, z kontrolowaną odpowiedzią OpenAI oraz tymczasową bazą.
- Przygotowano lokalną specyfikację zgodną z szablonem skilla `to-spec` i konwencją `.ai/`.
- Repozytorium ma zdalne `origin` na GitHub, ale `gh auth status` wykazał brak logowania; katalogu z rzeczywistą konfiguracją trackera też nie ma. Publikacja w GitHub jest obecnie niemożliwa.

## Sprawdzenia

- Sprawdzono zgodność zamierzonej specyfikacji z `GLOSSARY.md`, schematem Prisma i kontraktem skilla. Nie uruchamiano testów aplikacji, ponieważ ten etap dotyczy dokumentacji.

## Nierozstrzygnięte

- Publikacja w GitHub po skonfigurowaniu trackera i uwierzytelnieniu `gh`.

## Wynik

Lokalna specyfikacja ukończona. Nieopublikowana w trackerze z powodu braku uwierzytelnienia GitHub i konfiguracji trackera.
