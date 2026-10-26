---
name: create-lexical-senses
description: Create source-backed Italian LexicalSense JSON records from supplied words or phrases. Use for lexical meaning creation or reruns; exclude exercise generation.
---

# Create Italian LexicalSense records

Create one batch JSON object for the supplied Italian inputs.

1. Read [creation.rules.md](references/creation.rules.md) and follow it. Read [lexicalsense.schema.json](references/lexicalsense.schema.json) for each sense's contract.
2. Search and open web sources for every candidate. Resolve lemma, part of speech, and reading before writing a sense.
3. Return `lexical_senses`, `deferred`, and `coverage` as defined by [openai.response.format.json](references/openai.response.format.json). Deduplicate senses within the batch.
4. Validate every completed sense against the schema and the rules. Put unresolved inputs or readings in `deferred`.

For the Responses API, pass `openai.response.format.json` as `text.format` and enable `web_search`. Return only the batch JSON object. Write files only when the caller requests a location.
