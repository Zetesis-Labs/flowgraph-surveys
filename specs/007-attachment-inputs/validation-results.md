# Validation Results: Attachment Inputs

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
| Existing demo Playwright | PASS — 14/14 desktop and mobile |

Coverage evidence:

- Statements: 100% (1460/1460)
- Branches: 100% (962/962)
- Functions: 100% (388/388)
- Lines: 100% (1269/1269)

## Requirement reconciliation

- FR-001–FR-003: Attachment ids, references, questions, strict schemas, and metadata-only
  answers are public and covered by parser tests.
- FR-004–FR-007: Replay, active truth, structured validation, checking, and bounded
  probing are covered in core unit and integration tests.
- FR-008–FR-010: The injected volatile store and default renderer are covered by
  contract and FlowPage integration tests, including rejection without mutation.
- FR-011: Repository search returns no reporting-vertical terms in the implementation.
- FR-012 and SC-005: Exact governed coverage is recorded above.
- SC-001–SC-004: Round trips, deterministic replay, every validation class, focus,
  disabled state, removal, replacement, and absent-binary remount behavior pass.
- SC-006: `rg -n -i "garment|prenda|naiz|fitting" packages/flow-core packages/flow-react`
  returns no matches.

## Manual boundary review

- No `capture` attribute is rendered.
- No camera API is referenced.
- File objects remain confined to `flow-react`.
- Schemas and event logs contain references only.
