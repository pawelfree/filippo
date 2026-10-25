# LexicalSense JSON design

- Date: 2026-10-25
- Status: complete
- Objective: define how input LexicalItem entries become JSON records for their Italian meanings and uses.
- Related spec: none; the requested `creation.rules.md` is the agent-facing procedure.
- Actions: read project records and the domain model; delegated primary-source research; wrote [creation rules](../docs/lexical_sense/creation.rules.md), a [LexicalSense JSON Schema](../docs/lexical_sense/lexicalsense.schema.json), and a [research note](../docs/lexical-sense-research.md).
- Checks and results: reviewed the schema fields against the rules and the existing exercise schema's `lexical_sense_id` reference. No tests were run; no real lexical input list was supplied or needed for the rules.
- Decisions: confine artifacts to lexical sense creation. The user clarified that no input list is needed. An illustrative data file was removed to avoid presenting sample senses as real learner data. The exercise schema and generation rules were left unchanged.
- Unresolved issues: a production catalog of approved lexical sources and their reuse terms is not yet defined; the rules specify a conservative default and deferral path.
- Outcome: agent-facing procedure and schema are ready for review and later implementation.
