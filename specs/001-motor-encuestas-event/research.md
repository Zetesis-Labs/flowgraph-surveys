# Phase 0 Research: Event-sourced Survey Engine

**Feature**: `001-motor-encuestas-event`
**Date**: 2026-07-19
**Status**: Complete — no unresolved technical clarifications

## 1. Numeric representation

**Decision**: v1 numeric wire values are scaled safe integers. Numeric answers,
`num` literals, range bounds, comparison thresholds, and option weights MUST satisfy
`Number.isSafeInteger`; `-0` is normalized to `0`. Fractions, non-finite values, and
values outside the safe-integer range fail at the parse boundary.

Domains needing decimals express values in their smallest declared unit outside the
kernel (for example, cents or tenths). Units are authoring context and are not carried
or converted by v1.

`sum` and multi-select `score` accumulate with internal `bigint`, then return a known
number only when the final result is a safe integer. Overflow yields `unknown`, never
a rounded value. `eq` and `ne` are exact integer comparisons without epsilon.

**Rationale**: exact integers keep comparisons, hashing, replay, probing at
`threshold ± 1`, and cross-runtime serialization deterministic without a decimal
dependency or a contextual tolerance policy.

**Alternatives considered**:

- Finite IEEE-754 decimals with exact equality: rejected because common decimal sums
  produce surprising equality and serialization behavior.
- Floating-point epsilon: rejected because no universal tolerance exists and it breaks
  coherent ordering semantics.
- Decimal strings or coefficient/scale pairs: exact but expands every wire contract;
  reserve for a separately versioned future requirement.
- One global scale: rejected because it imposes arbitrary precision and range on every
  vertical.

## 2. Strong Kleene evaluation

**Decision**: the truth domain is Strong Kleene K3:
`true | false | unknown`.

- `not(true)=false`, `not(false)=true`, `not(unknown)=unknown`.
- `all` returns `false` if any operand is false, `true` if all are true, and
  `unknown` otherwise. `all([])=true`.
- `any` returns `true` if any operand is true, `false` if all are false, and
  `unknown` otherwise. `any([])=false`.
- An empty `all` or `any` remains total but produces an authoring warning.
- `answered` is always definite: it reports whether a structurally typed, active,
  visible answer fact exists; semantic validity is separate.
- `selected` is true or false only for an existing active select answer and is
  `unknown` for missing, inactive, hidden, or mistyped data.
- `answer` applies only to numeric questions; `score` applies only to selects.
  Missing, inactive, hidden, mistyped, or overflowing values yield `unknown`.
- `sum` yields `unknown` when any input is unknown. Missing data is never coerced to
  zero.
- `cmp` supports `eq`, `ne`, `lt`, `lte`, `gt`, and `gte`; an unknown operand makes
  the comparison unknown.
- An edge fires only when its guard is definitively true.

**Rationale**: these tables are total, preserve information under missing data, and
allow a determining operand (`false` in `all`, `true` in `any`) to settle a result
without fabricating values.

**Alternatives considered**:

- Boolean coercion of unknown to false: rejected because negation can fabricate a
  conclusion.
- Strict "any unknown means unknown": rejected because it is not Strong Kleene and
  ignores already-determining operands.

## 3. Canonical schema hashing

**Decision**: `hashSchema(schema)` is a pure synchronous core function:

1. Parse and normalize a `FlowSchema`.
2. Canonicalize it using the JSON Canonicalization Scheme rules of
   [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html): recursively sorted object
   keys, preserved array order, ECMAScript primitive serialization, and no
   insignificant whitespace.
3. Encode canonical text as UTF-8 with a pure encoder.
4. Compute SHA-256 in pure TypeScript following
   [FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final).
5. Return 64 lowercase hexadecimal characters.

The shell calls `hashSchema()` when constructing `START`. `decide(START)` recomputes
and verifies the supplied hash before emitting `SESSION_STARTED`; `replay()` recomputes
and compares it with the first event before applying the log. Empty logs remain
`not-started` and require no comparison.

The implementation is tested with JCS examples, NIST SHA-256 vectors, canonicalization
properties, and a test-only cross-check against `node:crypto`.

**Rationale**: this is the only synchronous, dependency-free, platform-neutral design
that actually verifies content while preserving the closed core signatures and the
no-platform constitution gate.

**Alternatives considered**:

- Web Crypto: async and platform-dependent.
- `node:crypto`: excludes browsers and violates the core boundary.
- A hashing dependency: violates the allowed runtime-dependency set.
- Trusting a host-supplied hash during replay: compares labels rather than verifying
  schema content.

**Risk**: owned cryptographic code is isolated and used for identity, not
authentication. Standard vectors and the independent test-only cross-check are
mandatory mitigations.

## 4. Golden suite format

**Decision**: goldens are declarative, versioned JSON. A suite identifies its schema
and contains named cases made of command intents plus expected public projections.
It never contains executable code, prebuilt events, a declared schema hash, or a
claimed coverage value.

The runner supplies deterministic metadata (`at` from step order, `source: human`
unless overridden, `path: []`) and calculates `START.schemaHash`. Before every
command, it reconstructs state through `replay`; after a successful decision, it
appends the full event batch and replays again. Every command in a golden route must
succeed. Negative behavior belongs in focused contract tests.

Expected results require an outcome and may assert trail, current node, and active
answers through public selectors. Coverage is aggregated from successfully replayed
`ADVANCED` events, never declared by the author.

**Rationale**: JSON is portable, diffable, suitable for LLM authoring, and unable to
hide behavior in fixture code. Public projections avoid coupling goldens to internal
state representation.

**Alternatives considered**:

- TypeScript fixtures: ergonomic but executable, language-specific, and easy to make
  self-fulfilling.
- Complete commands with metadata and hashes: correct but noisy and brittle.
- Event logs as goldens: validate replay but bypass decision logic.

## 5. Edge identity and coverage

**Decision**: a v1 edge is identified by `(from, to)`. `check()` rejects two outgoing
edges from the same node with the same target using `duplicate-edge-target` and reports
their indices. Authors combine equivalent destinations with `any([...])`.

Coverage denominator is every declared edge of a schema that passes `check()`.
An edge is covered only by a successfully replayed `ADVANCED{from,to}`. Back events do
not cover graph edges; the `ADVANCED` in a terminal batch does. Reports include hit
count and contributing golden-case ids. If structural checking fails, coverage is
unavailable rather than silently adjusted.

**Rationale**: `ADVANCED{from,to}` cannot distinguish parallel edges. Rejecting
duplicate targets keeps coverage reconstructible from the immutable log without
changing the constitutional event shape. Same-target guards remain expressible as
one `any` guard.

**Alternatives considered**:

- Add `edgeId` to `ADVANCED`: would require a constitutional amendment and upcast.
- Instrument `decide` only: coverage could not be reconstructed from replay.
- Credit every parallel edge for one transition: false coverage.

## 6. Bounded probing

**Decision**: `probe()` deterministically explores at most 4096 assignments per
conditional page.

- Single select: unanswered plus every option in schema order.
- Multi-select: unanswered plus every valid subset, including the distinct answered
  empty set.
- Numeric: unanswered, declared min/max, every referenced threshold and
  `threshold ± 1`, deduplicated, sorted, and range-clamped; use `0` if no concrete
  candidate exists.
- Text referenced by `answered`: unanswered plus one minimal valid sentinel.
- Dependencies required by `visibleWhen` are included.

For each assignment, probe resolves visibility and active truth, then semantic
validation. Invalid assignments are classified `validation-blocked`, not routing
dead-ends. Valid assignments evaluate ordered guards and record a witness when none is
definitively true.

When the Cartesian product exceeds 4096, only the first deterministic assignments are
examined; the report sets `truncated: true`, `complete: false`, emits
`probe-budget-exceeded`, and never claims the page passed. At most 16 detailed
witnesses per page are retained alongside the total dead-end count.

**Rationale**: the budget covers ordinary schemas, is reproducible, bounds runtime,
and communicates incomplete analysis honestly. With safe integers, `threshold ± 1`
is an exact adjacent persisted unit.

**Alternatives considered**:

- Unbounded enumeration: combinatorial denial of service.
- Random sampling: non-reproducible and incompatible with pure deterministic tooling.
- Pairwise sampling after the cap: cannot prove absence of higher-order dead-ends.
- A solver: powerful but adds a large dependency and semantics outside the minimal
  kernel.

## 7. Progress over a conditional DAG

**Decision**: progress is structural and conservative.

For the active trail, let `completedEdges = max(0, trail.length - 1)`. For the current
node, compute `maximumRemainingEdges` as the longest path to any terminal by dynamic
programming over the checked DAG:

```text
fraction = completedEdges / (completedEdges + maximumRemainingEdges)
```

An unstarted session reports `0`; a finished session reports `1`. Core returns the
components and fraction without presentation rounding. `BACK` may reduce progress.
Every successful forward transition increases it monotonically.

**Rationale**: the longest possible remainder never promises a shorter unknown route,
works through reconvergence, excludes mutually exclusive nodes from the completed
count, and does not depend on question visibility.

**Alternatives considered**:

- Shortest remaining route: can make progress fall when a longer branch is chosen.
- Visited/global nodes: counts mutually exclusive branches.
- Answered/visible questions: fluctuates with conditional visibility.
- Expected route length: requires business probabilities absent from the kernel.

## 8. Session atomicity and reentrancy

**Decision**: an accepted dispatch commits its entire readonly event batch before any
callback. The shell builds the final log and snapshot locally, swaps both references
once, then calls event listeners once with the batch and state listeners once with the
final snapshot. Event listeners run first; each listener class preserves subscription
order. Empty successful batches and rejected commands do not change references or
notify.

Listener lists are snapshotted before notification, so subscribe/unsubscribe changes
apply to the next cycle. Unsubscribe is idempotent. `getSnapshot()` and `getEvents()`
return stable references between commits.

Dispatch while notifying returns
`Result.err([{code: "reentrant-dispatch"}])`, emits nothing, and notifies nobody.
Listener callbacks are contracted not to throw. Defensively, the shell catches each
callback failure, continues notifying, resets its guard in `finally`, and throws one
`AggregateError` only after the committed notification cycle. A subscriber failure
never rolls back state and the host must not retry the command.

**Rationale**: nested dispatch causes later listeners to observe causality out of
order; queuing cannot truthfully return the eventual synchronous `Result`. Rejection
preserves the single-writer log and atomic terminal batches.

**Alternatives considered**:

- Nested dispatch: inconsistent observations across listeners.
- Queueing: changes synchronous result semantics and defers domain failures.
- Throwing on reentrancy: reentrancy is a controlled rejection, not an exceptional
  domain failure.

## 9. Session creation failure contract

**Decision**: refine the previously sketched factory to:

```ts
createSession(
  schema: FlowSchema,
  pastEvents?: readonly Event[]
): Result<FlowSession, Problem>
```

Fresh creation succeeds for an already parsed schema and returns a `not-started`
session. Restoration invokes `replay` exactly once and returns its failure without
constructing a partial session.

**Rationale**: replay explicitly fails on schema or log mismatch. A direct
`FlowSession` return cannot express that failure without violating the project's
`Result` discipline, throwing on valid parsed input, duplicating replay outside the
factory, or creating an invalid session. This is a necessary completion of the
factory signature, not an alternative hydration path.

**Alternatives considered**:

- Throw a typed restoration exception: violates the functional error contract.
- Return a partially restored session: violates event sourcing and replay integrity.
- Require callers to replay first: duplicates logic and creates another hydration path.
- Split `restoreSession`: conflicts with the specified single factory path.

## 10. Packaging, build, and dependency boundaries

**Decision**: use a private pnpm workspace root with two ESM-only ES2022 packages:

- `@flowgraph/core`: pure domain, parsing, integrity, semantics, engine, selectors,
  authoring validation, and golden support; only `zod` as a runtime dependency.
- `@flowgraph/session`: observable shell; depends only on the public core package.

Build with `tsc -b` and TypeScript project references, `module` and
`moduleResolution: NodeNext`, declarations and source maps, and closed root-only
package export maps. No bundler and no CommonJS build in v1.

Core production compilation uses `lib:["ES2022"]` and `types:[]`. Mechanical checks
ban platform globals, `Math.random`, `node:*`, adapters, deep package imports, and
dependency cycles. Tests have separate Node/Vitest types and may cross-check platform
behavior without contaminating production.

CI runs formatting, lint, project type checking, dependency-boundary checks, unit and
integration tests, seeded property tests, broken-schema corpus, goldens with 100% edge
coverage, build, package-manifest validation, tarball checks, and ESM/TypeScript
consumer smoke tests on the supported Node tooling matrix.

**Rationale**: plain TypeScript emit keeps a small library auditable and portable,
while physical packages, compiler libs, lint rules, dependency checks, and tarball
tests enforce the functional-core boundary mechanically.

**Alternatives considered**:

- One package: weakens the only-mutation-in-session boundary.
- A bundler: unnecessary complexity and can hide invalid imports or shims.
- Dual ESM/CommonJS: doubles the surface and introduces interop hazards before any
  consumer requires it.
- Convention-only boundaries: regress under future adapters.

## 11. Structured messages and authoring output

**Decision**: runtime problems expose stable codes and structured locations/details,
not localized presentation strings. Adapters map those codes to user messages.
`SchemaProblem` may include an English authoring suggestion because it is transient
technical feedback, never persisted survey presentation.

**Rationale**: this preserves stable machine contracts and keeps resolved presentation
out of core data and events.

**Alternatives considered**:

- Persist messages: breaks localization and makes wording part of the event contract.
- Core-owned localized catalog: platform/presentation responsibility in the kernel.
