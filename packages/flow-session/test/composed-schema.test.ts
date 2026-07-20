import {
  compileComposition,
  hashSchema,
  namespaceOutcomeId,
  replay,
  toNodeId,
  toOutcomeId,
  toPackId,
  toPackInstanceId,
  toPackPortId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type Command,
  type Event,
  type FlowComposition,
  type FlowPack,
  type FlowSchema,
} from '@flowgraph/core'
import { describe, expect, it } from 'vitest'

import { createSession } from '../src/index.js'

const startPort = toPackPortId('start')
const donePort = toPackPortId('done')
const reportInstance = toPackInstanceId('report')
const terminalInstance = toPackInstanceId('terminal')

const reportPack = (): FlowPack => {
  const page = toNodeId('page')
  return {
    id: toPackId('report'),
    version: toSchemaVersion('1.0.0'),
    entry: startPort,
    entries: [{ id: startPort, node: page }],
    nodes: {
      [page]: { kind: 'page', questions: [], edges: [] },
    },
    outlets: [{ id: donePort, from: page, when: { kind: 'always' }, required: true }],
  }
}

const terminalPack = (): FlowPack => {
  const page = toNodeId('page')
  const terminal = toNodeId('terminal')
  return {
    id: toPackId('terminal'),
    version: toSchemaVersion('1.0.0'),
    entry: startPort,
    entries: [{ id: startPort, node: page }],
    nodes: {
      [page]: {
        kind: 'page',
        questions: [],
        edges: [{ to: terminal, when: { kind: 'always' } }],
      },
      [terminal]: { kind: 'terminal', outcome: toOutcomeId('submitted') },
    },
    outlets: [],
  }
}

const compiledSchema = (): FlowSchema => {
  const composition: FlowComposition = {
    id: toSchemaId('composed-session'),
    version: toSchemaVersion('1.0.0'),
    entry: { instance: reportInstance, entry: startPort },
    instances: [
      { id: reportInstance, pack: reportPack() },
      { id: terminalInstance, pack: terminalPack() },
    ],
    connections: [
      {
        from: { instance: reportInstance, outlet: donePort },
        to: { instance: terminalInstance, entry: startPort },
      },
    ],
  }
  const compiled = compileComposition(composition)
  if (!compiled.ok) throw new Error('expected valid composed schema')
  return compiled.value
}

const command = (schema: FlowSchema, kind: 'START' | 'NEXT'): Command => {
  const meta = { at: toSafeInt(1), source: 'human' as const, path: [] }
  return kind === 'START' ? { kind, meta, schemaHash: hashSchema(schema) } : { kind, meta }
}

describe('composed schema compatibility', () => {
  it('runs through the ordinary session and restores exactly through replay', () => {
    const schema = compiledSchema()
    const created = createSession(schema)
    if (!created.ok) throw new Error('expected session creation')

    expect(created.value.dispatch(command(schema, 'START')).ok).toBe(true)
    expect(created.value.dispatch(command(schema, 'NEXT')).ok).toBe(true)
    expect(created.value.dispatch(command(schema, 'NEXT')).ok).toBe(true)
    expect(created.value.getSnapshot()).toMatchObject({
      status: 'finished',
      outcome: namespaceOutcomeId(terminalInstance, toOutcomeId('submitted')),
    })

    const transported = JSON.parse(JSON.stringify(created.value.getEvents())) as readonly Event[]
    const replayed = replay(schema, transported)
    const restored = createSession(schema, transported)
    expect(replayed).toEqual({ ok: true, value: created.value.getSnapshot() })
    expect(restored.ok && restored.value.getSnapshot()).toEqual(created.value.getSnapshot())
  })
})
