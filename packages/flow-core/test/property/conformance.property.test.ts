import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  apply,
  canonicalizeSchema,
  check,
  decide,
  hashSchema,
  initialState,
  progress,
  replay,
  toNodeId,
  toQuestionId,
  toSafeInt,
  type Event,
  type FlowSchema,
} from '../../src/index.js'
import { command, meta, simpleSchema } from '../support/builders.js'

describe('cross-story conformance properties', () => {
  it('keeps starts unique, terminal batches adjacent, metadata-equal, and logs sealed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
        fc.constantFrom('human', 'agent', 'import'),
        (at, source) => {
          const schema = simpleSchema()
          const start = decide(
            schema,
            initialState(schema),
            command('START', { schemaHash: hashSchema(schema), meta: meta(at, source) }),
          )
          if (!start.ok || !start.value[0]) return false
          const active = apply(initialState(schema), start.value[0])
          const next = decide(schema, active, command('NEXT', { meta: meta(at, source) }))
          if (!next.ok || next.value.length !== 2) return false
          const [advanced, finished] = next.value
          if (!advanced || !finished) return false
          const log: readonly Event[] = [...start.value, ...next.value]
          const restored = replay(schema, log)
          return (
            restored.ok &&
            log.filter(({ kind }) => kind === 'SESSION_STARTED').length === 1 &&
            advanced.kind === 'ADVANCED' &&
            finished.kind === 'SESSION_FINISHED' &&
            advanced.at === finished.at &&
            advanced.source === finished.source &&
            JSON.stringify(advanced.path) === JSON.stringify(finished.path) &&
            !replay(schema, [...log, finished]).ok
          )
        },
      ),
    )
  })

  it('ignores object insertion order for hashes but preserves array order', () => {
    const schema = simpleSchema()
    const done = schema.nodes[toNodeId('done')]
    const originalPage = schema.nodes[toNodeId('page')]
    const reordered = {
      nodes: { done, page: originalPage },
      entry: schema.entry,
      version: schema.version,
      id: schema.id,
    } as FlowSchema
    const page = schema.nodes[toNodeId('page')]
    if (page?.kind !== 'page') throw new Error('test setup failed')
    const orderedArrays = {
      ...schema,
      nodes: {
        ...schema.nodes,
        page: {
          ...page,
          questions: [
            {
              kind: 'text',
              id: toQuestionId('first'),
              text: { key: 'first', fallback: 'First' },
            },
            {
              kind: 'text',
              id: toQuestionId('second'),
              text: { key: 'second', fallback: 'Second' },
            },
          ],
        },
      },
    } as FlowSchema
    const orderedPage = orderedArrays.nodes[toNodeId('page')]
    if (orderedPage?.kind !== 'page') throw new Error('test setup failed')
    const reversed = {
      ...orderedArrays,
      nodes: {
        ...orderedArrays.nodes,
        page: { ...orderedPage, questions: [...orderedPage.questions].reverse() },
      },
    } as FlowSchema

    expect(canonicalizeSchema(reordered)).toBe(canonicalizeSchema(schema))
    expect(hashSchema(reordered)).toBe(hashSchema(schema))
    expect(hashSchema(reversed)).not.toBe(hashSchema(orderedArrays))
  })

  it('makes forward progress monotonic on checked DAGs', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (at) => {
        const schema = simpleSchema()
        if (check(schema).some(({ severity }) => severity === 'error')) return false
        const start = decide(
          schema,
          initialState(schema),
          command('START', {
            schemaHash: hashSchema(schema),
            meta: { at: toSafeInt(at), source: 'human', path: [] },
          }),
        )
        if (!start.ok || !start.value[0]) return false
        const active = apply(initialState(schema), start.value[0])
        const before = progress(schema, active).fraction
        const next = decide(schema, active, command('NEXT'))
        if (!next.ok) return false
        const after = progress(schema, next.value.reduce(apply, active)).fraction
        return after >= before
      }),
    )
  })
})
