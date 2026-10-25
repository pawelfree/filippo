# SQLite and Prisma integration

- Date: 2026-10-25
- Status: complete
- Objective: add SQLite persistence through Prisma to the NestJS app.
- Related spec: none; this is direct implementation of the user's request.
- Actions: inspect project instructions, current NestJS modules, runtime scripts, and domain records; add Prisma schema and database integration.
- Checks and results: Prisma client generated; schema validated; initial migration applied with `prisma migrate deploy`; SQLite client connected; `npm run build` and `npm test` passed.
- Decisions: persist LexicalSense, generated task, per-sense FSRS state, and review history; keep current JSON-backed read-only taxonomy/profile loading unchanged.
- Unresolved issues: `prisma migrate dev` returned an empty schema-engine error in this environment, so first setup and deployment use `prisma migrate deploy`; `prisma migrate diff` verified the checked-in SQL against the schema.
- Outcome: SQLite/Prisma integration is ready; the current app can inject `PrismaService` and use the generated models.
