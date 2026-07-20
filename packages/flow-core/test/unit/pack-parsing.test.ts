import { describe, expect, it } from 'vitest'

import { parseComposition, parsePack } from '../../src/index.js'
import { decisionPack, validComposition } from '../support/packs.js'

describe('pack wire parsing', () => {
  it('round-trips strict concrete packs and compositions as plain JSON', () => {
    const pack = decisionPack()
    const composition = validComposition()
    expect(parsePack(JSON.parse(JSON.stringify(pack)))).toEqual({ ok: true, value: pack })
    expect(parseComposition(JSON.parse(JSON.stringify(composition)))).toEqual({
      ok: true,
      value: composition,
    })
  })

  it.each([
    ['unknown pack field', { ...decisionPack(), extra: true }, parsePack],
    ['empty pack id', { ...decisionPack(), id: '' }, parsePack],
    [
      'malformed outlet guard',
      {
        ...decisionPack(),
        outlets: [{ ...decisionPack().outlets[0], when: { kind: 'mystery' } }],
      },
      parsePack,
    ],
    ['unknown composition field', { ...validComposition(), extra: true }, parseComposition],
    [
      'empty instance id',
      {
        ...validComposition(),
        instances: [{ ...validComposition().instances[0], id: '' }],
      },
      parseComposition,
    ],
    [
      'unknown connection field',
      {
        ...validComposition(),
        connections: [{ ...validComposition().connections[0], extra: true }],
      },
      parseComposition,
    ],
  ] as const)('fails closed for %s', (_label, input, parser) => {
    const result = parser(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error[0]?.code).toBe('invalid-wire-value')
  })
})
