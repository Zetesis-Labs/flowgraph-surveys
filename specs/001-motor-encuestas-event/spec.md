# Feature Specification: Event-sourced survey engine (flow-core + flow-session)

**Feature Branch**: `001-motor-encuestas-event`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "Event-sourced survey engine: flow-core (graph kernel, decide/apply/replay, check, probe, goldens) and flow-session (observable session)"

## Context

Horizontal flow/survey engine (retail, logistics, governance, clinical) where the flow
is a **serializable graph** (not a tree with duplication), a session's state is an
**event log** (not a mutable snapshot), and all logic lives in a **pure core** with no
platform. Design derived from the post-mortem of an earlier-generation survey engine
and the clarification phase recorded below.
The project constitution (12 rules) governs this spec.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Respondent completes a conditional flow (Priority: P1)

A person (or an agent on their behalf) walks a survey defined as a graph: answers
questions, advances, goes back, and reaches an outcome. The engine validates each page,
picks the branch via declarative guards, and guarantees there is no path to a
conclusion with insufficient data (three-valued logic).

**Why this priority**: this is the entire engine; without it there is no product.
Every other story consumes this one.

**Independent Test**: fully executable with the pure core and a fixture schema — no UI,
no storage: a sequence of `decide/apply` ending in `SESSION_FINISHED`.

**Acceptance Scenarios**:

1. **Given** the 3-branch retail fixture and the `wrong_tickets` branch
   chosen, **When** the respondent completes the extra label-photo page and the shared
   pages, **Then** the trail records exactly that branch's path and the session ends in
   `completed`, with the shared pages defined ONCE in the schema (re-convergence).
2. **Given** a page with an unanswered required question, **When** advancing is
   attempted, **Then** `decide` returns
   `{ok:false, error:[{code:'required', where:{q}}]}` and NO event is emitted.
3. **Given** the PHQ-2 screening fixture with answers weighing 2+2, **When** advancing
   from the second page, **Then** the edge `cmp(sum(score q1, score q2) >= 3)` fires and
   reaches the referral page; with weights 1+1 it reaches the `negative` terminal.
4. **Given** both PHQ-2 questions UNANSWERED and an edge guarded by
   `not(cmp(sum >= 3))`, **When** evaluated, **Then** the guard is `unknown` (Kleene),
   the edge does NOT fire, and `decide` returns a `Result` error containing `no-edge`
   — never a fabricated outcome.
5. **Given** a respondent who advanced down branch A, went back, and chose branch B,
   **When** a guard or `score` references questions from the abandoned branch A,
   **Then** those answers are inactive (do not count) although they remain in the log;
   and **When** they return to branch A, **Then** the answers reappear pre-filled upon
   re-entering through their pages.

---

### User Story 2 - Session restorable and auditable via replay (Priority: P1)

An interrupted session is restored by rebuilding it from its log (`replay`); an auditor
reconstructs exactly what happened: what was answered, in what order, which branch was
taken, and **who** produced each datum (`source`: human/agent/import).

**Why this priority**: event sourcing is the project's structural bet; if replay is not
reliable, nothing else stands.

**Independent Test**: property test — serialize the log, re-create the session with
`createSession(schema, events)`, verify a deeply equal `FlowState`, and separately
verify equal outputs from `activeAnswers(schema,state)` and
`currentNode(schema,state)`.

**Acceptance Scenarios**:

1. **Given** a serialized log of a half-completed session, **When** a new session is
   created from it, **Then** its `FlowState` (status, stored answers, trail, schema
   identity, and outcome) is deeply equal to the state at interruption, while
   `activeAnswers()` and `currentNode()` produce equal derived values — there is no
   hydration path other than replay.
2. **Given** any valid log, **When** replayed twice, **Then** the resulting states are
   deep-equal (determinism).
3. **Given** events with mixed `source` (agent pre-fills, human corrects), **When** the
   log is read, **Then** every `ANSWERED` keeps its provenance and timestamp.
4. **Given** a valid v1 event, **When** the v1 read boundary loads it, **Then** the
   single composed upcast pipeline returns the current v1 shape in memory without
   rewriting disk; and a future unknown version fails explicitly. A concrete v1→v2
   migration test is deferred until the v2 wire format exists.

---

### User Story 3 - Technical author (or LLM) validates a schema before publishing (Priority: P2)

An author defines the graph's JSON schema and submits it to the validation ladder:
structural `check()` with actionable errors, bounded `probe()`, and golden tests with
engine-measured edge coverage. The generate → check → fix loop is suitable for LLM
authoring.

**Why this priority**: without the validator, graph defects are silent at runtime (the
central lesson of the prototype). It gates safe authoring, but the engine (US1) can be
demonstrated with already-valid fixtures.

**Independent Test**: corpus of broken schemas (dangling reference, unreachable page,
cycle without exit, forward-referencing visibleWhen, duplicate question) — `check()`
detects all with the expected codes.

**Acceptance Scenarios**:

1. **Given** a schema with an edge to a nonexistent node, **When** `check()` runs,
   **Then** `{severity: 'error', code: 'dangling-node', from, to}`.
2. **Given** a `visibleWhen` referencing a later question (ill-founded), **When**
   `check()` runs, **Then** a specific error naming the question and the reference.
3. **Given** a conditional page whose guards do not cover some combination of its
   referenced selects, **When** `probe()` runs, **Then** a dead-end report with the
   concrete combination that fires no edge.
4. **Given** the retail fixture's goldens, **When** the runner executes them, **Then**
   it reports which graph edges were never traversed (coverage computed by the engine,
   not asserted by the author).

---

### User Story 4 - Host integrates the observable session (Priority: P2)

A host (React, MCP, CLI) creates a session, dispatches commands, and subscribes to
changes. Rejections return synchronously to the caller (ephemeral friction); facts go
to the log; persistence and telemetry are subscribers.

**Why this priority**: it is the boundary that makes the core consumable, but it is
~50 lines on top of US1/US2.

**Acceptance Scenarios**:

1. **Given** a created session, **When** a valid `dispatch(ANSWER)` occurs, **Then**
   listeners are notified and `getSnapshot()` returns a new, stable reference.
2. **Given** a `dispatch(NEXT)` on an invalid page, **Then** the `Result` with problems
   returns to the caller, listeners are NOT notified, and the log does not grow.
3. **Given** an event subscriber (persistence), **When** events are emitted, **Then** it
   receives exactly the appended events, in order.
4. **Given** a valid `NEXT` whose selected edge reaches a terminal, **When** the host
   dispatches it, **Then** the event subscriber receives `ADVANCED` followed by
   `SESSION_FINISHED` as one append batch and the state subscriber is notified once
   with the finished snapshot.

### Edge Cases

- After `SESSION_FINISHED` is recorded, the session is **sealed**: `ANSWER` and `BACK`
  are rejected with `session-sealed`; `NEXT` succeeds idempotently as
  `{ok:true, value:[]}`, emitting no new event. Hosts read finished status through
  `isFinished(state)`.
- A `NEXT` that reaches a terminal emits the ordered atomic batch
  `[ADVANCED, SESSION_FINISHED]`; a subscriber cannot observe the session between
  those two events.
- `back` on the first page → no-op (the trail never becomes empty).
- Answer to a question not present in the schema → rejected by `decide` (problem), no event.
- Answer to a question hidden by `visibleWhen`, or not on the current page → rejected.
- Answer whose kind mismatches the question (number to a select), an unknown `OptionId`,
  or multiple selections on a single-select → rejected structurally, no event.
- Out-of-range / over-max-length values ARE recorded (the user really entered them);
  they surface as problems on `NEXT` and via the per-question validation selector.
- `selected` guard over a non-select question → `unknown` (Kleene), never an exception.
- `score` with an option lacking `weight` → weight 0 (documented).
- Page with zero questions → valid (informational pages), advances directly.
- Empty log → `replay` yields the initial state at `entry`.
- A session created with an empty log is `not-started`: `ANSWER`, `NEXT`, and `BACK`
  are rejected with `session-not-started` until `START` succeeds.
- `START` after `SESSION_STARTED` is rejected with `session-already-started`; the log
  remains unchanged.
- Event with an unknown (future) `v` → upcast fails explicitly; never partial interpretation.
- Event with non-empty `path` on a v1 engine → rejected (fail-closed; subflow scope unknown).
- Two `ANSWERED` for the same question → last one wins (the log keeps both).
- A schema containing a self-loop or a cycle across multiple nodes is rejected by
  `check()` before execution; backward navigation over the recorded trail remains
  valid and is not a schema cycle.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The schema is an adjacency graph (`nodes` with identity, ordered edges
  with guards); strict fail-closed parsing (unknown kind does not parse).
- **FR-002**: Kernel v1 guards/expressions: `always/answered/selected/not/all/any/cmp`
  and `num/answer/score/sum`, with Kleene three-valued semantics; an edge fires only on
  definitive `true`.
- **FR-003**: `decide(schema, state, command) → Result<Event[], Problem[]>`, pure;
  v1 commands: `START`, `ANSWER`, `NEXT`, `BACK`. Every command carries immutable
  `meta{at, source, path}` supplied by the shell; `START` additionally carries the
  shell-computed `schemaHash`.
- **FR-004**: `apply(state, event) → state`, pure and total; `replay = fold(apply)`.
- **FR-005**: Event vocabulary v1 (5): `SESSION_STARTED{schemaId, schemaVersion,
  schemaHash}`, `ANSWERED{q, value}`, `ADVANCED{from, to}`, `WENT_BACK{from, to}`,
  `SESSION_FINISHED{outcome}`. Common envelope: `v`, `at` (epoch ms UTC, minted by the
  shell), `source` (`human|agent|import`), `path` (`[{flow, instance?}]`, empty in v1).
  Every event emitted for a command copies `at`, `source`, and `path` from that
  command's metadata.
- **FR-006**: Active truth — guards/scores/validation read only answers whose page is on
  the current trail and whose question is visible; the log keeps every fact.
- **FR-007**: `visibleWhen` references strictly earlier questions only; violation is a
  `check()` error; single-pass evaluation with normative order.
- **FR-008**: `check(schema) → SchemaProblem[]`, structural, with severity and
  actionable data: missing entry, dangling references, unknown or duplicate questions,
  unreachable nodes, no-terminal-reachable, no default edge, ill-founded visibility.
- **FR-009**: `probe(schema)` — bounded exploration per conditional page (enumerated
  selects; numerics at boundary values min/max/threshold±1) detecting semantic dead-ends.
- **FR-010**: Golden runner: a golden = command sequence + expected outcome (+ optional
  state asserts); the runner executes via replay and reports graph edge coverage.
- **FR-011**: Single upcast at the event read boundary; purely functional; fails
  explicitly on unknown versions.
- **FR-012**: `createSession(schema, events?)` in flow-session: `dispatch`,
  `getSnapshot` (stable reference), `subscribe`, `subscribeEvents`, `getEvents`;
  restore = replay, no alternative hydration path; single writer. Without past events,
  it creates an explicit `not-started` session and the host MUST dispatch `START`
  before any other command can succeed.
- **FR-013**: Declarative question validation: `required`, numeric range, `maxLength`;
  selects with static `options` and optional `weight`; texts as
  `TextRef{key, fallback}` — resolved text never appears in data or events.
- **FR-014**: Pure selectors exported for hosts: current page, visible questions,
  per-question validation (for inline errors), expression evaluation (score),
  progress, `canGoBack`, `isFinished`/outcome — no host computes business logic.
- **FR-015**: Normative evaluation semantics under missing/inactive/mistyped data:
  `answered` is always definite (true/false); `selected`, `cmp`, `score` yield
  `unknown` when their data is missing, inactive, or of the wrong kind; `not/all/any`
  follow Kleene tables (normative truth tables in the plan's data model). An edge
  fires only on definitive `true`.
- **FR-016**: `ANSWER` is valid only for questions visible on the current page.
  Structural mismatches (kind, unknown option, select arity) are rejected with no
  event; semantic violations (range, maxLength, required) are recorded and surface
  at `NEXT` and via the validation selector.
- **FR-017**: Sealed sessions — after `SESSION_FINISHED`, `decide` rejects `ANSWER`
  and `BACK` with `session-sealed`; `NEXT` returns `{ok:true, value:[]}`
  idempotently. Corrections happen in a new session (explicit reopen may arrive in a
  future version as a recorded event).
- **FR-018**: Replay integrity — `replay` verifies the supplied schema's content hash
  against `SESSION_STARTED.schemaHash` and fails explicitly (`schema-mismatch`);
  events inconsistent with the graph (e.g., `ADVANCED` to a nonexistent node) fail
  explicitly (`log-schema-mismatch`); never garbage state.
- **FR-019**: Engine semantics never read `at` — timestamps are provenance, not
  input. Event order is log position, never wall-clock. (No time-dependent guards
  can ever exist without a constitutional amendment.)
- **FR-020**: Canonical serialization for hashing — schemas hash as SHA-256 over
  canonical JSON (lexicographically sorted keys, UTF-8, no insignificant
  whitespace); the hash is computed by the shell and supplied inside the `START`
  command.
- **FR-021**: Normative Problem-code registry (runtime): `required`, `out-of-range`,
  `too-long`, `no-edge`, `missing-node`, `unknown-question`, `answer-kind-mismatch`,
  `unknown-option`, `arity-mismatch`, `not-current-page`, `session-sealed`,
  `schema-mismatch`, `log-schema-mismatch`. Codes are API: adapters and the LLM loop
  depend on them; additions are non-breaking, renames are breaking.
  The registry also includes lifecycle codes `session-not-started` and
  `session-already-started`.
- **FR-022**: A v1 schema MUST be a directed acyclic graph. `check()` MUST report a
  `cycle-detected` structural error for self-loops and multi-node cycles before a
  session can execute; bounded or instance-bearing repetition remains outside v1.
- **FR-023**: Session start is explicit and unique. `START` is the only command
  accepted in `not-started`; after `SESSION_STARTED`, every later `START` is rejected
  without emitting an event.
- **FR-024**: When `NEXT` selects an edge to a terminal, `decide()` MUST return the
  ordered batch `[ADVANCED, SESSION_FINISHED]`. Both events inherit the command
  metadata; `flow-session` appends the full batch before notifying state subscribers
  exactly once.
- **FR-025**: Structural graph constraints are part of the public v1 contract:
  `entry` MUST identify a page; one page MUST NOT declare multiple edges to the same
  target; and an edge guard may reference questions only on its current page or on
  strict ancestor pages. `check()` reports violations with stable actionable codes.

### Key Entities

- **FlowSchema**: immutable versioned graph (`id`, `version`, `entry`, `nodes`);
  archived append-only by the host; content hash referenced in `SESSION_STARTED`.
- **Event**: immutable fact with envelope (`v`, `at`, `source`, `path`) + union of 5 kinds.
- **FlowState**: derived projection containing the latest stored answers and trail;
  active truth is computed from `schema + state` by pure selectors and is never
  persisted separately. The complete projection is always reconstructible.
- **Command**: intent (`START/ANSWER/NEXT/BACK`) plus shell-supplied immutable
  provenance metadata; may be rejected leaving no trace in the log.
- **SchemaProblem / Problem**: structured actionable errors (authoring and runtime).
- **Golden**: conformance case living next to its schema (commands + expected outcome).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both fixtures (3-branch retail with re-convergence; PHQ-2 with scoring)
  pass their goldens with 100% edge coverage.
- **SC-002**: Property tests green: replay determinism, `apply` totality (no valid
  event throws), every trail is a valid graph path, schema/state/event serialization
  round-trip = identity.
- **SC-003**: The broken-schema corpus (≥6 error classes) is fully detected by
  `check()`/`probe()` with the expected codes.
- **SC-004**: `flow-core` compiles with `"lib": ["ES2022"]` (no DOM) and passes the
  banned-globals lint; zero runtime dependencies except zod at the parse boundary.
- **SC-005**: The Kleene scenario (US1.4) is an explicit test: no answers, no
  conclusion — the "fabricated outcome" bug class is impossible to reproduce.
- **SC-006**: A session serialized to JSON and restored in a fresh process continues
  exactly where it was (US2.1) — demonstrated in a flow-session integration test.
- **SC-007**: Replaying a log against a schema with a different content hash fails
  with `schema-mismatch` — demonstrated by test (the schemaHash guarantee is
  enforced, not decorative).
- **SC-008**: Property test — for any generated command sequence, no event ever
  follows `SESSION_FINISHED` in the log (sealed sessions hold universally).
- **SC-009**: The broken-schema corpus includes self-loop and multi-node-cycle cases;
  `check()` detects 100% of them with `cycle-detected` and identifies the cycle.
- **SC-010**: For identical schema, state, and command including its metadata,
  `decide()` produces deeply equal results without reading time, randomness, IO, or
  platform state.
- **SC-011**: For every valid session log, `SESSION_STARTED` occurs exactly once as
  the first event; generated command-sequence tests never produce an earlier event or
  a second start.
- **SC-012**: In 100% of terminal-transition tests, the log records `ADVANCED`
  immediately followed by `SESSION_FINISHED` from the same command, event subscribers
  receive both in order, and state subscribers observe only the finished snapshot.
- **SC-013**: CI MUST enforce 100% statement, branch, function, and line coverage,
  globally and per executable source file, across `packages/flow-core/src` and
  `packages/flow-session/src`. Type-only files are naturally non-executable; excluding
  executable code requires an explicit documented human waiver.
- **SC-014**: Explicit contract tests demonstrate that a valid zero-question page
  advances normally and that repeated `ANSWERED` events for one question retain both
  facts in the log while the latest value wins in the projected state.

## Clarifications

### Session 2026-07-19

- Q: Are graph cycles allowed in core v1? → A: No; v1 schemas are acyclic and `check()` rejects every cycle.
- Q: How does pure `decide()` receive event provenance and schema hash? → A: Each command carries shell-supplied metadata; `START` also carries `schemaHash`.
- Q: Is session start explicit or implicit? → A: Explicit; a new session accepts only `START`, and a second `START` is rejected.
- Q: Which events does `NEXT` emit when it reaches a terminal? → A: One atomic ordered batch: `ADVANCED`, then `SESSION_FINISHED`.
- Q: What code-coverage gate governs the pure core and session shell? → A: CI requires 100% statements, branches, functions, and lines globally and per executable source file.
- Q: What does the v1 upcast acceptance test prove before a v2 format exists? → A: Identity through the composed boundary, no disk rewrite, and explicit rejection of future versions.
- Q: Is active truth stored inside FlowState? → A: No; it is selector-derived from schema, trail, and latest stored answers.
- Q: Are the plan's entry, duplicate-target, and edge-guard reference restrictions normative? → A: Yes; they are public v1 structural constraints enforced by check().
- Q: Must zero-question pages and repeated answers have explicit contract tests? → A: Yes; both behaviors are named acceptance gates, not incidental coverage.
- Q: How are blocked commands and NEXT on a finished session represented? → A: Blocked commands are Result errors; finished NEXT is successful with an empty event batch.
- Q: What must restoration compare for state and active truth? → A: Deep-equal FlowState plus equal activeAnswers and currentNode selector outputs.

- Logic under missing answers: **Kleene three-valued**; an edge fires only on
  definitive true.
- Abandoned branches: full log + **active truth**; reactivation only by re-entering.
- Transitions: **recorded** (`ADVANCED`); history is not rewritten by hotfixes.
- Rejections: **not events**; returned synchronously; telemetry is separate.
- Provenance: `source` on every event from v1 (compliance, hybrid human+agent sessions).
- Repeatable instances: opaque ids minted in the shell; `path` on the event from v1;
  subflow implementation lands in v1.1.
- Concurrency: **single writer per session**; no log merging.
- Authoring integrity: `schemaHash` in `SESSION_STARTED` (dev schemas overwritten
  in place become detectable).
- Kernel: 4 admission criteria; named evaluators = macros expanding to kernel.

### Completeness pass (2026-07-19, later same day)

- Finished sessions are **sealed** (FR-017); reopen, if ever, will be a recorded event.
- Validation split: structural at `ANSWER` (rejected, no event), semantic at `NEXT`
  (recorded facts, surfaced as problems) — the log keeps what the user really entered.
- `replay` **verifies** `schemaHash` (FR-018) — the hash is enforced, not decorative.
- Canonical JSON (sorted keys) + SHA-256 for schema hashing (FR-020).
- `at` is provenance only; engine semantics are time-independent (FR-019).
- Kleene primitive table: `answered` definite; `selected/cmp/score` unknown on
  missing/inactive/mistyped; edge fires only on definitive true (FR-015).
- Problem codes are a stable API surface (FR-021).

### Deferred beyond the v1 implementation plan

- **Logical grouping vs presentational pagination**: v1 keeps page = graph node;
  renderers may re-paginate visually (e.g., one page per screen on mobile). Revisit
  as a separate layer if verticals demand it.
- **Evaluator macro expansion point**: macros expand to kernel at authoring time
  (the engine only ever sees kernel); the macro catalog itself ships with authoring
  tooling, not with the engine. Detail in plan phase.
- **Telemetry format** (e.g., blocked-attempt analytics): subscriber-side concern,
  out of core.

## Assumptions

- The host supplies the exact schema (id+version) on restore; the schema registry is
  the host's responsibility (outside the core).
- Authors are technical (humans, or LLMs with the check loop); a visual editor is not
  a requirement.
- React/MCP/CLI adapters are specified as separate features (002+) on top of the
  flow-session API; they do not constrain this spec.
- Volumes: session logs of tens–hundreds of events; graphs of tens–hundreds of nodes.
  No extraordinary performance requirements.
- The log is a per-session container; session identity and multi-session storage
  tagging are the host's responsibility (the shell exposes one session per instance).
- Forward execution visits each node at most once in v1; repeated instances and
  bounded looping remain deferred to v1.1.
- The v1 plan resolves the numeric representation, full Kleene truth tables, golden
  format, progress formula, edge-coverage rules, hashing, and shell notification/
  reentrancy contract in `research.md`, `data-model.md`, and `contracts/`.
