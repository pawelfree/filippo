# Wskazówka znaczeniowa w ćwiczeniu

- Data: 2026-11-03
- Status: zastąpiony 2026-11-03
- Cel: zapewnić uczącemu się informację o zamierzonym znaczeniu w każdym ćwiczeniu leksykalnym.
- Specyfikacje: brak odrębnej; korekta kontraktu generowania po próbie ze znaczeniem „tregua”.
- Działania: stwierdzono, że poprzedni zestaw nie podawał w każdym zadaniu polskiego znaczenia, więc uczeń nie wiedział, które słowo wstawić. Dodano obowiązkowe `meaning_hint_pl` do schematu i reguł, uzupełniono instrukcję skilla oraz zsynchronizowano jego kopie w repozytorium i katalogu instalacyjnym.
- Kontrole: schemat skompilował się w Ajv 2020; pusta wskazówka została odrzucona, a polska zaakceptowana; kopie reguł i schematu są identyczne z dokumentami źródłowymi.
- Decyzje: osobne wymagane pole `meaning_hint_pl` w ćwiczeniu, widoczne przed odpowiedzią. `hints` pozostają dla dodatkowych wskazówek gramatycznych i formy podstawowej.
- Nierozstrzygnięte: brak.
- Wynik: rozwiązanie z `meaning_hint_pl` okazało się niewystarczające. Użytkownik wymaga pełnego polskiego odpowiednika włoskiego zdania; kontrakt zastąpiono w [kolejnej korekcie](2026-11-03-exercise-polish-sentence.md).
