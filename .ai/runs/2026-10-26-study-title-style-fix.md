# Poprawa stylu tytułu ekranu „Nauka”

- **Data:** 2026-10-26
- **Status:** zakończony.
- **Cel:** ujednolicić tytuł [ekranu „Nauka”](../../public/study.html) z pozostałymi widokami zgodnie z [wdrożoną specyfikacją](../specs/implemented/2026-10-26-study-screen.md).
- **Działania:** zmieniono nagłówek na „Nauka słownictwa”, z pogrubionym pierwszym słowem i kursywą wyłącznie w drugim. Komunikat startowy dopasowano do etykiety przycisku „Rozpocznij” lub „Kontynuuj”.
- **Sprawdzenie:** porównano znaczniki tytułów istniejących ekranów i sprawdzono widok w Chrome; `npm run build:browser`, dwa testy ekranu nauki oraz `git diff --check` przeszły.
- **Decyzje:** zachowano wspólną regułę `h1` i `h1 em` bez nowego CSS.
- **Nierozstrzygnięte:** brak.
- **Wynik:** tytuł używa tego samego wzorca co pozostałe ekrany.
