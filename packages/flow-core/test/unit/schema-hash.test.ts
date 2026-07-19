import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  canonicalizeSchema,
  hashSchema,
  sha256,
  utf8Encode,
  type FlowSchema,
} from '../../src/index.js'
import { simpleSchema } from '../support/builders.js'

describe('canonical schema hashing', () => {
  it('matches JCS key ordering while preserving arrays and Unicode', () => {
    const left = { z: 1, a: { emoji: '😀', values: [3, 2, 1] } }
    const right = { a: { values: [3, 2, 1], emoji: '😀' }, z: 1 }

    expect(canonicalizeSchema(left as unknown as FlowSchema)).toBe(
      canonicalizeSchema(right as unknown as FlowSchema),
    )
    expect(canonicalizeSchema(left as unknown as FlowSchema)).toBe(
      '{"a":{"emoji":"😀","values":[3,2,1]},"z":1}',
    )
  })

  it.each([
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  ])('matches the NIST SHA-256 vector for %j', (input, expected) => {
    expect(sha256(utf8Encode(input))).toBe(expected)
  })

  it('matches node:crypto independently for Unicode schemas', () => {
    const schema = {
      ...simpleSchema(),
      id: 'encuesta-😀',
    } as unknown as FlowSchema
    const canonical = canonicalizeSchema(schema)
    expect(hashSchema(schema)).toBe(createHash('sha256').update(canonical, 'utf8').digest('hex'))
  })

  it('encodes every UTF-8 width and replaces lone surrogate code points', () => {
    expect(utf8Encode('\u0000\u007f\u0080\u07ff\u0800\uffff😀')).toEqual([
      0x00, 0x7f, 0xc2, 0x80, 0xdf, 0xbf, 0xe0, 0xa0, 0x80, 0xef, 0xbf, 0xbf, 0xf0, 0x9f, 0x98,
      0x80,
    ])
    expect(utf8Encode('\ud800')).toEqual([0xef, 0xbf, 0xbd])
  })
})
