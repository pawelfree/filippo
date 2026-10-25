# Browser TypeScript migration

- Date: 2026-10-25
- Status: complete
- Objective: make TypeScript the source for all browser scripts and compile them into the static assets served by Nest.
- Related specs: [taxonomy viewer](../specs/implemented/2026-10-24-grammar-taxonomy-viewer.md), [profile viewer](../specs/implemented/2026-10-24-competence-profile-viewer.md), [LexicalSense import](../specs/implemented/2026-10-25-lexical-sense-import.md).
- Actions: moved the three browser scripts into `src/browser/*.ts`, added browser compilation, served generated scripts from `/assets/`, updated the pages and the LexicalSense flow test, and removed the old `public/*.js` sources. Documented the build in README.
- Checks: `npm run build` passed; `npm test` passed (4 tests); local server returned `200` with `text/javascript` for `/assets/app.js` after the static route ordering fix.
- Decision: keep browser JavaScript as generated output because browsers execute JavaScript; put its editable source under `src/`.
- Unresolved issues: browser changes require restarting `npm run start:dev` to rebuild their scripts.
- Outcome: TypeScript is the editable browser source; generated JavaScript lives only in ignored `dist/browser/`.
