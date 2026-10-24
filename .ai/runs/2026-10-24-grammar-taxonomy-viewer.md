# Grammar taxonomy viewer run

Date: 2026-10-24  
Status: complete

## Objective

Build a NestJS skeleton that visualizes the taxonomy and validates it against its schema before loading.

## Related spec

[Grammar taxonomy viewer](../specs/implemented/2026-10-24-grammar-taxonomy-viewer.md)

## Actions and checks

- Inspected project records and the taxonomy structure.
- Confirmed the data resides under `.ai/docs/grammar_taxonomy`.
- Built a NestJS API and static browser for the hierarchy, CEFR details, examples, and relations.
- Added draft 2020-12 schema validation before service startup.
- `npm run build`, `npm test` (2 tests), and `node --check public/app.js` passed.
- Local HTTP smoke check returned 200 for the page, assets, and `/api/taxonomy`.

## Decisions

- Keep the initial browser read-only and serve the existing JSON as the source of truth.
- Use the repository's `.ai` directory; `./ai` in the request has no matching directory.

## Unresolved issues and outcome

No unresolved issues. Browser-based visual inspection was unavailable in the execution environment; HTTP and code checks passed. The read-only skeleton is complete.
