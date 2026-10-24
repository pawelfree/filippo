# Beta-Binomial profile viewer run

Date: 2026-10-24  
Status: complete

## Objective

Adapt the profile application to the changed profile schema and data.

## Related spec

[Beta-Binomial profile viewer](../specs/2026-10-24-beta-binomial-profile-viewer.md)

## Actions and checks

- Compared profile schema 1.3.0 and data changes with the current application.
- Confirmed 345 of 348 variants are prior-only and the current stored mastery/confidence/trend values agree with the configured model.
- Noted the profile page uses nullable mastery and recent-window fields that no longer match the new schema.
- Updated profile types and UI for `bayesian_model`, alpha/beta, trend state, and the reduced performance shape.
- Prior-only competency counts now use effective evidence rather than `mastery !== null`; the page explains why a 0.5 prior is not evidence of mastery.
- Added startup consistency checks for posterior mastery, confidence, trends, and state counts.
- `npm run build`, `node --check public/profile.js`, and `git diff --check` passed; NestJS started successfully with the current schema and profile.

## Decisions

- Treat positive effective evidence as the distinction between an assessed posterior and a prior-only value.
- Preserve the user-edited profile, schema, and generation rule documents unchanged.

## Unresolved issues and outcome

The new user-edited `.ai/docs/generation_rules/generation_rules.md` still refers to `mastery=null`, while profile schema 1.3.0 defines prior-only mastery as 0.5 with confidence 0. This documentation mismatch is outside the application update and remains for follow-up. The app is running locally at `http://localhost:3000`.
