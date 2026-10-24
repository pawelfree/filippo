# Grammar taxonomy viewer

Status: implemented  
Created: 2026-10-24
Implemented: 2026-10-24; all acceptance criteria met.

## Problem

The repository contains an Italian grammar taxonomy in JSON but has no application for browsing it. The data must be checked against its JSON Schema before users see it.

## Intended behavior

The application presents categories, constructions, variants, and variant details, including CEFR information and related variants. It reads the taxonomy from `.ai/docs/grammar_taxonomy/taxonomy.json`. Startup validates that file against `.ai/docs/grammar_taxonomy/taxonomy.schema.json`; invalid data produces a clear error and is not served.

## Scope

NestJS backend, a simple browser interface, local setup instructions, and checks for successful and failed schema validation. Editing taxonomy data is outside this viewer.

## Acceptance criteria

- [x] NestJS application starts locally and serves a taxonomy browser.
- [x] The browser supports navigating the hierarchy and inspecting variant details and relations.
- [x] JSON Schema draft 2020-12 validation runs before taxonomy data is served.
- [x] Invalid taxonomy causes startup to fail with useful validation errors.
- [x] Build and relevant checks pass.

## Open questions

None for the initial read-only skeleton.

## Related run

[Implementation run](../../runs/2026-10-24-grammar-taxonomy-viewer.md)
