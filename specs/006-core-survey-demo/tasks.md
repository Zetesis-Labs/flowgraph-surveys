# Tasks: Core Survey Demo

**Input**: Design documents from `/specs/006-core-survey-demo/`

**Tests**: Required by the specification, including core conformance, 100% transition
coverage, unit/integration coverage, Playwright, and Axe.

## Phase 1: Setup

- [x] T001 Create the `apps/survey-demo` workspace skeleton and HTML entry point
- [x] T002 Add pinned React, Vite, Tailwind CSS, test, build, and dev configuration
- [x] T003 Wire the app into root TypeScript references and root demo scripts

## Phase 2: Foundational

- [x] T004 [P] Author the immutable three-route fixture in `apps/survey-demo/src/fixture/schema.ts`
- [x] T005 [P] Author executable route and correction goldens in `apps/survey-demo/src/fixture/goldens.ts`
- [x] T006 Write failing fixture conformance tests for check, probe, goldens, and edge coverage
- [x] T007 Implement fail-fast fixture verification in `apps/survey-demo/src/fixture/verify.ts`
- [x] T008 Write failing browser-session tests for empty, restored, corrupt, failed-save, and replacement cases
- [x] T009 Implement the one-session event-store shell in `apps/survey-demo/src/session/browser-session.ts`

## Phase 3: User Story 1 — Complete and submit an adaptive survey (P1)

**Goal**: A respondent completes any of three adaptive routes and reaches a neutral,
sealed confirmation.

**Independent Test**: Start from the introduction, complete sleep, stress, and
life-change journeys separately, and verify they reconverge and submit.

- [x] T010 [US1] Write failing respondent journey tests in `apps/survey-demo/test/app.test.tsx`
- [x] T011 [P] [US1] Build the branded responsive shell in `apps/survey-demo/src/components/visual-shell.tsx`
- [x] T012 [P] [US1] Build the informational introduction in `apps/survey-demo/src/components/intro-screen.tsx`
- [x] T013 [P] [US1] Build the neutral completion screen in `apps/survey-demo/src/components/completion-screen.tsx`
- [x] T014 [US1] Build the FlowPage survey composition in `apps/survey-demo/src/components/survey-screen.tsx`
- [x] T015 [US1] Build session lifecycle orchestration in `apps/survey-demo/src/app/use-demo-session.ts`
- [x] T016 [US1] Compose intro, active, recovery, and complete states in `apps/survey-demo/src/app/app.tsx`
- [x] T017 [US1] Create the Tailwind visual system and responsive styles in `apps/survey-demo/src/styles.css`
- [x] T018 [US1] Add the React entrypoint and verify all three P1 journeys

## Phase 4: User Story 2 — Correct answers and routes (P2)

**Goal**: Backtracking changes the active route without mixing abandoned answers.

**Independent Test**: Answer the sleep route, go back to stress, finish, and verify
sleep answers remain in history but are excluded from active answers.

- [x] T019 [US2] Add failing route-correction and restoration tests to `apps/survey-demo/test/app.test.tsx`
- [x] T020 [US2] Add route orientation and backtracking presentation to `survey-screen.tsx`
- [x] T021 [US2] Verify abandoned-route active truth and restored re-entry with core replay

## Phase 5: User Story 3 — Resume safely (P3)

**Goal**: Refresh restores exactly one local session; explicit replacement starts
empty and removes the prior retained session.

**Independent Test**: Refresh on every page, compare reconstructed state, submit,
reload sealed state, cancel replacement, then confirm it.

- [x] T022 [US3] Add failing restore/reload/replacement tests to `apps/survey-demo/test/app.test.tsx`
- [x] T023 [P] [US3] Build the replacement confirmation in `apps/survey-demo/src/components/confirm-dialog.tsx`
- [x] T024 [P] [US3] Build persistence and corruption warning UI in `apps/survey-demo/src/components/storage-notice.tsx`
- [x] T025 [US3] Integrate persistence subscription, recovery, and explicit replacement
- [x] T026 [US3] Verify completed sessions remain sealed after reload

## Phase 6: User Story 4 — Resolve input problems (P3)

**Goal**: Missing and invalid answers are preserved, explained, and focused.

**Independent Test**: Trigger every supported validation error, correct it with
keyboard input, and continue without route or data loss.

- [x] T027 [US4] Add failing missing/range/text-length/focus tests to `apps/survey-demo/test/app.test.tsx`
- [x] T028 [US4] Add the app-specific short-text renderer in `apps/survey-demo/src/renderers/short-text-renderer.tsx`
- [x] T029 [US4] Style error, focus, disabled, and live-region states without replacing native semantics
- [x] T030 [US4] Verify all invalid actions leave event count, route, and progress unchanged

## Phase 7: Browser acceptance and polish

- [x] T031 Add Playwright configuration and desktop/mobile route journeys under `test/demo-browser/`
- [x] T032 Add Axe, keyboard-only, focus, reload, sealed-completion, and replacement browser checks
- [x] T033 Add screenshot-based visual inspection at 360 px and 1280 px
- [x] T034 Run app unit tests, typecheck, lint, build, core suite, and browser suite
- [x] T035 Reconcile implementation against every FR/SC and record any manual-only evidence
- [x] T036 Mark this task list complete and validate `quickstart.md` from a clean local launch

## Dependencies

- Setup blocks all implementation.
- T004–T009 block user stories.
- US1 establishes the navigable product; US2–US4 extend independently testable
  behavior on the same public controller contract.
- Browser acceptance depends on all user stories.

## Implementation Strategy

Implement test-first in priority order. The first visible checkpoint is US1 with all
three routes. The acceptance checkpoint is the complete local product with persistence,
correction, validation, accessibility, responsive screenshots, and all automated gates
green.

## Phase 8: Complete v1 primitive fixture expansion

**Goal**: Make the same coherent respondent fixture directly execute every governed v1
guard and numeric expression through non-clinical logistical adaptation.

- [x] T037 Add failing primitive-inventory and expanded edge-coverage tests in `apps/survey-demo/test/fixture.test.ts`
- [x] T038 Expand `apps/survey-demo/src/fixture/schema.ts` with scheduling capacity, weighted interaction preference, optional request, three ordered logistical routes, and reconvergence
- [x] T039 Expand `apps/survey-demo/src/fixture/goldens.ts` with request, spacious-capacity, focused-capacity, and false reference journeys, plus explicit unknown fixture semantics in `apps/survey-demo/test/fixture.test.ts`
- [x] T040 Extend `apps/survey-demo/src/fixture/verify.ts` to fail when any governed guard or numeric expression is absent
- [x] T041 Add respondent tests for the new conditional fields and logistical route correction in `apps/survey-demo/test/app.test.tsx`
- [x] T042 Extend `test/demo-browser/demo.spec.ts` to enter every logistical route on desktop and mobile
- [x] T043 Add acceptance assertions that no score or scoring terminology appears in any patient-visible screen
- [x] T044 Re-run check, probe, goldens, transition coverage, replay, accessibility, responsive, and sealed-session acceptance
- [x] T045 Restore 100% governed package coverage and update `specs/006-core-survey-demo/validation-results.md`
