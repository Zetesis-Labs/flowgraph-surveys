# Technical Decisions — closed during design phase

**Scope**: implementation-level decisions that are CLOSED. The plan phase
(`/speckit-plan`) consumes this file instead of re-deriving; anything listed under
"Open" at the bottom is the plan's to decide. Re-litigating a closed item requires
the same ceremony as a constitutional amendment.

## Stack & tooling

- TypeScript, `strict` + `noUncheckedIndexedAccess`. pnpm workspaces monorepo.
- Tests: vitest; property-based testing with fast-check.
- CI coverage: 100% statements, branches, functions, and lines globally and per
  executable source file in flow-core and flow-session. Executable-code exclusions
  require a documented human waiver.
- `zod` at parse boundaries only (incoming schemas, events, persisted state).
  Core internals are zod-free; parsed values flow as plain typed data.

## FP dialect

- Vanilla FP. No fp-ts, no Effect — in kernel or shell. Adapters may use whatever
  their host uses; it never leaks inward.
- ADTs = discriminated unions on `kind`; exhaustive `switch` with `never` check.
- `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }` — hand-rolled.
  Core functions never throw on input that passed the parse boundary.
- `readonly` by default. No classes in flow-core. No mutation outside flow-session.

## Package boundaries (physical, not conventional)

- `flow-core/tsconfig.json` → `"lib": ["ES2022"]` — DOM types do not compile.
- ESLint `no-restricted-globals` in flow-core/src: `Date`, `Math.random`, `crypto`,
  `performance`, `setTimeout`, `setInterval`, `fetch`.
- `flow-session` is the only stateful module (target: ~50 lines); depends only on
  flow-core. Adapters depend on session+core; nothing depends on adapters.
- React binding: `useSyncExternalStore`; React ≥18 as peer dependency.

## Core API surface (signatures closed)

```ts
decide(schema, state, command): Result<readonly Event[], readonly Problem[]>
apply(state, event): FlowState                      // total
replay(schema, events): Result<FlowState, Problem>  // verifies schemaHash; explicit failures
check(schema): SchemaProblem[]
probe(schema): ProbeReport
createSession(schema, pastEvents?): Result<FlowSession, Problem>
```

This completes the earlier sketch so restoration can surface `replay` failures without
throwing or exposing a partial session.

- `dispatch` returns the `Result` synchronously; rejections never notify subscribers
  and never touch the log.
- `getSnapshot`: stable reference between notifications; new reference after each
  applied batch (React memo-friendly).
- `subscribeEvents`: only events appended after subscription, in log order; catch-up
  via `getEvents()`. It receives one readonly batch per successful non-empty dispatch.
  State notifications are synchronous post-append and occur once per batch.
- Commands v1: `START`, `ANSWER`, `NEXT`, `BACK`. Restore = `createSession(schema,
  events)` — there is no other hydration path.
- Every command carries shell-supplied `meta{at,source,path}`; `START` also carries
  `schemaHash`. Session start is explicit and unique.
- Dispatch during notification is rejected with `reentrant-dispatch`.

## Wire formats

- Event envelope: `{ v: int, at: epoch-ms UTC int, source: 'human'|'agent'|'import',
  path: Array<{flow: string, instance?: string}> }` + kind payload.
- v1 kinds (5): `SESSION_STARTED{schemaId, schemaVersion, schemaHash}`,
  `ANSWERED{q, value}`, `ADVANCED{from, to}`, `WENT_BACK{from, to}`,
  `SESSION_FINISHED{outcome}`.
- Ids are branded strings (`NodeId`, `QuestionId`, `OptionId`); instance ids opaque,
  minted in the shell, arriving inside commands.
- Schema hash: SHA-256 over canonical JSON — lexicographically sorted keys, UTF-8,
  no insignificant whitespace. Core exports pure synchronous `hashSchema`; the shell
  calls it for `START`, while `decide` and `replay` recompute and verify it.
- `TextRef { key, fallback }`; resolved text never enters data or events.
- Graph: `{ id, version, entry, nodes: Record<NodeId, Node> }`; ordered edges;
  first definitively-true guard wins.
- Graphs are acyclic in v1. Entry identifies a page; same-page/same-target parallel
  edges are rejected because `ADVANCED{from,to}` must identify coverage
  reconstructibly; edge guards may reference only their current or ancestor pages.
- The composed v1 read-boundary upcast is an identity migration that rejects unknown
  future versions and never rewrites disk. Concrete v1→v2 migration behavior is
  deferred until the v2 wire format exists.

## Semantics (closed — normative detail in spec 001 FR-015..021)

- Kleene three-valued evaluation; an edge fires only on definitive `true`.
- `answered` is always definite; `selected`/`cmp`/`score` are `unknown` on
  missing/inactive/mistyped data.
- Active truth (trail ∩ visible); sealed sessions after `SESSION_FINISHED`.
- `ANSWER`: structural mismatch rejected (no event); semantic violations recorded,
  surfaced at `NEXT` and via the validation selector.
- `at` is provenance, never an input; event order = log position.
- Kernel v1: `always/answered/selected/not/all/any/cmp` + `num/answer/score/sum`.
  Evaluators-with-names are authoring-time macros expanding to kernel.
- Numeric wire values and weights are scaled safe integers; arithmetic is exact and
  overflow becomes unknown. K3 tables use mathematical empty identities.
- Terminal `NEXT` emits the atomic ordered batch `[ADVANCED, SESSION_FINISHED]`.

## Resolved by the implementation plan (2026-07-19)

- Core and session are separate ESM-only ES2022 packages built with `tsc -b`; internal
  module layout and CI boundary gates are defined in `plan.md`.
- Goldens are versioned declarative JSON; coverage is reconstructed by `(from,to)` from
  replayed `ADVANCED` events.
- Probe explores at most 4096 deterministic assignments per conditional page and
  reports truncation without claiming completeness.
- Progress uses completed trail edges over completed plus the longest remaining path
  in the checked DAG; it is monotonic on forward movement.
- Runtime problems expose codes and structured details; adapters own localized
  messages.
- Session reentrancy is rejected; accepted batches commit before event listeners and
  one state notification.
- Numeric values are safe integers with exact comparison and internal bigint
  accumulation.
- Strong Kleene truth tables, data shapes, hashing, validation, and notification
  contracts are normative in `data-model.md` and `contracts/`.
