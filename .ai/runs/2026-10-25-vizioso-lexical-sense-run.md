# Vizioso LexicalSense trial run

- Date: 2026-10-25
- Status: complete
- Objective: apply [creation.rules.md](../docs/lexical_sense/creation.rules.md) to the raw Italian word `vizioso` and produce sense JSON only.
- Input: one raw word; no application LexicalItem registry or prior sense records were supplied. This trial creates run-scoped parent item IDs, documented in the input fixture.
- Sources: Wikizionario Italian entry `vizioso` (revision 3652663) and Wikidata Lexeme L1228120 for noun part of speech. Definitions and examples in the output are authored paraphrases, not copied source text.
- Actions: identified adjective and noun entries, then considered the adjective's moral and defective uses as separate meanings.
- Checks and results: read the exact Wikizionario entry revision and Wikidata noun lexeme. The entry separates two adjective uses and one noun use. All three output records passed the repository's Ajv Draft 2020-12 schema validation. Authored examples were reviewed against their own definitions; no corpus attestation is claimed.
- Decisions: separate adjective and noun LexicalItems; output two adjective senses and one noun sense in a trial namespace.
- Unresolved issues: no production item IDs or repository exist yet; trial IDs must not be imported without deduplication.
- Outcome: [input fixture](../docs/lexical_sense/examples/vizioso.input.json) and [result JSON](../docs/lexical_sense/examples/vizioso.result.json) contain a complete trial run with three sense records and no deferred candidates.

Model update on 2026-10-25: the linked fixtures were converted to `LexicalSense` schema 2.0.0 with `lexical_item_it` stored in each sense. Parent item IDs described above record the original trial design and are no longer present in the linked files; see the [model correction](2026-10-25-inline-lexical-item.md).
