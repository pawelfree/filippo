# Prisma migration URL override

- Date: 2026-10-25
- Status: complete
- Objective: resolve the `P1012` SQLite URL validation failure from `npm run db:migrate`.
- Related spec: none; this is an environment configuration issue.
- Actions: confirmed `prisma/schema.prisma` and `.env.example` use SQLite; reproduced the reported failure; compared only the URL protocols and found `.env` has `file:` while the shell exports `postgres:`.
- Checks and results: unmodified `npm run db:migrate` fails with the reported `P1012` error; `env DATABASE_URL=file:./dev.db npm run db:migrate` created `prisma/dev.db` and applied both checked-in migrations successfully.
- Decision: run the migration with the SQLite URL set for the command, leaving the intentional precedence of shell variables intact.
- Unresolved issues: the shell still exports a PostgreSQL `DATABASE_URL`, so future Prisma commands in this shell need a SQLite override or the exported variable removed.
- Outcome: the local SQLite database is migrated.
