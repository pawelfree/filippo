# Lessons learned

Read this index before working on related areas. Add concise, evidence-based lessons here after a bug fix or other reusable finding. Put longer explanations in `lessons/YYYY-MM-DD-slug.md` and link them from the entry.

- When a CSS class sets `display`, add an explicit `[hidden] { display: none }` rule for views initially hidden by HTML. The taxonomy browser's grid rule would otherwise override the user-agent treatment of `hidden` before data loaded. Applies to browser interfaces with conditional sections.
- When validating JSON Schema with Ajv, install and register `ajv-formats` for schemas that rely on `date-time` or `uri`; Ajv does not enforce those format keywords by itself. Applies to runtime validation of profile metadata and timestamps.


