import { describe, expect, it } from 'vitest'

import {
  activeAnswers,
  apply,
  decide,
  hashSchema,
  initialState,
  toOptionId,
  toQuestionId,
  type AnswerValue,
  type Command,
  type FlowSchema,
  type FlowState,
} from '../../src/index.js'
import { command } from '../support/builders.js'
import { phq2Schema } from '../fixtures/phq2/journeys.js'
import { retailSchema } from '../fixtures/retail/journeys.js'

const dispatch = (schema: FlowSchema, state: FlowState, input: Command): FlowState => {
  const result = decide(schema, state, input)
  if (!result.ok) throw new Error(`Rejected test command: ${String(result.error[0]?.code)}`)
  return result.value.reduce(apply, state)
}

const start = (schema: FlowSchema): FlowState =>
  dispatch(schema, initialState(schema), command('START', { schemaHash: hashSchema(schema) }))

const answer = (schema: FlowSchema, state: FlowState, q: string, value: AnswerValue): FlowState =>
  dispatch(schema, state, command('ANSWER', { q: toQuestionId(q), value }))

describe('conditional flow acceptance', () => {
  it('runs the wrong-item retail branch through one shared reconverged page', () => {
    let state = start(retailSchema)
    state = answer(retailSchema, state, 'reason', [toOptionId('wrong')])
    state = dispatch(retailSchema, state, command('NEXT'))
    state = answer(retailSchema, state, 'label', 'photo-1')
    state = dispatch(retailSchema, state, command('NEXT'))
    state = answer(retailSchema, state, 'email', 'a@example.test')
    state = dispatch(retailSchema, state, command('NEXT'))

    expect(state.status).toBe('finished')
    expect(state.outcome).toBe('completed')
    expect(state.trail).toEqual(['reason', 'label', 'shared', 'done'])
  })

  it.each([
    [['often'], ['often'], 'referral'],
    [['sometimes'], ['sometimes'], 'negative'],
  ])('routes PHQ-2 weighted answers to %s', (q1, q2, expected) => {
    let state = start(phq2Schema)
    state = answer(phq2Schema, state, 'q1', q1.map(toOptionId))
    state = answer(phq2Schema, state, 'q2', q2.map(toOptionId))
    state = dispatch(phq2Schema, state, command('NEXT'))
    expect(state.outcome).toBe(expected)
  })

  it('never fabricates an outcome from missing PHQ-2 data', () => {
    const result = decide(phq2Schema, start(phq2Schema), command('NEXT'))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.map((problem) => problem.code)).toContain('required')
  })

  it('deactivates and later reactivates retained abandoned-branch answers', () => {
    let state = start(retailSchema)
    state = answer(retailSchema, state, 'reason', [toOptionId('wrong')])
    state = dispatch(retailSchema, state, command('NEXT'))
    state = answer(retailSchema, state, 'label', 'retained')
    state = dispatch(retailSchema, state, command('BACK'))
    state = answer(retailSchema, state, 'reason', [toOptionId('other')])
    state = dispatch(retailSchema, state, command('NEXT'))
    expect(activeAnswers(retailSchema, state)[toQuestionId('label')]).toBeUndefined()

    state = dispatch(retailSchema, state, command('BACK'))
    state = answer(retailSchema, state, 'reason', [toOptionId('wrong')])
    state = dispatch(retailSchema, state, command('NEXT'))
    expect(activeAnswers(retailSchema, state)[toQuestionId('label')]).toBe('retained')
  })
})
