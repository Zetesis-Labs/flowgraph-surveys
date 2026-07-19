import { createBrowserEventStore, persistSession, type PersistenceProblem } from '@flowgraph/react'
import { createSession, type FlowSession } from '@flowgraph/session'

import { demoSchema } from '../fixture/schema.js'

export const DEMO_STORAGE_KEY = 'flowgraph:survey-demo:v1'

export type DemoSessionLoad =
  | {
      readonly kind: 'ready'
      readonly session: FlowSession
      readonly persistenceProblem?: PersistenceProblem
      readonly retained: boolean
    }
  | {
      readonly kind: 'recovery'
      readonly problem: PersistenceProblem | { readonly code: 'replay-failed' }
    }

const fresh = (): FlowSession => {
  const created = createSession(demoSchema)
  if (!created.ok) throw new Error(created.error.code)
  return created.value
}

export const loadDemoSession = (storage: Storage): DemoSessionLoad => {
  const store = createBrowserEventStore({ storage, key: DEMO_STORAGE_KEY })
  const loaded = store.load()
  if (!loaded.ok) {
    if (loaded.error.code === 'storage-unavailable') {
      return {
        kind: 'ready',
        session: fresh(),
        retained: false,
        persistenceProblem: loaded.error,
      }
    }
    return { kind: 'recovery', problem: loaded.error }
  }
  if (loaded.value === undefined) {
    return { kind: 'ready', session: fresh(), retained: false }
  }
  const restored = createSession(demoSchema, loaded.value)
  if (!restored.ok) return { kind: 'recovery', problem: { code: 'replay-failed' } }
  return {
    kind: 'ready',
    session: restored.value,
    retained: loaded.value.length > 0,
  }
}

export const subscribeDemoPersistence = (
  session: FlowSession,
  storage: Storage,
  onProblem: (problem: PersistenceProblem) => void,
): (() => void) => {
  const store = createBrowserEventStore({ storage, key: DEMO_STORAGE_KEY })
  return persistSession(session, store, onProblem)
}

export const replaceDemoSession = (
  storage: Storage,
):
  | { readonly ok: true; readonly session: FlowSession }
  | {
      readonly ok: false
      readonly problem: PersistenceProblem
    } => {
  const store = createBrowserEventStore({ storage, key: DEMO_STORAGE_KEY })
  const cleared = store.clear()
  if (!cleared.ok) return { ok: false, problem: cleared.error }
  return { ok: true, session: fresh() }
}
