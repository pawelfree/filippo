# Przywrócenie stylu nawigacji LexicalSense

Date: 2026-10-25
Status: completed
Objective: Ustalić przyczynę utraty stylu przycisków nawigacji na stronie LexicalSense i ją poprawić.
Related spec: [Strona tworzenia i zapisu LexicalSense](../specs/implemented/2026-10-25-lexical-sense-import.md)

## Actions and checks

- Porównano arkusze ładowane przez trzy strony. Reguły `.page-nav` były wyłącznie w `profile.css`, którego `lexical-senses.html` nie ładuje.
- Kontrola odwołań do arkuszy wykazała: `index: styled`, `profile: styled`, `lexical-senses: UNSTYLED` (kod wyjścia 1).
- Przeniesiono reguły `.page-nav`, w tym wariant mobilny, z `profile.css` do współdzielonego `styles.css`.
- Ta sama kontrola po zmianie zwróciła `styled` dla wszystkich trzech stron (kod wyjścia 0). `git diff --check` przeszedł.

## Decision

Przenieść wspólne reguły nawigacji do `styles.css`, ładowanego na każdej stronie.

## Unresolved issues

Brak.

## Outcome

Styl nawigacji LexicalSense jest dostępny przez arkusz ładowany przez wszystkie widoki. [Lesson](../lessons.md).
