import { describe, expect, it } from 'vitest'

import {
  canGoBack,
  currentNode,
  isFinished,
  outcome,
  progress,
  toNodeId,
  toOutcomeId,
  type FlowState,
} from '../../src/index.js'
import { simpleSchema } from '../support/builders.js'

describe('navigation and progress selectors', () => {
  it('projects every lifecycle and navigation state', () => {
    const schema = simpleSchema()
    const initial: FlowState = {
      status: 'not-started',
      schemaId: schema.id,
      schemaVersion: schema.version,
      trail: [schema.entry],
      answers: {},
    }
    const active: FlowState = { ...initial, status: 'active' }
    const advanced: FlowState = {
      ...active,
      trail: [schema.entry, toNodeId('done')],
    }
    const finished: FlowState = {
      ...advanced,
      status: 'finished',
      outcome: toOutcomeId('submitted'),
    }

    expect(currentNode(schema, initial).kind).toBe('page')
    expect(currentNode(schema, advanced).kind).toBe('terminal')
    expect(canGoBack(initial)).toBe(false)
    expect(canGoBack(active)).toBe(false)
    expect(canGoBack(advanced)).toBe(true)
    expect(isFinished(active)).toBe(false)
    expect(isFinished(finished)).toBe(true)
    expect(outcome(active)).toBeUndefined()
    expect(outcome(finished)).toBe('submitted')
    expect(progress(schema, initial)).toEqual({
      completedEdges: 0,
      maximumRemainingEdges: 1,
      fraction: 0,
    })
    expect(progress(schema, active).fraction).toBe(0)
    expect(progress(schema, finished)).toEqual({
      completedEdges: 1,
      maximumRemainingEdges: 0,
      fraction: 1,
    })
  })

  it('handles dead ends, missing nodes, cycles, and invalid state references defensively', () => {
    const schema = simpleSchema()
    const broken = {
      ...schema,
      nodes: {
        page: {
          kind: 'page',
          questions: [],
          edges: [{ to: toNodeId('page'), when: { kind: 'always' } }],
        },
      },
    } as unknown as typeof schema
    const state: FlowState = {
      status: 'active',
      schemaId: schema.id,
      schemaVersion: schema.version,
      trail: [toNodeId('missing')],
      answers: {},
    }

    expect(progress(broken, { ...state, trail: [broken.entry] })).toMatchObject({
      maximumRemainingEdges: 1,
    })
    expect(progress(schema, state).maximumRemainingEdges).toBe(0)
    expect(currentNode(schema, { ...state, trail: [] }).kind).toBe('page')
    expect(progress(schema, { ...state, trail: [] }).maximumRemainingEdges).toBe(1)
    expect(
      progress(
        {
          ...schema,
          nodes: {
            page: { kind: 'page', questions: [], edges: [] },
          },
        } as unknown as typeof schema,
        { ...state, trail: [schema.entry] },
      ).maximumRemainingEdges,
    ).toBe(0)
    expect(() => currentNode({ ...schema, nodes: {} }, state)).toThrow(TypeError)
  })
})
