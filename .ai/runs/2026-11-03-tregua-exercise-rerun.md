# Ponowne wygenerowanie ćwiczeń „tregua”

- Data: 2026-11-03
- Status: historyczny; wynik zastąpiony 2026-11-03
- Cel: ponowić generowanie czterech ćwiczeń dla `cmvzt331p000dmspo5q12o5t5` po dodaniu obowiązkowej wskazówki znaczeniowej.
- Specyfikacje: brak odrębnej; obowiązuje [kontrakt skilla](../docs/generate-lexical-exercises/SKILL.md).
- Działania: użyto tego samego wejściowego znaczenia oraz tych samych plików profilu i taksonomii; przygotowano cztery ćwiczenia z `meaning_hint_pl` „wytchnienie; chwilowa przerwa od czegoś uciążliwego”. Czwarte zawiera dodatkową wskazówkę o czasowniku `dare`.
- Kontrole: walidacja wejścia, profilu, taksonomii, zgodności wersji i SHA-256; cztery ćwiczenia oraz cała partia przeszły walidację schematów. Cele gramatyczne występują w taksonomii i profilu.
- Decyzje: zwrócić użytkownikowi tylko żądane wskazówki zamiast pełnego JSON-a partii; wyniku nie zapisano w bazie.
- Nierozstrzygnięte: brak.
- Wynik: cztery pozycje przeszły ówczesny schemat, ale ich wskazówka znaczeniowa nie spełniła intencji użytkownika. Zobacz [ponowne generowanie z polskimi zdaniami](2026-11-03-exercise-polish-sentence.md).
