# Implementation Plan: Event-sourced Survey Engine

**Branch**: `001-motor-encuestas-event` | **Date**: 2026-07-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-motor-encuestas-event/spec.md`

## Summary

Build the governed v1 FlowGraph kernel as two physically separated TypeScript
libraries. `@flowgraph/core` owns immutable schemas, commands, events, state projection,
Strong Kleene evaluation, active truth, `decide/apply/replay`, selectors, structural
checking, bounded probing, deterministic schema hashing, and golden coverage.
`@flowgraph/session` is the only mutable shell and atomically exposes the core through
a synchronous observable session.

The implementation is ESM-only ES2022, event-sourced, dependency-minimal, and usable
without DOM or Node APIs. Retail and PHQ-2 fixtures plus property tests prove branching,
reconvergence, scoring, schema integrity, deterministic replay, sealed completion, and
100% graph-edge coverage before React or any other adapter is introduced.

## Technical Context

**Language/Version**: TypeScript 5.x in strict mode, emitting ESM for ES2022; Node.js
22 and 24 are tooling/test targets, not runtime dependencies of the core.

**Primary Dependencies**: `zod` only at `@flowgraph/core` parse boundaries;
`@flowgraph/session` depends only on `@flowgraph/core`. Development tooling:
pnpm workspaces, Vitest, fast-check, ESLint, dependency-cruiser, TypeScript,
publint, and `@arethetypeswrong/cli`.

**Storage**: N/A. The libraries own no durable storage. A session keeps an immutable
event-array reference in memory and exposes append batches to host subscribers.

**Testing**: Vitest unit/contract/integration tests with 100% statement, branch,
function, and line coverage globally and per executable source file; fast-check
properties; broken schema corpus; JCS and SHA-256 vectors; deterministic JSON goldens
with engine-measured edge coverage; package tarball and consumer smoke tests.

**Target Platform**: Any ESM ES2022 host. `@flowgraph/core` compiles with
`lib:["ES2022"]`, `types:[]`, and no DOM or Node globals. Published v1 packages are
ESM-only.

**Project Type**: pnpm library monorepo with a pure functional core package and one
observable session-shell package.

**Performance Goals**: Deterministic bounded work for the intended scale. Structural
graph passes are linear in nodes, edges, questions, and expression references; replay
is linear in log length times transition validation; probe explores at most 4096
assignments per conditional page and stores at most 16 detailed dead-end witnesses.

**Constraints**: No IO, clock, randomness, platform crypto, timers, mutation, classes,
or platform imports in core. Safe-integer numeric wire values only. v1 schemas are
acyclic, event kinds are fixed at five, paths are empty, and one session has one writer.

**Scale/Scope**: Typical graphs contain tens to hundreds of nodes/questions and session
logs tens to hundreds of events; supported validation and replay tests cover up to
500 nodes and 1000 events. Storage, UI, localization resolution, analytics,
multi-session registries, collaboration, subflows, and repeatables are outside v1.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Pre-research | Post-design evidence |
|------|--------------|----------------------|
| I. Functional core, effectful shell | PASS | Separate packages; core compiler excludes platform types; session is the only mutable module; contracts use readonly ADTs and `Result`. |
| II. Event sourcing is truth | PASS | `FlowState` is derived only by replay/apply; session stores the event log and has no hydration alternative. |
| III. Immutable event shape | PASS | Wire contract fixes five v1 kinds and common envelope; JCS + SHA-256 are specified and verified on start/replay. |
| IV. Closed semantics | PASS | Data model contains Strong Kleene tables, active-truth rules, acyclic/well-founded references, and single-writer behavior. |
| V. Minimal governed kernel | PASS | Only the specified guards/expressions exist; no domain-specific or presentation primitive enters core. |
| VI. Validation ladder | PASS | `check`, capped deterministic `probe`, JSON goldens, and reconstructible edge coverage have explicit contracts. |
| VII. Test-first pure core | PASS | Unit, property, broken-corpus, hash-vector, golden, session integration, and package boundary suites are required gates; CI also enforces 100% statements, branches, functions, and lines globally and per executable source file. |
| Strict TypeScript and dependency policy | PASS | Root project references plus package-specific strict configs; zod is restricted to parsing; dependency manifests and imports are checked in CI. |
| Version/session governance | PASS | State is pinned to schema id/version/hash; unknown events and non-empty v1 paths fail closed; no migration/repeatable behavior is introduced. |
| Adapter separation | PASS | No React, MCP, CLI, persistence, or presentation implementation exists in this feature structure. |

The design introduces no constitutional violation. The `createSession` return type is
completed as `Result<FlowSession, Problem>` because restoration is required to surface
`replay` failures without exceptions or a second hydration path.

## Project Structure

### Documentation (this feature)

```text
specs/001-motor-encuestas-event/
├── spec.md
├── decisions.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── public-api.md
│   ├── wire-formats.md
│   └── validation.md
└── tasks.md                 # Created later by speckit-tasks
```

### Source Code (repository root)

```text
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
tsconfig.json
tsconfig.base.json
eslint.config.js
vitest.workspace.ts
.dependency-cruiser.cjs
.github/workflows/ci.yml

packages/
├── flow-core/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.test.json
│   ├── src/
│   │   ├── domain/
│   │   │   ├── ids.ts
│   │   │   ├── schema.ts
│   │   │   ├── command.ts
│   │   │   ├── event.ts
│   │   │   ├── state.ts
│   │   │   ├── problem.ts
│   │   │   └── result.ts
│   │   ├── parsing/
│   │   │   ├── schema.ts
│   │   │   ├── event.ts
│   │   │   └── upcast.ts
│   │   ├── integrity/
│   │   │   ├── canonical-json.ts
│   │   │   ├── utf8.ts
│   │   │   ├── sha256.ts
│   │   │   └── schema-hash.ts
│   │   ├── semantics/
│   │   │   ├── truth.ts
│   │   │   ├── evaluate.ts
│   │   │   ├── visibility.ts
│   │   │   ├── active-truth.ts
│   │   │   └── validate.ts
│   │   ├── engine/
│   │   │   ├── initial-state.ts
│   │   │   ├── decide.ts
│   │   │   ├── apply.ts
│   │   │   └── replay.ts
│   │   ├── selectors/
│   │   │   ├── navigation.ts
│   │   │   ├── answers.ts
│   │   │   └── progress.ts
│   │   ├── authoring/
│   │   │   ├── check.ts
│   │   │   ├── probe.ts
│   │   │   ├── golden.ts
│   │   │   └── coverage.ts
│   │   └── index.ts
│   └── test/
│       ├── unit/
│       ├── property/
│       ├── integration/
│       └── fixtures/
│           ├── retail/
│           ├── phq2/
│           └── broken-schemas/
└── flow-session/
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.test.json
    ├── src/
    │   ├── types.ts
    │   ├── session.ts
    │   └── index.ts
    └── test/
        ├── session.test.ts
        ├── restore.test.ts
        └── reentrancy.test.ts
```

**Structure Decision**: Use two publishable packages because the constitutional
mutation boundary must be physically enforceable. Core internals form a directed
dependency graph from domain through semantics and engine to authoring; internal
barrels are avoided. Session imports only the public `@flowgraph/core` root. Tests use
separate compiler configs so Node/Vitest types cannot leak into production core.
