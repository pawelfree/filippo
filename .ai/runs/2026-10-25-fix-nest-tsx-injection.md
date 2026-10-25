# Fix Nest dependency injection in tsx development mode

- Date: 2026-10-25
- Status: complete
- Objective: resolve the startup error where `ProfileService` receives no `TaxonomyService` in the tsx runtime.
- Related spec: none.
- Actions: compared compiled and tsx metadata; reproduced the reported exception in a Nest application context; added an application-context regression test; added explicit injection tokens to the service and both controllers.
- Checks and results: regression test failed before the fix and passes after; the full TypeScript-source Nest application context starts; `npm run build`, all 3 tests, Prisma validation, and migration status pass.
- Decisions: preserve `start:dev` and make the required constructor injection token explicit at the failing seam.
- Unresolved issues: none known.
- Outcome: Nest dependency injection now works in tsx runtime.
