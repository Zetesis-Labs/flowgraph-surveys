# Tasks: Event-sourced Survey Engine

**Input**: Design documents from `specs/001-motor-encuestas-event/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/`, `quickstart.md`

**Tests**: Required. The constitution mandates test-first core development, property
tests, broken-schema tests, and golden conformance coverage. SC-013 additionally
requires 100% statement, branch, function, and line coverage globally and per
executable source file in both packages.

**Organization**: Tasks are grouped by user story so every increment has an
independent executable acceptance boundary.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: May run in parallel after preceding non-parallel prerequisites are complete.
- **[Story]**: Maps implementation work to a user story from `spec.md`.
- Every task names the concrete file or directory it changes.

## Phase 1: Setup

**Purpose**: Establish the pnpm workspace, package boundaries, and executable quality
tooling without implementing domain behavior.

- [x] T001 Create the private pnpm workspace, root scripts including `test:coverage`, package manager pin, and package directories in `package.json` and `pnpm-workspace.yaml`
- [x] T002 [P] Configure strict ES2022 project references and shared compiler options in `tsconfig.json` and `tsconfig.base.json`
- [x] T003 [P] Configure the ESM-only `@flowgraph/core` manifest, closed export map, production/test compiler separation, and scripts in `packages/flow-core/package.json`, `packages/flow-core/tsconfig.json`, and `packages/flow-core/tsconfig.test.json`
- [x] T004 [P] Configure the ESM-only `@flowgraph/session` manifest, workspace-only core dependency, closed export map, compiler separation, and scripts in `packages/flow-session/package.json`, `packages/flow-session/tsconfig.json`, and `packages/flow-session/tsconfig.test.json`
- [x] T005 [P] Configure formatting, lint bans, import restrictions, manifest checks, and dependency DAG rules in `prettier.config.js`, `eslint.config.js`, and `.dependency-cruiser.cjs`
- [x] T006 [P] Configure Vitest projects, reproducible fast-check reporting, and 100% statement/branch/function/line thresholds globally and per executable source file in `vitest.workspace.ts` and `packages/flow-core/test/setup.ts`
- [x] T007 [P] Add the initial read-only CI workflow for Node 22/24 install, format, lint, types, boundaries, tests with coverage, build, and packaging gates in `.github/workflows/ci.yml`

**Checkpoint**: Workspace commands resolve both empty packages and mechanical boundary
rules are executable.

---

## Phase 2: Foundational Domain and Parse Boundary

**Purpose**: Create shared readonly ADTs and strict parse boundaries required by every
user story.

**⚠️ CRITICAL**: No user-story implementation begins until this phase compiles and its
parse contract tests fail only for intentionally unimplemented behavior.

- [x] T008 [P] Add failing strict-schema parsing contract tests for unknown kinds/fields, branded ids, safe integers, constraints, and normalization in `packages/flow-core/test/unit/schema-parsing.test.ts`
- [x] T009 [P] Add failing event and command parsing contract tests for envelopes, metadata, hashes, five v1 event kinds, and empty v1 paths in `packages/flow-core/test/unit/event-parsing.test.ts`
- [x] T010 Implement branded identifiers, safe-integer helpers, `TextRef`, `Result`, and structured problem registries in `packages/flow-core/src/domain/ids.ts`, `packages/flow-core/src/domain/result.ts`, and `packages/flow-core/src/domain/problem.ts`
- [x] T011 [P] Implement readonly schema, node, question, guard, numeric-expression, and answer ADTs in `packages/flow-core/src/domain/schema.ts`
- [x] T012 [P] Implement readonly command metadata, command union, immutable event envelope, and five-kind event union in `packages/flow-core/src/domain/command.ts` and `packages/flow-core/src/domain/event.ts`
- [x] T013 [P] Implement `FlowState`, progress, probe, golden, and coverage result ADTs in `packages/flow-core/src/domain/state.ts`
- [x] T014 [P] Implement the strict zod schema parser and plain-domain conversion in `packages/flow-core/src/parsing/schema.ts`
- [x] T015 [P] Implement strict command/event parsers with safe-integer and v1-path enforcement in `packages/flow-core/src/parsing/event.ts`
- [x] T016 Expose the foundational domain and parse-boundary surface without deep exports in `packages/flow-core/src/index.ts`
- [x] T017 Create deterministic schema, command, event, and state builders plus fast-check arbitraries for later tests in `packages/flow-core/test/support/builders.ts` and `packages/flow-core/test/support/arbitraries.ts`

**Checkpoint**: Wire-format contract tests pass; no engine, replay, authoring, or
session behavior exists yet.

---

## Phase 3: User Story 1 — Complete a Conditional Flow (Priority: P1) 🎯 MVP

**Goal**: A caller can start, answer, validate, advance, go back, branch, reconverge,
score, and finish through pure `decide/apply` with active-truth and Strong Kleene
semantics.

**Independent Test**: Execute the retail and PHQ-2 schemas using only pure core
commands and event application. Required/invalid answers block without events, branch
correction deactivates abandoned answers, and terminal navigation returns the atomic
`[ADVANCED, SESSION_FINISHED]` batch.

### Tests for User Story 1

> Write these tests first and confirm they fail before implementing the behavior.

- [x] T018 [P] [US1] Add exhaustive Strong Kleene `not/all/any` table and empty-identity tests in `packages/flow-core/test/unit/truth.test.ts`
- [x] T019 [P] [US1] Add numeric `num/answer/score/sum/cmp`, safe-integer overflow, and exact-comparison tests in `packages/flow-core/test/unit/evaluate.test.ts`
- [x] T020 [P] [US1] Add visibility ordering, active-truth, abandoned-route, and reactivation tests in `packages/flow-core/test/unit/active-truth.test.ts`
- [x] T021 [P] [US1] Add structural-answer rejection and recorded semantic-validation tests in `packages/flow-core/test/unit/validation.test.ts`
- [x] T022 [P] [US1] Add explicit-start, exact Result-error navigation failures, navigation including a zero-question page, first-page back, sealing, finished `NEXT` as `ok([])`, and terminal-batch contract tests in `packages/flow-core/test/unit/decide.test.ts`
- [x] T023 [P] [US1] Add RFC 8785 canonicalization, NIST SHA-256, Unicode, key-order, array-order, and `node:crypto` cross-check tests in `packages/flow-core/test/unit/schema-hash.test.ts`
- [x] T024 [P] [US1] Add generated `apply` totality, repeated-answer last-write-wins projection, and accepted-trail graph-path properties in `packages/flow-core/test/property/apply.property.test.ts`
- [x] T025 [P] [US1] Create the three-branch reconverging retail schema and direct command journeys in `packages/flow-core/test/fixtures/retail/schema.json` and `packages/flow-core/test/fixtures/retail/journeys.ts`
- [x] T026 [P] [US1] Create the weighted PHQ-2 conformance schema and threshold journeys in `packages/flow-core/test/fixtures/phq2/schema.json` and `packages/flow-core/test/fixtures/phq2/journeys.ts`
- [x] T027 [US1] Add end-to-end pure `decide/apply` acceptance tests over both fixtures in `packages/flow-core/test/integration/conditional-flow.test.ts`

### Implementation for User Story 1

- [x] T028 [P] [US1] Implement total Strong Kleene truth operators in `packages/flow-core/src/semantics/truth.ts`
- [x] T029 [P] [US1] Implement RFC 8785-compatible canonical JSON and pure UTF-8 encoding in `packages/flow-core/src/integrity/canonical-json.ts` and `packages/flow-core/src/integrity/utf8.ts`
- [x] T030 [P] [US1] Implement synchronous dependency-free SHA-256 with standard-vector compatibility in `packages/flow-core/src/integrity/sha256.ts`
- [x] T031 [US1] Implement schema hashing and lowercase `SchemaHash` validation using canonical JSON, UTF-8, and SHA-256 in `packages/flow-core/src/integrity/schema-hash.ts`
- [x] T032 [US1] Implement numeric/guard evaluation, document-order visibility, and active-answer projection without module cycles in `packages/flow-core/src/semantics/evaluate.ts`, `packages/flow-core/src/semantics/visibility.ts`, and `packages/flow-core/src/semantics/active-truth.ts`
- [x] T033 [US1] Implement structural answer checks and semantic required/range/max-length validation in `packages/flow-core/src/semantics/validate.ts`
- [x] T034 [US1] Implement initial not-started state and total immutable event projection in `packages/flow-core/src/engine/initial-state.ts` and `packages/flow-core/src/engine/apply.ts`
- [x] T035 [US1] Implement pure command decisions, ordered edge selection, lifecycle errors, backward navigation, and atomic terminal batches in `packages/flow-core/src/engine/decide.ts`
- [x] T036 [US1] Implement current-node, visible-question, stored/active-answer, validation, navigation, outcome, and longest-path progress selectors in `packages/flow-core/src/selectors/navigation.ts`, `packages/flow-core/src/selectors/answers.ts`, and `packages/flow-core/src/selectors/progress.ts`
- [x] T037 [US1] Export the complete User Story 1 public contract and keep internal modules private in `packages/flow-core/src/index.ts`

**Checkpoint**: User Story 1 runs independently through pure core functions and both
fixture acceptance journeys pass without replay, authoring tools, or session shell.

---

## Phase 4: User Story 2 — Restore and Audit Through Replay (Priority: P1)

**Goal**: A serialized event log reconstructs the exact session deterministically,
preserves provenance, rejects schema/log corruption, and never uses another hydration
path.

**Independent Test**: Serialize a half-complete mixed-source log, restore it through
`replay`, and compare state deeply; modified schema hash, invalid transitions, future
versions, non-empty v1 paths, duplicate starts, broken terminal batches, and events
after finish all fail explicitly.

### Tests for User Story 2

- [x] T038 [P] [US2] Add replay integrity, deep FlowState plus `activeAnswers`/`currentNode` restoration equality, schema identity/hash, sequence, transition, provenance, repeated-answer log retention/last-write-wins projection, and terminal-adjacency contract tests in `packages/flow-core/test/integration/replay.test.ts`
- [x] T039 [P] [US2] Add composed v1 identity-upcast, unknown-future-version, non-empty-path, and no-disk-rewrite tests in `packages/flow-core/test/unit/upcast.test.ts`
- [x] T040 [P] [US2] Add replay determinism, decide determinism with metadata, event/state JSON round-trip, one-start, and no-event-after-finish properties in `packages/flow-core/test/property/replay.property.test.ts`

### Implementation for User Story 2

- [x] T041 [US2] Implement the single composed pure v1 event upcast/read-boundary pipeline in `packages/flow-core/src/parsing/upcast.ts`
- [x] T042 [US2] Implement hash-verifying, sequence-validating, fail-closed replay with total apply folding in `packages/flow-core/src/engine/replay.ts`
- [x] T043 [US2] Export replay and upcast APIs while preserving the closed root-only package surface in `packages/flow-core/src/index.ts`

**Checkpoint**: User Story 2 independently restores valid JSON logs and rejects every
specified corruption without throwing or producing partial state.

---

## Phase 5: User Story 3 — Validate a Schema Before Publishing (Priority: P2)

**Goal**: Technical authors receive actionable structural diagnostics, bounded
dead-end witnesses, executable JSON goldens, and engine-measured edge coverage.

**Independent Test**: Run the broken-schema corpus through `check/probe` and both
governed fixtures through the golden runner. Every expected diagnostic appears,
truncation never claims completeness, and retail/PHQ-2 reach 100% measured coverage.

### Tests and fixtures for User Story 3

- [x] T044 [P] [US3] Create the JSON corpus with one named schema per required structural error, including entry-not-page, duplicate-edge-target, invalid edge-guard references, self-loop, multi-node cycle, dead-end, and probe-budget cases in `packages/flow-core/test/fixtures/broken-schemas/corpus.json`
- [x] T045 [P] [US3] Create versioned declarative retail golden cases covering every branch, reconvergence, and branch correction in `packages/flow-core/test/fixtures/retail/goldens.json`
- [x] T046 [P] [US3] Create versioned declarative PHQ-2 golden cases covering both threshold outcomes in `packages/flow-core/test/fixtures/phq2/goldens.json`
- [x] T047 [P] [US3] Add stable-order `check()` diagnostic tests for every error/warning and actionable location in `packages/flow-core/test/integration/check.test.ts`
- [x] T048 [P] [US3] Add deterministic candidate-domain, validation-blocked, witness, 4096-budget, and 16-witness-cap tests in `packages/flow-core/test/integration/probe.test.ts`
- [x] T049 [P] [US3] Add JSON golden execution, replay-per-step, forbidden asserted coverage/hash, and exact edge-coverage tests in `packages/flow-core/test/integration/golden.test.ts`

### Implementation for User Story 3

- [x] T050 [US3] Implement stable multi-pass structural graph/question/expression checking with actionable diagnostics in `packages/flow-core/src/authoring/check.ts`
- [x] T051 [US3] Implement deterministic bounded candidate generation, semantic exploration, truncation reporting, and dead-end witnesses in `packages/flow-core/src/authoring/probe.ts`
- [x] T052 [P] [US3] Implement replay-reconstructed `(from,to)` coverage aggregation and per-case hit reporting in `packages/flow-core/src/authoring/coverage.ts`
- [x] T053 [US3] Implement strict GoldenSuiteV1 parsing, deterministic command materialization, replay-per-step execution, projection assertions, and coverage reporting in `packages/flow-core/src/authoring/golden.ts`
- [x] T054 [US3] Export `check`, `probe`, golden, and coverage contracts through the closed package root in `packages/flow-core/src/index.ts`
- [x] T055 [US3] Wire focused `test:authoring`, `test:goldens`, and `test:replay` scripts to the implemented suites in `packages/flow-core/package.json`

**Checkpoint**: User Story 3 is independently usable by technical authors and both
critical fixtures report 100% engine-measured edge coverage.

---

## Phase 6: User Story 4 — Integrate the Observable Session (Priority: P2)

**Goal**: Hosts create or restore one single-writer session, dispatch commands, receive
atomic event batches and stable snapshots, and cannot cause nested notification
causality.

**Independent Test**: Create a fresh session, start and finish it through dispatch,
verify exact event/state notification order and reference stability, restore the same
log, reject invalid restore/reentrant dispatch, and aggregate subscriber exceptions
only after the committed cycle.

### Tests for User Story 4

- [x] T056 [P] [US4] Add fresh-session, dispatch result, empty-batch, reference-stability, subscription-order, and atomic-terminal tests in `packages/flow-session/test/session.test.ts`
- [x] T057 [P] [US4] Add valid restore with deep snapshot and derived-selector equality, invalid schema/log restore, no-partial-session, and single-replay-path tests in `packages/flow-session/test/restore.test.ts`
- [x] T058 [P] [US4] Add reentrant-dispatch, listener-list snapshot, idempotent unsubscribe, listener failure continuation, and post-commit AggregateError tests in `packages/flow-session/test/reentrancy.test.ts`

### Implementation for User Story 4

- [x] T059 [P] [US4] Define the readonly `FlowSession`, listener, unsubscribe, and factory result contracts in `packages/flow-session/src/types.ts`
- [x] T060 [US4] Implement `createSession`, replay-only restore, atomic batch commits, stable references, ordered notifications, and reentrancy rejection in `packages/flow-session/src/session.ts`
- [x] T061 [US4] Export only the session public root and core contract types in `packages/flow-session/src/index.ts`
- [x] T062 [US4] Complete session package scripts and ESM build/type integration against the public workspace core package in `packages/flow-session/package.json`

**Checkpoint**: User Story 4 passes independently against the published core API and
introduces no business logic or alternative state truth.

---

## Phase 7: Polish and Cross-Cutting Gates

**Purpose**: Prove constitutional enforcement, scale assumptions, published-package
correctness, and reproducible end-to-end validation across all stories.

- [x] T063 [P] Add cross-story generated command-sequence, sealed-log, terminal-batch, hash-order, and monotonic-progress properties in `packages/flow-core/test/property/conformance.property.test.ts`
- [x] T064 [P] Add deterministic 500-node/1000-event scale and probe-budget regression tests in `packages/flow-core/test/integration/scale.test.ts`
- [x] T065 [P] Add clean tarball consumer smoke projects in `test/consumer/esm/package.json`, `test/consumer/esm/smoke.mjs`, `test/consumer/typescript/package.json`, `test/consumer/typescript/tsconfig.json`, and `test/consumer/typescript/index.ts`
- [x] T066 [P] Document package purpose, public entry points, safe-integer units, `Result` restoration, and ESM-only consumption in `packages/flow-core/README.md` and `packages/flow-session/README.md`
- [x] T067 Finalize root commands, exact dependency versions, lockfile, tarball validation, publint, and `@arethetypeswrong/cli` orchestration in `package.json` and `pnpm-lock.yaml`
- [x] T068 Run format, lint, production typecheck, dependency boundaries, and coverage tests; add semantic tests until every executable source file reaches 100% statements, branches, functions, and lines, then resolve every remaining violation in `packages/flow-core/src/`, `packages/flow-session/src/`, and their test directories
- [x] T069 Run every command and acceptance scenario from `specs/001-motor-encuestas-event/quickstart.md` and record reproducible outcomes in `specs/001-motor-encuestas-event/validation-results.md`
- [x] T070 Finalize the least-privilege CI gate with frozen install, enforced global/per-file 100% statement/branch/function/line coverage, properties, goldens, package tarballs, and consumer smoke tests in `.github/workflows/ci.yml`

**Checkpoint**: All quickstart commands pass, both fixture suites have 100% measured
graph-edge coverage, all executable source files have 100% statement/branch/function/
line coverage, package consumers resolve only public exports, and every constitution
gate is green.

---

## Dependencies and Execution Order

### Phase dependencies

```text
Phase 1 Setup
  └─> Phase 2 Foundational
       └─> Phase 3 US1: conditional core
            └─> Phase 4 US2: replay
                 ├─> Phase 5 US3: authoring validation
                 └─> Phase 6 US4: observable session
                      \___________________________
                                  └─> Phase 7 cross-cutting gates
```

- Setup has no feature dependency.
- Foundational depends on the workspace and compiler/package boundaries.
- US1 depends on foundational domain and parsing and forms the MVP.
- US2 depends on US1 state projection, hashing, and decisions.
- US3 depends on US1 plus replay from US2 because goldens and coverage reconstruct
  actual logs.
- US4 depends on US1 plus replay from US2 for its only restoration path.
- US3 and US4 may execute in parallel after US2.
- Polish depends on the desired story phases being complete; final acceptance requires
  all four.

### Within each user story

1. Add the listed tests and fixtures.
2. Confirm the new tests fail for missing behavior.
3. Implement lower-level pure modules before orchestrators.
4. Export only after internal behavior passes.
5. Run the independent-test checkpoint before starting a dependent phase.

## Parallel Opportunities

### Setup and foundational

- T002–T007 may proceed in parallel after T001.
- T008 and T009 may proceed in parallel.
- T011–T013 may proceed in parallel after T010.
- T014 and T015 may proceed in parallel after their domain ADTs exist.

### User Story 1

```text
Parallel tests: T018, T019, T020, T021, T022, T023, T024
Parallel fixtures: T025, T026
Parallel first implementations: T028, T029, T030
Then: T031 → T032 → T033 → T034 → T035 → T036 → T037
```

### User Story 2

```text
Parallel tests: T038, T039, T040
Then: T041 → T042 → T043
```

### User Story 3

```text
Parallel fixtures/tests: T044, T045, T046, T047, T048, T049
Then: T050 and T052 may proceed in parallel
Then: T051 → T053 → T054 → T055
```

### User Story 4

```text
Parallel tests: T056, T057, T058
T059 may proceed while tests are authored
Then: T060 → T061 → T062
```

### Final gates

- T063–T066 may proceed in parallel after all stories.
- T065 consumer fixtures may be prepared before T067 package orchestration.

## Implementation Strategy

### MVP first

1. Complete Setup and Foundational phases.
2. Complete User Story 1 through T037.
3. Stop and run the pure retail/PHQ-2 independent checkpoint.
4. Demonstrate conditional navigation, active truth, validation, backtracking, scoring,
   reconvergence, and immutable finish without any adapter.

### Incremental delivery

1. **US1**: pure conditional survey execution.
2. **US2**: deterministic restoration and audit integrity.
3. **US3** and **US4** in parallel: safe authoring plus host integration.
4. Cross-cutting package and constitutional gates.
5. Only after core completion begin `004-react-adapter` and
   `006-core-survey-demo`.

## Notes

- `[P]` means different files and no dependency on an incomplete task at that point.
- Story labels provide traceability to `spec.md`.
- Runtime dependencies remain exactly: core → zod at parsing only; session → core.
- No task may introduce storage, React, MCP, CLI, analytics, subflows, repeatables,
  resolved presentation, time-dependent semantics, or another event kind.
- A change to the five-event vocabulary or kernel primitives stops implementation and
  requires the constitutional amendment process.
