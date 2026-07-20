import { describe, expect, it } from 'vitest'

import {
  questionProblems,
  structuralAnswerProblems,
  toNodeId,
  toOptionId,
  toQuestionId,
  toSafeInt,
  type AnswerValue,
  type FlowSchema,
} from '../../src/index.js'
import { attachment, attachmentSchema } from '../support/builders.js'
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

  it('validates attachment count, MIME type, size, and unique identity', () => {
    const schema = attachmentSchema()
    const state = stateOn(schema, 'page')
    const photos = toQuestionId('photos')
    const valid = attachment()

    expect(questionProblems(schema, state, photos).map(({ code }) => code)).toEqual(['required'])
    expect(
      structuralAnswerProblems(schema, state, photos, [
        valid,
        { ...valid, name: 'duplicate.jpg' },
      ]).map(({ code }) => code),
    ).toContain('duplicate-attachment')
    expect(
      questionProblems(
        schema,
        stateOn(schema, 'page', {
          photos: [{ ...valid, mediaType: 'application/pdf' }],
        }),
        photos,
      ).map(({ code }) => code),
    ).toContain('unsupported-file-type')
    expect(
      questionProblems(
        schema,
        stateOn(schema, 'page', {
          photos: [{ ...valid, size: toSafeInt(8 * 1024 * 1024 + 1) }],
        }),
        photos,
      ).map(({ code }) => code),
    ).toContain('file-too-large')
    expect(
      questionProblems(
        schema,
        stateOn(schema, 'page', {
          photos: Array.from({ length: 5 }, (_, index) => attachment(`${String(index)}.jpg`)),
        }),
        photos,
      ).map(({ code }) => code),
    ).toContain('attachment-count')
    expect(
      structuralAnswerProblems(
        schema,
        state,
        photos,
        Array.from({ length: 5 }, (_, index) => attachment(`structural-${String(index)}.jpg`)),
      ).map(({ code }) => code),
    ).toContain('attachment-count')
    expect(questionProblems(schema, stateOn(schema, 'page', { photos: [valid] }), photos)).toEqual(
      [],
    )
  })

  it('supports optional unconstrained attachment questions and rejects malformed objects', () => {
    const constrained = attachmentSchema()
    const page = constrained.nodes[toNodeId('page')]
    if (page?.kind !== 'page') throw new Error('attachment fixture missing')
    const question = page.questions[0]
    if (question?.kind !== 'attachment') throw new Error('attachment question missing')
    const schema = {
      ...constrained,
      nodes: {
        ...constrained.nodes,
        [toNodeId('page')]: {
          ...page,
          questions: [
            {
              kind: 'attachment',
              id: question.id,
              text: question.text,
            },
          ],
        },
      },
    } as FlowSchema
    const state = stateOn(schema, 'page', { photos: [] })
    expect(questionProblems(schema, state, toQuestionId('photos'))).toEqual([])

    const minimumSchema = {
      ...schema,
      nodes: {
        ...schema.nodes,
        [toNodeId('page')]: {
          ...schema.nodes[toNodeId('page')],
          kind: 'page',
          questions: [
            {
              kind: 'attachment',
              id: question.id,
              text: question.text,
              minFiles: toSafeInt(2),
            },
          ],
        },
      },
    } as FlowSchema
    expect(
      structuralAnswerProblems(
        minimumSchema,
        stateOn(minimumSchema, 'page'),
        toQuestionId('photos'),
        [attachment()],
      ),
    ).toEqual([])

    for (const malformed of [
      [null],
      [[]],
      [{}],
      [{ id: '', name: 'x', mediaType: 'image/jpeg', size: 1 }],
      [{ id: 'x', name: '', mediaType: 'image/jpeg', size: 1 }],
      [{ id: 'x', name: 'x', mediaType: '', size: 1 }],
      [{ id: 'x', name: 'x', mediaType: 'image/jpeg', size: 1.5 }],
      [{ id: 'x', name: 'x', mediaType: 'image/jpeg', size: -1 }],
    ]) {
      expect(
        structuralAnswerProblems(
          schema,
          state,
          toQuestionId('photos'),
          malformed as unknown as AnswerValue,
        ).map(({ code }) => code),
      ).toContain('answer-kind-mismatch')
    }
  })
})
