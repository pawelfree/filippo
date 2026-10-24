# AI project records

This directory holds the project's durable AI work records. `AGENTS.md` in the project root sets the rules for using them.

| Path | Purpose | Naming |
| --- | --- | --- |
| `specs/` | Active SDD specifications | `YYYY-MM-DD-slug.md` |
| `specs/implemented/` | Specifications whose acceptance criteria are met | Keep the original filename |
| `specs/archive/` | Withdrawn or superseded specifications | Keep the original filename |
| `runs/` | Logs of individual autonomous AI work runs | `YYYY-MM-DD-slug.md` |
| `lessons.md` | Short index of reusable lessons | Fixed filename |
| `lessons/` | Longer, linked lesson records | `YYYY-MM-DD-slug.md` |

Use the creation date in filenames, with four-digit year, two-digit month and day. Slugs use lowercase letters, numbers, and hyphens. If two records would have the same name, make the slug more specific rather than overwriting a record.

## Recommended record content

**Specification:** title, status, created date, problem, intended behavior, scope, acceptance criteria, open questions, and links to related records. Status is `active`, `implemented`, or `archived`; the file's folder must match its status. When moved, record the date and reason.

**Run:** title, date, status, objective, related spec, actions, checks and results, decisions, unresolved issues, and outcome. A run log is a record of what happened, not a substitute for a specification.

**Lesson:** title, date, situation, evidence or cause, rule for future work, scope, and related links. Summarize durable lessons in `lessons.md`; use a separate file when a summary would omit important context.
