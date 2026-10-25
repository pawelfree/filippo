# LexicalSense output simplification

- Date: 2026-10-25
- Status: complete
- Objective: remove the separate `reused_sense_ids` list from the lexical creation result.
- Related rules: [creation.rules.md](../docs/lexical_sense/creation.rules.md).
- Actions: changed the deduplication and batch-output rules so `lexical_senses` contains one complete record per resolved sense, including an existing sense with its stable identifier.
- Checks and results: reviewed the affected rule sections for consistency; no tests were run for this documentation edit.
- Decision: the result should provide full meaning records directly; deduplication remains an internal step and preserves existing IDs.
- Unresolved issues: none for this change.
- Outcome: the separate ID list was removed.
