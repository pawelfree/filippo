# Propozycja skilla generującego ćwiczenia

- Data: 2026-11-03
- Status: zakończony
- Cel: ocenić istniejące kontrakty LexicalSense, profilu, taksonomii i ćwiczeń oraz zaproponować skill generujący cztery zadania na znaczenie.
- Specyfikacje: brak nowej specyfikacji; praca koncepcyjna.
- Działania: przeczytano dokumenty w `.ai/docs/`, sprawdzono strukturę bazy i aktualne dane przykładowe.
- Kontrole: SHA-256 taksonomii jest zgodny z profilem; taksonomia ma 348 wariantów, profil ma wyniki prób dla 3, a 345 ma tylko prior.
- Decyzje: przed implementacją trzeba uzgodnić regułę liczby zadań (obecnie dokładnie jedno na znaczenie), powiązanie wejściowych rekordów bez ID z `lexical_sense_id` oraz prezentację wskazówek w schemacie.
- Nierozstrzygnięte: czy cztery ćwiczenia są generowane zawsze jako zestaw, czy wybierane po jednej próbie w czasie nauki.
- Wynik: propozycja architektury i zasad doboru przekazana użytkownikowi; nie zmieniono reguł generowania ani schematów.
