import { describe, expect, it } from 'vitest'

import {
  check,
  checkPack,
  compileComposition,
  namespaceNodeId,
  namespaceOptionId,
  namespaceOutcomeId,
  namespaceQuestionId,
  parseSchema,
  probe,
  runGoldens,
  toNodeId,
  toOptionId,
  toOutcomeId,
  toPackId,
  toPackInstanceId,
  toPackPortId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type FlowComposition,
  type FlowPack,
  type GoldenSuiteV1,
  type NodeId,
} from '../../src/index.js'
import {
  configurablePack,
  decisionPack,
  donePort,
  noPort,
  startPort,
  terminalPack,
  validComposition,
  yesPort,
} from '../support/packs.js'

const compile = (composition = validComposition()) => {
  const result = compileComposition(composition)
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error('expected composition to compile')
  return result.value
}

const item = <Value>(values: readonly Value[], index: number): Value => {
  const value = values[index]
  if (value === undefined) throw new Error(`missing fixture item ${String(index)}`)
  return value
}

describe('schema pack composition', () => {
  it('validates a one-entry multi-page pack independently', () => {
    expect(checkPack(decisionPack())).toEqual([])
    expect(checkPack(terminalPack())).toEqual([])
  })

  it('keeps synthetic validation identities collision-free', () => {
    const collisionPack: FlowPack = {
      id: toPackId('synthetic-collisions'),
      version: toSchemaVersion('1.0.0'),
      entry: startPort,
      entries: [{ id: startPort, node: toNodeId('__flowgraph_pack_entry_0') }],
      nodes: {
        __flowgraph_pack_entry_0: {
          kind: 'page',
          questions: [],
          edges: [
            {
              to: toNodeId('__flowgraph_pack_outlet_0_0'),
              when: { kind: 'always' },
            },
          ],
        },
        __flowgraph_pack_outlet_0_0: {
          kind: 'page',
          questions: [],
          edges: [],
        },
      } as Readonly<Record<NodeId, FlowPack['nodes'][NodeId]>>,
      outlets: [
        {
          id: donePort,
          from: toNodeId('__flowgraph_pack_outlet_0_0'),
          when: { kind: 'always' },
        },
      ],
    }
    expect(checkPack(collisionPack)).toEqual([])
  })

  it('reports duplicate, missing, and invalid pack ports plus internal schema errors', () => {
    const base = decisionPack()
    const invalid: FlowPack = {
      ...base,
      entry: toPackPortId('missing-default'),
      entries: [
        ...base.entries,
        { id: startPort, node: toNodeId('missing-node') },
        { id: toPackPortId('terminal-entry'), node: toNodeId('exceptional') },
      ],
      outlets: [
        ...base.outlets,
        {
          id: startPort,
          from: toNodeId('exceptional'),
          when: { kind: 'always' },
        },
      ],
      nodes: {
        ...base.nodes,
        [toNodeId('accepted')]: {
          kind: 'page',
          questions: [],
          edges: [{ to: toNodeId('missing-target'), when: { kind: 'always' } }],
        },
      },
    }
    const codes = checkPack(invalid).map(({ code }) => code)
    expect(codes).toContain('duplicate-port')
    expect(codes).toContain('missing-default-entry')
    expect(codes).toContain('unknown-entry-node')
    expect(codes).toContain('outlet-not-page')
    expect(codes).toContain('invalid-pack-schema')

    expect(
      checkPack({
        ...base,
        entries: [],
      }),
    ).toEqual([
      expect.objectContaining({
        code: 'missing-default-entry',
      }),
    ])
  })

  it('compiles to one ordinary schema and rewrites every identity and reference kind', () => {
    const schema = compile()
    expect(Object.keys(schema)).toEqual(['id', 'version', 'entry', 'nodes'])
    expect(parseSchema(JSON.parse(JSON.stringify(schema)))).toEqual({ ok: true, value: schema })
    expect(check(schema).filter(({ severity }) => severity === 'error')).toEqual([])
    expect(probe(schema).pages.every(({ deadEndsFound }) => deadEndsFound === 0)).toBe(true)

    const instance = toPackInstanceId('decision')
    const start = schema.nodes[namespaceNodeId(instance, toNodeId('start'))]
    expect(start?.kind).toBe('page')
    if (start?.kind !== 'page') return
    expect(start.questions.map(({ id }) => id)).toEqual([
      namespaceQuestionId(instance, toQuestionId('name')),
      namespaceQuestionId(instance, toQuestionId('age')),
      namespaceQuestionId(instance, toQuestionId('choice')),
      namespaceQuestionId(instance, toQuestionId('files')),
    ])
    const choice = start.questions[2]
    expect(choice?.kind).toBe('select')
    if (choice?.kind === 'select') {
      expect(choice.options.map(({ id }) => id)).toEqual([
        namespaceOptionId(instance, toOptionId('yes')),
        namespaceOptionId(instance, toOptionId('no')),
      ])
    }
    const serializedGuard = JSON.stringify(start.edges[0]?.when)
    expect(serializedGuard).toContain(namespaceQuestionId(instance, toQuestionId('age')))
    expect(serializedGuard).toContain(namespaceQuestionId(instance, toQuestionId('choice')))
    expect(serializedGuard).toContain(namespaceOptionId(instance, toOptionId('yes')))

    const accepted = schema.nodes[namespaceNodeId(instance, toNodeId('accepted'))]
    expect(accepted?.kind).toBe('page')
    if (accepted?.kind === 'page') {
      expect(accepted.edges).toHaveLength(2)
      expect(accepted.edges[0]?.to).toBe(namespaceNodeId(instance, toNodeId('exceptional')))
      expect(accepted.edges[1]?.to).toBe(
        namespaceNodeId(toPackInstanceId('terminal'), toNodeId('finish')),
      )
    }
    const exceptional = schema.nodes[namespaceNodeId(instance, toNodeId('exceptional'))]
    expect(exceptional).toEqual({
      kind: 'terminal',
      outcome: namespaceOutcomeId(instance, toOutcomeId('exceptional')),
    })
    expect(JSON.stringify(schema)).not.toMatch(/"pack"|"instances"|"connections"|"outlets"/u)
  })

  it('uses an injective namespace even when ids contain separators', () => {
    expect(namespaceNodeId(toPackInstanceId('a'), toNodeId('b:c'))).not.toBe(
      namespaceNodeId(toPackInstanceId('a:b'), toNodeId('c')),
    )
    expect(namespaceQuestionId(toPackInstanceId('x'), toQuestionId('y'))).not.toBe(
      namespaceOptionId(toPackInstanceId('x'), toOptionId('y')),
    )
  })

  it('executes compiled output through ordinary goldens with full edge coverage', () => {
    const schema = compile()
    const instance = toPackInstanceId('decision')
    const name = namespaceQuestionId(instance, toQuestionId('name'))
    const age = namespaceQuestionId(instance, toQuestionId('age'))
    const choice = namespaceQuestionId(instance, toQuestionId('choice'))
    const option = (id: 'yes' | 'no') => namespaceOptionId(instance, toOptionId(id))
    const commands = (years: number, selected: 'yes' | 'no') =>
      [
        { kind: 'START' as const },
        { kind: 'ANSWER' as const, q: name, value: 'Ada' },
        { kind: 'ANSWER' as const, q: age, value: toSafeInt(years) },
        { kind: 'ANSWER' as const, q: choice, value: [option(selected)] },
        { kind: 'NEXT' as const },
        { kind: 'NEXT' as const },
        ...(years > 100 && selected === 'yes' ? [] : [{ kind: 'NEXT' as const }]),
      ] as const
    const suite: GoldenSuiteV1 = {
      formatVersion: 1,
      schema: { id: schema.id, version: schema.version },
      cases: [
        {
          id: 'accepted',
          commands: commands(30, 'yes'),
          expect: {
            outcome: namespaceOutcomeId(toPackInstanceId('terminal'), toOutcomeId('submitted')),
          },
        },
        {
          id: 'exceptional',
          commands: commands(110, 'yes'),
          expect: { outcome: namespaceOutcomeId(instance, toOutcomeId('exceptional')) },
        },
        {
          id: 'declined',
          commands: commands(30, 'no'),
          expect: {
            outcome: namespaceOutcomeId(toPackInstanceId('terminal'), toOutcomeId('submitted')),
          },
        },
      ],
    }
    const report = runGoldens(schema, suite)
    expect(report.ok).toBe(true)
    if (report.ok) {
      expect(report.value.cases.every(({ passed }) => passed)).toBe(true)
      expect(report.value.coverage.covered).toBe(report.value.coverage.total)
    }
  })

  it('preserves concrete factory configuration across repeated pack instances', () => {
    const first = configurablePack({ label: 'First', maxLength: 10 })
    const second = configurablePack({ label: 'Second', maxLength: 20 })
    const composition: FlowComposition = {
      ...validComposition(),
      instances: [
        { id: toPackInstanceId('first'), pack: first },
        { id: toPackInstanceId('second'), pack: second },
        { id: toPackInstanceId('terminal'), pack: terminalPack() },
      ],
      entry: { instance: toPackInstanceId('first'), entry: startPort },
      connections: [
        ...[yesPort, noPort].map((outlet) => ({
          from: { instance: toPackInstanceId('first'), outlet },
          to: { instance: toPackInstanceId('second'), entry: startPort },
        })),
        ...[yesPort, noPort].map((outlet) => ({
          from: { instance: toPackInstanceId('second'), outlet },
          to: { instance: toPackInstanceId('terminal'), entry: startPort },
        })),
      ],
    }
    const schema = compile(composition)
    const firstPage = schema.nodes[namespaceNodeId(toPackInstanceId('first'), toNodeId('start'))]
    const secondPage = schema.nodes[namespaceNodeId(toPackInstanceId('second'), toNodeId('start'))]
    expect(firstPage?.kind === 'page' && firstPage.title?.fallback).toBe('First')
    expect(secondPage?.kind === 'page' && secondPage.title?.fallback).toBe('Second')
    expect(
      firstPage?.kind === 'page' &&
        firstPage.questions[0]?.kind === 'text' &&
        firstPage.questions[0].maxLength,
    ).toBe(10)
    expect(
      secondPage?.kind === 'page' &&
        secondPage.questions[0]?.kind === 'text' &&
        secondPage.questions[0].maxLength,
    ).toBe(20)
  })

  it('instantiates the same concrete pack 100 times without identity collisions', () => {
    const reusable: FlowPack = {
      id: toPackId('reusable'),
      version: toSchemaVersion('1.0.0'),
      entry: startPort,
      entries: [{ id: startPort, node: toNodeId('page') }],
      nodes: {
        page: { kind: 'page', questions: [], edges: [] },
      } as Readonly<Record<NodeId, FlowPack['nodes'][NodeId]>>,
      outlets: [{ id: donePort, from: toNodeId('page'), when: { kind: 'always' }, required: true }],
    }
    const ids = Array.from({ length: 100 }, (_, index) =>
      toPackInstanceId(`instance-${String(index)}`),
    )
    const composition: FlowComposition = {
      id: toSchemaId('one-hundred'),
      version: toSchemaVersion('1.0.0'),
      entry: { instance: item(ids, 0), entry: startPort },
      instances: [
        ...ids.map((id) => ({ id, pack: reusable })),
        { id: toPackInstanceId('terminal'), pack: terminalPack() },
      ],
      connections: ids.map((id, index) => ({
        from: { instance: id, outlet: donePort },
        to:
          index === ids.length - 1
            ? { instance: toPackInstanceId('terminal'), entry: startPort }
            : { instance: item(ids, index + 1), entry: startPort },
      })),
    }
    const schema = compile(composition)
    const keys = Object.keys(schema.nodes)
    expect(keys).toHaveLength(102)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('compiles 20 packs and 500 private nodes in under one second', () => {
    const nodeCount = 25
    const nodes = Object.fromEntries(
      Array.from({ length: nodeCount }, (_, index) => [
        toNodeId(`page-${String(index)}`),
        {
          kind: 'page' as const,
          questions: [],
          edges:
            index === nodeCount - 1
              ? []
              : [
                  {
                    to: toNodeId(`page-${String(index + 1)}`),
                    when: { kind: 'always' as const },
                  },
                ],
        },
      ]),
    ) as Readonly<Record<NodeId, FlowPack['nodes'][NodeId]>>
    const largePack: FlowPack = {
      id: toPackId('large'),
      version: toSchemaVersion('1.0.0'),
      entry: startPort,
      entries: [{ id: startPort, node: toNodeId('page-0') }],
      nodes,
      outlets: [
        {
          id: donePort,
          from: toNodeId(`page-${String(nodeCount - 1)}`),
          when: { kind: 'always' },
          required: true,
        },
      ],
    }
    const ids = Array.from({ length: 20 }, (_, index) => toPackInstanceId(`large-${String(index)}`))
    const composition: FlowComposition = {
      id: toSchemaId('large-composition'),
      version: toSchemaVersion('1.0.0'),
      entry: { instance: item(ids, 0), entry: startPort },
      instances: [
        ...ids.map((id) => ({ id, pack: largePack })),
        { id: toPackInstanceId('terminal'), pack: terminalPack() },
      ],
      connections: ids.map((id, index) => ({
        from: { instance: id, outlet: donePort },
        to:
          index === ids.length - 1
            ? { instance: toPackInstanceId('terminal'), entry: startPort }
            : { instance: item(ids, index + 1), entry: startPort },
      })),
    }
    const started = process.hrtime.bigint()
    const schema = compile(composition)
    const elapsed = process.hrtime.bigint() - started
    expect(Object.keys(schema.nodes)).toHaveLength(502)
    expect(elapsed).toBeLessThan(1_000_000_000n)
  })

  it.each([
    [
      'duplicate-instance',
      () => {
        const base = validComposition()
        return { ...base, instances: [...base.instances, item(base.instances, 0)] }
      },
    ],
    [
      'unknown-entry-instance',
      () => ({
        ...validComposition(),
        entry: { instance: toPackInstanceId('missing'), entry: startPort },
      }),
    ],
    [
      'unknown-entry-port',
      () => ({
        ...validComposition(),
        entry: {
          instance: toPackInstanceId('decision'),
          entry: toPackPortId('missing'),
        },
      }),
    ],
    [
      'unknown-source-instance',
      () => {
        const base = validComposition()
        return {
          ...base,
          connections: [
            {
              ...item(base.connections, 0),
              from: {
                ...item(base.connections, 0).from,
                instance: toPackInstanceId('missing'),
              },
            },
            item(base.connections, 1),
          ],
        }
      },
    ],
    [
      'unknown-outlet',
      () => {
        const base = validComposition()
        return {
          ...base,
          connections: [
            {
              ...item(base.connections, 0),
              from: { ...item(base.connections, 0).from, outlet: toPackPortId('missing') },
            },
            item(base.connections, 1),
          ],
        }
      },
    ],
    [
      'unknown-target-instance',
      () => {
        const base = validComposition()
        return {
          ...base,
          connections: [
            {
              ...item(base.connections, 0),
              to: {
                ...item(base.connections, 0).to,
                instance: toPackInstanceId('missing'),
              },
            },
            item(base.connections, 1),
          ],
        }
      },
    ],
    [
      'unknown-target-entry',
      () => {
        const base = validComposition()
        return {
          ...base,
          connections: [
            {
              ...item(base.connections, 0),
              to: { ...item(base.connections, 0).to, entry: toPackPortId('missing') },
            },
            item(base.connections, 1),
          ],
        }
      },
    ],
    [
      'duplicate-outlet-binding',
      () => {
        const base = validComposition()
        return { ...base, connections: [...base.connections, item(base.connections, 0)] }
      },
    ],
    [
      'unconnected-outlet',
      () => ({ ...validComposition(), connections: validComposition().connections.slice(0, 1) }),
    ],
    [
      'invalid-pack',
      () => {
        const base = validComposition()
        const first = item(base.instances, 0)
        return {
          ...base,
          instances: [{ ...first, pack: { ...first.pack, entries: [] } }, item(base.instances, 1)],
        }
      },
    ],
  ] as const)('fails closed with %s', (code, create) => {
    const result = compileComposition(create())
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.map(({ code: actual }) => actual)).toContain(code)
  })

  it('rejects an invalid final schema and never returns partial output', () => {
    const incomplete: FlowPack = {
      id: toPackId('incomplete'),
      version: toSchemaVersion('1.0.0'),
      entry: startPort,
      entries: [{ id: startPort, node: toNodeId('page') }],
      nodes: {
        page: { kind: 'page', questions: [], edges: [] },
      } as Readonly<Record<NodeId, FlowPack['nodes'][NodeId]>>,
      outlets: [
        {
          id: donePort,
          from: toNodeId('page'),
          when: { kind: 'always' },
        },
      ],
    }
    const result = compileComposition({
      id: toSchemaId('invalid-final'),
      version: toSchemaVersion('1.0.0'),
      entry: { instance: toPackInstanceId('only'), entry: startPort },
      instances: [{ id: toPackInstanceId('only'), pack: incomplete }],
      connections: [],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual([
        expect.objectContaining({
          code: 'invalid-composed-schema',
          details: { schemaCode: 'no-terminal-reachable' },
        }),
      ])
    }
  })
})
