# FlowGraph Constitution

Event-sourced flow/survey engine, horizontal across verticals (retail, logistics,
governance, clinical…), consumable from frontends (React), agents (MCP), and CI.
This constitution captures the decisions closed during the design phase (Jul 2026);
every spec, plan, and task must comply with it or propose an explicit amendment.

## Core Principles

### I. Functional Core, Effectful Shell (NON-NEGOTIABLE)
`flow-core` is pure: zero platform dependencies, no DOM, no clock, no randomness,
no IO. All logic is total functions `(Schema, State, Input) → Result`.
The only place with mutation is `flow-session` (an observable cell of ~50 lines).
Adapters (React, MCP, CLI) are subscribers; they never contain business logic.
Enforcement is mechanical, not disciplinary: flow-core `tsconfig` with
`"lib": ["ES2022"]` (no DOM), ESLint `no-restricted-globals` (`Date`, `Math.random`,
`crypto`, `performance`, `setTimeout`), and physical package boundaries (an illegal
import does not compile). Disciplined vanilla FP: ADTs as discriminated unions with
exhaustive matching, `Result` instead of exceptions, `readonly` by default.
Neither fp-ts nor Effect in the kernel.

### II. Event sourcing as the single source of truth
State is a projection: `state = replay(schema, events) = events.reduce(apply, init)`.
Core API: `decide(schema, state, command) → Result<Event[], Problem[]>` (pure,
validates intent) and `apply(state, event) → state` (pure, total). The snapshot is a
cache, never the truth. Minimal session-event vocabulary in v1 (5): `SESSION_STARTED`,
`ANSWERED`, `ADVANCED`, `WENT_BACK`, `SESSION_FINISHED`. The vocabulary grows only by
constitutional amendment and never mutates existing kinds (planned extensions:
`SCHEMA_MIGRATED` with session migration; `ITEM_ADDED`/`ITEM_REMOVED` with v1.1
subflows). Facts are recorded, including the
transitions taken (history is not rewritten by schema hotfixes). Rejections (blocked)
are NOT events: they return synchronously to the caller; ephemeral friction lives in
the client, telemetry is a separate subscriber.

### III. Immutable event shape (decided on day one)
Every event carries: `v` (event-format version), `at` (epoch millis UTC, minted by the
emitting shell), `source` (`human` | `agent` | `import`), and `path`
(`Array<{flow: string, instance?: string}>` — subflow scope; empty in v1).
`SESSION_STARTED` includes `schemaId`, `schemaVersion`, and the **content hash of the
schema** (SHA-256 over canonical JSON), which `replay` verifies against the supplied
schema. `at` is provenance, never an input: engine semantics are time-independent, and
event order is log position, not wall-clock. Events on disk are never rewritten; a
single pure upcast function at the read boundary composes migrations. Instance ids are
opaque, stable, minted in the shell and arrive inside the command — the core never
generates ids.

### IV. Semantics closed by specification, not by implementation
(a) **Three-valued logic (Kleene)**: `unknown` propagates; an edge fires only if its
guard is definitively `true`. The system fails toward asking for more information,
never toward a fabricated conclusion.
(b) **Active truth**: an answer counts for guards/scores/validation if and only if its
page is on the current trail and the question is visible under the active answers.
The log keeps every fact; nothing reactivates without re-entering through its page.
(c) **Well-foundedness**: `visibleWhen` may only reference strictly earlier questions
(previous pages on the trail, or document order within the same page); `check()`
enforces this as an error. Single-pass evaluation with normative order.
(d) **Single writer per session**: the log is a sequence, not a set. Collaboration =
one session per actor, reconciled over typed outputs — never log merging.

### V. Minimal governed kernel
The graph is an adjacency map with identity (`nodes: Record<NodeId, Node>`, ordered
edges with guards). Kernel v1 expressions: `always/answered/selected/not/all/any/cmp`
plus `num/answer/score/sum`. A new primitive enters only if it meets all 4 criteria
(needed by ≥2 independent verticals; not expressible as a macro; analyzable by
`check()`; total under missing answers). Named evaluators are macros that expand to
kernel — the engine interprets kernel only. Fail-closed: unknown `kind` does not parse.
Presentation never lives in data: texts are `TextRef` (i18n key + fallback), resolved
at render time, never persisted.

### VI. Validation as a product (three-rung ladder)
1. `check()`: structural — dangling references, reachability, co-reachability to a
terminal, duplicates, visibility well-foundedness. Structured, actionable errors
(`{code, where, suggestion}`) — they are the feedback loop for LLM authoring.
2. `probe()`: bounded exploration — for each conditional page, enumerate combinations
of its referenced questions (finite selects; numerics at boundary values min/max/
threshold±1) and verify some edge fires.
3. **Golden tests with engine-measured edge coverage**: each golden runs through
`replay`; the runner reports untraversed edges. Critical domains: 100% coverage or an
explicit human waiver. Coverage is computed by the engine — it cannot be asserted.

### VII. Test-first over the pure core
The core invites property tests, and they are required: replay determinism (same log
twice → deep-equal states), totality of `apply`, every trail is a valid path of the
graph, serialization round-trip = identity. Goldens (PHQ-2, retail flow) live
next to the example schemas and run in CI as the engine's conformance suite.

## Additional Constraints

- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`). pnpm monorepo.
- `zod` allowed only at the parse boundary (incoming schemas/events/state).
- A session is pinned to its schema version; the schema registry is append-only;
  session migration is an explicit operation that emits `SCHEMA_MIGRATED`.
- Out of core scope (adapters or separate products): storage, React, MCP, visual
  editor, i18n resolution, multi-actor, multi-device sync, analytics.
- Subflows/repeatables are implemented in v1.1, but their footprint in the event
  format (`path`, instances) exists from v1.
- Question ids are stable across schema versions (longitudinal-analytics contract);
  renaming a question id is a breaking schema change, not an edit.

## Development Workflow

Spec-driven: constitution → specify → clarify (done during the design phase, recorded
in the specs) → plan → tasks → implement. Spec-kit artifacts are the source of
decisions; code that contradicts a spec loses. Every PR verifies compliance with this
constitution; adding kernel primitives requires an amendment documenting the 4 criteria.

## Governance

This constitution supersedes all other practices. Amendments: PR with rationale,
impact on already-recorded events (touching Principle III requires an upcast), and
updates to affected specs.

**Version**: 1.2.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-19
