# Data Model: Event-sourced Survey Engine

**Feature**: `001-motor-encuestas-event`
**Date**: 2026-07-19

## Modeling rules

- All public data is readonly and serializable unless explicitly identified as a
  runtime callback.
- Wire unions use `kind` discriminants and reject unknown kinds.
- Branded ids remain JSON strings on the wire.
- Numeric wire values are safe integers; no `bigint` is exposed or persisted.
- Presentation strings are `TextRef`; resolved text never enters schemas, state,
  commands, or events.
- `FlowState` is a projection cache. The event sequence is the only session truth.

## Identifiers and primitives

```ts
type SchemaId = string & Brand<'SchemaId'>
type SchemaVersion = string & Brand<'SchemaVersion'>
type SchemaHash = string & Brand<'SchemaHash'>
type NodeId = string & Brand<'NodeId'>
type QuestionId = string & Brand<'QuestionId'>
type OptionId = string & Brand<'OptionId'>
type OutcomeId = string & Brand<'OutcomeId'>
type SafeInt = number & Brand<'SafeInt'>

type TextRef = {
  readonly key: string
  readonly fallback: string
}
```

All ids, versions, keys, and outcomes are non-empty. A `SchemaHash` is exactly 64
lowercase hexadecimal characters. `SafeInt` is finite, has `-0` normalized to `0`,
and satisfies `Number.isSafeInteger`.

## Survey definition

```ts
type FlowSchema = {
  readonly id: SchemaId
  readonly version: SchemaVersion
  readonly entry: NodeId
  readonly nodes: Readonly<Record<NodeId, Node>>
}

type Node = PageNode | TerminalNode

type PageNode = {
  readonly kind: 'page'
  readonly title?: TextRef
  readonly questions: readonly Question[]
  readonly edges: readonly Edge[]
}

type TerminalNode = {
  readonly kind: 'terminal'
  readonly outcome: OutcomeId
}

type Edge = {
  readonly to: NodeId
  readonly when: Guard
}
```

Node identity is the key in `nodes`; it is not duplicated inside the node value.
Outgoing edges are ordered and the first definitively true guard wins. A terminal has
no outgoing edges. In v1, edge identity is `(from,to)`, so one page cannot declare two
edges to the same target.

### Question definitions

```ts
type Question = TextQuestion | NumberQuestion | SelectQuestion

type QuestionBase = {
  readonly id: QuestionId
  readonly text: TextRef
  readonly required?: boolean
  readonly visibleWhen?: Guard
}

type TextQuestion = QuestionBase & {
  readonly kind: 'text'
  readonly maxLength?: SafeInt
}

type NumberQuestion = QuestionBase & {
  readonly kind: 'number'
  readonly min?: SafeInt
  readonly max?: SafeInt
}

type SelectQuestion = QuestionBase & {
  readonly kind: 'select'
  readonly multiple?: boolean
  readonly options: readonly Option[]
}

type Option = {
  readonly id: OptionId
  readonly text: TextRef
  readonly weight?: SafeInt
}
```

Question ids are globally unique inside a schema and stable across schema versions.
Option ids are unique within their select question. `maxLength` is non-negative and
counts Unicode code points. Numeric `min` and `max` are inclusive and `min <= max`.
Option weights may be signed; missing weight means zero.

### Answer values

```ts
type AnswerValue = string | SafeInt | readonly OptionId[]
```

- Text questions accept strings.
- Number questions accept safe integers.
- Select questions accept arrays of unique option ids.
- A single select accepts zero or one option; a multi-select accepts any unique subset.
- An empty select array is a recorded answer distinct from no answer.
- Semantic violations such as empty required text, empty required selection, range,
  and maximum length may be recorded. Structural kind, arity, duplicate-option, and
  unknown-option violations are rejected before an event is emitted.

## Guards and numeric expressions

```ts
type Truth = 'true' | 'false' | 'unknown'

type Guard =
  | { readonly kind: 'always' }
  | { readonly kind: 'answered'; readonly q: QuestionId }
  | { readonly kind: 'selected'; readonly q: QuestionId; readonly option: OptionId }
  | { readonly kind: 'not'; readonly value: Guard }
  | { readonly kind: 'all'; readonly values: readonly Guard[] }
  | { readonly kind: 'any'; readonly values: readonly Guard[] }
  | {
      readonly kind: 'cmp'
      readonly op: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte'
      readonly left: NumericExpr
      readonly right: NumericExpr
    }

type NumericExpr =
  | { readonly kind: 'num'; readonly value: SafeInt }
  | { readonly kind: 'answer'; readonly q: QuestionId }
  | { readonly kind: 'score'; readonly q: QuestionId }
  | { readonly kind: 'sum'; readonly values: readonly NumericExpr[] }

type NumericResult =
  | { readonly kind: 'known'; readonly value: SafeInt }
  | { readonly kind: 'unknown' }
```

`answer` references a number question. `score` references a select question and sums
the weights of the unique selected options. `sum` requires at least one operand in a
valid authored schema, although its evaluator remains total for parsed defensive input.
Accumulation uses internal `bigint`; an out-of-safe-range result is unknown.

### Strong Kleene K3 truth tables

| `x` | `not(x)` |
|-----|----------|
| true | false |
| false | true |
| unknown | unknown |

| `all(a,b)` | true | false | unknown |
|------------|------|-------|---------|
| **true** | true | false | unknown |
| **false** | false | false | false |
| **unknown** | unknown | false | unknown |

| `any(a,b)` | true | false | unknown |
|------------|------|-------|---------|
| **true** | true | true | true |
| **false** | true | false | unknown |
| **unknown** | true | unknown | unknown |

For n-ary values, `all` is false if any value is false, true if all are true, and
unknown otherwise. `any` is true if any value is true, false if all are false, and
unknown otherwise. Identities are `all([])=true` and `any([])=false`.

### Primitive semantics

| Primitive | Known result | Unknown result |
|-----------|--------------|----------------|
| `always` | Always true | Never |
| `answered` | True when a structurally typed active fact exists; otherwise false | Never |
| `selected` | True/false for an existing active select answer | Missing, inactive, hidden, or mistyped answer |
| `num` | Declared safe integer | Never after parsing |
| `answer` | Active numeric answer, even if out of semantic range | Missing, inactive, hidden, wrong question kind, mistyped value |
| `score` | Sum of active selected-option weights; explicit empty selection is zero | Missing/inactive/hidden/mistyped answer or overflow |
| `sum` | Exact safe-integer total when every operand is known | Any unknown operand or overflow |
| `cmp` | Exact integer comparison when both sides are known | Either side unknown |

An edge or `visibleWhen` condition is active only on definitive true. False and unknown
do not fire/show it.

## Structural validity and well-foundedness

A publishable v1 schema satisfies all of the following:

1. `entry` exists and identifies a page.
2. Every node is reachable from `entry`.
3. Every reachable page can reach at least one terminal.
4. The directed graph has no self-loop or multi-node cycle.
5. Every page has an ordered non-empty edge list. A present `always` edge must be last;
   an earlier `always` cannot shadow later edges. Absence of a default is an authoring
   warning evaluated further by `probe`, not a structural error by itself.
6. A page has at most one edge to a given target.
7. All node, question, option, guard, and expression references exist and have the
   required kind.
8. Question ids are globally unique; option ids are unique within their question.
9. A `visibleWhen` reference is to an earlier question on the same page or a question
   on a strict graph ancestor page. An edge guard may reference the current page or an
   ancestor page. Descendant and unrelated-branch references are invalid.
10. Same-page visibility is evaluated once in document order; it cannot look forward.
11. Terminal nodes have an outcome and no questions or edges.
12. Numeric constraints and literals are safe integers and internally consistent.

The active truth of an answer is:

```text
answer page is in current trail
AND question is definitively visible under earlier active answers
AND a structurally typed answer fact exists
```

The answer map retains inactive facts. Returning through a page makes its latest
answer eligible to become active again.

## Commands

```ts
type CommandMeta = {
  readonly at: SafeInt
  readonly source: 'human' | 'agent' | 'import'
  readonly path: readonly PathSegment[]
}

type PathSegment = {
  readonly flow: string
  readonly instance?: string
}

type Command =
  | {
      readonly kind: 'START'
      readonly meta: CommandMeta
      readonly schemaHash: SchemaHash
    }
  | {
      readonly kind: 'ANSWER'
      readonly meta: CommandMeta
      readonly q: QuestionId
      readonly value: AnswerValue
    }
  | { readonly kind: 'NEXT'; readonly meta: CommandMeta }
  | { readonly kind: 'BACK'; readonly meta: CommandMeta }
```

`at` is a non-negative epoch-millisecond safe integer. Core never reads it for
semantics. `path` MUST be empty in v1. Each emitted event copies the command's
`at`, `source`, and `path`.

## Events

```ts
type EventEnvelope = {
  readonly v: 1
  readonly at: SafeInt
  readonly source: 'human' | 'agent' | 'import'
  readonly path: readonly PathSegment[]
}

type Event =
  | EventEnvelope & {
      readonly kind: 'SESSION_STARTED'
      readonly schemaId: SchemaId
      readonly schemaVersion: SchemaVersion
      readonly schemaHash: SchemaHash
    }
  | EventEnvelope & {
      readonly kind: 'ANSWERED'
      readonly q: QuestionId
      readonly value: AnswerValue
    }
  | EventEnvelope & {
      readonly kind: 'ADVANCED'
      readonly from: NodeId
      readonly to: NodeId
    }
  | EventEnvelope & {
      readonly kind: 'WENT_BACK'
      readonly from: NodeId
      readonly to: NodeId
    }
  | EventEnvelope & {
      readonly kind: 'SESSION_FINISHED'
      readonly outcome: OutcomeId
    }
```

Events are append-only facts. Rejections and validation friction are not events.
The event array position is ordering truth; `at` is provenance only.

## Flow state

```ts
type FlowState = {
  readonly status: 'not-started' | 'active' | 'finished'
  readonly schemaId: SchemaId
  readonly schemaVersion: SchemaVersion
  readonly schemaHash?: SchemaHash
  readonly trail: readonly NodeId[]
  readonly answers: Readonly<Record<QuestionId, AnswerValue>>
  readonly outcome?: OutcomeId
}
```

Initial state is `not-started`, has `trail:[schema.entry]`, an empty answer map, and no
hash or outcome. `SESSION_STARTED` activates it and pins the hash. `ANSWERED` replaces
the latest value for one question without deleting older facts from the log.
`ADVANCED` appends a node to the active trail. `WENT_BACK` removes its final node after
replay verifies `from` and `to`. `SESSION_FINISHED` seals state and sets the outcome.

Visibility, active answers, validation, current page, and progress are selectors over
`schema + state`; they are not separately persisted inside `FlowState`.

## State transition table

| State | Command | Result |
|-------|---------|--------|
| not-started | `START` with matching hash | `[SESSION_STARTED]`; state becomes active |
| not-started | `ANSWER`, `NEXT`, `BACK` | `session-not-started`; no events |
| active | `START` | `session-already-started`; no events |
| active | structurally valid `ANSWER` | `[ANSWERED]`, including semantic-invalid values |
| active | structurally invalid `ANSWER` | typed problem; no events |
| active page | `NEXT` with validation problems | problems; no events |
| active page | `NEXT` with no true edge | `no-edge`; no events |
| active page | `NEXT` to page | `[ADVANCED]` |
| active page | `NEXT` to terminal | atomic `[ADVANCED, SESSION_FINISHED]` |
| active first page | `BACK` | success with empty batch |
| active later page | `BACK` | `[WENT_BACK]` to previous trail node |
| finished | `NEXT` | idempotent success with empty batch |
| finished | `START` | `session-already-started`; no events |
| finished | `ANSWER`, `BACK` | `session-sealed`; no events |

## Replay validation

`replay(schema, events)` performs, in order:

1. Parse and upcast every event at the read boundary; reject unknown future versions.
2. Return initial `not-started` state for an empty log.
3. Require exactly one `SESSION_STARTED` as the first event.
4. Recompute the schema hash and compare id, version, and hash with the start event.
5. Require empty v1 paths and structurally typed event payloads.
6. Validate each event against the current schema and projected state:
   current/visible question for `ANSWERED`, actual current edge for `ADVANCED`,
   previous trail node for `WENT_BACK`, and current terminal outcome for
   `SESSION_FINISHED`.
7. Require `SESSION_FINISHED` immediately after an `ADVANCED` to a terminal with equal
   command metadata.
8. Reject every event after finish.
9. Call total `apply` only after each event passes sequence validation.

`apply(state,event)` itself never throws and performs only mechanical projection.
Public restoration uses replay; direct apply is not a log-integrity boundary.

## Validation problems

```ts
type Problem = {
  readonly code: ProblemCode
  readonly where?: Readonly<Record<string, string | number>>
  readonly details?: Readonly<Record<string, unknown>>
}

type SchemaProblem = {
  readonly severity: 'error' | 'warning'
  readonly code: SchemaProblemCode
  readonly where: Readonly<Record<string, string | number>>
  readonly suggestion?: string
}
```

Runtime codes include the registry from the specification plus
`session-not-started`, `session-already-started`, `reentrant-dispatch`,
`duplicate-option`, and `unsupported-event-version`. Replay inconsistencies use
`log-schema-mismatch` with structured details rather than creating partially valid
state.

Structural schema codes include `missing-entry`, `entry-not-page`, `dangling-node`,
`unreachable-node`, `no-terminal-reachable`, `cycle-detected`,
`duplicate-question`, `duplicate-option`, `duplicate-edge-target`,
`shadowed-edge`, `ill-founded-visibility`, `invalid-expression-reference`, and
`invalid-constraint`. `missing-default-edge` is a warning because a complete set of
conditional guards is valid; `probe` determines whether supported assignments actually
dead-end.

## Progress projection

```ts
type Progress = {
  readonly completedEdges: number
  readonly maximumRemainingEdges: number
  readonly fraction: number
}
```

For active state:

```text
completedEdges = max(0, trail.length - 1)
maximumRemainingEdges = longest path from current node to a terminal
fraction = completedEdges / (completedEdges + maximumRemainingEdges)
```

Unstarted is zero and finished is one. Longest remaining distance is computed by
dynamic programming on the checked DAG. Forward movement is monotonic; `BACK` may
reduce progress.

## Probe report

```ts
type ProbeReport = {
  readonly complete: boolean
  readonly pages: readonly ProbePageReport[]
  readonly problems: readonly SchemaProblem[]
}

type ProbePageReport = {
  readonly node: NodeId
  readonly candidateSpace: string
  readonly explored: number
  readonly truncated: boolean
  readonly numericSampling: boolean
  readonly deadEndsFound: number
  readonly witnesses: readonly ProbeWitness[]
}
```

`candidateSpace` is a decimal string to avoid numeric overflow. A page explores at most
4096 deterministic assignments and stores at most 16 witnesses. Truncation emits
`probe-budget-exceeded` and prevents a complete/passing claim.
`numericSampling` identifies pages whose integer domain was represented by boundaries
and thresholds rather than exhaustively enumerated.

## Golden and coverage model

```ts
type GoldenSuiteV1 = {
  readonly formatVersion: 1
  readonly schema: {
    readonly id: SchemaId
    readonly version: SchemaVersion
  }
  readonly cases: readonly GoldenCase[]
}

type EdgeCoverage = {
  readonly total: number
  readonly covered: number
  readonly ratio: number
  readonly edges: readonly {
    readonly from: NodeId
    readonly to: NodeId
    readonly index: number
    readonly hits: number
    readonly cases: readonly string[]
  }[]
}
```

Golden steps contain command intent, optional deterministic provenance overrides, and
public expected projections. The runner supplies hash and default metadata. Coverage
is a suite-level union reconstructed from replayed `ADVANCED` events and is unavailable
when schema checking fails.
