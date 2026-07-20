import type { Command, CommandMeta } from '../domain/command.js'
import type { Event } from '../domain/event.js'
import type { NodeId } from '../domain/ids.js'
import type { Problem } from '../domain/problem.js'
import { err, ok, type Result } from '../domain/result.js'
import type { AnswerValue, AttachmentRef, FlowSchema } from '../domain/schema.js'
import type { FlowState } from '../domain/state.js'
import { hashSchema } from '../integrity/schema-hash.js'
import { upcastEvents } from '../parsing/upcast.js'
import { apply } from './apply.js'
import { decide } from './decide.js'
import { initialState } from './initial-state.js'

type ReplayEvent = Exclude<Event, { readonly kind: 'SESSION_STARTED' }>

const mismatch = (): Result<FlowState, Problem> => err({ code: 'log-schema-mismatch' })

const metadata = (event: Event): CommandMeta => ({
  at: event.at,
  source: event.source,
  path: event.path,
})

const samePath = (left: Event['path'], right: Event['path']): boolean =>
  left.length === right.length

const sameAnswer = (left: AnswerValue, right: AnswerValue): boolean =>
  Array.isArray(left) && Array.isArray(right)
    ? left.length === right.length &&
      (left as readonly unknown[]).every((value, index) => {
        const candidate: unknown = (right as readonly unknown[])[index]
        if (typeof value === 'string' || typeof candidate === 'string') return value === candidate
        const leftAttachment = value as AttachmentRef
        const rightAttachment = candidate as AttachmentRef
        return (
          leftAttachment.id === rightAttachment.id &&
          leftAttachment.name === rightAttachment.name &&
          leftAttachment.mediaType === rightAttachment.mediaType &&
          leftAttachment.size === rightAttachment.size
        )
      })
    : left === right

const sameEvent = (left: ReplayEvent, right: ReplayEvent): boolean => {
  if (
    left.kind !== right.kind ||
    left.at !== right.at ||
    left.source !== right.source ||
    !samePath(left.path, right.path)
  ) {
    return false
  }
  switch (left.kind) {
    case 'ANSWERED':
      return right.kind === 'ANSWERED' && left.q === right.q && sameAnswer(left.value, right.value)
    case 'ADVANCED':
      return right.kind === 'ADVANCED' && left.from === right.from && left.to === right.to
    case 'WENT_BACK':
      return right.kind === 'WENT_BACK' && left.from === right.from && left.to === right.to
    case 'SESSION_FINISHED':
      return right.kind === 'SESSION_FINISHED' && left.outcome === right.outcome
  }
}

const expectedBatch = (
  schema: FlowSchema,
  state: FlowState,
  command: Command,
): readonly Event[] | undefined => {
  const result = decide(schema, state, command)
  return result.ok ? result.value : undefined
}

export const replay = (schema: FlowSchema, input: readonly Event[]): Result<FlowState, Problem> => {
  const upcasted = upcastEvents(input)
  if (!upcasted.ok) return err(upcasted.error)
  const events = upcasted.value
  let state = initialState(schema)
  if (events.length === 0) return ok(state)

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]
    if (!event || state.status === 'finished') return mismatch()

    if (event.kind === 'SESSION_STARTED') {
      if (
        index !== 0 ||
        event.schemaId !== schema.id ||
        event.schemaVersion !== schema.version ||
        event.schemaHash !== hashSchema(schema)
      ) {
        return index === 0 ? err({ code: 'schema-mismatch' }) : mismatch()
      }
      state = apply(state, event)
      continue
    }

    if (index === 0 || state.status === 'not-started') return mismatch()

    if (event.kind === 'ANSWERED') {
      const expected = expectedBatch(schema, state, {
        kind: 'ANSWER',
        meta: metadata(event),
        q: event.q,
        value: event.value,
      })
      if (expected?.length !== 1 || !expected[0] || !sameEvent(expected[0] as ReplayEvent, event)) {
        return mismatch()
      }
      state = apply(state, event)
      continue
    }

    if (event.kind === 'WENT_BACK') {
      const expected = expectedBatch(schema, state, {
        kind: 'BACK',
        meta: metadata(event),
      })
      if (expected?.length !== 1 || !expected[0] || !sameEvent(expected[0] as ReplayEvent, event)) {
        return mismatch()
      }
      state = apply(state, event)
      continue
    }

    if (event.kind === 'ADVANCED') {
      const expected = expectedBatch(schema, state, {
        kind: 'NEXT',
        meta: metadata(event),
      })
      if (!expected?.[0] || !sameEvent(expected[0] as ReplayEvent, event)) return mismatch()
      if (expected.length === 2) {
        const expectedFinish = expected[1]
        const actualFinish = events[index + 1]
        if (
          !expectedFinish ||
          !actualFinish ||
          !sameEvent(expectedFinish as ReplayEvent, actualFinish as ReplayEvent)
        ) {
          return mismatch()
        }
      }
      state = apply(state, event)
      continue
    }

    const previous = events[index - 1]
    const node = state.trail.at(-1) as NodeId
    const terminal = schema.nodes[node]
    if (
      previous?.kind !== 'ADVANCED' ||
      terminal?.kind !== 'terminal' ||
      event.outcome !== terminal.outcome ||
      previous.at !== event.at ||
      previous.source !== event.source ||
      !samePath(previous.path, event.path)
    ) {
      return mismatch()
    }
    state = apply(state, event)
  }

  return ok(state)
}
