import { describe, expect, it } from 'vitest'

import {
  check,
  decide,
  hashSchema,
  initialState,
  probe,
  replay,
  toNodeId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type Event,
  type FlowSchema,
  type Node,
} from '../../src/index.js'
import corpus from '../fixtures/broken-schemas/corpus.json' with { type: 'json' }
import { command } from '../support/builders.js'

const chainSchema = (size: number): FlowSchema => {
  const entries: [string, Node][] = Array.from({ length: size - 1 }, (_, index) => [
    `n${String(index)}`,
    {
      kind: 'page',
      questions: [],
      edges: [
        {
          to: toNodeId(index === size - 2 ? 'done' : `n${String(index + 1)}`),
          when: { kind: 'always' },
        },
      ],
    },
  ])
  entries.push(['done', { kind: 'terminal', outcome: toOutcomeId('done') }])
  return {
    id: toSchemaId(`chain-${String(size)}`),
    version: toSchemaVersion('1'),
    entry: toNodeId('n0'),
    nodes: Object.fromEntries(entries),
  }
}

describe('scale assumptions', () => {
  it('checks a 500-node DAG and replays a 1000-event log deterministically', () => {
    const graph = chainSchema(500)
    expect(check(graph).filter(({ severity }) => severity === 'error')).toEqual([])

    const answerSchema: FlowSchema = {
      id: toSchemaId('events-1000'),
      version: toSchemaVersion('1'),
      entry: toNodeId('page'),
      nodes: {
        page: {
          kind: 'page',
          questions: [{ kind: 'text', id: toQuestionId('q'), text: { key: 'q', fallback: 'Q' } }],
          edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
        },
        done: { kind: 'terminal', outcome: toOutcomeId('done') },
      } as FlowSchema['nodes'],
    }
    const start = decide(
      answerSchema,
      initialState(answerSchema),
      command('START', { schemaHash: hashSchema(answerSchema) }),
    )
    if (!start.ok || !start.value[0]) throw new Error('test setup failed')
    const answers: readonly Event[] = Array.from({ length: 999 }, (_, index) => ({
      v: 1,
      kind: 'ANSWERED',
      at: toSafeInt(1),
      source: 'import',
      path: [],
      q: toQuestionId('q'),
      value: String(index),
    }))
    expect(replay(answerSchema, [...start.value, ...answers])).toMatchObject({
      ok: true,
      value: { answers: { q: '998' } },
    })
  })

  it('keeps the probe budget hard-capped under combinatorial pressure', () => {
    const budget = corpus.cases.find(({ id }) => id === 'probe-budget')
    if (!budget) throw new Error('missing fixture')
    const report = probe(budget.schema as unknown as FlowSchema)
    expect(report.pages[0]?.explored).toBe(4096)
    expect(report.complete).toBe(false)
  })
})
