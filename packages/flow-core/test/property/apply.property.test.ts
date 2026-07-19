import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  apply,
  initialState,
  toNodeId,
  toQuestionId,
  type Event,
  type FlowState,
} from '../../src/index.js'
import { event, simpleSchema } from '../support/builders.js'

describe('apply properties', () => {
  it('is total for every typed event kind', () => {
    const schema = simpleSchema()
    const kinds: readonly Event['kind'][] = [
      'SESSION_STARTED',
      'ANSWERED',
      'ADVANCED',
      'WENT_BACK',
      'SESSION_FINISHED',
    ]

    fc.assert(
      fc.property(fc.constantFrom(...kinds), (kind) => {
        expect(() => apply(initialState(schema), event(kind))).not.toThrow()
      }),
    )
  })

  it('uses the latest repeated answer while retaining immutable prior states', () => {
    const initial = initialState(simpleSchema())
    const first = apply(initial, event('ANSWERED', { q: toQuestionId('q'), value: 'first' }))
    const second = apply(first, event('ANSWERED', { q: toQuestionId('q'), value: 'second' }))

    expect(first.answers[toQuestionId('q')]).toBe('first')
    expect(second.answers[toQuestionId('q')]).toBe('second')
    expect(initial.answers).toEqual({})
  })

  it('projects accepted ADVANCED events as a graph path', () => {
    const schema = simpleSchema()
    const state: FlowState = {
      ...initialState(schema),
      status: 'active',
    }
    const advanced = apply(
      state,
      event('ADVANCED', { from: toNodeId('page'), to: toNodeId('done') }),
    )

    expect(advanced.trail).toEqual([toNodeId('page'), toNodeId('done')])
    expect(
      advanced.trail.slice(1).every((to, index) => {
        const from = advanced.trail[index]
        const node = from ? schema.nodes[from] : undefined
        return node?.kind === 'page' && node.edges.some((edge) => edge.to === to)
      }),
    ).toBe(true)
  })
})
