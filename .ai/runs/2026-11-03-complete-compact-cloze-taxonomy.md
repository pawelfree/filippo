# Pełna, zwięzła taksonomia w generowaniu cloze

Data: 2026-11-03. Status: zakończony.

Cel: udostępnić generatorowi wszystkie kategorie i poziomy gramatyczne bez zbędnych metadanych.

Ustalenia: wcześniejszy filtr wysyłał 133 z 348 wariantów, wybierając siedem kategorii i poziomy A1–B1. Nie wynikał z profilu ani reguł generatora. Pełna taksonomia ma 16 kategorii, 58 konstrukcji, 348 wariantów i 448 relacji.

Działania: dodano projekcję pełnej taksonomii. Zachowuje identyfikatory, nazwy, definicje wariantów, podstawowe CEFR i aspekty, warunki szczególnych reguł oraz relacje. Pomija m.in. powtarzalne `slug`, redakcyjne opisy CEFR, zakresy poziomów, statusy mapowania, źródła, przykłady i metadane pliku. Profil przekazuje kompetencje wszystkich 348 wariantów. Walidacja używa nadal pełnych lokalnych plików.

Pomiar: rozmiar samej części taksonomii po zagnieżdżonym kodowaniu JSON używanym przez żądanie HTTP wynosi 256 069 B. Pełna taksonomia ze wszystkimi polami miałaby 385 574 B, więc projekcja oszczędza 129 505 B (33,6%). Dotychczasowa niepełna taksonomia zajmowała 134 180 B; względem niej nowa część jest większa o 121 889 B (90,8%), ponieważ zawiera wszystkie warianty i relacje. Pomiar nie obejmuje profilu, znaczeń ani instrukcji skilla.

Sprawdzenie: `npm run build` i 10 testów serwisu cloze przeszły. Test weryfikuje komplet identyfikatorów kategorii, konstrukcji, wariantów i relacji oraz obecność profilu dla 348 wariantów. Nie uruchamiano płatnego generowania.

Wynik: generator ma pełny wybór gramatyki, a taksonomia wysyłana do API jest o jedną trzecią mniejsza od pełnego surowego pliku.
