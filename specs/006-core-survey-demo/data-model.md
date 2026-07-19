# Data Model: Core Survey Demo

## Demo fixture

- `FlowSchema`: immutable definition with stable ids and version.
- Entry page: respondent context and consultation reason.
- Conditional pages: sleep, stress, life change.
- Shared pages: preferences, logistical adaptation, and final context.
- Logistical conditional pages: specific request, spacious capacity, focused capacity.
- Terminal: neutral `submitted` outcome.
- `GoldenSuiteV1`: executable journeys that cover all ordered edges, route correction,
  primitive truth outcomes, both reconvergences, and successful completion.

The fixture contains no React or storage values. Text is stored as `TextRef` fallback
content and resolved only at render time.

## Retained session

- Durable value: `{ formatVersion: 1, events: Event[] }`.
- Authority: ordered event log.
- Derived values: current node, visible questions, active answers, progress, route,
  problems, and completion.
- Cardinality: zero or one retained session per browser profile.

States:

```text
empty -> active -> finished
  ^        |          |
  +--------+----------+
       explicit replace
```

`active` can move backward and forward through commands. `finished` is sealed by the
core; replacement creates a distinct fresh session rather than reopening it.

## App lifecycle

- `loading`: reads and validates local event envelope.
- `intro`: no started event exists; informational entry screen.
- `survey`: active core state after start.
- `complete`: immutable finished core state.
- `recovery`: stored content could not be parsed/replayed.

`storageProblem` is orthogonal: the in-memory session remains usable while the shell
warns that refresh may lose work.

## Identity

- Schema: `demo-wellbeing-intake`, version `1`.
- Storage key: `flowgraph:survey-demo:v1`.
- Question ids remain stable across content edits.
- Timestamps are minted by the browser command-meta factory.
