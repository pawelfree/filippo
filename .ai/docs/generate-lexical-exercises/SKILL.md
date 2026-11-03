---
name: generate-lexical-exercises
description: Generate Italian open-cloze exercises for stored LexicalSense meanings using a learner competence profile and grammar taxonomy. Use for personalized exercise generation; exclude creating lexical meanings.
---

# Generate Italian lexical exercises

Create one batch result for the supplied stored meaning or meanings.

1. Read [generation_rules.md](references/generation_rules.md) and follow it. Validate each supplied meaning against [lexical_sense_input.schema.json](references/lexical_sense_input.schema.json). When given a full stored `LexicalSense`, first project it to that smaller input; its database `id` must be retained.
2. Validate the supplied profile and taxonomy against [profile.schema.json](references/profile.schema.json) and [taxonomy.schema.json](references/taxonomy.schema.json). Check their version and taxonomy hash as required by the rules. Report invalid or incompatible input before generating exercises.
3. Plan four exercise slots per meaning across the whole batch. Prefer distinct, natural grammar targets and varied relative difficulty based on the profile. Generate and check at most three candidates per slot, counting revisions and changed targets against the same limit. Keep valid exercises; report each unfilled slot with its attempt count and reason.
4. Return `results` as defined by [generation_result.schema.json](references/generation_result.schema.json). Validate each successful exercise against [exercise.schema.json](references/exercise.schema.json), then check batch invariants: every input ID appears once, every meaning has positions 1–4 exactly once, exercise IDs are unique, and each exercise's `lexical_sense_id` matches its meaning. Return partial results explicitly when needed.

Return only the batch JSON object for valid input. Write files only when the caller requests a location.
