# Tasks: React Survey Adapter

**Input**: Design documents from `specs/004-react-adapter/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/`, `quickstart.md`

**Tests**: Required. Feature acceptance demands 100% per-file source coverage plus
real-browser keyboard and accessibility verification. Within each phase, write the
listed tests first and confirm they fail for the intended missing behavior.

**Organization**: Tasks are grouped by user story. Setup and foundational work create
the package boundary; persistence and final verification are cross-cutting contracts.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after the phase prerequisites because it touches
  different files and has no dependency on another incomplete `[P]` task
- **[Story]**: Maps the task to a user story in `spec.md`
- Every task names the exact file or files it changes

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Register a strict, publishable React package and real-browser harness
without weakening existing core boundaries.

- [x] T001 Create the `@flowgraph/react` package manifest and strict project references in `packages/flow-react/package.json`, `packages/flow-react/tsconfig.json`, and `packages/flow-react/tsconfig.test.json`
- [x] T002 Add the pinned React, testing, Playwright, axe, jsdom, and Vite dependencies and regenerate `package.json` and `pnpm-lock.yaml`
- [x] T003 Register the `react` Vitest project with jsdom setup and per-file coverage in `vitest.workspace.ts`, `vitest.config.ts`, and `packages/flow-react/test/setup.ts`
- [x] T004 Extend TypeScript, ESLint, and dependency-cruiser boundaries for DOM-enabled adapter code and public-root imports in `tsconfig.json`, `tsconfig.eslint.json`, `eslint.config.js`, and `.dependency-cruiser.cjs`
- [x] T005 [P] Create the browser harness entry and runner configuration in `test/browser/index.html`, `test/browser/main.tsx`, `test/browser/vite.config.ts`, and `test/browser/playwright.config.ts`
- [x] T006 Add adapter build, test, browser-test, clean, and package-check commands to `package.json`, `.github/workflows/ci.yml`, and `scripts/package-check.mjs`

**Checkpoint**: the empty adapter package typechecks, the test projects are discoverable,
and existing core/session gates remain green.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish presentation-only types, deterministic fixtures, text/problem
mapping, and the draft registry required by all stories.

**⚠️ CRITICAL**: No user story implementation begins until this phase passes.

- [x] T007 [P] Create deterministic schema, session, metadata, and rendered-control builders in `packages/flow-react/test/support/builders.tsx`
- [x] T008 [P] Define readonly `FlowView`, `QuestionView`, `FrictionState`, `CommandMetaFactory`, and renderer contract types in `packages/flow-react/src/types.ts`
- [x] T009 [P] Add fallback text resolution and stable problem-to-question mapping tests in `packages/flow-react/test/unit/presentation-mapping.test.ts`
- [x] T010 [P] Add draft registration, idempotent cleanup, stable ordering, and stop-on-rejection tests in `packages/flow-react/test/unit/draft-registry.test.ts`
- [x] T011 Implement fallback text resolution and pure problem ordering in `packages/flow-react/src/view/resolve-text.ts` and `packages/flow-react/src/view/problem-mapping.ts`
- [x] T012 Implement the controller-owned draft registry contract in `packages/flow-react/src/controller/draft-registry.ts`
- [x] T013 Create the provisional closed package export surface for foundational types in `packages/flow-react/src/index.ts`

**Checkpoint**: shared types and pure presentation coordination are covered at 100%;
no adapter file evaluates graph semantics or imports internal package paths.

---

## Phase 3: User Story 1 — Observe and control a survey session (Priority: P1) 🎯

**Goal**: Subscribe React to one existing `FlowSession`, expose core-derived view data,
and dispatch governed actions without mirroring survey truth.

**Independent Test**: connect a session, execute start, answer, next, back, and finish,
and verify every observer renders the exact session snapshot and public-selector
results; rejection, no-op, and unmount cause no fabricated update.

### Tests for User Story 1

- [x] T014 [P] [US1] Add cached snapshot, resubscription, unsubscription, rejected dispatch, and no-op contract tests in `packages/flow-react/test/contract/use-flow-state.test.tsx`
- [x] T015 [P] [US1] Add current page, visibility, progress, back, active-answer, and completion projection tests in `packages/flow-react/test/contract/use-flow-view.test.tsx`
- [x] T016 [P] [US1] Add metadata-factory, answer, next, back, finish, rejection, and reentrant-dispatch controller tests in `packages/flow-react/test/contract/use-flow-survey.test.tsx`
- [x] T017 [P] [US1] Add multiple-consumer convergence and remount integration tests in `packages/flow-react/test/integration/session-binding.test.tsx`

### Implementation for User Story 1

- [x] T018 [US1] Implement the client-only external-store hook in `packages/flow-react/src/hooks/use-flow-state.ts`
- [x] T019 [US1] Implement the selector-only presentation projection in `packages/flow-react/src/hooks/use-flow-view.ts`
- [x] T020 [P] [US1] Implement ephemeral friction creation, clearing, and problem ordering in `packages/flow-react/src/controller/friction.ts`
- [x] T021 [US1] Implement governed actions and injected command provenance in `packages/flow-react/src/controller/use-flow-survey.ts`
- [x] T022 [US1] Export and document the US1 hook/controller surface in `packages/flow-react/src/index.ts` and verify the independent US1 suite

**Checkpoint**: User Story 1 works without any renderer or demo application and is
independently consumable as the adapter MVP binding.

---

## Phase 4: User Story 2 — Render accessible survey questions (Priority: P1)

**Goal**: Render every v1 question presentation with accessible native controls,
core-derived values and problems, deterministic focus, and no hidden semantic logic.

**Independent Test**: render text, number, single-choice, and multiple-choice questions;
operate a full page by keyboard; trigger several problems; verify labels, roles, values,
descriptions, focus order, hidden questions, and sealed state.

### Tests for User Story 2

- [x] T023 [P] [US2] Add default textarea label, fallback text, value, required, problem, disabled, and blur behavior tests in `packages/flow-react/test/contract/text-renderer.test.tsx`
- [x] T024 [P] [US2] Add raw integer draft, safe-integer conversion, min/max hint, rejection, and focus tests in `packages/flow-react/test/contract/number-renderer.test.tsx`
- [x] T025 [P] [US2] Add radio and checkbox group semantics, option ordering, checked state, and immediate-answer tests in `packages/flow-react/test/contract/select-renderer.test.tsx`
- [x] T026 [P] [US2] Add visible-question-only, page-problem live region, first-problem focus, and sealed-state tests in `packages/flow-react/test/integration/flow-page.test.tsx`

### Implementation for User Story 2

- [x] T027 [P] [US2] Implement the drafted accessible textarea control in `packages/flow-react/src/renderers/text-renderer.tsx`
- [x] T028 [P] [US2] Implement the drafted safe-integer control in `packages/flow-react/src/renderers/number-renderer.tsx`
- [x] T029 [P] [US2] Implement native single-choice and multiple-choice controls in `packages/flow-react/src/renderers/select-renderer.tsx`
- [x] T030 [US2] Assemble the closed default renderer map in `packages/flow-react/src/renderers/default-renderers.tsx`
- [x] T031 [US2] Implement React question/page problem presentation, stable ids, live regions, and focus targets in `packages/flow-react/src/view/problem-messages.tsx`
- [x] T032 [US2] Implement the selector-driven current-page composition and draft context in `packages/flow-react/src/view/flow-page.tsx`
- [x] T033 [US2] Build a fixture-backed client harness using only public adapter APIs in `test/browser/adapter-harness.tsx` and `test/browser/main.tsx`
- [x] T034 [P] [US2] Add the 360 px and 1280 px full keyboard journey in `test/browser/keyboard.spec.ts`
- [x] T035 [P] [US2] Add axe scans for empty, completed, choice, multi-error, page-error, and sealed states in `test/browser/accessibility.spec.ts`
- [x] T036 [US2] Export the default renderer and `FlowPage` surface from `packages/flow-react/src/index.ts` and verify the independent US2 suite

**Checkpoint**: User Stories 1 and 2 form the functional adapter MVP required by the
future demo, with automated keyboard and WCAG checks green.

---

## Phase 5: User Story 3 — Customize presentation without changing semantics (Priority: P2)

**Goal**: Allow deterministic renderer overrides by kind and question id while keeping
each renderer blind to graph and unrelated-answer state.

**Independent Test**: register a kind override and an id override, verify
id → kind → default precedence and common answer delivery, and confirm that custom
props contain no graph, trail, session, or unrelated answers.

### Tests for User Story 3

- [x] T037 [P] [US3] Add default, kind, id, missing-renderer, and immutable-registry resolution tests in `packages/flow-react/test/contract/renderer-registry.test.tsx`
- [x] T038 [P] [US3] Add a compile-time and runtime closed-props custom-renderer contract test in `packages/flow-react/test/contract/custom-renderer.test.tsx`

### Implementation for User Story 3

- [x] T039 [US3] Implement deterministic renderer resolution in `packages/flow-react/src/renderers/renderer-registry.ts`
- [x] T040 [US3] Integrate registry overrides without semantic access in `packages/flow-react/src/view/flow-page.tsx`
- [x] T041 [US3] Export `RendererRegistry`, renderer props, and default registry from `packages/flow-react/src/index.ts` and verify the independent US3 suite

**Checkpoint**: Product-specific visual overrides are possible without duplicating any
core decision.

---

## Phase 6: User Story 4 — Preserve deliberate input and report friction (Priority: P2)

**Goal**: Confirm drafted text/number answers exactly once, flush them before
navigation in stable order, preserve correction context on rejection, and focus the
first actionable problem.

**Independent Test**: edit several fields, blur one, navigate with another dirty,
trigger structural and page validation failures, and verify exact command/event order,
no keystroke or duplicate answers, retained drafts, and deterministic focus.

### Tests for User Story 4

- [x] T042 [P] [US4] Add clean, dirty, successful flush, rejected flush, unmount, and conditional-removal draft lifecycle tests in `packages/flow-react/test/integration/draft-lifecycle.test.tsx`
- [x] T043 [P] [US4] Add multi-draft stable-order, stop-on-first-rejection, and distinct metadata tests in `packages/flow-react/test/integration/navigation-flush.test.tsx`
- [x] T044 [P] [US4] Add blur-then-Continue deduplication and rejected visible-draft preservation tests in `packages/flow-react/test/integration/draft-deduplication.test.tsx`
- [x] T045 [P] [US4] Add question-friction clearing, page-friction clearing, fallback-summary focus, and no-repeat-focus tests in `packages/flow-react/test/integration/friction-focus.test.tsx`

### Implementation for User Story 4

- [x] T046 [US4] Complete idempotent draft registration and flush-result reporting in `packages/flow-react/src/controller/draft-registry.ts`
- [x] T047 [US4] Synchronize confirmed values, raw drafts, blur commits, and unmount cleanup in `packages/flow-react/src/renderers/text-renderer.tsx` and `packages/flow-react/src/renderers/number-renderer.tsx`
- [x] T048 [US4] Flush dirty drafts before `NEXT` and `BACK` and stop on first rejection in `packages/flow-react/src/controller/use-flow-survey.ts`
- [x] T049 [US4] Implement relevant friction clearing and one-shot first-problem focus in `packages/flow-react/src/controller/friction.ts` and `packages/flow-react/src/view/flow-page.tsx`
- [x] T050 [US4] Verify US4 event ordering against the real session log and complete 100% story coverage in `packages/flow-react/test/integration/draft-event-log.test.tsx`

**Checkpoint**: Every deliberate draft becomes at most one confirmed answer, and
rejected work remains understandable and correctable.

---

## Phase 7: Persistence Contract (Cross-Cutting)

**Purpose**: Provide the browser event-log example required by FR-019–FR-022 without
making storage authoritative or allowing subscriber failure to retry a commit.

- [x] T051 [P] Add empty, round-trip, invalid JSON, invalid envelope, invalid event, unavailable, write-failure, and clear-failure tests in `packages/flow-react/test/contract/browser-event-store.test.ts`
- [x] T052 Implement injected `StorageLike`, complete-log envelopes, parse/upcast loading, save, and clear in `packages/flow-react/src/persistence/browser-event-store.ts`
- [x] T053 [P] Add committed-log save, listener unsubscribe, failure callback, and no-throw/no-retry tests in `packages/flow-react/test/integration/persist-session.test.ts`
- [x] T054 Implement safe event subscription persistence in `packages/flow-react/src/persistence/persist-session.ts`
- [x] T055 Add restore-through-`createSession`, schema mismatch, corrupt history, and uninterrupted-equivalence tests in `packages/flow-react/test/integration/persistence-restore.test.ts`

**Checkpoint**: persistence stores only complete event logs, every trusted restore goes
through governed replay, and storage failure leaves the in-memory survey usable.

---

## Phase 8: Polish & Cross-Cutting Verification

**Purpose**: Close the public package, prove architectural boundaries and 100% coverage,
and record reproducible acceptance evidence.

- [x] T056 [P] Write package usage, client-only scope, renderer, draft, friction, and persistence guidance in `packages/flow-react/README.md`
- [x] T057 [P] Add isolated ESM and TypeScript consumers for `@flowgraph/react` in `test/consumer/react-esm/smoke.mjs`, `test/consumer/react-esm/package.json`, `test/consumer/react-typescript/index.tsx`, `test/consumer/react-typescript/package.json`, and `test/consumer/react-typescript/tsconfig.json`
- [x] T058 Close all uncovered adapter branches and verify 100% per-file statements, branches, functions, and lines with focused tests under `packages/flow-react/test/`
- [x] T059 Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm boundaries`, and `pnpm build`; resolve only feature-related failures in their reported files
- [x] T060 Run `pnpm test:coverage`, `pnpm test:browser`, and `pnpm package:check`; resolve all feature-related failures and retain the generated coverage and Playwright summaries
- [ ] T061 Execute the VoiceOver keyboard/screen-reader checklist from `specs/004-react-adapter/contracts/accessibility.md` and record pass/fail evidence in `specs/004-react-adapter/validation-results.md`
- [x] T062 Execute every sequence in `specs/004-react-adapter/quickstart.md` and append commands, versions, timings, and outcomes to `specs/004-react-adapter/validation-results.md`
- [x] T063 [P] Add a second non-psychology schema builder and complete it through the public adapter in `packages/flow-react/test/support/builders.tsx` and `packages/flow-react/test/integration/cross-fixture-conformance.test.tsx`
- [x] T064 [P] Add a warmed real-browser action-to-render latency assertion below 100 milliseconds in `test/browser/performance.spec.ts`
- [ ] T065 Reconcile implementation exports and behavior against every FR/SC and contract, then mark completed tasks in `specs/004-react-adapter/tasks.md`

---

## Dependencies & Execution Order

### Phase dependencies

```text
Phase 1 Setup
    ↓
Phase 2 Foundation
    ↓
US1 Session binding
    ↓
US2 Accessible defaults
    ├───────────────┐
    ↓               ↓
US3 Overrides    US4 Draft/friction completion
    └───────┬───────┘
            ↓
Phase 7 Persistence
            ↓
Phase 8 Verification
```

- **Setup** has no dependencies.
- **Foundation** depends on Setup and blocks all stories.
- **US1** depends on Foundation.
- **US2** depends on the US1 controller/view contract.
- **US3** depends on the US2 default-renderer composition.
- **US4** depends on US1 actions and US2 drafted controls, but is independent of US3.
- **Persistence** depends on US1 session binding and may proceed in parallel with US3
  and US4 once that binding is stable; it is ordered later here to minimize shared
  export-file conflicts.
- **Verification** depends on all selected behavior and persistence tasks.

### Requirement traceability

| Scope | Requirements |
|---|---|
| Foundation | FR-010, FR-023–FR-025 |
| US1 | FR-001–FR-005, FR-017–FR-018 |
| US2 | FR-006–FR-008, FR-015–FR-016 |
| US3 | FR-009 |
| US4 | FR-011–FR-014 |
| Persistence | FR-019–FR-022 |

### Success-criterion traceability

| Criterion | Tasks |
|---|---|
| SC-001 | T014–T019 |
| SC-002 | T004, T015, T019, T065 |
| SC-003 | T023–T035 |
| SC-004 | T035, T061 |
| SC-005 | T042–T050 |
| SC-006 | T042–T050 |
| SC-007 | T037–T041 |
| SC-008 | T063 |
| SC-009 | T051–T055 |
| SC-010 | T051–T055 |
| SC-011 | T064 |
| SC-012 | T058, T060, T065 |

### Parallel opportunities

- After T008, presentation mapping (T009/T011) and draft registry (T010/T012) are
  separate workstreams.
- US1 test files T014–T017 can be written in parallel before T018–T021.
- US2 renderer tests T023–T025 and page integration test T026 can be written in
  parallel; renderer implementations T027–T029 touch separate files.
- Browser tests T034 and T035 can be written in parallel after the harness exists.
- US3 tests T037–T038 are parallel.
- US4 tests T042–T045 are parallel; US4 can proceed alongside US3.
- Persistence store tests/implementation and US3/US4 work touch separate modules once
  the US1 session contract is stable.
- Documentation and isolated consumer tasks T056–T057 are parallel after exports close.
- Cross-fixture conformance T063 and browser latency T064 can run in parallel after the
  full adapter and harness are available.

---

## Parallel Examples

### User Story 1

```text
Task T014: use-flow-state external-store contract tests
Task T015: use-flow-view selector projection tests
Task T016: use-flow-survey action contract tests
Task T017: multi-consumer session binding tests
```

### User Story 2

```text
Task T023 → T027: text renderer test then implementation
Task T024 → T028: number renderer test then implementation
Task T025 → T029: select renderer test then implementation
Task T034: keyboard browser journey
Task T035: accessibility browser scans
```

### User Story 3 and User Story 4

```text
Workstream A: T037–T041 renderer overrides
Workstream B: T042–T050 draft ordering and friction
```

---

## Implementation Strategy

### MVP first

The useful adapter MVP is both P1 stories, not US1 alone:

1. Complete Setup and Foundation.
2. Complete US1 to prove the binding.
3. Complete US2 to provide an accessible, navigable page.
4. Stop and run the US1/US2 package and browser suites.

At this checkpoint, feature 006 can begin composition experiments, but feature 004 is
not complete until overrides, full draft/friction guarantees, persistence, and final
verification pass.

### Incremental delivery

1. **Binding increment**: US1.
2. **Usable UI increment**: US2.
3. **Product customization increment**: US3.
4. **Input-integrity increment**: US4.
5. **Restoration increment**: Persistence.
6. **Accepted package**: all gates, coverage, packaging, and manual accessibility
   evidence.

### TDD discipline

- Write each listed test before its corresponding implementation.
- Confirm failure is caused by missing contract behavior, not broken setup.
- Implement the smallest behavior that satisfies the current contract.
- Keep 100% per-file coverage throughout; do not defer a large coverage gap to T058.
- Never weaken a core/session test or coverage threshold to make adapter work pass.

## Notes

- `[P]` means separate files and no dependency on another incomplete parallel task.
- User-story labels provide traceability to `spec.md`.
- Core semantics remain in `@flowgraph/core`; apparent convenience logic in React must
  be replaced by a public selector or rejected from this feature.
- Commit after each completed phase or coherent task group.
- Feature 006 remains dependent on the completed public adapter contract and does not
  absorb unfinished feature 004 work.
