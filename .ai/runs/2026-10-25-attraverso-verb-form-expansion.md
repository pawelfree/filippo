# Attraverso verb-form expansion

- Date: 2026-10-25
- Status: complete
- Objective: make raw-form lexical creation retain the verb reading of `attraverso` and its LexicalSense records under the lemma `attraversare`.
- Related rules: [creation.rules.md](../docs/lexical_sense/creation.rules.md).
- Actions: reviewed the earlier `attraverso` result and the Wikizionario entries for `attraverso` and `attraversare`; identified the first-person present verb form and two clearly documented general verb uses.
- Checks and results: five LexicalSense records passed Ajv Draft 2020-12 validation; each parent ID matches the input fixture and sense IDs are unique. The output has no deferred candidates and covers three parent items.
- Decisions: distinguish an underspecified surface-form input from an input that already identifies one LexicalItem and part of speech.
- Unresolved issues: production LexicalItem IDs are unavailable; example IDs remain scoped to the trial. Narrower verb uses listed by the source were not resolved in this general-use trial.
- Outcome: [attraverso.result.json](../docs/lexical_sense/examples/attraverso.result.json) now includes two preposition senses, one adverb sense, and two `attraversare` verb senses matched from the input form `attraverso`.
