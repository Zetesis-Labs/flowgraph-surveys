# Tasks: Attachment Inputs

**Input**: Design documents from `/specs/007-attachment-inputs/`

**Tests**: Required test-first across the governed core and React adapter. Exact 100%
statement, branch, function, and line coverage is mandatory.

## Phase 1: Setup

- [x] T001 Verify existing attachment changes against `specs/007-attachment-inputs/plan.md`
- [x] T002 [P] Add reusable attachment schema/reference builders in `packages/flow-core/test/support/builders.ts`
- [x] T003 [P] Add reusable attachment renderer builders in `packages/flow-react/test/support/builders.tsx`

## Phase 2: Foundational — strict attachment domain

- [x] T004 Add strict attachment schema and event wire-format tests in `packages/flow-core/test/unit/schema-parsing.test.ts` and `packages/flow-core/test/unit/event-parsing.test.ts`
- [x] T005 Add attachment id, reference, question, and answer domain types in `packages/flow-core/src/domain/ids.ts` and `packages/flow-core/src/domain/schema.ts`
- [x] T006 Implement strict attachment schema and answer parsing in `packages/flow-core/src/parsing/schema.ts` and `packages/flow-core/src/parsing/shared.ts`
- [x] T007 Export the attachment domain surface from `packages/flow-core/src/index.ts`

## Phase 3: User Story 1 — Author an attachment question (P1)

**Goal**: Define, parse, check, and probe portable attachment questions.

**Independent Test**: Round-trip valid definitions, reject malformed constraints, and
probe attachment-driven conditional routing without platform access.

- [x] T008 [US1] Add attachment constraint and probe tests in `packages/flow-core/test/integration/probe.test.ts` and `packages/flow-core/test/unit/schema-parsing.test.ts`
- [x] T009 [US1] Implement attachment structural checking in `packages/flow-core/src/authoring/check.ts`
- [x] T010 [US1] Implement finite attachment candidates and earlier-page guard sampling in `packages/flow-core/src/authoring/probe.ts`

## Phase 4: User Story 2 — Answer with governed references (P1)

**Goal**: Replay and evaluate metadata-only attachment answers with active truth.

**Independent Test**: Replay serialized attachment answers, navigate away from their
page, and verify deterministic state and inactive-answer exclusion.

- [x] T011 [US2] Add attachment replay, round-trip, and active-truth tests in `packages/flow-core/test/integration/replay.test.ts` and `packages/flow-core/test/unit/event-parsing.test.ts`
- [x] T012 [US2] Implement attachment answer typing and active evaluation in `packages/flow-core/src/semantics/evaluate.ts`
- [x] T013 [US2] Implement deep attachment answer equality during replay in `packages/flow-core/src/engine/replay.ts`
- [x] T014 [P] [US2] Add volatile store contract tests in `packages/flow-react/test/contract/attachment-store.test.ts`
- [x] T015 [US2] Implement the isolated file store and context in `packages/flow-react/src/attachments/attachment-store.ts` and `packages/flow-react/src/attachments/context.ts`

## Phase 5: User Story 3 — Correct invalid selections (P2)

**Goal**: Validate, render, remove, and replace selections without camera access.

**Independent Test**: Exercise all validation boundaries and the complete renderer/store
lifecycle, including rejected proposals, disabled state, focus, and remount.

- [x] T016 [US3] Add required/count/type/size/duplicate validation tests in `packages/flow-core/test/unit/validation.test.ts`
- [x] T017 [US3] Add structured attachment problems in `packages/flow-core/src/domain/problem.ts`
- [x] T018 [US3] Implement pure attachment validation in `packages/flow-core/src/semantics/validate.ts`
- [x] T019 [P] [US3] Add renderer contract tests in `packages/flow-react/test/contract/attachment-renderer.test.tsx`
- [x] T020 [US3] Implement the default camera-free renderer in `packages/flow-react/src/renderers/attachment-renderer.tsx`
- [x] T021 [US3] Integrate renderer selection, injected store, problem copy, and public exports in `packages/flow-react/src/renderers/default-renderers.tsx`, `packages/flow-react/src/view/flow-page.tsx`, `packages/flow-react/src/view/problem-messages.tsx`, `packages/flow-react/src/types.ts`, and `packages/flow-react/src/index.ts`
- [x] T022 [US3] Add FlowPage navigation, focus, disabled, removal, replacement, and remount tests in `packages/flow-react/test/integration/flow-page.test.tsx`

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T023 Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm boundaries`, `pnpm build`, and `pnpm test:coverage`
- [x] T024 Record exact evidence and requirement reconciliation in `specs/007-attachment-inputs/validation-results.md`
- [x] T025 Mark `specs/007-attachment-inputs/spec.md` complete after convergence and analysis pass

## Dependencies

- Phase 2 blocks all user stories.
- US1 and US2 may proceed independently after the strict domain exists.
- US3 depends on answer validation from US2 and completes the adapter-facing capability.

## Parallel Opportunities

- T002/T003 touch independent package test support.
- T014 can proceed alongside core replay work.
- T019 can be authored while core validation is being completed.

## Implementation Strategy

Deliver the strict core definition first, then replay semantics and the volatile adapter
boundary, and finally the interactive renderer. Every phase restores exact governed
coverage before the next phase begins.
