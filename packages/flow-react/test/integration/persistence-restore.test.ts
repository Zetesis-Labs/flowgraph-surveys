import { hashSchema, toSchemaVersion } from '@flowgraph/core'
import { createSession } from '@flowgraph/session'
import { describe, expect, it } from 'vitest'

import { createBrowserEventStore } from '../../src/persistence/browser-event-store.js'
import type { StorageLike } from '../../src/persistence/types.js'
import {
  createMetaFactory,
  optionSleep,
  qName,
  qReason,
  freshSession,
  surveySchema,
} from '../support/builders.js'

const memoryStorage = (): StorageLike => {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
}

describe('persistence restore', () => {
  it('restores through governed replay with an uninterrupted-equivalent snapshot', () => {
    const schema = surveySchema()
    const session = freshSession(schema)
    const meta = createMetaFactory(110)
    session.dispatch({ kind: 'START', schemaHash: hashSchema(schema), meta: meta() })
    session.dispatch({ kind: 'ANSWER', q: qName, value: 'Ada', meta: meta() })
    session.dispatch({ kind: 'ANSWER', q: qReason, value: [optionSleep], meta: meta() })
    const store = createBrowserEventStore({ storage: memoryStorage(), key: 'flowgraph:test' })
    expect(store.save(session.getEvents()).ok).toBe(true)

    const loaded = store.load()
    if (!loaded.ok || !loaded.value) throw new Error('Expected a stored event log')
    const restored = createSession(schema, loaded.value)

    expect(restored.ok).toBe(true)
    if (restored.ok) {
      expect(restored.value.getSnapshot()).toEqual(session.getSnapshot())
      expect(restored.value.getEvents()).toEqual(session.getEvents())
    }
  })

  it('rejects schema mismatch and corrupt ordering after a valid store load', () => {
    const schema = surveySchema()
    const session = freshSession(schema)
    const meta = createMetaFactory(120)
    session.dispatch({ kind: 'START', schemaHash: hashSchema(schema), meta: meta() })

    const changed = { ...schema, version: toSchemaVersion('2.0.0') }
    expect(createSession(changed, session.getEvents())).toEqual({
      ok: false,
      error: { code: 'schema-mismatch' },
    })
    expect(createSession(schema, [...session.getEvents(), ...session.getEvents()])).toEqual({
      ok: false,
      error: { code: 'log-schema-mismatch' },
    })
  })
})
