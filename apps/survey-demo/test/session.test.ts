import { hashSchema, toSafeInt } from '@flowgraph/core'
import { describe, expect, it, vi } from 'vitest'

import { demoSchema } from '../src/fixture/schema.js'
import {
  DEMO_STORAGE_KEY,
  loadDemoSession,
  replaceDemoSession,
  subscribeDemoPersistence,
} from '../src/session/browser-session.js'
import { memoryStorage } from './support/storage.js'

const meta = () => ({ at: toSafeInt(1), source: 'human' as const, path: [] })

describe('browser demo session', () => {
  it('creates an empty session when no history exists', () => {
    const loaded = loadDemoSession(memoryStorage())
    expect(loaded.kind).toBe('ready')
    if (loaded.kind !== 'ready') return
    expect(loaded.session.getSnapshot().status).toBe('not-started')
    expect(loaded.retained).toBe(false)
  })

  it('persists events and restores the exact current page', () => {
    const storage = memoryStorage()
    const loaded = loadDemoSession(storage)
    expect(loaded.kind).toBe('ready')
    if (loaded.kind !== 'ready') return
    const stop = subscribeDemoPersistence(loaded.session, storage, vi.fn())
    loaded.session.dispatch({ kind: 'START', schemaHash: hashSchema(demoSchema), meta: meta() })
    stop()

    const restored = loadDemoSession(storage)
    expect(restored.kind).toBe('ready')
    if (restored.kind !== 'ready') return
    expect(restored.session.getSnapshot()).toEqual(loaded.session.getSnapshot())
    expect(restored.retained).toBe(true)
  })

  it('enters recovery for corrupt saved content', () => {
    const loaded = loadDemoSession(memoryStorage({ [DEMO_STORAGE_KEY]: '{definitely-not-json' }))
    expect(loaded).toMatchObject({
      kind: 'recovery',
      problem: { code: 'invalid-json' },
    })
  })

  it('keeps the survey usable when storage itself is unavailable', () => {
    const storage = memoryStorage()
    storage.getItem = () => {
      throw new Error('blocked')
    }
    const loaded = loadDemoSession(storage)
    expect(loaded.kind).toBe('ready')
    if (loaded.kind !== 'ready') return
    expect(loaded.persistenceProblem?.code).toBe('storage-unavailable')
    expect(loaded.session.getSnapshot().status).toBe('not-started')
  })

  it('explicitly replaces the only retained session', () => {
    const storage = memoryStorage({ [DEMO_STORAGE_KEY]: '{"formatVersion":1,"events":[]}' })
    const replaced = replaceDemoSession(storage)
    expect(replaced.ok).toBe(true)
    expect(storage.getItem(DEMO_STORAGE_KEY)).toBeNull()
    if (replaced.ok) expect(replaced.session.getEvents()).toEqual([])
  })

  it('keeps events, route, and progress unchanged after rejected navigation', () => {
    const loaded = loadDemoSession(memoryStorage())
    expect(loaded.kind).toBe('ready')
    if (loaded.kind !== 'ready') return
    loaded.session.dispatch({
      kind: 'START',
      schemaHash: hashSchema(demoSchema),
      meta: meta(),
    })
    const beforeState = loaded.session.getSnapshot()
    const beforeEvents = loaded.session.getEvents()
    const rejected = loaded.session.dispatch({ kind: 'NEXT', meta: meta() })
    expect(rejected.ok).toBe(false)
    expect(loaded.session.getSnapshot()).toEqual(beforeState)
    expect(loaded.session.getEvents()).toEqual(beforeEvents)
  })
})
