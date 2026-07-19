# `@flowgraph/react`

Client-only React 19 bindings and accessible survey controls for FlowGraph.

The package observes an existing `FlowSession`; it does not own a second survey state
or evaluate graph rules. Visibility, validation, progress, navigation and completion
remain governed by `@flowgraph/core`.

## Basic use

```tsx
import { FlowPage, useFlowSurvey } from '@flowgraph/react'

const Survey = ({ schema, session }) => {
  const controller = useFlowSurvey({
    schema,
    session,
    createMeta: () => ({
      at: Date.now(),
      source: 'human',
      path: [],
    }),
  })

  return <FlowPage controller={controller} />
}
```

The host starts the session and owns not-started and completion screens. SSR and
hydration are intentionally outside the v1 contract.

## Rendering and text

Default renderers provide a textarea, safe-integer number input, radio group and
checkbox group. Text falls back to each `TextRef.fallback`. A host may inject a
resolver and renderer overrides:

```tsx
<FlowPage
  controller={controller}
  resolveText={(ref) => translations[ref.key]}
  renderers={{
    byKind: { text: ProductTextRenderer },
    byId: { displayName: CompactNameRenderer },
  }}
/>
```

Resolution is question id, then question kind, then the default. Custom renderer props
contain only that question's definition, resolved labels, confirmed value, current
problems, disabled state and `onAnswer`. They do not expose the graph, session, trail
or unrelated answers.

## Drafts and friction

Default text and number controls keep raw local drafts. They confirm on blur or before
Back/Continue, in visible question order, and stop at the first rejection. Successful
blur followed by navigation does not emit the answer twice.

Rejected commands become ephemeral `controller.friction`; they are never events.
Default controls associate question problems programmatically and rejected navigation
focuses the first actionable control once.

## Event-log persistence

Persistence is optional and injected:

```ts
import { createBrowserEventStore, persistSession } from '@flowgraph/react'

const store = createBrowserEventStore({
  storage: window.localStorage,
  key: 'my-app:survey',
})

const unsubscribe = persistSession(session, store, (problem) => {
  reportStorageProblem(problem)
})
```

The store writes the complete event log in a versioned envelope. It never stores a
snapshot, resolved view, draft or friction. On refresh, call `store.load()` and pass a
successful log to `createSession(schema, events)` so governed replay verifies it.
Storage failures do not undo or retry an in-memory commit.

## Accessibility

The defaults use native labeled controls, fieldsets/legends, problem relationships,
progress semantics, live page errors and deterministic focus. The automated baseline
is WCAG 2.2 AA; product styling and final copy must preserve these relationships and
receive a manual screen-reader check.
