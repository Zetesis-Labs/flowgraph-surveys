import type { FlowSession } from '@flowgraph/session'

import type { BrowserEventStore, PersistenceProblem } from './types.js'

export const persistSession = (
  session: FlowSession,
  store: BrowserEventStore,
  onProblem: (problem: PersistenceProblem) => void,
): (() => void) =>
  session.subscribeEvents(() => {
    try {
      const saved = store.save(session.getEvents())
      if (!saved.ok) onProblem(saved.error)
    } catch (cause) {
      onProblem({ code: 'storage-write-failed', cause })
    }
  })
