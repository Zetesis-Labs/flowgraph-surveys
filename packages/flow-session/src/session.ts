import {
  apply,
  decide,
  err,
  initialState,
  ok,
  replay,
  type Event,
  type FlowSchema,
  type FlowState,
  type Problem,
  type Result,
} from '@flowgraph/core'

import type { EventListener, FlowSession, StateListener, Unsubscribe } from './types.js'

const subscription = <Listener>(listeners: Listener[], listener: Listener): Unsubscribe => {
  listeners.push(listener)
  let active = true
  return () => {
    if (!active) return
    active = false
    const index = listeners.indexOf(listener)
    listeners.splice(index, 1)
  }
}

export const createSession = (
  schema: FlowSchema,
  pastEvents?: readonly Event[],
): Result<FlowSession, Problem> => {
  let events: readonly Event[]
  let snapshot: FlowState
  if (pastEvents === undefined) {
    events = []
    snapshot = initialState(schema)
  } else {
    const restored = replay(schema, pastEvents)
    if (!restored.ok) return err(restored.error)
    events = pastEvents
    snapshot = restored.value
  }

  const stateListeners: StateListener[] = []
  const eventListeners: EventListener[] = []
  let notifying = false

  const dispatch: FlowSession['dispatch'] = (command) => {
    if (notifying) return err([{ code: 'reentrant-dispatch' }])
    const decided = decide(schema, snapshot, command)
    if (!decided.ok || decided.value.length === 0) return decided

    const nextEvents = [...events, ...decided.value]
    const nextSnapshot = decided.value.reduce(apply, snapshot)
    events = nextEvents
    snapshot = nextSnapshot

    const currentEventListeners = [...eventListeners]
    const currentStateListeners = [...stateListeners]
    const failures: unknown[] = []
    notifying = true
    try {
      for (const listener of currentEventListeners) {
        try {
          listener(decided.value)
        } catch (failure) {
          failures.push(failure)
        }
      }
      for (const listener of currentStateListeners) {
        try {
          listener()
        } catch (failure) {
          failures.push(failure)
        }
      }
    } finally {
      notifying = false
    }
    if (failures.length > 0) {
      throw new AggregateError(failures, 'Flow session listeners failed after commit')
    }
    return decided
  }

  return ok({
    dispatch,
    getSnapshot: () => snapshot,
    getEvents: () => events,
    subscribe: (listener) => subscription(stateListeners, listener),
    subscribeEvents: (listener) => subscription(eventListeners, listener),
  })
}
