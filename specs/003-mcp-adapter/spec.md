# Feature Specification: MCP adapter (agent-facing sessions)

**Feature Branch**: `003-mcp-adapter`

**Created**: 2026-07-19

**Status**: Draft (backlog — first adapter after core, before React)

## Context

The engine must be usable **outside any frontend**: an LLM agent conducts a survey
conversationally (intake interviews, guided data capture) or authors/validates schemas
— all through MCP tools. The session shell (`flow-session`) is the integration point;
the MCP server is a thin adapter, sibling of React.

**The inversion that makes this valuable**: normally agent tools are dumb and the
agent carries the protocol. Here the engine is the agent's guardrail — the agent
cannot skip a mandatory question, invent a branch, or deviate from a clinical
protocol, because the protocol lives in the graph and `decide` rejects anything else.

## Tool surface (sketch)

```
start_session(schemaId)              → sessionId + current page
get_current_page(sessionId)          → title, visible questions, types, options, constraints
answer(sessionId, questionId, value) → ok | structured problems
advance(sessionId) / back(sessionId) → moved | blocked{problems} | finished{outcome}
get_events(sessionId)                → full log (audit)
validate_schema(schema)              → check() + probe()   ← LLM authoring loop as a tool
simulate(schema, commands)           → outcome             ← goldens runnable by author-agents
```

## Decisions already taken (design phase, 2026-07-19)

- **Information discipline**: the agent sees the current page only, never the full
  graph — same discipline as a human UI; prevents hallucinated shortcuts.
- Events dispatched through this adapter carry `source: 'agent'` (constitutional
  provenance field). Hybrid sessions (agent pre-fills from documents, human reviews
  in a frontend) work over the same log; the single-writer rule means alternation,
  not concurrency — the shell serializes access.
- Structured `Problem`/`SchemaProblem` payloads are returned verbatim to the agent —
  they are the agent's self-correction loop.
- **Prompt-injection surface**: schema labels/texts are third-party content the agent
  will read. The adapter must delimit/sanitize them as untrusted data in tool outputs
  (e.g., fenced as data, never as instructions).

## Open questions

- Transport (stdio vs HTTP) and auth for remote use.
- Session registry: in-memory keyed by sessionId + host-pluggable persistence
  (subscribeEvents) — locking strategy for the single-writer guarantee.
- Rate/size limits on `get_events` for long sessions.

## Success criteria (sketch)

- An agent completes the PHQ-2 fixture end-to-end via tools only, and the resulting
  log is indistinguishable (except `source`) from a human session.
- An agent given an invalid schema converges to a valid one using only
  `validate_schema` feedback, without human hints.
- Injection test: a schema whose labels contain adversarial instructions does not
  alter agent tool usage.
