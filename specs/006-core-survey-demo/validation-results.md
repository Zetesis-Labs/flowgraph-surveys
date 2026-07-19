# Validation Results: Core Survey Demo

**Date**: 2026-07-20  
**Runtime**: Node.js 22.22.3, pnpm 10.14.0

## Automated evidence

- Monorepo unit/integration: 47 files, 198 tests passed.
- Governed package coverage: 100% statements (1123/1123), branches (763/763),
  functions (287/287), and lines (966/966).
- Demo-specific Vitest: 18 tests passed.
- Existing React adapter Playwright: 7 tests passed.
- Demo Playwright: 14 tests passed across Chromium desktop and mobile profiles.
- Axe: zero serious or critical violations on introduction, active survey, and
  completion at both viewport profiles.
- Fixture authoring: no structural errors, no probe errors, all goldens passed, 14/14
  transitions covered (100%).
- Primitive inventory: 7/7 v1 guards (`always`, `answered`, `selected`, `not`, `all`,
  `any`, `cmp`) and 4/4 numeric expressions (`num`, `answer`, `score`, `sum`) are
  present in the executable fixture. A direct test also preserves `unknown` for both
  compound logistical guards while their numeric inputs are absent.
- TypeScript, ESLint, Prettier, dependency boundaries, production build, publint,
  package consumers, and type-package checks passed.
- Production demo bundle: 97.01 KiB gzip JavaScript and 5.20 KiB gzip CSS at the
  measured build.

## Journey evidence

- Sleep, stress, and life-change routes each open from the shared entry and reconverge.
- Request-priority, spacious-capacity, and focused-capacity logistical routes each
  execute from the same fixture and reconverge before submission.
- Conditional sleep detail appears only for its controlling option.
- Conditional request detail appears only after a specific request is entered and
  remains required while visible.
- Backtracking preserves applicable answers; route correction excludes abandoned
  answers from active truth while retaining event history.
- Refresh restores the active page and committed answers.
- Submission seals the session; refresh remains sealed and duplicate edits are absent.
- New demonstration requires confirmation, can be cancelled, and replaces the one
  retained local session only after confirmation.
- Missing, range, and text-length problems preserve input, keep the graph node stable,
  and focus the first invalid control.

## Visual evidence

Settled-state screenshots were inspected at 1280×900 and 390×844 for the introduction,
an active stress-route page, and the expanded five-control logistical page. No
horizontal overflow, clipped required control, unreadable density, or hidden navigation
action was found. No score or scoring terminology appears before or after any
logistical branch. Motion-reduction and native control semantics remain intact.

## Manual-only evidence

- SC-002 (90% of first-time participants completing without assistance under eight
  minutes) requires a post-delivery usability study and is not claimed by automated
  tests.
