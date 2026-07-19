import {
  hashSchema,
  toNodeId,
  toOutcomeId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type Command,
  type FlowSchema,
} from '@flowgraph/core'
import { describe, expect, it } from 'vitest'

import { createSession } from '../src/index.js'

const schema: FlowSchema = {
  id: toSchemaId('session-test'),
  version: toSchemaVersion('1'),
  entry: toNodeId('page'),
  nodes: {
    page: {
      kind: 'page',
      questions: [],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    done: { kind: 'terminal', outcome: toOutcomeId('done') },
  } as FlowSchema['nodes'],
}

const input = (kind: Command['kind']): Command =>
  ({
    kind,
    meta: { at: toSafeInt(1), source: 'human', path: [] },
    ...(kind === 'START' ? { schemaHash: hashSchema(schema) } : {}),
  }) as Command

describe('createSession', () => {
  it('creates a fresh explicit-start session with stable references', () => {
    const created = createSession(schema)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const session = created.value
    const beforeState = session.getSnapshot()
    const beforeEvents = session.getEvents()

    expect(beforeState.status).toBe('not-started')
    expect(session.getSnapshot()).toBe(beforeState)
    expect(session.getEvents()).toBe(beforeEvents)

    expect(session.dispatch(input('START'))).toMatchObject({
      ok: true,
      value: [{ kind: 'SESSION_STARTED' }],
    })
    expect(session.getSnapshot()).not.toBe(beforeState)
    expect(session.getEvents()).not.toBe(beforeEvents)
    expect(session.getSnapshot()).toBe(session.getSnapshot())
    expect(session.getEvents()).toBe(session.getEvents())
  })

  it('preserves references and notifications for rejection and empty batches', () => {
    const created = createSession(schema)
    if (!created.ok) throw new Error('test setup failed')
    const session = created.value
    session.dispatch(input('START'))
    const calls: string[] = []
    session.subscribeEvents(() => calls.push('events'))
    session.subscribe(() => calls.push('state'))
    const state = session.getSnapshot()
    const events = session.getEvents()

    expect(session.dispatch(input('BACK'))).toEqual({ ok: true, value: [] })
    expect(session.getSnapshot()).toBe(state)
    expect(session.getEvents()).toBe(events)
    expect(calls).toEqual([])

    expect(session.dispatch(input('START'))).toMatchObject({
      ok: false,
      error: [{ code: 'session-already-started' }],
    })
    expect(session.getSnapshot()).toBe(state)
    expect(session.getEvents()).toBe(events)
    expect(calls).toEqual([])
  })

  it('commits terminal events atomically and notifies event then state listeners', () => {
    const created = createSession(schema)
    if (!created.ok) throw new Error('test setup failed')
    const session = created.value
    session.dispatch(input('START'))
    const observations: string[] = []
    session.subscribeEvents((batch) => {
      observations.push(`events:${batch.map(({ kind }) => kind).join(',')}`)
      expect(session.getSnapshot().status).toBe('finished')
      expect(session.getEvents().at(-1)?.kind).toBe('SESSION_FINISHED')
    })
    session.subscribe(() => observations.push(`state:${session.getSnapshot().status}`))

    const result = session.dispatch(input('NEXT'))
    expect(result).toMatchObject({
      ok: true,
      value: [{ kind: 'ADVANCED' }, { kind: 'SESSION_FINISHED' }],
    })
    expect(observations).toEqual(['events:ADVANCED,SESSION_FINISHED', 'state:finished'])
  })
})
