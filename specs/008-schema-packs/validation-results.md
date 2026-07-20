# Validation Results: Composable Schema Packs

**Validated**: 2026-07-20

## Automated gates

| Gate | Result |
|------|--------|
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm boundaries` | PASS — 251 modules, 404 dependencies, zero violations |
| `pnpm build` | PASS |
| `pnpm test:coverage` | PASS — 54 files, 251 tests |
| `pnpm package:check` | PASS — all three tarballs, public exports, and consumer installs |
| `pnpm demo:build` | PASS |
| Adapter Playwright | PASS — 7/7 accessibility, keyboard, and performance |
| Demo Playwright | PASS — 14/14 desktop and mobile |

Coverage evidence:

- Statements: 100% (1460/1460)
- Branches: 100% (962/962)
- Functions: 100% (388/388)
- Lines: 100% (1269/1269)

## Requirement reconciliation

- FR-001–FR-005: Strict concrete packs, private internals, named entries/outlets,
  composition roots, and ordered connections are covered by parser and pack-check tests.
- FR-006–FR-008: Injective namespacing, complete recursive reference rewriting, and
  internal-before-external edge ordering are covered by integration and property tests.
- FR-009–FR-010: Duplicate identities/bindings, unknown instances/ports/targets,
  required unconnected outlets, invalid packs, and invalid compiled schemas produce
  aggregated, stable, location-aware problems without partial output.
- FR-011–FR-012: Compiled output is strict ordinary-schema JSON and passes the existing
  checker, probe, replay-driven golden runner, and serialization boundary unchanged.
- FR-013: Two typed factory configurations preserve their concrete values without
  serializing or executing a factory at runtime.
- FR-014: Purity and platform independence are verified by code review, deterministic
  property tests, and package boundary checks.
- FR-015 and SC-006: Determinism and exact governed coverage are recorded above.
- SC-001: A 20-pack, 500-node composition compiles below the one-second test threshold.
- SC-002: The same concrete pack compiles 100 times with collision-free identities.
- SC-003: Successful compiled output exposes only `id`, `version`, `entry`, and `nodes`.
- SC-004: Every declared invalid pack/composition class is covered with no partial result.
- SC-005: Ordinary goldens complete every compiled route with 100% measured edge coverage.

## Boundary review

- Compiled output contains only the existing `FlowSchema` grammar.
- The session, replay, probe, and golden runtimes contain no pack-specific branches.
- Compilation performs no input/output, clock access, randomness, mutation, or registry lookup.
- Concrete pack and composition documents remain strict JSON data.
