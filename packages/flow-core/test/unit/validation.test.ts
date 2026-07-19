import { describe, expect, it } from 'vitest'

import {
  questionProblems,
  structuralAnswerProblems,
  toOptionId,
  toQuestionId,
  toSafeInt,
} from '../../src/index.js'
import { validationSchema, stateOn } from '../support/scenarios.js'

describe('answer validation', () => {
  it.each([
    ['unknown-question', toQuestionId('missing'), 'text'],
    ['answer-kind-mismatch', toQuestionId('age'), 'text'],
    ['unknown-option', toQuestionId('choice'), [toOptionId('missing')]],
    ['duplicate-option', toQuestionId('choice'), [toOptionId('a'), toOptionId('a')]],
    ['arity-mismatch', toQuestionId('single'), [toOptionId('a'), toOptionId('b')]],
  ] as const)('rejects %s structurally without recording', (code, q, value) => {
    const schema = validationSchema()
    const state = stateOn(schema, 'page')
    expect(
      structuralAnswerProblems(schema, state, q, value).map((problem) => problem.code),
    ).toContain(code)
  })

  it('rejects a known question that is not on the current visible page', () => {
    const schema = validationSchema()
    const state = stateOn(schema, 'done')
    expect(
      structuralAnswerProblems(schema, state, toQuestionId('age'), toSafeInt(42))[0]?.code,
    ).toBe('not-current-page')
  })

  it('records semantic violations and surfaces them through selectors', () => {
    const schema = validationSchema()
    const state = stateOn(schema, 'page', {
      notes: 'abcd',
      age: toSafeInt(130),
      single: [],
    })

    expect(questionProblems(schema, state, toQuestionId('notes')).map((p) => p.code)).toEqual([
      'too-long',
    ])
    expect(questionProblems(schema, state, toQuestionId('age')).map((p) => p.code)).toEqual([
      'out-of-range',
    ])
    expect(questionProblems(schema, state, toQuestionId('single')).map((p) => p.code)).toEqual([
      'required',
    ])
    expect(questionProblems(schema, state, toQuestionId('missing'))).toEqual([])
    expect(questionProblems(schema, stateOn(schema, 'done'), toQuestionId('age'))).toEqual([])
  })
})
