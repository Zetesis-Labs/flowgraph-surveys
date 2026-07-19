import {
  activeAnswers,
  currentNode,
  decide,
  hashSchema,
  initialState,
  replay,
  toNodeId,
  toOptionId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type Event,
  type FlowSchema,
} from '@flowgraph/core'
import { describe, expect, it } from 'vitest'

import { createSession } from '../src/index.js'

const schema: FlowSchema = {
  id: toSchemaId('restore'),
  version: toSchemaVersion('1'),
  entry: toNodeId('page'),
  nodes: {
    page: {
      kind: 'page',
      questions: [
        {
          kind: 'select',
          id: toQuestionId('q'),
          text: { key: 'q', fallback: 'Q' },
          options: [{ id: toOptionId('a'), text: { key: 'a', fallback: 'A' } }],
        },
      ],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    done: { kind: 'terminal', outcome: toOutcomeId('done') },
  } as FlowSchema['nodes'],
}

const log = (): readonly Event[] => {
  const start = decide(schema, initialState(schema), {
    kind: 'START',
    schemaHash: hashSchema(schema),
    meta: { at: toSafeInt(1), source: 'import', path: [] },
  })
  if (!start.ok || !start.value[0]) throw new Error('test setup failed')
  const active = replay(schema, start.value)
  if (!active.ok) throw new Error('test setup failed')
  const answer = decide(schema, active.value, {
    kind: 'ANSWER',
    q: toQuestionId('q'),
    value: [toOptionId('a')],
    meta: { at: toSafeInt(2), source: 'human', path: [] },
  })
  if (!answer.ok) throw new Error('test setup failed')
  return [...start.value, ...answer.value]
}

describe('session restoration', () => {
  it('restores only through replay with exact state, selectors, and stable log references', () => {
    const events = log()
    const expected = replay(schema, events)
    const created = createSession(schema, JSON.parse(JSON.stringify(events)) as readonly Event[])
    expect(created.ok).toBe(true)
    if (!created.ok || !expected.ok) return

    expect(created.value.getSnapshot()).toEqual(expected.value)
    expect(currentNode(schema, created.value.getSnapshot())).toEqual(
      currentNode(schema, expected.value),
    )
    expect(activeAnswers(schema, created.value.getSnapshot())).toEqual(
      activeAnswers(schema, expected.value),
    )
    expect(created.value.getEvents()).toEqual(events)
    expect(created.value.getEvents()).toBe(created.value.getEvents())
  })

  it('fails closed for schema or log corruption without exposing a partial session', () => {
    const events = log()
    const first = events[0]
    if (!first) throw new Error('test setup failed')
    const changed = { ...schema, version: toSchemaVersion('2') }
    expect(createSession(changed, events)).toEqual({
      ok: false,
      error: { code: 'schema-mismatch' },
    })
    expect(createSession(schema, [...events, first])).toEqual({
      ok: false,
      error: { code: 'log-schema-mismatch' },
    })
  })
})
