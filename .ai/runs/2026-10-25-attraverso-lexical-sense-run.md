# Attraverso LexicalSense trial run

- Date: 2026-10-25
- Status: complete
- Objective: apply [creation.rules.md](../docs/lexical_sense/creation.rules.md) to the raw Italian word `attraverso` and produce meaning JSON only.
- Input: one raw word; no application LexicalItem registry or prior sense records were supplied. The trial assigns run-scoped IDs to candidate parent items in an input fixture.
- Sources: Italian Wikizionario entry `attraverso` (revision 3815171), English Wiktionary entry (revision 92140329), Wikidata Lexemes L1165448 and L1413197, and usage attestations in Italian Wikipedia articles about Holmenkollen and Mendelian Inheritance in Man.
- Actions: identified preposition, adverb, and first-person verb-form readings; separated spatial and instrumental preposition meanings.
- Checks and results: both complete sense records passed Ajv Draft 2020-12 validation; two candidates remain deferred. Italian Wikizionario identifies spatial preposition, adverb, and verb-form readings; its synonym list plus Italian Wikipedia usage supports the instrumental preposition reading. Wikidata's preposition Lexeme L1413197 has an adverb-like sense gloss, so it was not used as semantic evidence. Authored examples were reviewed against their definitions; no corpus attestation is claimed for their exact sentences.
- Decisions: produce two preposition senses; defer the adverb pending a reliable contemporary example, and defer the verb-form route pending context that selects `attraversare`.
- Unresolved issues: no production item IDs or repository exist yet; trial IDs must not be imported without deduplication.
- Outcome: [input fixture](../docs/lexical_sense/examples/attraverso.input.json) and [result JSON](../docs/lexical_sense/examples/attraverso.result.json) contain two complete preposition senses plus explicit adverb and verb-form deferrals.

Follow-up on 2026-10-25: the [deferred review](2026-10-25-attraverso-deferred-review.md) corrected the output. The linked JSON now contains three complete senses and no deferred candidates; the outcome above records the original run.
