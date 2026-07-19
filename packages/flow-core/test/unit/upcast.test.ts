import { describe, expect, it } from 'vitest'

import { upcastEvents } from '../../src/index.js'
import { event } from '../support/builders.js'

describe('upcastEvents', () => {
  it('passes v1 through the composed boundary without rewriting persisted input', () => {
    const input: readonly unknown[] = [event('ANSWERED')]
    const before = JSON.stringify(input)
    const result = upcastEvents(input)

    expect(result).toEqual({ ok: true, value: input })
    expect(JSON.stringify(input)).toBe(before)
  })

  it('rejects unknown future versions explicitly', () => {
    expect(upcastEvents([{ ...event('ANSWERED'), v: 2 }])).toEqual({
      ok: false,
      error: { code: 'unsupported-event-version' },
    })
  })

  it('fails closed for non-empty v1 paths and malformed fields', () => {
    expect(upcastEvents([{ ...event('ANSWERED'), path: ['future'] }])).toEqual({
      ok: false,
      error: { code: 'log-schema-mismatch' },
    })
    expect(upcastEvents([{ ...event('ANSWERED'), unexpected: true }])).toEqual({
      ok: false,
      error: { code: 'log-schema-mismatch' },
    })
  })
})
