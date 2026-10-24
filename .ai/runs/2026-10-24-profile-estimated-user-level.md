# Estimated user level update

Date: 2026-10-24  
Status: complete

## Objective

Update the profile page for the schema 1.2.0 estimated user level.

## Related spec

[Estimated user level in profile](../specs/2026-10-24-profile-estimated-user-level.md)

## Actions and checks

- Inspected the changed profile and schema.
- Confirmed the profile schema requires `estimated_user_level` and constrains the CEFR value, confidence, and assessment provenance.
- Added the typed estimated-level property and a separate profile-page card for CEFR level, confidence, assessment source, date, and evidence count.
- Kept the overall level separate from per-variant mastery, and described it as an estimate rather than a certification or grammar limit.
- `npm run build`, `node --check public/profile.js`, and `git diff --check` passed.
- Restarted NestJS; startup succeeded with the updated profile and schema.

## Decisions

- Present the overall estimated CEFR level separately from per-variant mastery scores.
- Label it as an estimate, include its evidence context, and show null as unknown.

## Unresolved issues and outcome

No unresolved issues. The app is running locally at `http://localhost:3000`.
