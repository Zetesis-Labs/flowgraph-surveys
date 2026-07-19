import { describe, expect, it } from 'vitest'

import {
  evaluateGuard,
  evaluateNumeric,
  toNodeId,
  toOptionId,
  toQuestionId,
  toSafeInt,
  type FlowSchema,
  type FlowState,
} from '../../src/index.js'
import { evaluationSchema, stateOn } from '../support/scenarios.js'

describe('numeric and guard evaluation', () => {
  it('evaluates num, answer, score, sum, and all comparison operators exactly', () => {
    const schema = evaluationSchema()
    const state = stateOn(schema, 'page', {
      count: toSafeInt(2),
      choice: [toOptionId('heavy'), toOptionId('light')],
    })
    const sum = {
      kind: 'sum',
      values: [
        { kind: 'answer', q: toQuestionId('count') },
        { kind: 'score', q: toQuestionId('choice') },
        { kind: 'num', value: toSafeInt(1) },
      ],
    } as const

    expect(evaluateNumeric(schema, state, sum)).toEqual({ kind: 'known', value: 6 })
    for (const [op, expected] of [
      ['eq', 'true'],
      ['ne', 'false'],
      ['lt', 'false'],
      ['lte', 'true'],
      ['gt', 'false'],
      ['gte', 'true'],
    ] as const) {
      expect(
        evaluateGuard(schema, state, {
          kind: 'cmp',
          op,
          left: sum,
          right: { kind: 'num', value: toSafeInt(6) },
        }),
      ).toBe(expected)
    }
  })

  it('returns unknown for missing, inactive, mistyped, wrong-kind, and overflowing values', () => {
    const schema = evaluationSchema()
    const base = stateOn(schema, 'page')

    expect(evaluateNumeric(schema, base, { kind: 'answer', q: toQuestionId('count') })).toEqual({
      kind: 'unknown',
    })
    expect(evaluateNumeric(schema, base, { kind: 'score', q: toQuestionId('choice') })).toEqual({
      kind: 'unknown',
    })
    expect(evaluateNumeric(schema, base, { kind: 'answer', q: toQuestionId('choice') })).toEqual({
      kind: 'unknown',
    })
    expect(
      evaluateNumeric(
        schema,
        { ...base, answers: { count: 'wrong type' } } as unknown as FlowState,
        { kind: 'answer', q: toQuestionId('count') },
      ),
    ).toEqual({ kind: 'unknown' })

    const basePage = schema.nodes[toNodeId('page')]
    const overflowSchema: FlowSchema = {
      ...schema,
      nodes: {
        ...schema.nodes,
        [toNodeId('page')]: {
          ...schema.nodes[toNodeId('page')],
          kind: 'page',
          questions: [
            {
              kind: 'select',
              id: toQuestionId('choice'),
              text: { key: 'choice', fallback: 'Choice' },
              multiple: true,
              options: [
                {
                  id: toOptionId('huge'),
                  text: { key: 'huge', fallback: 'Huge' },
                  weight: toSafeInt(Number.MAX_SAFE_INTEGER),
                },
                {
                  id: toOptionId('one'),
                  text: { key: 'one', fallback: 'One' },
                  weight: toSafeInt(1),
                },
              ],
            },
          ],
          edges: basePage?.kind === 'page' ? basePage.edges : [],
        },
      },
    }
    const overflowState = stateOn(overflowSchema, 'page', {
      choice: [toOptionId('huge'), toOptionId('one')],
    })
    expect(
      evaluateNumeric(overflowSchema, overflowState, {
        kind: 'score',
        q: toQuestionId('choice'),
      }),
    ).toEqual({ kind: 'unknown' })
  })

  it('keeps selected unknown without an answer and score zero for answered-empty', () => {
    const schema = evaluationSchema()
    const missing = stateOn(schema, 'page')
    const empty = stateOn(schema, 'page', { choice: [] })

    expect(
      evaluateGuard(schema, missing, {
        kind: 'selected',
        q: toQuestionId('choice'),
        option: toOptionId('heavy'),
      }),
    ).toBe('unknown')
    expect(
      evaluateGuard(schema, empty, {
        kind: 'selected',
        q: toQuestionId('choice'),
        option: toOptionId('heavy'),
      }),
    ).toBe('false')
    expect(evaluateNumeric(schema, empty, { kind: 'score', q: toQuestionId('choice') })).toEqual({
      kind: 'known',
      value: 0,
    })
  })

  it('treats absent weights as zero and unknown selected ids or sum operands as unknown', () => {
    const schema = evaluationSchema()
    const page = schema.nodes[toNodeId('page')]
    if (page?.kind !== 'page') throw new Error('test setup failed')
    const choice = page.questions.find(({ id }) => id === toQuestionId('choice'))
    if (choice?.kind !== 'select') throw new Error('test setup failed')
    const unweighted = {
      ...schema,
      nodes: {
        ...schema.nodes,
        page: {
          ...page,
          questions: [
            ...page.questions.filter(({ id }) => id !== choice.id),
            {
              ...choice,
              options: [
                ...choice.options,
                { id: toOptionId('zero'), text: { key: 'zero', fallback: 'Zero' } },
              ],
            },
          ],
        },
      },
    } as FlowSchema

    expect(
      evaluateNumeric(unweighted, stateOn(unweighted, 'page', { choice: [toOptionId('zero')] }), {
        kind: 'score',
        q: toQuestionId('choice'),
      }),
    ).toEqual({ kind: 'known', value: toSafeInt(0) })
    expect(
      evaluateNumeric(schema, stateOn(schema, 'page', { choice: [toOptionId('missing')] }), {
        kind: 'score',
        q: toQuestionId('choice'),
      }),
    ).toEqual({ kind: 'unknown' })
    expect(
      evaluateNumeric(schema, stateOn(schema, 'page'), {
        kind: 'sum',
        values: [{ kind: 'answer', q: toQuestionId('count') }],
      }),
    ).toEqual({ kind: 'unknown' })
    expect(
      evaluateNumeric(schema, stateOn(schema, 'page', { count: toSafeInt(1) }), {
        kind: 'score',
        q: toQuestionId('count'),
      }),
    ).toEqual({ kind: 'unknown' })
  })
})
