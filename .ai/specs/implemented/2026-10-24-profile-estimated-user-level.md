# Estimated user level in profile

Status: implemented  
Created: 2026-10-24
Implemented: 2026-10-24; all acceptance criteria met.

## Problem

Profile schema 1.2.0 adds an overall estimated CEFR level for the learner. The profile page currently displays competency estimates only and does not show this new field.

## Intended behavior

Display the estimated user CEFR level, confidence, evidence count, assessment date, and assessment source where available. Explain that it is an estimate used to calibrate sentence complexity, distinct from variant mastery and not a certification. Represent a missing level as unknown.

## Scope

Update profile types and the read-only profile page to consume the required `estimated_user_level` field. Existing schema validation remains the gate before profile data is served.

## Acceptance criteria

- [x] Profile types include the new schema 1.2.0 field.
- [x] Profile page presents estimated CEFR level and assessment context.
- [x] Missing level is shown as unknown, never as zero or A1.
- [x] The build succeeds and the application starts with the updated profile.

## Open questions

None.

## Related run

[Implementation run](../runs/2026-10-24-profile-estimated-user-level.md)
