# Minimalne wejście LexicalSense do generowania ćwiczeń

- Data: 2026-11-03
- Status: zakończony
- Cel: ograniczyć wejście generatora do informacji potrzebnych do tworzenia ćwiczeń.
- Specyfikacje: brak nowej specyfikacji; korekta [reguł generowania](../docs/generation_rules/generation_rules.md).
- Działania: dodano [schemat projekcji znaczenia](../docs/generation_rules/lexical_sense_input.schema.json) i mapowanie pól z zapisanego `LexicalSense`.
- Kontrole: schemat JSON kompiluje się w Ajv 2020; przykładowa projekcja przechodzi walidację, pełny rekord z dodatkowymi polami jest odrzucany; `git diff --check`.
- Decyzje: wymagane są ID, forma włoska, część mowy, definicje i warunki użycia; włoskie przykłady są opcjonalne. Dane źródłowe i metadane zapisu nie trafiają do generatora.
- Nierozstrzygnięte: implementacja mapowania z bazy pozostaje częścią przyszłej integracji.
- Wynik: generator ma osobny kontrakt wejścia zamiast wymogu pełnego schematu utworzenia `LexicalSense`.
