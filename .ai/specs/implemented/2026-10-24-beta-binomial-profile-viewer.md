# Beta-Binomial profile viewer

Status: implemented  
Created: 2026-10-24
Implemented: 2026-10-24; all acceptance criteria met.

## Problem

Competence profile schema 1.3.0 adds a Bayesian model and changes unpracticed competencies to a prior-only state with mastery 0.5 and confidence 0. The profile page still expects nullable mastery and recent-window performance fields from schema 1.2.0.

## Intended behavior

Show prior-only competencies as lacking evidence, not as demonstrated 50% mastery. Summaries count only competencies with positive effective evidence. Details expose alpha/beta, effective evidence, trend state, and first-attempt totals. Explain the configured Beta-Binomial model. Validate arithmetic relationships between model parameters and derived profile fields before serving the profile.

## Scope

Update the read-only profile page and its types/loader for schema 1.3.0. Do not alter user profile or generation rule source documents.

## Acceptance criteria

- [x] Application types match the schema 1.3.0 profile fields.
- [x] Prior-only competencies are visibly distinct from assessed competencies.
- [x] The UI no longer expects removed recent-window fields.
- [x] Bayesian model and per-competency trend state are represented clearly.
- [x] Startup checks derived mastery, confidence, trend, and trend-state invariants.
- [x] Build and application startup pass with the current profile.

## Open questions

None.

## Related run

[Implementation run](../runs/2026-10-24-beta-binomial-profile-viewer.md)
