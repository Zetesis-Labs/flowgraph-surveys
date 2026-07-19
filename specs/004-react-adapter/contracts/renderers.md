# Renderer Contract

**Feature**: `004-react-adapter`
**Contract version**: v1

## Closed component input

```ts
export type QuestionRendererProps<Q extends Question = Question> = {
  readonly question: Q
  readonly text: string
  readonly options: Q extends SelectQuestion
    ? readonly ResolvedOption[]
    : undefined
  readonly value: AnswerValue | undefined
  readonly problems: readonly Problem[]
  readonly disabled: boolean
  readonly onAnswer: (
    value: AnswerValue,
  ) => Result<readonly Event[], readonly Problem[]>
}

export type QuestionRenderer<Q extends Question = Question> =
  ComponentType<QuestionRendererProps<Q>>
```

A renderer MUST NOT receive `FlowSchema`, graph nodes or edges, the trail, unrelated
answers, a session object, or selector/evaluator functions. It renders one question and
reports an answer.

## Default text renderer

- Uses a labeled text input when the host identifies the question as short text and a
  labeled textarea for the adapter's default long-form presentation.
- Keeps a local raw string while focused.
- Commits on blur or controller flush.
- Uses code-point length for remaining-length presentation, matching core validation.
- Preserves a rejected draft and associates its problems through `aria-describedby`.

Core v1 has one `text` kind and no short/long presentation hint. Therefore the package
default is a textarea; feature 006 may use question-id overrides for selected
single-line fields without changing semantics.

## Default number renderer

- Uses a labeled text-compatible numeric control whose raw draft may temporarily be
  empty, signed, or otherwise incomplete.
- Converts only a complete safe integer into the governed answer.
- A non-safe or incomplete value remains draft friction and is not dispatched.
- Applies known min/max attributes as input hints, while core dispatch remains the
  authority for acceptance.

## Default single-choice renderer

- Uses a `fieldset` and `legend`.
- Renders one radio per option with a stable id.
- Dispatches the one-element option-id array immediately on deliberate selection.
- Uses the confirmed value as the checked source.

## Default multiple-choice renderer

- Uses a `fieldset` and `legend`.
- Renders one checkbox per option.
- Dispatches the complete ordered selected-option array immediately.
- Preserves schema option order regardless of selection order.

## Problem presentation

- Question-specific problems appear in stable problem order.
- The control or fieldset references a stable problem container id.
- `required`, `out-of-range`, `too-long`, structural answer problems, and
  `not-current-page` remain distinguishable by code.
- Product copy is resolved outside the domain; the original `Problem` stays available
  for diagnostics.
- Page problems such as `no-edge` render in a page-level live region.

## Draft registration

Default text and number renderers use an internal draft context supplied by `FlowPage`.
Registration contains question id, visible order, flush, and focus callbacks.
Registration and cleanup are idempotent.

Custom renderers may dispatch immediately through `onAnswer`. A later public custom
draft API is not part of v1; applications needing bespoke drafted controls can wrap a
default renderer or explicitly manage confirmation before invoking `onAnswer`.

## Renderer resolution

```text
1. registry.byId[question.id]
2. registry.byKind[question.kind]
3. defaultRenderers[question.kind]
4. developer-visible missing-renderer error
```

An override never changes the question definition, answer representation, visibility,
validation, or navigation.
