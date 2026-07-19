import type { Event } from '@flowgraph/core'
import { describe, expect, it } from 'vitest'

import { createBrowserEventStore } from '../../src/persistence/browser-event-store.js'
import type { StorageLike } from '../../src/persistence/types.js'
import { startedSession, surveySchema } from '../support/builders.js'

const memoryStorage = (): StorageLike & { readonly values: Map<string, string> } => {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
}

const events = (): readonly Event[] => startedSession(surveySchema()).getEvents()

describe('createBrowserEventStore', () => {
  it('loads empty storage and round-trips a complete event log', () => {
    const storage = memoryStorage()
    const store = createBrowserEventStore({ storage, key: 'flowgraph:test' })

    expect(store.load()).toEqual({ ok: true, value: undefined })
    expect(store.save(events())).toEqual({ ok: true, value: undefined })
    expect(JSON.parse(storage.values.get('flowgraph:test') ?? '')).toEqual({
      formatVersion: 1,
      events: events(),
    })
    expect(store.load()).toEqual({ ok: true, value: events() })
    expect(store.clear()).toEqual({ ok: true, value: undefined })
    expect(store.load()).toEqual({ ok: true, value: undefined })
  })

  it.each([
    ['invalid-json', '{'],
    ['invalid-envelope', JSON.stringify({ formatVersion: 2, events: [] })],
    ['invalid-envelope', JSON.stringify({ formatVersion: 1, events: {} })],
    ['invalid-events', JSON.stringify({ formatVersion: 1, events: [{ v: 2 }] })],
    ['invalid-events', JSON.stringify({ formatVersion: 1, events: [{}] })],
  ] as const)('reports %s without exposing stored content', (code, stored) => {
    const storage = memoryStorage()
    storage.values.set('flowgraph:test', stored)
    const result = createBrowserEventStore({ storage, key: 'flowgraph:test' }).load()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe(code)
      expect(result.error).not.toHaveProperty('stored')
    }
  })

  it('reports unavailable reads, failed writes, and failed clears', () => {
    const cause = new Error('private storage details')
    const throwing: StorageLike = {
      getItem: () => {
        throw cause
      },
      setItem: () => {
        throw cause
      },
      removeItem: () => {
        throw cause
      },
    }
    const store = createBrowserEventStore({ storage: throwing, key: 'flowgraph:test' })

    expect(store.load()).toEqual({
      ok: false,
      error: { code: 'storage-unavailable', cause },
    })
    expect(store.save(events())).toEqual({
      ok: false,
      error: { code: 'storage-write-failed', cause },
    })
    expect(store.clear()).toEqual({
      ok: false,
      error: { code: 'storage-clear-failed', cause },
    })
  })

  it('reports serialization failures as failed writes', () => {
    const storage = memoryStorage()
    const cyclic: { self?: unknown } = {}
    cyclic.self = cyclic
    const store = createBrowserEventStore({ storage, key: 'flowgraph:test' })

    const result = store.save(cyclic as unknown as readonly Event[])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('storage-write-failed')
  })
})
