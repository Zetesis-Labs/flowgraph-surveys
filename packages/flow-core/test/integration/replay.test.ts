import { describe, expect, it } from 'vitest'

import {
  activeAnswers,
  apply,
  currentNode,
  decide,
  hashSchema,
  initialState,
  replay,
  toNodeId,
  toOptionId,
  toQuestionId,
  type Command,
  type Event,
  type FlowSchema,
  type FlowState,
} from '../../src/index.js'
import {
  attachment,
  attachmentSchema,
  command,
  event,
  meta,
  simpleSchema,
} from '../support/builders.js'
import { retailSchema } from '../fixtures/retail/journeys.js'

const record = (
  schema: FlowSchema,
  state: FlowState,
  events: readonly Event[],
  input: Command,
): readonly [FlowState, readonly Event[]] => {
  const decided = decide(schema, state, input)
  if (!decided.ok) throw new Error(`Rejected test command: ${String(decided.error[0]?.code)}`)
  return [decided.value.reduce(apply, state), [...events, ...decided.value]]
}

const startedLog = (schema: FlowSchema): readonly Event[] => {
  const result = decide(
    schema,
    initialState(schema),
    command('START', { schemaHash: hashSchema(schema) }),
  )
  if (!result.ok) throw new Error('test setup failed')
  return result.value
}

describe('replay', () => {
  it('restores a serialized mixed-source log and every derived projection exactly', () => {
    let state = initialState(retailSchema)
    let events: readonly Event[] = []
    ;[state, events] = record(
      retailSchema,
      state,
      events,
      command('START', { schemaHash: hashSchema(retailSchema), meta: meta(1, 'human') }),
    )
    ;[state, events] = record(
      retailSchema,
      state,
      events,
      command('ANSWER', {
        q: toQuestionId('reason'),
        value: [toOptionId('wrong')],
        meta: meta(2, 'agent'),
      }),
    )
    ;[state, events] = record(
      retailSchema,
      state,
      events,
      command('NEXT', { meta: meta(3, 'import') }),
    )
    ;[state, events] = record(
      retailSchema,
      state,
      events,
      command('ANSWER', {
        q: toQuestionId('label'),
        value: 'photo-1',
        meta: meta(4, 'human'),
      }),
    )

    const serialized = JSON.stringify(events)
    const parsed = JSON.parse(serialized) as readonly Event[]
    const restored = replay(retailSchema, parsed)
    expect(restored).toEqual({ ok: true, value: state })
    if (restored.ok) {
      expect(currentNode(retailSchema, restored.value)).toEqual(currentNode(retailSchema, state))
      expect(activeAnswers(retailSchema, restored.value)).toEqual(
        activeAnswers(retailSchema, state),
      )
    }
    expect(parsed.map(({ at, source }) => ({ at, source }))).toEqual([
      { at: 1, source: 'human' },
      { at: 2, source: 'agent' },
      { at: 3, source: 'import' },
      { at: 4, source: 'human' },
    ])
  })

  it('requires a matching first start and rejects duplicate starts', () => {
    const schema = simpleSchema()
    const start = startedLog(schema)[0]
    if (!start) throw new Error('test setup failed')

    expect(replay(schema, [event('ANSWERED')])).toEqual({
      ok: false,
      error: { code: 'log-schema-mismatch' },
    })
    expect(replay(schema, [{ ...start, schemaHash: 'b'.repeat(64) } as Event])).toEqual({
      ok: false,
      error: { code: 'schema-mismatch' },
    })
    expect(replay({ ...schema, version: '2' } as FlowSchema, [start])).toEqual({
      ok: false,
      error: { code: 'schema-mismatch' },
    })
    expect(replay(schema, [start, start])).toEqual({
      ok: false,
      error: { code: 'log-schema-mismatch' },
    })
  })

  it('rejects graph transitions, invalid backs, and events after completion', () => {
    const schema = simpleSchema()
    const start = startedLog(schema)[0]
    if (!start) throw new Error('test setup failed')

    expect(
      replay(schema, [
        start,
        event('ADVANCED', { from: toNodeId('page'), to: toNodeId('missing') }),
      ]),
    ).toEqual({ ok: false, error: { code: 'log-schema-mismatch' } })
    expect(
      replay(schema, [start, event('WENT_BACK', { from: toNodeId('page'), to: toNodeId('page') })]),
    ).toEqual({ ok: false, error: { code: 'log-schema-mismatch' } })
    expect(
      replay(schema, [start, event('ANSWERED', { q: toQuestionId('missing'), value: 'invalid' })]),
    ).toEqual({ ok: false, error: { code: 'log-schema-mismatch' } })
    expect(replay(schema, [{ ...start, v: 2 } as unknown as Event])).toEqual({
      ok: false,
      error: { code: 'unsupported-event-version' },
    })

    const next = decide(schema, apply(initialState(schema), start), command('NEXT'))
    if (!next.ok) throw new Error('test setup failed')
    const complete = [start, ...next.value]
    expect(replay(schema, complete)).toMatchObject({ ok: true, value: { status: 'finished' } })
    expect(replay(schema, [...complete, event('ANSWERED')])).toEqual({
      ok: false,
      error: { code: 'log-schema-mismatch' },
    })
  })

  it('requires an adjacent, metadata-identical finish after a terminal advance', () => {
    const schema = simpleSchema()
    const start = startedLog(schema)[0]
    if (!start) throw new Error('test setup failed')
    const state = apply(initialState(schema), start)
    const next = decide(schema, state, command('NEXT', { meta: meta(9, 'agent') }))
    if (!next.ok || next.value.length !== 2) throw new Error('test setup failed')
    const [advanced, finished] = next.value
    if (!advanced || !finished) throw new Error('test setup failed')

    expect(replay(schema, [start, advanced])).toEqual({
      ok: false,
      error: { code: 'log-schema-mismatch' },
    })
    expect(replay(schema, [start, finished])).toEqual({
      ok: false,
      error: { code: 'log-schema-mismatch' },
    })
    expect(replay(schema, [start, advanced, { ...finished, at: meta(10).at }])).toEqual({
      ok: false,
      error: { code: 'log-schema-mismatch' },
    })
  })

  it('retains repeated answer facts while projecting the last value', () => {
    let state = initialState(retailSchema)
    let log: readonly Event[] = []
    ;[state, log] = record(
      retailSchema,
      state,
      log,
      command('START', { schemaHash: hashSchema(retailSchema) }),
    )
    ;[state, log] = record(
      retailSchema,
      state,
      log,
      command('ANSWER', { q: toQuestionId('reason'), value: [toOptionId('wrong')] }),
    )
    ;[, log] = record(
      retailSchema,
      state,
      log,
      command('ANSWER', { q: toQuestionId('reason'), value: [toOptionId('other')] }),
    )

    expect(log.filter(({ kind }) => kind === 'ANSWERED')).toHaveLength(2)
    expect(replay(retailSchema, log)).toMatchObject({
      ok: true,
      value: { answers: { reason: ['other'] } },
    })
  })

  it('replays attachment metadata by deep ordered value equality', () => {
    const schema = attachmentSchema()
    const start = startedLog(schema)[0]
    if (!start) throw new Error('test setup failed')
    const state = apply(initialState(schema), start)
    const value = [attachment('front.jpg'), attachment('side.png', { mediaType: 'image/png' })]
    const answered = decide(schema, state, command('ANSWER', { q: toQuestionId('photos'), value }))
    expect(answered.ok).toBe(true)
    if (!answered.ok) return
    expect(replay(schema, [start, ...answered.value])).toMatchObject({
      ok: true,
      value: { answers: { photos: value } },
    })
    const serialized = JSON.parse(JSON.stringify([start, ...answered.value])) as readonly Event[]
    expect(replay(schema, serialized)).toMatchObject({
      ok: true,
      value: { answers: { photos: value } },
    })
  })
})
