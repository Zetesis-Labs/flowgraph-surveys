# Feature Specification: Subflows & repeatables (typed flow composition)

**Feature Branch**: `002-subflows-repeatables`

**Created**: 2026-07-19

**Status**: Draft (backlog — core v1.1; event-format footprint already reserved in v1)

## Context

A flow is a **typed function**: declared inputs (context) → interactive session →
declared outputs. Flows compose like functions: a parent graph invokes a subflow and
branches on its typed outputs. This is what makes the engine horizontal:

- **Clinical**: standardized instruments (PHQ-9, GAD-7…) become reusable, versioned
  subflows with outputs like `{score: number, severity: enum}` — validated once,
  composed into any protocol. An instrument bank instead of re-authored questions.
- **Logistics**: collections ("N packages, each with its own questions") become
  `repeat(subflow)` — repetition is composition, not an indexing hack.
- **Any consumer** (EHR, WMS, dashboard) consumes typed outputs, not raw answer dumps.

## Decisions already taken (design phase, 2026-07-19)

- Event envelope carries `path: Array<{flow: string, instance?: string}>` from v1
  (empty until this feature ships). The log is **flat with path namespacing** — no
  nested logs.
- Instance ids are opaque and stable, minted in the shell, arriving inside commands:
  `ITEM_ADDED{collection, instance}`, `ITEM_REMOVED{collection, instance}` (new event
  kinds — constitutional amendment required when this ships).
- Removal makes an instance's answers **inactive** (reuses the active-truth rule from
  the constitution; no deletion, no new mechanism).
- Display order of instances = addition order (v1.1); explicit reordering deferred.
- A subflow declares typed **inputs** (context it needs) and **outputs** (values
  computed from its answers via kernel expressions). Parents branch on outputs; they
  never reach into a subflow's internals.

## Open questions (for clarify/plan when activated)

- Output declaration syntax: one kernel expression per output field; enum outputs via
  ordered threshold ranges?
- Guard quantifiers over collections ("any item where X", "sum over items") — must
  pass the kernel's 4 admission criteria.
- Nested repeat depth: allow arbitrary nesting or cap at one level in v1.1?
- Instrument bank distribution: how subflow schemas are referenced (inline vs by
  id+version from the host's registry).

## Success criteria (sketch)

- A PHQ-9 subflow used by two different parent protocols with zero duplication.
- A logistics fixture: N packages added/removed, answers keyed per instance, goldens
  with full edge coverage including add/remove sequences.
- Replay determinism holds across add/remove/re-add sequences.
