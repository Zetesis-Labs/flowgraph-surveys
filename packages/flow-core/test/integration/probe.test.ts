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
})
