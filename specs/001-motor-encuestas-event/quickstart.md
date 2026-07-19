# Quickstart Validation Guide

This guide describes how to validate the completed
`001-motor-encuestas-event` feature. It is a runbook, not implementation code.

## Prerequisites

- Node.js 22 or 24
- Corepack-enabled pnpm matching the root `packageManager`
- A checkout with `packages/flow-core` and `packages/flow-session` implemented

From the repository root:

```bash
pnpm install --frozen-lockfile
```

Expected result: dependencies install without changing `pnpm-lock.yaml`.

## 1. Run the complete feature gate

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm boundaries
pnpm test:coverage
pnpm build
pnpm package:check
```

Expected result:

- No formatting, lint, compiler, dependency-boundary, or packaging error.
- Core production compilation has no DOM or Node types.
- Core imports zod only from parsing modules.
- Session depends only on the public core package.
- Unit, integration, property, broken-schema, hash-vector, golden, and consumer tests
  all pass.
- Coverage is exactly 100% for statements, branches, functions, and lines both
  globally and in every executable source file in core and session.

## 2. Validate the pure core package

```bash
pnpm --filter @flowgraph/core test -- --coverage
pnpm --filter @flowgraph/core build
```

Expected result:

- Strong Kleene truth tables pass exhaustively.
- Numeric safe-integer, overflow, and exact comparison tests pass.
- JCS examples and NIST SHA-256 vectors pass.
- Test-only hashing cross-checks match `node:crypto`.
- `decide`, `apply`, and `replay` satisfy deterministic property tests.
- Core executable source files reach 100% statements, branches, functions, and lines.
- The emitted package contains ESM JavaScript, declarations, and maps only from
  `dist/`.

## 3. Validate authoring safeguards

```bash
pnpm --filter @flowgraph/core test:authoring
```

Expected result:

- `check()` detects every required broken-schema class, including self-loop,
  multi-node cycle, duplicate edge target, forward visibility reference, dangling
  reference, unreachable node, and missing terminal path.
- `probe()` reports a concrete witness for the dead-end fixture.
- The budget fixture explores 4096 assignments, reports
  `probe-budget-exceeded`, and does not claim completeness.

See [validation.md](contracts/validation.md) for the normative report rules.

## 4. Run golden journeys and coverage

```bash
pnpm --filter @flowgraph/core test:goldens
```

Expected result:

- Every retail route completes, including reconvergence and branch correction.
- Abandoned-branch answers remain in the log but are absent from active truth.
- PHQ-2 threshold routes reach their expected outcomes.
- Missing PHQ-2 answers never fabricate the negative outcome.
- Both fixtures report 100% edge coverage calculated from replayed `ADVANCED` events.
- No golden file contains an asserted coverage percentage or schema hash.

## 5. Validate replay integrity

```bash
pnpm --filter @flowgraph/core test:replay
```

Expected result:

- Replaying the same log twice gives deeply equal states.
- Replaying with a modified schema gives `schema-mismatch`.
- Unknown event versions and non-empty v1 paths fail closed.
- Invalid transitions give `log-schema-mismatch`.
- Empty logs return `not-started`.
- Every accepted log starts exactly once and contains no event after finish.

## 6. Validate the observable session shell

```bash
pnpm --filter @flowgraph/session test -- --coverage
```

Expected result:

- Fresh creation returns a successful `not-started` session.
- Invalid restore returns a `Result` error and no partial session.
- Snapshot and event-array references remain stable between commits.
- Rejections and successful empty batches do not notify.
- A terminal dispatch exposes one event batch
  `[ADVANCED, SESSION_FINISHED]` and one final state notification.
- Reentrant dispatch returns `reentrant-dispatch`.
- Subscriber-list changes affect only the next notification cycle.
- Session executable source files reach 100% statements, branches, functions, and lines.

See [public-api.md](contracts/public-api.md) for exact ordering and exception behavior.

## 7. Verify the platform boundary mechanically

```bash
pnpm boundaries
pnpm --filter @flowgraph/core typecheck:prod
```

Expected result:

- Imports of `node:*`, DOM APIs, session/adapters, timers, host crypto, or random
  sources from core production code fail the gate.
- `Date`, `Math.random`, `crypto`, `performance`, timers, and `fetch` are prohibited.
- Package and internal dependency graphs contain no cycle.

## 8. Verify published-package consumption

```bash
pnpm package:check
```

Expected result:

- `publint` and `@arethetypeswrong/cli` accept both tarballs.
- A clean ESM NodeNext consumer imports each public root successfully.
- A clean TypeScript consumer resolves declarations without workspace source paths.
- Deep imports and undeclared subpaths are not exposed.

## Acceptance

The core v1 feature is ready for task completion only when every command above passes,
the two governed fixtures have 100% measured edge coverage, every executable core and
session source file has 100% statement/branch/function/line coverage, all property
tests are green with reproducible fast-check seeds, and no constitution gate in
[plan.md](plan.md) has regressed.
