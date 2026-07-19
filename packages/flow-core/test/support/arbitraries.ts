import fc from 'fast-check'

import { toNodeId, toSafeInt, type NodeId, type SafeInt } from '../../src/index.js'

export const safeIntArbitrary: fc.Arbitrary<SafeInt> = fc
  .integer({ min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER })
  .map(toSafeInt)

export const nodeIdArbitrary: fc.Arbitrary<NodeId> = fc
  .string({
    unit: fc.constantFrom(
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
    ),
    minLength: 1,
  })
  .map(toNodeId)
