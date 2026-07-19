# Public API Contract: `@flowgraph/react`

**Feature**: `004-react-adapter`
**Contract version**: v1

The package exposes one ESM root. Deep imports and imports from `src/` are unsupported.
React and React DOM are peer dependencies. All FlowGraph types come from public
`@flowgraph/core` or `@flowgraph/session` roots.

## Subscription hooks

```ts
export function useFlowState(session: FlowSession): FlowState

export function useFlowView(
  schema: FlowSchema,
  session: FlowSession,
): FlowView
```

`useFlowState` subscribes on mount and unsubscribes on unmount. It returns the exact
snapshot reference supplied by `session.getSnapshot()`. Rejected and successful-empty
dispatches do not cause a new snapshot.

`useFlowView` derives only through public core selectors. It does not persist its
result, evaluate guards, inspect edges, or project events itself.

## Controller

```ts
export type CommandMetaFactory = () => CommandMeta

export type UseFlowSurveyOptions = {
  readonly schema: FlowSchema
  readonly session: FlowSession
  readonly createMeta: CommandMetaFactory
}

export type FlowSurveyController = {
  readonly state: FlowState
  readonly view: FlowView
  readonly friction: FrictionState
  readonly answer: (
    question: QuestionId,
    value: AnswerValue,
  ) => Result<readonly Event[], readonly Problem[]>
  readonly next: () => Result<readonly Event[], readonly Problem[]>
  readonly back: () => Result<readonly Event[], readonly Problem[]>
  readonly clearFriction: () => void
}

export function useFlowSurvey(
  options: UseFlowSurveyOptions,
): FlowSurveyController
```

Each action calls `createMeta()` exactly once for each command it dispatches. `next`
and `back` first flush registered dirty drafts in stable question order. If a flush is
rejected, navigation is not dispatched and its problems become friction.

The controller never catches and retries a dispatch. A committed dispatch whose
session listener later throws remains committed; the error is allowed to reach the
host error boundary.

## Page rendering

```ts
export type ResolveText = (text: TextRef) => string | undefined

export type FlowPageProps = {
  readonly controller: FlowSurveyController
  readonly resolveText?: ResolveText
  readonly renderers?: RendererRegistry
  readonly disabled?: boolean
}

export function FlowPage(props: FlowPageProps): ReactElement
```

`FlowPage` renders only the current active page and its visible questions. The default
resolver returns the `TextRef.fallback`. A custom resolver returning `undefined` also
falls back. Finished and not-started product screens remain the host application's
responsibility.

## Renderer types

The closed renderer contract is specified in [renderers.md](./renderers.md).

```ts
export type RendererRegistry = {
  readonly byKind?: Readonly<Partial<Record<Question['kind'], QuestionRenderer>>>
  readonly byId?: Readonly<Partial<Record<QuestionId, QuestionRenderer>>>
}

export const defaultRenderers: Readonly<
  Record<Question['kind'], QuestionRenderer>
>
```

Resolution order is question id, question kind, default. Registry objects are treated
as immutable configuration.

## Persistence

The injected browser store is specified in [persistence.md](./persistence.md).

```ts
export function createBrowserEventStore(
  options: BrowserEventStoreOptions,
): BrowserEventStore

export function persistSession(
  session: FlowSession,
  store: BrowserEventStore,
  onProblem: (problem: PersistenceProblem) => void,
): () => void
```

`persistSession` returns an idempotent unsubscribe. It catches store failures and calls
`onProblem` so a storage exception never escapes a session notification and never
causes a committed command to be retried.

## Error policy

- Domain rejection is returned as the existing `Result` and becomes friction.
- Persistence failure is returned or reported as `PersistenceProblem`.
- Invalid configuration, such as no renderer for a supported question kind, throws a
  developer-facing error suitable for a React error boundary.
- The package does not translate problem codes into product copy. It exposes the
  structured code and uses a minimal Spanish-neutral fallback only in default examples;
  feature 006 supplies final respondent messages.
