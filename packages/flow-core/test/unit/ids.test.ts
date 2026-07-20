import { describe, expect, it } from 'vitest'

import {
  toPackId,
  toPackInstanceId,
  toPackPortId,
  type PackId,
  type PackInstanceId,
  type PackPortId,
} from '../../src/index.js'

describe('pack identity brands', () => {
  it('keeps opaque author-provided identity values unchanged', () => {
    expect(toPackId('pack')).toBe('pack')
    expect(toPackInstanceId('instance')).toBe('instance')
    expect(toPackPortId('port')).toBe('port')

    const identities: readonly [PackId, PackInstanceId, PackPortId] = [
      toPackId('pack'),
      toPackInstanceId('instance'),
      toPackPortId('port'),
    ]
    expect(identities).toEqual(['pack', 'instance', 'port'])
  })
})
