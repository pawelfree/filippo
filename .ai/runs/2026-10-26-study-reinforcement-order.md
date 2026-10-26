# Kolejność utrwaleń w nauce

- **Data:** 2026-10-26
- **Status:** zakończony.
- **Cel:** po `Again` pokazać pozostałe nowe znaczenia przed ponowną prezentacją błędnie ocenionego nowego znaczenia.
- **Specyfikacja:** [ekran Nauka](../specs/implemented/2026-10-26-study-screen.md).
- **Działania:** dodano test odtwarzający natychmiastowy powrót pierwszego znaczenia mimo drugiego nowego w kolejce; rozdzielono utrwalenia według ostatniej formalnej oceny `due` lub `new` w bieżącym dniu.
- **Sprawdzenie:** test przed poprawką był czerwony i wskazał ponowną prezentację tego samego znaczenia; po zmianie przeszedł. `npm run build` zakończył się poprawnie, `npm test`: 18/18. Istniejący test potwierdził zachowanie pierwszeństwa utrwalenia po należnej powtórce.
- **Decyzje:** zachować pierwszeństwo terminów FSRS i utrwaleń po należnych powtórkach; utrwalenia nowych znaczeń dać po pozostałych nowych.
- **Nierozstrzygnięte:** brak.
- **Wynik:** błędnie ocenione nowe znaczenie wraca po pozostałych nowych; terminy FSRS i utrwalenia należnych powtórek zachowują pierwszeństwo.
