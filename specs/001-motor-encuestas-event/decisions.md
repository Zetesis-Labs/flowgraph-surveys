# Technical Decisions — closed during design phase

**Scope**: implementation-level decisions that are CLOSED. The plan phase
(`/speckit-plan`) consumes this file instead of re-deriving; anything listed under
"Open" at the bottom is the plan's to decide. Re-litigating a closed item requires
the same ceremony as a constitutional amendment.

## Stack & tooling

- TypeScript, `strict` + `noUncheckedIndexedAccess`. pnpm workspaces monorepo.
- Tests: vitest; property-based testing with fast-check.
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
createSession(schema, pastEvents?): {
  dispatch, getSnapshot, getEvents, subscribe, subscribeEvents
}
```

- `dispatch` returns the `Result` synchronously; rejections never notify subscribers
  and never touch the log.
- `getSnapshot`: stable reference between notifications; new reference after each
  applied batch (React memo-friendly).
- `subscribeEvents`: only events appended after subscription, in log order; catch-up
  via `getEvents()`. State notifications are synchronous post-append.
- Commands v1: `START`, `ANSWER`, `NEXT`, `BACK`. Restore = `createSession(schema,
  events)` — there is no other hydration path.

## Wire formats

- Event envelope: `{ v: int, at: epoch-ms UTC int, source: 'human'|'agent'|'import',
  path: Array<{flow: string, instance?: string}> }` + kind payload.
- v1 kinds (5): `SESSION_STARTED{schemaId, schemaVersion, schemaHash}`,
  `ANSWERED{q, value}`, `ADVANCED{from, to}`, `WENT_BACK{from, to}`,
  `SESSION_FINISHED{outcome}`.
- Ids are branded strings (`NodeId`, `QuestionId`, `OptionId`); instance ids opaque,
  minted in the shell, arriving inside commands.
- Schema hash: SHA-256 over canonical JSON — lexicographically sorted keys, UTF-8,
  no insignificant whitespace. Computed by the shell at `START`; verified by `replay`.
- `TextRef { key, fallback }`; resolved text never enters data or events.
- Graph: `{ id, version, entry, nodes: Record<NodeId, Node> }`; ordered edges;
  first definitively-true guard wins.

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

## Open — the plan phase decides (do not assume)

- Internal file/module layout of flow-core; naming conventions beyond the API above.
- Golden file format; edge-coverage counting rules; probe exploration budget.
- Progress formula; problem *message* wording (codes are closed API, messages are not).
- Session shell reentrancy contract (dispatch during notification).
- Packaging/publishing (build tool, exports maps) and CI pipeline details.
- Numeric representation beyond "integer weights for scores" (floats vs scaled ints,
  `eq` on non-integers).
- Full normative Kleene truth tables (data-model artifact of the plan).
