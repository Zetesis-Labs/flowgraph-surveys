import corpus from '../fixtures/broken-schemas/corpus.json' with { type: 'json' }

import { describe, expect, it } from 'vitest'

import {
  probe,
  toNodeId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type FlowSchema,
} from '../../src/index.js'
import { phq2Schema } from '../fixtures/phq2/journeys.js'
import { attachmentSchema } from '../support/builders.js'

const fixture = (id: string): FlowSchema => {
  const found = corpus.cases.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`missing fixture ${id}`)
  return found.schema as unknown as FlowSchema
}

describe('probe', () => {
  it('finds deterministic validation-aware dead-end witnesses', () => {
    const first = probe(fixture('semantic-dead-end'))
    const second = probe(fixture('semantic-dead-end'))
    expect(second).toEqual(first)
    expect(first.complete).toBe(true)
    expect(first.pages[0]).toMatchObject({
      node: 'page',
      candidateSpace: '3',
      explored: 3,
      truncated: false,
      deadEndsFound: 2,
    })
    expect(first.pages[0]?.witnesses).toHaveLength(2)
    expect(first.problems.map(({ code }) => code)).toContain('semantic-dead-end')
  })

  it('caps exploration at 4096, retains 16 witnesses, and never claims completeness', () => {
    const report = probe(fixture('probe-budget'))
    expect(report.complete).toBe(false)
    expect(report.pages[0]).toMatchObject({
      candidateSpace: '8193',
      explored: 4096,
      truncated: true,
    })
    expect(report.pages[0]?.witnesses.length).toBeLessThanOrEqual(16)
    expect(report.problems.map(({ code }) => code)).toContain('probe-budget-exceeded')
  })

  it('does not explore or claim completeness when structural errors exist', () => {
    const report = probe(fixture('self-loop'))
    expect(report.complete).toBe(false)
    expect(report.pages).toEqual([])
    expect(report.problems.map(({ code }) => code)).toContain('cycle-detected')
  })

  it('samples numeric thresholds and text on a reachable child conditional page', () => {
    const schema = {
      id: toSchemaId('probe-domains'),
      version: toSchemaVersion('1'),
      entry: toNodeId('root'),
      nodes: {
        root: {
          kind: 'page',
          questions: [],
          edges: [
            { to: toNodeId('unused'), when: { kind: 'any', values: [] } },
            { to: toNodeId('child'), when: { kind: 'always' } },
          ],
        },
        child: {
          kind: 'page',
          questions: [
            {
              kind: 'number',
              id: toQuestionId('n'),
              text: { key: 'n', fallback: 'N' },
              min: toSafeInt(0),
              max: toSafeInt(10),
            },
            {
              kind: 'text',
              id: toQuestionId('t'),
              text: { key: 't', fallback: 'T' },
            },
          ],
          edges: [
            {
              to: toNodeId('high'),
              when: {
                kind: 'all',
                values: [
                  { kind: 'answered', q: toQuestionId('t') },
                  {
                    kind: 'cmp',
                    op: 'gte',
                    left: { kind: 'answer', q: toQuestionId('n') },
                    right: {
                      kind: 'sum',
                      values: [{ kind: 'num', value: toSafeInt(5) }],
                    },
                  },
                ],
              },
            },
            {
              to: toNodeId('low'),
              when: {
                kind: 'not',
                value: {
                  kind: 'any',
                  values: [
                    {
                      kind: 'cmp',
                      op: 'gte',
                      left: { kind: 'answer', q: toQuestionId('n') },
                      right: { kind: 'num', value: toSafeInt(5) },
                    },
                  ],
                },
              },
            },
            { to: toNodeId('fallback'), when: { kind: 'always' } },
          ],
        },
        unused: {
          kind: 'page',
          questions: [],
          edges: [{ to: toNodeId('unused-done'), when: { kind: 'always' } }],
        },
        'unused-done': { kind: 'terminal', outcome: toOutcomeId('unused') },
        high: { kind: 'terminal', outcome: toOutcomeId('high') },
        low: { kind: 'terminal', outcome: toOutcomeId('low') },
        fallback: { kind: 'terminal', outcome: toOutcomeId('fallback') },
      },
    } as FlowSchema

    const report = probe(schema)
    expect(report.complete).toBe(true)
    const child = report.pages.find(({ node }) => node === 'child')
    expect(child).toMatchObject({
      node: 'child',
      numericSampling: true,
      truncated: false,
    })
    expect(Number(child?.candidateSpace)).toBeGreaterThan(2)
  })

  it('samples required answers from earlier pages when a child route depends on them', () => {
    const schema = {
      id: toSchemaId('probe-prior-answers'),
      version: toSchemaVersion('1'),
      entry: toNodeId('context'),
      nodes: {
        context: {
          kind: 'page',
          questions: [
            {
              kind: 'select',
              id: toQuestionId('category'),
              text: { key: 'category', fallback: 'Category' },
              required: true,
              options: [
                { id: 'upper', text: { key: 'upper', fallback: 'Upper' } },
                { id: 'lower', text: { key: 'lower', fallback: 'Lower' } },
              ],
            },
          ],
          edges: [{ to: toNodeId('fit'), when: { kind: 'always' } }],
        },
        fit: {
          kind: 'page',
          questions: [],
          edges: [
            {
              to: toNodeId('upper-done'),
              when: { kind: 'selected', q: toQuestionId('category'), option: 'upper' },
            },
            {
              to: toNodeId('lower-done'),
              when: { kind: 'selected', q: toQuestionId('category'), option: 'lower' },
            },
          ],
        },
        'upper-done': { kind: 'terminal', outcome: toOutcomeId('upper') },
        'lower-done': { kind: 'terminal', outcome: toOutcomeId('lower') },
      },
    } as FlowSchema

    const report = probe(schema)
    expect(report.problems.filter(({ severity }) => severity === 'error')).toEqual([])
    expect(report.pages.find(({ node }) => node === 'fit')).toMatchObject({
      candidateSpace: '2',
      explored: 2,
      deadEndsFound: 0,
    })
  })

  it('uses safe default samples for an unconstrained number with no thresholds', () => {
    const schema = {
      id: toSchemaId('probe-default-number'),
      version: toSchemaVersion('1'),
      entry: toNodeId('page'),
      nodes: {
        page: {
          kind: 'page',
          questions: [
            {
              kind: 'number',
              id: toQuestionId('n'),
              text: { key: 'n', fallback: 'N' },
            },
          ],
          edges: [
            {
              to: toNodeId('answered'),
              when: { kind: 'answered', q: toQuestionId('n') },
            },
            { to: toNodeId('fallback'), when: { kind: 'always' } },
          ],
        },
        answered: { kind: 'terminal', outcome: toOutcomeId('answered') },
        fallback: { kind: 'terminal', outcome: toOutcomeId('fallback') },
      },
    } as FlowSchema

    expect(probe(schema).pages[0]).toMatchObject({
      candidateSpace: '2',
      deadEndsFound: 0,
      numericSampling: true,
    })
    expect(probe(phq2Schema).pages[0]?.deadEndsFound).toBe(0)
  })

  it('uses safe defaults for an optional unconstrained attachment domain', () => {
    const base = attachmentSchema()
    const page = base.nodes[toNodeId('page')]
    if (page?.kind !== 'page') throw new Error('attachment fixture missing')
    const question = page.questions[0]
    if (question?.kind !== 'attachment') throw new Error('attachment question missing')
    const schema = {
      ...base,
      nodes: {
        ...base.nodes,
        [toNodeId('page')]: {
          ...page,
          questions: [
            {
              kind: 'attachment',
              id: question.id,
              text: question.text,
            },
          ],
          edges: [
            {
              to: toNodeId('done'),
              when: { kind: 'answered', q: question.id },
            },
            { to: toNodeId('empty-done'), when: { kind: 'always' } },
          ],
        },
        [toNodeId('empty-done')]: {
          kind: 'terminal',
          outcome: toOutcomeId('empty'),
        },
      },
    } as FlowSchema

    expect(probe(schema).pages[0]).toMatchObject({
      candidateSpace: '2',
      explored: 2,
      deadEndsFound: 0,
    })

    const requiredSchema = {
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
              required: true,
            },
          ],
        },
      },
    } as FlowSchema
    expect(probe(requiredSchema).problems.filter(({ severity }) => severity === 'error')).toEqual(
      [],
    )
  })

  it('samples one valid metadata-only attachment answer', () => {
    const schema = attachmentSchema()
    const page = schema.nodes[toNodeId('page')]
    if (page?.kind !== 'page') throw new Error('test setup failed')
    const conditional = {
      ...schema,
      nodes: {
        ...schema.nodes,
        page: {
          ...page,
          edges: [
            {
              to: toNodeId('done'),
              when: { kind: 'answered', q: toQuestionId('photos') },
            },
          ],
        },
      },
    } as FlowSchema
    expect(probe(conditional).pages[0]).toMatchObject({
      candidateSpace: '2',
      explored: 2,
      deadEndsFound: 0,
    })
  })
})
