# Feature Specification: React adapter (subscriber frontend)

**Feature Branch**: `004-react-adapter`

**Created**: 2026-07-19

**Status**: Draft (backlog)

## Context

React is a **subscriber of a truth it does not own**. The core is the source of truth;
`flow-session` is the observable; the React package is a binding, not a logic layer.

## Decisions already taken (design phase, 2026-07-19)

- Binding via `useSyncExternalStore` (React's blessed API for external stores):
  `useFlowState(session)` subscribes and returns the immutable snapshot.
- **No business logic in components**: everything a component renders comes from pure
  selectors exported by the core (current page, visible questions, expression values,
  progress). A business `if` in a component is a boundary leak.
- **Ephemeral friction lives in component state**: `dispatch` returns the `Result`
  synchronously; a blocked "Next" renders from local `useState`, never touches the log.
- Renderer registry: `QuestionDef.kind → component`, with per-question-id overrides
  (`byId`) for bespoke widgets (e.g., card-stack selects).
- `TextRef` resolution (i18n) happens here, at render time — resolved text never
  flows back into data.
- Persistence example ships with the adapter: a `subscribeEvents` listener appending
  to localStorage; restore = `createSession(schema, storedEvents)` — no separate
  hydration path.
- Presentation pagination is free: v1 maps one graph page to one screen, but the
  renderer may re-paginate (deferred decision recorded in spec 001).

## Open questions

- SSR story (`getServerSnapshot`) — the pure core makes it possible; is it needed?
- Controlled-input ergonomics for high-frequency typing vs dispatch-per-keystroke
  (local draft state committed on blur?).
- Accessibility baseline for the default renderers.

## Success criteria (sketch)

- Demo app runs both fixtures (retail, PHQ-2) with zero business logic in components
  (verified by review + lint rule).
- Kill the tab mid-session, reopen, continue exactly where left off (localStorage
  events + replay).
- A custom `byId` renderer overrides a default without touching the adapter.
