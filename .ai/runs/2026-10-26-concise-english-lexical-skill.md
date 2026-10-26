# Concise English lexical-sense skill

Date: 2026-10-26
Status: completed
Objective: Translate the local `create-lexical-senses` instructions to concise English while preserving output and research rules.

## Actions

- Rewrote `SKILL.md` and `references/creation.rules.md` in English.
- Removed repeated API, file-output, and schema explanations while retaining research, evidence, splitting, deferral, coverage, and deduplication rules.

## Checks

- JSON Schema and Responses format files parse successfully.
- Frontmatter and all linked resources are present.
- The rewritten instruction files contain no Polish text and total 606 words.
- The bundled skill validator could not run because its environment lacks the `yaml` Python module; no dependency was installed for this documentation-only check.

## Outcome

The skill instructions are concise English while retaining the source research, evidence, sense-boundary, deferral, coverage, and output requirements.
