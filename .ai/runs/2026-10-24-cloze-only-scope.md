# Cloze-only scope alignment

- Date: 2026-10-24
- Status: complete
- Objective: align profile schema, product documents, and profile viewer with the confirmed cloze-only exercise scope.
- Relevant spec: none; scope confirmed directly by the user.
- Actions: narrowed the profile contract, sample, update/evaluation contracts, generation/product documentation, and profile viewer to open cloze. Removed stale open questions about exercise formats and sample-profile provenance from the current design review.
- Checks and results: scoped text search found no alternate exercise formats in current schemas, contracts, product documents, or app code. The current sample declares profile schema 2.0.0 and its populated task type is `fill_blank`. The exact `profile.json` diff could not be inspected: sandbox shell startup failed, and the elevated read-only request was rejected because automatic approval review disconnected before completion.
- Decisions: constrain task format to `fill_blank`, bump profile schema version to 2.0.0, update the current profile document to the new contract, and retain no alternate task-format options.
- Unresolved: the exact `profile.json` diff could not be inspected because of the tool restriction noted above. No historical usage was inspected or inferred.
- Outcome: completed the cloze-only alignment. Tests were not run.
