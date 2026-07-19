import { describe, expect, it } from 'vitest'

import { parseSchema, toNodeId } from '../../src/index.js'

const validSchema = {
  id: 'survey',
  version: '1.0.0',
  entry: 'page',
  nodes: {
    page: {
      kind: 'page',
      questions: [
        {
          kind: 'number',
          id: 'age',
          text: { key: 'age', fallback: 'Age' },
          required: true,
          min: 0,
          max: 120,
        },
        {
          kind: 'select',
          id: 'reason',
          text: { key: 'reason', fallback: 'Reason' },
          options: [
            {
              id: 'other',
              text: { key: 'reason.other', fallback: 'Other' },
              weight: 0,
            },
          ],
        },
      ],
      edges: [{ to: 'done', when: { kind: 'always' } }],
    },
    done: { kind: 'terminal', outcome: 'submitted' },
  },
} as const

describe('parseSchema', () => {
  it('returns plain readonly domain data for a valid schema', () => {
    const result = parseSchema(validSchema)

    expect(result).toEqual({ ok: true, value: validSchema })
  })

  it('normalizes negative zero throughout numeric wire values', () => {
    const input = structuredClone(validSchema) as unknown as {
      nodes: {
        page: {
          questions: [{ min: number }, { options: [{ weight: number }] }]
        }
      }
    }
    input.nodes.page.questions[0].min = -0
    input.nodes.page.questions[1].options[0].weight = -0

    const result = parseSchema(input)

    expect(result.ok).toBe(true)
    if (result.ok) {
      const page = result.value.nodes[toNodeId('page')]
      expect(page?.kind).toBe('page')
      if (page?.kind === 'page') {
        expect(Object.is(page.questions[0]?.kind === 'number' && page.questions[0].min, -0)).toBe(
          false,
        )
      }
    }
  })

  it.each([
    ['unknown root field', { ...validSchema, extra: true }],
    [
      'unknown node kind',
      { ...validSchema, nodes: { ...validSchema.nodes, done: { kind: 'mystery' } } },
    ],
    [
      'unknown question field',
      {
        ...validSchema,
        nodes: {
          ...validSchema.nodes,
          page: {
            ...validSchema.nodes.page,
            questions: [{ ...validSchema.nodes.page.questions[0], extra: true }],
          },
        },
      },
    ],
    ['empty id', { ...validSchema, id: '' }],
    [
      'fractional numeric bound',
      {
        ...validSchema,
        nodes: {
          ...validSchema.nodes,
          page: {
            ...validSchema.nodes.page,
            questions: [{ ...validSchema.nodes.page.questions[0], min: 0.5 }],
          },
        },
      },
    ],
    [
      'unsafe numeric bound',
      {
        ...validSchema,
        nodes: {
          ...validSchema.nodes,
          page: {
            ...validSchema.nodes.page,
            questions: [
              { ...validSchema.nodes.page.questions[0], max: Number.MAX_SAFE_INTEGER + 1 },
            ],
          },
        },
      },
    ],
    [
      'negative maximum length',
      {
        ...validSchema,
        nodes: {
          ...validSchema.nodes,
          page: {
            ...validSchema.nodes.page,
            questions: [
              {
                kind: 'text',
                id: 'notes',
                text: { key: 'notes', fallback: 'Notes' },
                maxLength: -1,
              },
            ],
          },
        },
      },
    ],
  ])('fails closed for %s', (_label, input) => {
    const result = parseSchema(input)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0)
      expect(result.error[0]?.code).toBe('invalid-wire-value')
    }
  })
})
