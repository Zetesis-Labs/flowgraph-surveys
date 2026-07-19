import { err, ok, upcastEvents } from '@flowgraph/core'

import type {
  BrowserEventStore,
  BrowserEventStoreOptions,
  PersistenceProblem,
  PersistenceProblemCode,
} from './types.js'

const failure = (code: PersistenceProblemCode, cause?: unknown): PersistenceProblem =>
  cause === undefined ? { code } : { code, cause }

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const createBrowserEventStore = ({
  storage,
  key,
}: BrowserEventStoreOptions): BrowserEventStore => ({
  load: () => {
    let stored: string | null
    try {
      stored = storage.getItem(key)
    } catch (cause) {
      return err(failure('storage-unavailable', cause))
    }
    if (stored === null) return ok(undefined)

    let envelope: unknown
    try {
      envelope = JSON.parse(stored) as unknown
    } catch (cause) {
      return err(failure('invalid-json', cause))
    }
    if (!isRecord(envelope) || envelope.formatVersion !== 1 || !Array.isArray(envelope.events)) {
      return err(failure('invalid-envelope'))
    }

    const events = upcastEvents(envelope.events)
    return events.ok ? ok(events.value) : err(failure('invalid-events', events.error))
  },
  save: (events) => {
    try {
      storage.setItem(key, JSON.stringify({ formatVersion: 1, events }))
      return ok(undefined)
    } catch (cause) {
      return err(failure('storage-write-failed', cause))
    }
  },
  clear: () => {
    try {
      storage.removeItem(key)
      return ok(undefined)
    } catch (cause) {
      return err(failure('storage-clear-failed', cause))
    }
  },
})
