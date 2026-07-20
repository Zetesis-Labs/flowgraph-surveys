# Tasks: Composable Schema Packs

**Input**: Design documents from `/specs/008-schema-packs/`

**Tests**: Required test-first in the pure governed core, including unit, integration,
property, golden, and scale evidence with exact 100% coverage.

## Phase 1: Setup

- [x] T001 Verify pack touchpoints and public exports against `specs/008-schema-packs/plan.md`
- [x] T002 Add concrete reusable pack fixtures in `packages/flow-core/test/support/packs.ts`
- [x] T003 Verify existing ignore and package boundary configuration for new core files

## Phase 2: Foundational — pack domain and strict formats

- [x] T004 Add failing branded pack/instance/port id tests in `packages/flow-core/test/unit/ids.test.ts`
- [x] T005 Add failing strict pack and composition parsing tests in `packages/flow-core/test/unit/pack-parsing.test.ts`
- [x] T006 Implement pack, instance, and port ids in `packages/flow-core/src/domain/ids.ts`
- [x] T007 Implement concrete pack, port, composition, problem, and factory types in `packages/flow-core/src/domain/pack.ts`
- [x] T008 Expose reusable internal schema wire validators from `packages/flow-core/src/parsing/schema.ts`
- [x] T009 Implement strict pack and composition parsing in `packages/flow-core/src/parsing/pack.ts`

## Phase 3: User Story 1 — Define a logical pack (P1)

**Goal**: Define and validate one-page or multi-page concrete packs independently.

**Independent Test**: Validate a multi-page pack and every invalid entry, outlet,
identity, internal-reference, and public-port condition without another pack.

- [x] T010 [US1] Add failing independent pack validation tests in `packages/flow-core/test/integration/pack-composition.test.ts`
- [x] T011 [US1] Implement deterministic pack port and identity diagnostics in `packages/flow-core/src/authoring/compose.ts`
- [x] T012 [US1] Implement synthetic-schema validation through the existing checker in `packages/flow-core/src/authoring/compose.ts`

## Phase 4: User Story 2 — Compose packs into one form (P1)

**Goal**: Namespace and connect valid instances into one ordinary executable schema.

**Independent Test**: Compile three conditional packs, check/probe the result, and run
ordinary goldens with 100% engine-measured edge coverage.

- [x] T013 [US2] Add failing namespace mapping tests for every identity and reference kind in `packages/flow-core/test/integration/pack-composition.test.ts`
- [x] T014 [US2] Implement injective node, question, option, and outcome namespace helpers in `packages/flow-core/src/authoring/compose.ts`
- [x] T015 [US2] Implement recursive guard, expression, question, edge, and node rewriting in `packages/flow-core/src/authoring/compose.ts`
- [x] T016 [US2] Implement ordered outlet-to-entry connection compilation in `packages/flow-core/src/authoring/compose.ts`
- [x] T017 [US2] Validate final output with the existing checker and return an ordinary `FlowSchema` in `packages/flow-core/src/authoring/compose.ts`
- [x] T018 [US2] Add compiled checker, probe, session, replay, serialization, and golden acceptance tests in `packages/flow-core/test/integration/pack-composition.test.ts`

## Phase 5: User Story 3 — Reuse and parameterize factories (P2)

**Goal**: Reuse concrete packs and pure typed factories without runtime parameters.

**Independent Test**: Instantiate one pack 100 times and instantiate two differently
configured factory results while preserving independent identities and configuration.

- [x] T019 [US3] Add repeated-instance and typed-factory tests in `packages/flow-core/test/integration/pack-composition.test.ts`
- [x] T020 [US3] Add namespace injectivity and compilation determinism properties in `packages/flow-core/test/property/pack-composition.property.test.ts`
- [x] T021 [US3] Add 20-pack/500-node compilation scale evidence in `packages/flow-core/test/integration/pack-composition.test.ts`

## Phase 6: User Story 4 — Diagnose invalid compositions (P2)

**Goal**: Aggregate stable location-specific problems and never return partial output.

**Independent Test**: Exercise duplicates, unknown instances/ports/targets, unconnected
required outlets, and invalid final schemas both independently and together.

- [x] T022 [US4] Add failing exhaustive composition problem tests in `packages/flow-core/test/integration/pack-composition.test.ts`
- [x] T023 [US4] Implement deterministic composition preflight aggregation in `packages/flow-core/src/authoring/compose.ts`
- [x] T024 [US4] Map final checker errors into location-aware composition problems in `packages/flow-core/src/authoring/compose.ts`

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T025 Export the complete pack public surface from `packages/flow-core/src/index.ts`
- [x] T026 Update `packages/flow-core/README.md` with composition and single-JSON guidance
- [x] T027 Run format, lint, typecheck, boundaries, build, exact coverage, and package consumer checks
- [x] T028 Record exact requirement and performance evidence in `specs/008-schema-packs/validation-results.md`
- [x] T029 Mark `specs/008-schema-packs/spec.md` complete after analyze and converge pass

## Dependencies

- The strict pack domain blocks all user stories.
- US1 validation blocks compilation.
- US2 is the MVP and blocks repeated-instance and invalid-composition acceptance.
- US3 and US4 may proceed independently after successful basic compilation.

## Parallel Opportunities

- T004/T005 can be authored independently.
- Property tests in T020 can be prepared while T019 fixtures are finalized.
- Documentation T026 can proceed once the public API in T025 is stable.

## Implementation Strategy

Build the strict data boundary and pack validator first. Then compile the smallest valid
two-pack form, expand mapping to every identity/reference kind, prove repeated use and
scale, and finish with exhaustive fail-closed diagnostics.
