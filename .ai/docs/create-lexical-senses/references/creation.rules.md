# Creation rules

## Scope

Produce documented contemporary Italian meanings or uses for Polish-speaking learners. A record describes one sense, not an exercise, answer key, grammar target, or learning state. Put the lemma or fixed phrase directly in `lexical_item_it`.

## Resolve the input

- Preserve every original input in `coverage`.
- For an unspecified form, identify every source-backed reading: standalone lemma, inflected form, homograph, and fixed phrase. Use the appropriate lemma and part of speech for each sense. Do not create a separate sense for ordinary inflection.
- Keep a supplied phrase intact only when it has an established meaning or collocation. Defer an unresolved boundary.
- Use supplied context, gloss, or intent to select readings. Without it, cover well-documented contemporary general uses; do not infer historical, obsolete, regional, or specialist uses from a dictionary label alone.
- If no checked source supports a reading, defer the original input as `not_found_in_sources`. Use `insufficient_evidence` when search or source checking is unavailable or inconclusive. Do not claim that a word does not exist.

## Research and evidence

- Search the web and open the sources. A search snippet is not evidence.
- Use one to three sources per sense. Each `evidence` entry needs a source type, a precise locator, and only the claims it supports: `meaning`, `part_of_speech`, `pattern`, `register`, `constraint`, or `example`.
- Support every stated meaning and part of speech. Support any non-`unknown` register, nonempty pattern or constraint, and every attested example. Use `unknown` when register evidence is unavailable.
- Prefer sources that directly describe the Italian reading and its use. A synonym or translation list alone is insufficient. Do not invent citations, frequency claims, labels, or source-backed examples.

## Sense boundaries

Split senses only when interpretation, valid context, required pattern, or meaningful constraint changes. Do not split by inflection, spelling variant, grammatical person, gender, number, topic, or alternate Polish translation alone. One fixed phrase belongs in one record with the full phrase as its headword.

## Record quality

- `definition_it`, `definition_pl`, and `glosses_pl` must describe the same one sense.
- Put required frames, prepositions, and fixed components in `usage.patterns_it`; typical combinations in `collocations_it`; meaningful limits in `constraints_pl`.
- Include at least one natural Italian example and matching Polish translation. Mark model-written examples `authored`. Mark sourced examples `attested` and connect them to a present `evidence_id`.
- Compare all candidates in the batch. Return one record for the same Italian sense even when multiple inputs produced it.

## Batch result

Return one object matching `openai.response.format.json`.

- `lexical_senses`: complete, schema-valid, nonduplicate records.
- `deferred`: unresolved inputs or readings with `reason_code` and `needed_evidence_or_decision`. Use only `ambiguous_item`, `insufficient_evidence`, `not_found_in_sources`, or `source_rights`.
- `coverage`: one entry per resolved reading, using `provided_context` or `general_use`; use `unresolved_input` for an unresolved input. Write `notes_pl` in Polish and state the reviewed scope or reason for deferral.

Return partial results when some inputs are deferred.
