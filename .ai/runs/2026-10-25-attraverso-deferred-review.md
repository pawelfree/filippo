# Review of deferred attravers(o) analyses

- Date: 2026-10-25
- Status: complete
- Objective: re-evaluate both deferred candidates from the `attraverso` trial under [creation.rules.md](../docs/lexical_sense/creation.rules.md).
- Related result: [attraverso.result.json](../docs/lexical_sense/examples/attraverso.result.json).
- Actions: re-read the result and rules; checked the adverb in Italian and English Wiktionary and a historical usage pattern in Wikisource; checked that `attraverso` is also a form of the separate lemma `attraversare`; added the adverb sense and removed the verb-form candidate from this input's parent items; clarified the homographic-form rule.
- Checks and results: all three sense records passed Ajv Draft 2020-12 validation; all parent IDs and canonical forms match the input fixture; `deferred` is empty. The adverb example is authored and illustrates the documented sense, not a claimed contemporary corpus quotation.
- Decisions: the adverb has enough lexical evidence for an authored example; the verb form belongs to another LexicalItem and should not remain a deferred sense of `attraverso` without context selecting that lemma.
- Unresolved issues: production item IDs remain unavailable for this trial.
- Outcome: [attraverso.result.json](../docs/lexical_sense/examples/attraverso.result.json) now has three complete sense records and no deferred candidates.

Follow-up on 2026-10-25: the [verb-form expansion](2026-10-25-attraverso-verb-form-expansion.md) added the `attraversare` reading of raw `attraverso`. The linked JSON now contains five senses; the outcome above records this review's state.
