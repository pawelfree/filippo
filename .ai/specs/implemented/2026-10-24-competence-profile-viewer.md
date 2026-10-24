# Competence profile viewer

Status: implemented  
Created: 2026-10-24
Implemented: 2026-10-24; all acceptance criteria met.

## Problem

The repository has a competency profile for the Italian grammar taxonomy, but no page for inspecting its estimates and practice evidence. The profile must be validated before it is served.

## Intended behavior

Add a second page that summarizes learner mastery estimates and lets the user inspect competencies grouped by taxonomy category. Show unknown estimates distinctly from scores, along with confidence, trends, exposure, performance, and recorded difficulties. Validate the profile with `profile.schema.json` before serving it, and ensure its taxonomy reference matches the active taxonomy data and variant IDs.

## Scope

Read-only profile API and browser page using `.ai/docs/competence_profile/profile.json`. No profile editing, learner identity management, or assessment calculation.

## Acceptance criteria

- [x] A second page links to and from the taxonomy browser.
- [x] The page visualizes profile summaries and details by taxonomy category and variant.
- [x] JSON Schema draft 2020-12 validation occurs before the profile is served.
- [x] Profile taxonomy digest and coverage match the active taxonomy.
- [x] Invalid profile data causes startup to fail with useful validation details.
- [x] Build and relevant checks pass.

## Open questions

None for this read-only profile viewer.

## Related run

[Implementation run](../runs/2026-10-24-competence-profile-viewer.md)
