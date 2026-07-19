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
  id: toSchemaId('listeners'),
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

const command = (kind: Command['kind']): Command =>
  ({
    kind,
    meta: { at: toSafeInt(1), source: 'human', path: [] },
    ...(kind === 'START' ? { schemaHash: hashSchema(schema) } : {}),
  }) as Command

const session = () => {
  const created = createSession(schema)
  if (!created.ok) throw new Error('test setup failed')
  return created.value
}

describe('session notification causality', () => {
  it('rejects nested dispatch without side effects', () => {
    const flow = session()
    let nested: ReturnType<typeof flow.dispatch> | undefined
    flow.subscribeEvents(() => {
      nested = flow.dispatch(command('NEXT'))
    })

    flow.dispatch(command('START'))
    expect(nested).toEqual({
      ok: false,
      error: [{ code: 'reentrant-dispatch' }],
    })
    expect(flow.getEvents()).toHaveLength(1)
    expect(flow.getSnapshot().status).toBe('active')
  })

  it('snapshots listeners and makes unsubscribe idempotent', () => {
    const flow = session()
    const calls: string[] = []
    const late = () => calls.push('late')
    flow.subscribe(() => {
      calls.push('first')
      unsubscribeSecond()
      flow.subscribe(late)
    })
    const unsubscribeSecond = flow.subscribe(() => calls.push('second'))

    flow.dispatch(command('START'))
    expect(calls).toEqual(['first', 'second'])
    unsubscribeSecond()
    unsubscribeSecond()
    flow.dispatch(command('NEXT'))
    expect(calls).toEqual(['first', 'second', 'first', 'late'])
  })

  it('continues all listeners, commits, resets its guard, then throws one AggregateError', () => {
    const flow = session()
    const calls: string[] = []
    const unsubscribeFailure = flow.subscribeEvents(() => {
      calls.push('event-failed')
      throw new Error('persistence failed')
    })
    flow.subscribeEvents(() => calls.push('event-ok'))
    flow.subscribe(() => calls.push('state-ok'))

    expect(() => flow.dispatch(command('START'))).toThrow(AggregateError)
    expect(calls).toEqual(['event-failed', 'event-ok', 'state-ok'])
    expect(flow.getSnapshot().status).toBe('active')
    expect(flow.getEvents()).toHaveLength(1)

    unsubscribeFailure()
    expect(flow.dispatch(command('NEXT'))).toMatchObject({ ok: true })
    expect(flow.getSnapshot().status).toBe('finished')
  })

  it('aggregates state-listener failures after later state listeners run', () => {
    const flow = session()
    const calls: string[] = []
    flow.subscribe(() => {
      calls.push('failed')
      throw new Error('render failed')
    })
    flow.subscribe(() => calls.push('continued'))

    expect(() => flow.dispatch(command('START'))).toThrow(AggregateError)
    expect(calls).toEqual(['failed', 'continued'])
    expect(flow.getSnapshot().status).toBe('active')
  })
})
