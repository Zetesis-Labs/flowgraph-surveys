import corpus from '../fixtures/broken-schemas/corpus.json' with { type: 'json' }

import { describe, expect, it } from 'vitest'

import {
  check,
  toNodeId,
  toOptionId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type FlowSchema,
  type SchemaProblemCode,
} from '../../src/index.js'

describe('check', () => {
  it.each(
    corpus.cases.filter(
      ({ expected }) => !expected.startsWith('probe-') && expected !== 'semantic-dead-end',
    ),
  )('detects $id as $expected', ({ schema, expected }) => {
    const problems = check(schema as unknown as FlowSchema)
    expect(problems.map(({ code }) => code)).toContain(expected as SchemaProblemCode)
    expect(
      problems.filter(({ severity }) => severity === 'error').every(({ suggestion }) => suggestion),
    ).toBe(true)
  })

  it('detects self-loops and multi-node cycles with actionable cycle locations', () => {
    for (const id of ['self-loop', 'multi-node-cycle']) {
      const fixture = corpus.cases.find((candidate) => candidate.id === id)
      if (!fixture) throw new Error('missing fixture')
      const cycle = check(fixture.schema as unknown as FlowSchema).find(
        ({ code }) => code === 'cycle-detected',
      )
      expect(cycle?.where).toHaveProperty('node')
      expect(cycle?.details?.cycle).toBeDefined()
    }
  })

  it('returns all diagnostics in stable order with structured locations', () => {
    const fixture = corpus.cases.find(({ id }) => id === 'duplicate-edge-target')
    if (!fixture) throw new Error('missing fixture')
    const first = check(fixture.schema as unknown as FlowSchema)
    const second = check(fixture.schema as unknown as FlowSchema)
    expect(second).toEqual(first)
    expect(first.every(({ where }) => Object.keys(where).length > 0)).toBe(true)
  })

  it('walks nested guards, numeric references, ancestors, empty macros, and overflow risks', () => {
    const schema = {
      id: toSchemaId('deep-check'),
      version: toSchemaVersion('1'),
      entry: toNodeId('root'),
      nodes: {
        root: {
          kind: 'page',
          questions: [
            {
              kind: 'number',
              id: toQuestionId('ancestor-number'),
              text: { key: 'n', fallback: 'N' },
            },
            {
              kind: 'select',
              id: toQuestionId('weighted'),
              text: { key: 'w', fallback: 'W' },
              multiple: true,
              options: [
                {
                  id: toOptionId('a'),
                  text: { key: 'a', fallback: 'A' },
                  weight: toSafeInt(Number.MAX_SAFE_INTEGER),
                },
                {
                  id: toOptionId('b'),
                  text: { key: 'b', fallback: 'B' },
                  weight: toSafeInt(Number.MAX_SAFE_INTEGER),
                },
                {
                  id: toOptionId('c'),
                  text: { key: 'c', fallback: 'C' },
                  weight: toSafeInt(Number.MIN_SAFE_INTEGER),
                },
                {
                  id: toOptionId('d'),
                  text: { key: 'd', fallback: 'D' },
                  weight: toSafeInt(Number.MIN_SAFE_INTEGER),
                },
              ],
            },
          ],
          edges: [
            { to: toNodeId('child'), when: { kind: 'always' } },
            { to: toNodeId('sibling'), when: { kind: 'always' } },
          ],
        },
        child: {
          kind: 'page',
          questions: [
            {
              kind: 'text',
              id: toQuestionId('child-text'),
              text: { key: 't', fallback: 'T' },
              maxLength: toSafeInt(-1),
              visibleWhen: { kind: 'answered', q: toQuestionId('ancestor-number') },
            },
            {
              kind: 'text',
              id: toQuestionId('empty-all'),
              text: { key: 'empty', fallback: 'Empty' },
              visibleWhen: { kind: 'all', values: [] },
            },
          ],
          edges: [
            {
              to: toNodeId('done'),
              when: {
                kind: 'not',
                value: {
                  kind: 'all',
                  values: [
                    { kind: 'any', values: [] },
                    {
                      kind: 'cmp',
                      op: 'gt',
                      left: { kind: 'answer', q: toQuestionId('ancestor-number') },
                      right: { kind: 'num', value: toSafeInt(0) },
                    },
                  ],
                },
              },
            },
            {
              to: toNodeId('done-2'),
              when: { kind: 'answered', q: toQuestionId('sibling-question') },
            },
          ],
        },
        sibling: {
          kind: 'page',
          questions: [
            {
              kind: 'text',
              id: toQuestionId('sibling-question'),
              text: { key: 's', fallback: 'S' },
            },
          ],
          edges: [
            { to: toNodeId('sibling'), when: { kind: 'any', values: [] } },
            { to: toNodeId('done'), when: { kind: 'always' } },
          ],
        },
        done: { kind: 'terminal', outcome: toOutcomeId('done') },
        'done-2': { kind: 'terminal', outcome: toOutcomeId('done-2') },
      },
    } as unknown as FlowSchema

    const codes = check(schema).map(({ code }) => code)
    expect(codes).toContain('weight-overflow-risk')
    expect(codes).toContain('invalid-constraint')
    expect(codes).toContain('empty-any')
    expect(codes).toContain('empty-all')
    expect(codes).toContain('invalid-expression-reference')
    expect(codes).not.toContain('ill-founded-visibility')
  })
})
