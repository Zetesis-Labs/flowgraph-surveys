import { describe, expect, it } from 'vitest'

import {
  activeAnswers,
  evaluateGuard,
  storedAnswer,
  toNodeId,
  toOptionId,
  toQuestionId,
  visibleQuestions,
} from '../../src/index.js'
import { branchSchema, stateOnTrail } from '../support/scenarios.js'

describe('visibility and active truth', () => {
  it('evaluates same-page visibility in document order', () => {
    const schema = branchSchema()
    const hidden = stateOnTrail(schema, ['choice'], {})
    const visible = stateOnTrail(schema, ['choice'], { route: [toOptionId('a')], detail: 'kept' })

    expect(activeAnswers(schema, hidden)).toEqual({})
    expect(activeAnswers(schema, visible)).toEqual({
      route: [toOptionId('a')],
      detail: 'kept',
    })
  })

  it('deactivates abandoned-route answers while retaining stored facts', () => {
    const schema = branchSchema()
    const abandoned = stateOnTrail(schema, ['choice', 'branch-b'], {
      route: [toOptionId('b')],
      detail: 'from branch a',
      b: 'active branch b',
    })

    expect(storedAnswer(abandoned, toQuestionId('detail'))).toBe('from branch a')
    expect(activeAnswers(schema, abandoned)).toEqual({
      route: [toOptionId('b')],
      b: 'active branch b',
    })
    expect(
      evaluateGuard(schema, abandoned, {
        kind: 'answered',
        q: toQuestionId('detail'),
      }),
    ).toBe('false')
  })

  it('reactivates the latest retained answer only after re-entering its page', () => {
    const schema = branchSchema()
    const returned = stateOnTrail(schema, ['choice', 'branch-a'], {
      route: [toOptionId('a')],
      detail: 'prefilled',
    })

    expect(activeAnswers(schema, returned)[toQuestionId('detail')]).toBe('prefilled')
    expect(returned.trail).toEqual([toNodeId('choice'), toNodeId('branch-a')])
  })

  it('covers recursive guard composition, missing questions, and non-page visibility', () => {
    const schema = branchSchema()
    const state = stateOnTrail(schema, ['choice'], { route: [toOptionId('a')] })
    const selected = {
      kind: 'selected' as const,
      q: toQuestionId('route'),
      option: toOptionId('a'),
    }

    expect(evaluateGuard(schema, state, { kind: 'not', value: selected })).toBe('false')
    expect(evaluateGuard(schema, state, { kind: 'all', values: [selected] })).toBe('true')
    expect(evaluateGuard(schema, state, { kind: 'any', values: [selected] })).toBe('true')
    expect(evaluateGuard(schema, state, { kind: 'answered', q: toQuestionId('missing') })).toBe(
      'false',
    )
    expect(visibleQuestions(schema, state).map(({ id }) => id)).toEqual(['route', 'detail'])
    expect(visibleQuestions(schema, stateOnTrail(schema, ['done'], {}))).toEqual([])
    expect(visibleQuestions(schema, { ...state, trail: [] })).toEqual([])
  })
})
