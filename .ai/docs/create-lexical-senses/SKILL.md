---
name: create-lexical-senses
description: Create Italian LexicalSense JSON records from supplied words or phrases by searching and checking web sources under this skill's rules. Use for lexical meaning creation or reruns; exercise generation is outside this skill.
---

# Create Italian lexical senses

Read [creation.rules.md](references/creation.rules.md) as the procedure and [lexicalsense.schema.json](references/lexicalsense.schema.json) as the contract for each completed sense. For OpenAI Responses API, pass [openai.response.format.json](references/openai.response.format.json) as `text.format` and enable `web_search` in the request's `tools` array. Check each returned sense against the record schema and the nonstructural rules before accepting it.

## Run

1. Accept raw Italian words or phrases as well as objects with context. Preserve each original input. Analyze missing parts of speech or lemmata under the bundled rules.
2. Search the web for each input, open relevant results, and verify the current readings against the pages themselves. Record the sources used in `evidence`. Apply the selection, split, deferral, and deduplication rules in the bundled rules. Compare candidates produced in this run so the same meaning appears only once in the result.
3. Produce one batch JSON object with `lexical_senses`, `deferred`, and `coverage`. Each completed sense contains the Italian word or phrase in `lexical_item_it`.
4. Check each completed record against `lexicalsense.schema.json` and the nonstructural checks in the bundled rules. Put unresolved candidates in `deferred`.
5. Return the batch JSON object as the result; its arrays provide the counts and unresolved details. Write input or result files only when the user requests files; use the location they specify. If they request a file without a location, ask for the destination before writing.

The OpenAI format allows one to three evidence entries per sense, keyed `e1` through `e3`. Ensure every attested example's `evidence_id` names a present key. If three sources cannot support the sense, defer it under the bundled rules.

The skill searches for sources itself; callers provide words or phrases, not precollected dictionary data. A skill file cannot enable an API tool by itself: the Responses API caller must include `{ "type": "web_search" }` in `tools` alongside the skill. If web search is unavailable or no usable page can be checked, return the affected input in `deferred` with `insufficient_evidence` rather than inventing a source.
