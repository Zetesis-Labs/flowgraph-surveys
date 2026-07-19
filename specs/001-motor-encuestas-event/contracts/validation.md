# Validation and Conformance Contract

## Structural `check()`

```ts
check(schema: FlowSchema): readonly SchemaProblem[]
```

`check` is deterministic, pure, and returns every independently detectable problem in
stable document order. Errors make a schema unpublishable; warnings identify suspicious
but total constructs.

Required error classes:

| Code | Meaning |
|------|---------|
| `missing-entry` | Entry id is absent |
| `entry-not-page` | Entry points directly to a terminal |
| `dangling-node` | Edge target is absent |
| `unreachable-node` | Node cannot be reached from entry |
| `no-terminal-reachable` | A page cannot reach any terminal |
| `cycle-detected` | Self-loop or multi-node directed cycle |
| `duplicate-question` | Question id appears more than once |
| `duplicate-option` | Option id repeats in one question |
| `duplicate-edge-target` | One page has multiple edges to the same target |
| `shadowed-edge` | An edge follows an earlier `always` |
| `ill-founded-visibility` | `visibleWhen` references a later/non-ancestor question |
| `invalid-expression-reference` | Guard/expression reference is missing or wrong kind |
| `invalid-constraint` | Numeric/text/select constraint is internally invalid |

Recommended warnings:

| Code | Meaning |
|------|---------|
| `missing-default-edge` | Page relies entirely on conditional guards; probe must prove supported combinations |
| `empty-all` | `all([])` is total but likely a bad macro expansion |
| `empty-any` | `any([])` is total but likely a bad macro expansion |
| `weight-overflow-risk` | Static bounds prove a possible safe-integer overflow |

Every problem includes a structured `where`; errors from authoring analysis include an
actionable technical suggestion.

## Bounded `probe()`

```ts
probe(schema: FlowSchema): ProbeReport
```

Probe first runs structural checking. If structural errors exist, semantic exploration
does not claim completeness.

For each conditional page, it builds candidate domains from all guard references and
their visibility dependencies:

- Single select: unanswered and each option.
- Multi-select: unanswered and every subset, including answered-empty.
- Number: unanswered, min, max, referenced thresholds, and threshold ± 1, with stable
  deduplication and range clamping.
- Text used by `answered`: unanswered and one minimal valid sentinel.

The Cartesian product is evaluated in schema order with a hard cap of 4096 assignments
per page. Each candidate applies visibility and validation before routing. A valid
candidate with no definitively true edge is a dead-end.

If the candidate space exceeds the cap, the page reports:

```json
{
  "truncated": true,
  "complete": false,
  "problem": {
    "code": "probe-budget-exceeded",
    "candidateSpace": "8192",
    "explored": 4096
  }
}
```

At most 16 detailed witnesses are retained per page; total counts remain exact for the
explored prefix. Probe is bounded analysis, not a solver, and never presents a
truncated clean prefix as proof of safety.

## Golden suite JSON

```json
{
  "formatVersion": 1,
  "schema": {
    "id": "phq2",
    "version": "1.0.0"
  },
  "cases": [
    {
      "id": "referral-route",
      "commands": [
        { "kind": "START" },
        { "kind": "ANSWER", "q": "q1", "value": ["often"] },
        { "kind": "ANSWER", "q": "q2", "value": ["often"] },
        { "kind": "NEXT" }
      ],
      "expect": {
        "outcome": "referral",
        "state": {
          "current": "referral"
        }
      }
    }
  ]
}
```

Golden command steps omit engine metadata. The runner generates deterministic
metadata, calculates the real schema hash, and uses `path:[]`. A step may override
`source` or `at` only for provenance-specific conformance cases.

Before each command, the runner obtains state through `replay`; after a successful
decision, it appends the returned batch and replays again. Any rejected golden command,
wrong outcome, or mismatched public projection fails the case.

Goldens cannot state expected coverage. Negative/rejected-command behavior is tested
separately so route cases remain readable.

## Edge coverage

Coverage identity is `(from,to)`. A structurally valid v1 schema cannot have parallel
same-target edges from one page.

```ts
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

Rules:

1. Denominator is every declared edge in a schema with no check errors.
2. Only replayed `ADVANCED{from,to}` covers an edge.
3. `WENT_BACK` never covers an edge.
4. Terminal `ADVANCED` covers its edge.
5. Repeat traversal increments hits, not covered count.
6. Suite coverage is the union across cases.
7. Coverage is unavailable when structural checking has errors.
8. Critical fixtures require ratio `1` or an explicit human waiver defined by a future
   authoring feature; this core feature ships its fixtures with no waiver.

## Required conformance suites

### Retail fixture

- Three mutually exclusive branches.
- One branch contains an extra page.
- Branches reconverge on shared pages defined once.
- At least one route goes back, changes branch, and proves abandoned answers inactive.
- Goldens cover every edge.

### PHQ-2 fixture

- Two weighted select questions.
- Score at or above threshold reaches referral terminal.
- Score below threshold reaches negative terminal.
- Missing data proves Strong Kleene does not fabricate a negative result.
- Goldens cover every edge.

The PHQ-2 fixture is engine conformance data, not clinical advice or a patient-facing
assessment.

### Broken-schema corpus

At minimum one fixture per required structural error, including separate self-loop and
multi-node cycle cases. Probe fixtures include a true dead-end and a deliberately
truncated candidate space.

### Property suite

- Replay determinism.
- `apply` totality for generated typed events.
- Every accepted active trail is a valid graph path.
- Schema, command, event, and state JSON round-trip identity.
- `decide` determinism including command metadata.
- At most one `SESSION_STARTED`, always first.
- No event after `SESSION_FINISHED`.
- Terminal batches are adjacent and metadata-equal.
- Forward progress is monotonic on checked DAGs.
- Canonical hash ignores object-key insertion order but preserves array order.
