# Polskie zdanie w ćwiczeniach leksykalnych

- Data: 2026-11-03
- Status: zakończony
- Cel: zastąpić wskazówkę znaczeniową pełnym polskim odpowiednikiem włoskiego zdania i ponownie wygenerować cztery ćwiczenia dla `cmvzt331p000dmspo5q12o5t5`.
- Specyfikacje: brak odrębnej; korekta [kontraktu generowania](../docs/generation_rules/generation_rules.md) po uwadze użytkownika.
- Działania: zmieniono pole ćwiczenia z `meaning_hint_pl` na `sentence_pl`; reguły wymagają pełnego tłumaczenia całej treści po uzupełnieniu luk. Zsynchronizowano kopie skilla i wygenerowano cztery ćwiczenia dla tego samego znaczenia, profilu i taksonomii.
- Kontrole: wejście, profil i taksonomia przeszły walidację schematów; wersja i SHA-256 taksonomii odpowiadają profilowi. Cztery ćwiczenia i cała partia przeszły walidację schematów oraz kontrolę ID celów i luk. Kopie skilla są zgodne z wersją repozytoryjną.
- Decyzje: `hints` pozostaje opcjonalne dla izolowania gramatyki; w bieżącej partii wszystkie listy są puste.
- Nierozstrzygnięte: brak.
- Wynik: pełny JSON z czterema ćwiczeniami i polskim zdaniem w każdym zostaje zwrócony użytkownikowi; ćwiczeń nie zapisano w bazie.
