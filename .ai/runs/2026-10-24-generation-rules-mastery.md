# Poprawka opisu mastery w regułach generatora

- Date: 2026-10-24
- Status: complete
- Objective: align `generation_rules.md` with the profile schema 1.3.0 representation of prior-only mastery and evidence.
- Relevant spec: none; documentation correction based on `.ai/docs/competence_profile/profile.schema.json` and `.ai/docs/profile_update.md`.
- Actions: updated the profile-reading and target-selection rules in `.ai/docs/generation_rules/generation_rules.md`.
- Checks and results: inspected every matching mastery reference; both instructions now describe prior-only `mastery=0.5`, distinguish it from observed evidence, clarify that `confidence` is evidence volume, and explain that `trend=insufficient_data` may coexist with positive evidence. The sole remaining `mastery=null` mention explicitly says the schema does not use that representation. No tests were run; this was a documentation-only change.
- Decisions: kept the existing qualitative prioritization and added no numeric selection thresholds.
- Unresolved: none.
- Outcome: completed.
