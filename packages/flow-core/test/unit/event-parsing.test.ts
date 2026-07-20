import { describe, expect, it } from 'vitest'

import { parseCommand, parseEvents } from '../../src/index.js'

const hash = 'a'.repeat(64)
const meta = { at: 1_784_419_200_000, source: 'human', path: [] } as const

const events = [
  {
    v: 1,
    kind: 'SESSION_STARTED',
    ...meta,
    schemaId: 'survey',
    schemaVersion: '1.0.0',
    schemaHash: hash,
  },
  { v: 1, kind: 'ANSWERED', ...meta, q: 'age', value: 42 },
  { v: 1, kind: 'ADVANCED', ...meta, from: 'page', to: 'review' },
  { v: 1, kind: 'WENT_BACK', ...meta, from: 'review', to: 'page' },
  { v: 1, kind: 'SESSION_FINISHED', ...meta, outcome: 'submitted' },
] as const

describe('parseEvents', () => {
  it('parses all five v1 event kinds', () => {
    expect(parseEvents(events)).toEqual({ ok: true, value: events })
  })

  it('normalizes negative-zero event answers', () => {
    const result = parseEvents([{ ...events[1], value: -0 }])

    expect(result.ok).toBe(true)
    if (result.ok) {
      const event = result.value[0]
      expect(event?.kind).toBe('ANSWERED')
      if (event?.kind === 'ANSWERED') {
        expect(Object.is(event.value, -0)).toBe(false)
      }
    }
  })

  it('rejects duplicate select option ids at the wire boundary', () => {
    expect(parseEvents([{ ...events[1], value: ['same', 'same'] }]).ok).toBe(false)
  })

  it('parses strict serializable attachment answers', () => {
    const value = [
      {
        id: 'fit-front',
        name: 'front.webp',
        mediaType: 'image/webp',
        size: 2048,
      },
    ]
    expect(parseEvents([{ ...events[1], value }])).toEqual({
      ok: true,
      value: [{ ...events[1], value }],
    })
    expect(parseCommand({ kind: 'ANSWER', meta, q: 'photos', value })).toEqual({
      ok: true,
      value: { kind: 'ANSWER', meta, q: 'photos', value },
    })
    expect(parseEvents([{ ...events[1], value: [{ ...value[0], bytes: 'secret' }] }]).ok).toBe(
      false,
    )
    expect(parseEvents([{ ...events[1], value: [value[0], value[0]] }]).ok).toBe(false)
  })

  it.each([
    ['unknown version', [{ ...events[0], v: 2 }]],
    ['unknown kind', [{ ...events[0], kind: 'MIGRATED' }]],
    ['unknown field', [{ ...events[0], extra: true }]],
    ['non-empty v1 path', [{ ...events[0], path: [{ flow: 'child' }] }]],
    ['invalid hash', [{ ...events[0], schemaHash: 'ABC' }]],
    ['negative timestamp', [{ ...events[0], at: -1 }]],
    ['fractional answer', [{ ...events[1], value: 1.5 }]],
  ])('fails closed for %s', (_label, input) => {
    expect(parseEvents(input).ok).toBe(false)
  })
})

describe('parseCommand', () => {
  it.each([
    { kind: 'START', meta, schemaHash: hash },
    { kind: 'ANSWER', meta, q: 'age', value: 42 },
    { kind: 'NEXT', meta },
    { kind: 'BACK', meta },
  ])('parses $kind', (command) => {
    expect(parseCommand(command)).toEqual({ ok: true, value: command })
  })

  it.each([
    { kind: 'NEXT', meta, extra: true },
    { kind: 'ANSWER', meta, q: '', value: 42 },
    { kind: 'START', meta, schemaHash: 'bad' },
    { kind: 'NEXT', meta: { ...meta, source: 'robot' } },
    { kind: 'NEXT', meta: { ...meta, path: [{ flow: 'child' }] } },
  ])('rejects malformed command %#', (command) => {
    expect(parseCommand(command).ok).toBe(false)
  })
})
