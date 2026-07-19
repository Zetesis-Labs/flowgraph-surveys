# Feature Specification: LLM authoring loop (schema generation tooling)

**Feature Branch**: `005-llm-authoring-loop`

**Created**: 2026-07-19

**Status**: Draft (backlog — thin tooling over check/probe/goldens, not core)

## Context

Authors are technical; visual editors are a later extra. The primary authoring path is
**LLM-generated schemas gated by machine verification**: canonical, diffable JSON is
the ideal LLM target, and the validation ladder is the feedback loop.

```
generate → check() → probe() → feed structured problems back → regenerate → goldens
```

Humans review **behavior, not wiring**: golden paths ("given these answers, expect
outcome X") are legible; the graph itself need not be.

## Decisions already taken (design phase, 2026-07-19)

- `check()`/`probe()` errors are structured and actionable (`{code, where,
  suggestion}`) — designed as LLM feedback, per the constitution.
- The LLM co-generates goldens with the schema, but the **anti-illusion gate is
  engine-measured edge coverage**: the runner reports which graph edges no golden
  traverses. Coverage is computed, never asserted — an LLM cannot fake it.
- Critical domains: 100% edge coverage or an explicit, recorded human waiver.
- Schemas are diffable and code-reviewable (clinical protocols go through PR review);
  question ids stay stable across versions (constitutional rule).

## Open questions

- Packaging: CLI (`flowgraph validate/simulate/coverage`), MCP tools (shared with
  spec 003), or both from one implementation.
- Waiver format: where a human-approved coverage exception is recorded (in the golden
  file? a sidecar?).
- Prompt kit: do we ship reference prompts/templates for schema generation, or leave
  that to consumers?

## Success criteria (sketch)

- Starting from a natural-language brief, an LLM converges to a schema passing
  check+probe using only structured feedback (no human edits), on both fixture domains.
- The coverage report correctly identifies a deliberately-untested edge in a mutated
  golden suite.
