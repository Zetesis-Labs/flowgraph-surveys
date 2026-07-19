# Validation Results: Event-sourced Survey Engine

**Validated**: 2026-07-19
**Environment**: macOS, Node.js 22.22.0, pnpm 10.14.0

## Reproducible installation

`pnpm install --frozen-lockfile` passed without modifying `pnpm-lock.yaml`.

## Complete feature gate

| Command | Result |
|---|---|
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm boundaries` | PASS — 138 modules and 219 dependencies, no violations |
| `pnpm test:coverage` | PASS — 22 files, 121 tests |
| `pnpm build` | PASS |
| `pnpm package:check` | PASS |

Coverage is exactly 100% globally and per executable source file:

| Metric | Covered |
|---|---:|
| Statements | 829 / 829 |
| Branches | 611 / 611 |
| Functions | 197 / 197 |
| Lines | 709 / 709 |

## Focused quickstart gates

| Command | Result |
|---|---|
| `pnpm --filter @flowgraph/core test -- --coverage` | PASS — 19 files, 112 core tests |
| `pnpm --filter @flowgraph/core test:authoring` | PASS — 22 authoring tests |
| `pnpm --filter @flowgraph/core test:goldens` | PASS — 6 golden tests |
| `pnpm --filter @flowgraph/core test:replay` | PASS — 8 replay/upcast tests |
| `pnpm --filter @flowgraph/session test -- --coverage` | PASS — 9 session tests |
| `pnpm --filter @flowgraph/core typecheck:prod` | PASS |

The root coverage gate measures both packages together and enforces the required
per-file thresholds.

## Acceptance evidence

- Retail and PHQ-2 declarative suites complete with 100% engine-measured edge
  coverage.
- Structural checking detects the complete broken-schema corpus, including self-loop
  and multi-node cycles.
- Probe retains dead-end witnesses, stops at 4096 assignments, and reports truncation.
- Replay rejects schema/hash mismatch, future event versions, invalid transitions,
  broken terminal adjacency, duplicate starts, and events after finish.
- Session tests prove stable references, atomic terminal batches, ordered
  notifications, replay-only restore, reentrancy rejection, and post-commit
  `AggregateError`.
- The 500-node graph and 1000-event log regression tests pass.
- Both package tarballs pass Publint and Are The Types Wrong under the ESM-only
  profile.
- Clean temporary ESM and TypeScript consumers install the tarballs and resolve only
  the public package roots.

No waiver or source-file coverage exclusion is present.
