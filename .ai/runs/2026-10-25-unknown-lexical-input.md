# Unknown lexical input handling

- Date: 2026-10-25
- Status: complete
- Objective: define what lexical creation returns when an input form cannot be confirmed as an Italian LexicalItem.
- Related rules: [creation.rules.md](../docs/lexical_sense/creation.rules.md).
- Actions: reviewed the input-resolution and batch-output rules; found that `deferred` and `coverage` required a parent ID even when none could be resolved; added a raw-form route, a source-limited `not_found_in_sources` code, and an illustrative result shape.
- Checks and results: reviewed the revised input and output sections for consistent field names. No tests were run for this documentation change.
- Decisions: report the raw input with `not_found_in_sources`, no fabricated parent or sense ID, and no automatic spelling correction.
- Unresolved issues: none expected.
- Outcome: unconfirmed input yields no LexicalSense and remains traceable in `deferred` and `coverage` without a fabricated parent ID.
