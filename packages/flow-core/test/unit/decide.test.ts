import { describe, expect, it } from 'vitest'

import {
  apply,
  decide,
  hashSchema,
  initialState,
  toNodeId,
  toQuestionId,
  type Command,
  type FlowSchema,
  type FlowState,
} from '../../src/index.js'
import { command, meta, simpleSchema } from '../support/builders.js'
import { validationSchema } from '../support/scenarios.js'

const start = (schema: FlowSchema): Command => command('START', { schemaHash: hashSchema(schema) })

const started = (schema: FlowSchema): FlowState => {
  const result = decide(schema, initialState(schema), start(schema))
  if (!result.ok || !result.value[0]) throw new Error('test setup failed')
  return apply(initialState(schema), result.value[0])
}

describe('decide', () => {
  it('requires one explicit START with the matching schema hash', () => {
    const schema = simpleSchema()
    const state = initialState(schema)

    expect(decide(schema, state, command('NEXT'))).toEqual({
      ok: false,
      error: [{ code: 'session-not-started' }],
    })
    expect(decide(schema, state, command('START', { schemaHash: 'b'.repeat(64) }))).toEqual({
      ok: false,
      error: [{ code: 'schema-mismatch' }],
    })

    const result = decide(schema, state, start(schema))
    expect(result.ok).toBe(true)
    if (result.ok) {
      const startedEvent = result.value[0]
      if (!startedEvent) throw new Error('test setup failed')
      expect(result.value[0]).toMatchObject({
        kind: 'SESSION_STARTED',
        schemaId: schema.id,
        schemaVersion: schema.version,
      })
      const active = apply(state, startedEvent)
      expect(decide(schema, active, start(schema))).toEqual({
        ok: false,
        error: [{ code: 'session-already-started' }],
      })
    }
  })

  it('returns exact answer/navigation problems with no events', () => {
    const schema = validationSchema()
    const state = started(schema)

    expect(decide(schema, state, command('ANSWER', { q: toQuestionId('missing') }))).toEqual({
      ok: false,
      error: [{ code: 'unknown-question', where: { q: 'missing' } }],
    })
    const next = decide(schema, state, command('NEXT'))
    expect(next.ok).toBe(false)
    if (!next.ok) expect(next.error.map((problem) => problem.code)).toContain('required')
  })

  it('records structurally valid semantic-invalid answers', () => {
    const schema = validationSchema()
    const state = started(schema)
    const result = decide(schema, state, command('ANSWER', { q: toQuestionId('age'), value: 130 }))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value[0]).toMatchObject({ kind: 'ANSWERED', value: 130 })
  })

  it('navigates zero-question pages, supports first-page BACK, and finishes atomically', () => {
    const schema = simpleSchema()
    const state = started(schema)

    expect(decide(schema, state, command('BACK'))).toEqual({ ok: true, value: [] })
    const result = decide(schema, state, command('NEXT', { meta: meta(7, 'agent') }))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.map((event) => event.kind)).toEqual(['ADVANCED', 'SESSION_FINISHED'])
      expect(result.value[0]).toMatchObject({ at: 7, source: 'agent', path: [] })
      expect(result.value[1]).toMatchObject({ at: 7, source: 'agent', path: [] })
      const finished = result.value.reduce(apply, state)
      expect(decide(schema, finished, command('NEXT'))).toEqual({ ok: true, value: [] })
      expect(decide(schema, finished, command('ANSWER'))).toEqual({
        ok: false,
        error: [{ code: 'session-sealed' }],
      })
      expect(decide(schema, finished, command('BACK'))).toEqual({
        ok: false,
        error: [{ code: 'session-sealed' }],
      })
    }
  })

  it('records BACK to the previous trail node and reports no edge or missing nodes', () => {
    const schema = simpleSchema()
    const state = {
      ...started(schema),
      trail: [toNodeId('page'), toNodeId('page')],
    }
    expect(decide(schema, state, command('BACK'))).toMatchObject({
      ok: true,
      value: [{ kind: 'WENT_BACK', from: 'page', to: 'page' }],
    })

    const noEdge = {
      ...schema,
      nodes: {
        ...schema.nodes,
        page: { kind: 'page', questions: [], edges: [] },
      },
    } as unknown as FlowSchema
    expect(decide(noEdge, started(noEdge), command('NEXT'))).toEqual({
      ok: false,
      error: [{ code: 'no-edge', where: { node: 'page' } }],
    })

    const missing = {
      ...schema,
      nodes: {
        ...schema.nodes,
        page: {
          kind: 'page',
          questions: [],
          edges: [{ to: toNodeId('missing'), when: { kind: 'always' } }],
        },
      },
    } as unknown as FlowSchema
    expect(decide(missing, started(missing), command('NEXT'))).toEqual({
      ok: false,
      error: [{ code: 'missing-node', where: { node: 'missing' } }],
    })

    expect(decide(schema, { ...started(schema), trail: [] }, command('NEXT'))).toEqual({
      ok: false,
      error: [{ code: 'missing-node', where: { node: 'page' } }],
    })
    expect(
      decide(schema, { ...started(schema), trail: [toNodeId('done')] }, command('NEXT')),
    ).toEqual({
      ok: false,
      error: [{ code: 'missing-node', where: { node: 'done' } }],
    })
  })
})
