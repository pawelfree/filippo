# Multi-gap exercise contract

- Date: 2026-10-24
- Status: complete
- Objective: specify exercises with multiple word-level gaps tied to one `LexicalSense`, while allowing multiple grammar observations per complete answer.
- Relevant spec: none; the user supplied the required behavior.
- Actions: created `.ai/docs/exercise.schema.json`; updated gap construction, answer observations, and FSRS scope in `generation_rules.md`; aligned P0.2 and P0.4 in the work plan.
- Checks and results: scoped search found no remaining rule requiring one gap per exercise or a multiword gap. A JSON syntax check could not start because sandbox shell startup failed with `RTM_NEWADDR: Operation not permitted`. No tests were run.
- Decisions: create a JSON Schema at `.ai/docs/exercise.schema.json`; represent prompts as ordered text/gap parts, answer keys as per-gap word fragments, and grammar checks per answer key. Keep the single `lexical_sense_id` at exercise level as the FSRS unit.
- Unresolved: JSON syntax could not be machine-checked because the shell could not start; schema was reviewed structurally in the edited text.
- Outcome: completed the requested rule and schema updates.
