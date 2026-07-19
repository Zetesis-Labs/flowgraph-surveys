# Data Model: React Survey Adapter

**Feature**: `004-react-adapter`
**Date**: 2026-07-19

## Modeling boundaries

- `FlowSchema`, `FlowState`, `Command`, `Event`, `Problem`, and `FlowSession` remain
  owned by features 001's public packages.
- Adapter-owned data is presentation state or effect configuration. It never becomes
  a second persisted survey model.
- Every adapter collection is readonly at the public boundary.
- Stable question ids are the join key among view data, drafts, controls, problems,
  and renderer overrides.

## ReactSessionBinding

Represents one mounted relationship between React consumers and a `FlowSession`.

| Field | Type | Rules |
|---|---|---|
| `session` | `FlowSession` | Required; exactly one per binding |
| `snapshot` | `FlowState` | Read through `getSnapshot`; same reference until commit |
| `subscribe` | state subscription | Must return idempotent cleanup |

### Lifecycle

```text
unmounted → subscribed → notified zero or more times → unsubscribed
```

Unmount always reaches `unsubscribed`. A rejected or empty dispatch does not introduce
a notification transition.

## FlowView

Presentation-shaped projection computed from a schema and the observed snapshot.

| Field | Type | Source |
|---|---|---|
| `status` | `not-started \| active \| finished` | Snapshot |
| `current` | page/terminal view | Public `currentNode` selector |
| `questions` | readonly `QuestionView[]` | Public `visibleQuestions` selector |
| `progress` | `Progress` | Public `progress` selector |
| `canGoBack` | boolean | Public `canGoBack` selector |
| `finished` | boolean | Public `isFinished` selector |
| `outcome` | outcome id or undefined | Public `outcome` selector |

`FlowView` is disposable derived data. It is never serialized or restored.

## QuestionView

One visible question with presentation-only enrichment.

| Field | Type | Rules |
|---|---|---|
| `question` | governed `Question` | Must be currently visible |
| `text` | string | Resolved from `TextRef`; fallback required |
| `options` | readonly resolved options | Select questions only |
| `value` | `AnswerValue \| undefined` | Latest stored answer for active question |
| `problems` | readonly `Problem[]` | Ephemeral friction mapped by question id |
| `disabled` | boolean | True when session is sealed or host disables interaction |
| `order` | non-negative integer | Stable current-page question order |

## RendererRegistry

Deterministic presentation overrides.

| Field | Type | Rules |
|---|---|---|
| `byKind` | partial kind-to-renderer map | Optional |
| `byId` | question-id-to-renderer map | Optional |

### Resolution

```text
byId[question.id] ?? byKind[question.kind] ?? defaults[question.kind]
```

Failure to resolve a supported kind is a developer-visible configuration error, not a
hidden question.

## RendererProps

Closed input visible to a renderer.

| Field | Type | Rules |
|---|---|---|
| `question` | compatible governed question subtype | No schema or edges |
| `text` | resolved string | Never persisted |
| `options` | resolved option labels | Select only |
| `value` | confirmed answer or undefined | Readonly |
| `problems` | readonly `Problem[]` | Current question only |
| `disabled` | boolean | Blocks mutation |
| `onAnswer` | answer callback | Only route back to session |

Renderers never receive the graph, trail, unrelated answers, guard evaluators, or
navigation functions.

## DraftRecord

Ephemeral pending text or number edit.

| Field | Type | Rules |
|---|---|---|
| `questionId` | stable question id | Unique in registry |
| `order` | non-negative integer | Current visible order |
| `raw` | string | Preserves user typing, including incomplete numeric text |
| `dirty` | boolean | False after successful confirmation |
| `flush` | synchronous operation | Returns governed result |
| `focus` | effect callback | Focuses registered control |

### State transitions

```text
clean ──input──> dirty
dirty ──successful blur/flush──> clean
dirty ──rejected blur/flush──> dirty + friction
dirty ──unmount/refresh──> discarded
```

Navigation sorts dirty records by `order`, flushes them sequentially, and stops on the
first rejection. A record removed by conditional visibility is discarded as a UI
draft; its last confirmed answer remains governed by active-truth semantics.

## FrictionState

Ephemeral result of the latest rejected UI action.

| Field | Type | Rules |
|---|---|---|
| `problems` | readonly `Problem[]` | Never persisted |
| `action` | `answer \| next \| back \| restore` | Presentation context |
| `questionOrder` | readonly question ids | Stable focus order |
| `pageProblem` | boolean | True when no problem maps to a question |

Relevant successful answers clear their own problems. Successful navigation clears the
whole prior navigation friction. Rejected actions never mutate the session.

## CommandMetaFactory

Host-owned effect that supplies event provenance for each attempted command.

| Field | Type | Rules |
|---|---|---|
| return `at` | safe integer epoch milliseconds | Minted by host |
| return `source` | `human \| agent \| import` | Demo uses `human` |
| return `path` | readonly path segments | Empty for v1 root flow |

The adapter invokes the factory once per dispatched command. A draft flush followed by
navigation therefore receives distinct metadata for the answer and navigation facts.

## BrowserEventStore

One application-configured event log stored at the browser boundary.

| Field | Type | Rules |
|---|---|---|
| `storage` | `StorageLike` | Injected; may fail |
| `key` | non-empty string | Application-owned namespace |
| `formatVersion` | `1` | Wrapper format, independent of event `v` |
| `events` | readonly unknown values on read; typed events on save | Complete ordered log |

### Operations

```text
empty --save(events)--> stored
stored --load--> parsed/upcast events
stored --save(new complete log)--> replaced atomically by key
stored --clear--> empty
malformed/unavailable --load or save--> structured failure
```

No snapshot is stored. A successful load still requires
`createSession(schema, events)` before trusted rendering.

## PersistenceProblem

Presentation-safe storage failure.

| Code | Meaning |
|---|---|
| `storage-unavailable` | Storage API throws or cannot be accessed |
| `invalid-json` | Stored value is not JSON |
| `invalid-envelope` | Wrapper version or events field is invalid |
| `invalid-events` | Event parse/upcast fails |
| `storage-write-failed` | Complete log could not be saved |
| `storage-clear-failed` | Explicit replacement could not clear old log |

Problems may retain a cause for developer diagnostics but must not expose corrupt
stored content in respondent UI.
