import { describe, expect, it } from 'vitest'

import { allTruth, anyTruth, notTruth, type Truth } from '../../src/index.js'

const truths: readonly Truth[] = ['true', 'false', 'unknown']

describe('Strong Kleene truth operators', () => {
  it.each([
    ['true', 'false'],
    ['false', 'true'],
    ['unknown', 'unknown'],
  ] as const)('not(%s) = %s', (input, expected) => {
    expect(notTruth(input)).toBe(expected)
  })

  it('implements every binary all/any table cell', () => {
    const expectedAll = [
      ['true', 'false', 'unknown'],
      ['false', 'false', 'false'],
      ['unknown', 'false', 'unknown'],
    ] as const
    const expectedAny = [
      ['true', 'true', 'true'],
      ['true', 'false', 'unknown'],
      ['true', 'unknown', 'unknown'],
    ] as const

    truths.forEach((left, row) => {
      truths.forEach((right, column) => {
        expect(allTruth([left, right])).toBe(expectedAll[row]?.[column])
        expect(anyTruth([left, right])).toBe(expectedAny[row]?.[column])
      })
    })
  })

  it('uses mathematical empty identities', () => {
    expect(allTruth([])).toBe('true')
    expect(anyTruth([])).toBe('false')
  })
})
