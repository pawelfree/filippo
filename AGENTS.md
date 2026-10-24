# Project instructions for AI agents

Use the `.ai/` directory as the project's shared record of specifications, autonomous work, and lasting lessons. Read [.ai/README.md](.ai/README.md) before creating or moving any of these records.

## Specifications (SDD)

- Write each new specification in `.ai/specs/YYYY-MM-DD-slug.md`. Use the date the spec was created and a short lowercase, hyphenated slug.
- A spec must state the problem, intended behavior, scope, acceptance criteria, and any open questions. Keep implementation choices separate from requirements unless they are themselves required.
- Keep active specs in `.ai/specs/`. Move completed specs to `.ai/specs/implemented/`; move withdrawn or superseded specs to `.ai/specs/archive/`. Preserve the filename when moving, and record the reason and date in the spec.
- Before implementing a change covered by a spec, read it. Update its status and acceptance criteria as the work progresses. Do not mark it implemented until the criteria are met.

## Autonomous run logs

- For each autonomous AI work run, create or update one log in `.ai/runs/YYYY-MM-DD-slug.md`. The slug must distinguish runs on the same day.
- Record the objective, relevant spec links, actions taken, checks and results, decisions, unresolved issues, and final outcome. Keep the log factual and concise; do not put secrets or raw private data in it.
- Start the log when substantive work begins and finish it before ending the run. If interrupted, leave its current status and the next action clear.

## Lessons

- Read `.ai/lessons.md` before changing related behavior. Add a concise entry there after fixing a bug or discovering a reusable improvement or pitfall.
- Put a detailed lesson in `.ai/lessons/YYYY-MM-DD-slug.md` when context, examples, or a fuller explanation would help future work. Link it from `.ai/lessons.md`.
- A lesson states the observation, cause or evidence, the practice to follow, and where it applies. Do not turn guesses into rules; label unverified ideas clearly.

## Working rule

Keep the specification, run log, and lessons consistent with the actual work. Link related records using relative Markdown paths. Follow direct user instructions when they refine these conventions.

When spawning agents for simple tasks, use lower-capability models and lower reasoning effort.
