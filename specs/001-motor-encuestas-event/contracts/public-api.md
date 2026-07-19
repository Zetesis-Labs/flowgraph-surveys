# Public API Contract

**Packages**: `@flowgraph/core`, `@flowgraph/session`
**Contract version**: v1

## Common result

```ts
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }
```

Domain rejection is always represented by `Result`; valid parsed domain input never
causes a core function to throw.

## `@flowgraph/core`

### Parse boundary

```ts
export function parseSchema(
  input: unknown
): Result<FlowSchema, readonly ParseProblem[]>

export function parseEvents(
  input: unknown
): Result<readonly Event[], readonly ParseProblem[]>

export function upcastEvents(
  input: readonly unknown[]
): Result<readonly Event[], Problem>
```

Unknown object fields and unknown union kinds fail closed. Successful outputs are
plain readonly typed data; zod types and schemas are not exposed as the domain model.

### Integrity

```ts
export function canonicalizeSchema(schema: FlowSchema): string
export function hashSchema(schema: FlowSchema): SchemaHash
```

Both functions are pure and synchronous. `hashSchema` returns lowercase SHA-256 hex
over JCS-canonical UTF-8. It never uses host crypto.

### Engine

```ts
export function decide(
  schema: FlowSchema,
  state: FlowState,
  command: Command
): Result<readonly Event[], readonly Problem[]>

export function apply(state: FlowState, event: Event): FlowState

export function replay(
  schema: FlowSchema,
  events: readonly Event[]
): Result<FlowState, Problem>
```

`decide` validates intent and returns a readonly atomic event batch or problems.
Rejection emits no event. Identical inputs produce deeply equal results.

`apply` is total and performs mechanical projection only. Callers handling untrusted or
persisted logs MUST use `replay`, which validates schema hash and event sequence before
each apply.

An empty replay succeeds with the `not-started` initial state. A terminal `NEXT`
returns `[ADVANCED, SESSION_FINISHED]` in that order with identical metadata.

### Selectors and evaluators

```ts
export function currentNode(
  schema: FlowSchema,
  state: FlowState
): Node

export function visibleQuestions(
  schema: FlowSchema,
  state: FlowState
): readonly Question[]

export function storedAnswer(
  state: FlowState,
  question: QuestionId
): AnswerValue | undefined

export function activeAnswers(
  schema: FlowSchema,
  state: FlowState
): Readonly<Record<QuestionId, AnswerValue>>

export function questionProblems(
  schema: FlowSchema,
  state: FlowState,
  question: QuestionId
): readonly Problem[]

export function currentPageProblems(
  schema: FlowSchema,
  state: FlowState
): readonly Problem[]

export function evaluateGuard(
  schema: FlowSchema,
  state: FlowState,
  guard: Guard
): Truth

export function evaluateNumeric(
  schema: FlowSchema,
  state: FlowState,
  expression: NumericExpr
): NumericResult

export function progress(
  schema: FlowSchema,
  state: FlowState
): Progress

export function canGoBack(state: FlowState): boolean
export function isFinished(state: FlowState): boolean
export function outcome(state: FlowState): OutcomeId | undefined
```

Selectors never mutate state or cache hidden platform state. `storedAnswer` returns the
latest fact whether active or not; `activeAnswers` applies trail and visibility rules.

### Authoring validation

```ts
export function check(schema: FlowSchema): readonly SchemaProblem[]
export function probe(schema: FlowSchema): ProbeReport

export function runGoldens(
  schema: FlowSchema,
  suite: GoldenSuiteV1
): Result<GoldenReport, readonly GoldenProblem[]>
```

`probe` is deterministic and bounded. `runGoldens` first requires a schema with no
`check` errors, executes command intents through decide and replay, and calculates
coverage from actual replayed transitions.

## `@flowgraph/session`

```ts
export type FlowSession = {
  readonly dispatch: (
    command: Command
  ) => Result<readonly Event[], readonly Problem[]>

  readonly getSnapshot: () => FlowState
  readonly getEvents: () => readonly Event[]

  readonly subscribe: (
    listener: () => void
  ) => () => void

  readonly subscribeEvents: (
    listener: (batch: readonly Event[]) => void
  ) => () => void
}

export function createSession(
  schema: FlowSchema,
  pastEvents?: readonly Event[]
): Result<FlowSession, Problem>
```

Fresh creation returns a `not-started` session. Restoration calls core `replay`
exactly once and fails without exposing a partial session.

### Commit and notification contract

For a successful non-empty dispatch:

1. Decide the complete readonly batch.
2. Apply all events to local log/state references.
3. Atomically publish the new log and final snapshot references.
4. Invoke each event listener once with the complete batch, in subscription order.
5. Invoke each state listener once, in subscription order.

Before step 4, `getEvents()` and `getSnapshot()` already expose the final commit.
There is no observable intermediate terminal state. Successful empty batches and
rejections preserve both references and notify nobody.

Listener collections are snapshotted before notification. Subscription changes take
effect in the next cycle; unsubscribe is idempotent.

`dispatch` called from any notification returns
`{ok:false,error:[{code:"reentrant-dispatch"}]}` and has no side effect.

Listeners are contracted not to throw. The shell nevertheless calls every listener and
restores its reentrancy guard if callbacks fail, then throws one `AggregateError` after
the already-committed cycle. The host MUST NOT retry a dispatch because a subscriber
failed.

### Reference stability

- `getSnapshot()` returns the same reference until a non-empty successful dispatch.
- `getEvents()` returns the same reference until a non-empty successful dispatch.
- One successful non-empty dispatch creates exactly one new snapshot reference and
  one new event-array reference.
- Returned arrays and state are readonly; consumers must not mutate them.

## Package surface

Both packages expose one closed `"."` export. Deep imports and imports from `src/` are
unsupported. `@flowgraph/session` imports only from the public core root. v1 is
ESM-only and has no CommonJS export.
