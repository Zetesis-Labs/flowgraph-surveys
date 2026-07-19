import type { Event } from '../domain/event.js'
import type { FlowState } from '../domain/state.js'

export const apply = (state: FlowState, event: Event): FlowState => {
  switch (event.kind) {
    case 'SESSION_STARTED':
      return { ...state, status: 'active', schemaHash: event.schemaHash }
    case 'ANSWERED':
      return { ...state, answers: { ...state.answers, [event.q]: event.value } }
    case 'ADVANCED':
      return { ...state, trail: [...state.trail, event.to] }
    case 'WENT_BACK':
      return { ...state, trail: state.trail.slice(0, -1) }
    case 'SESSION_FINISHED':
      return { ...state, status: 'finished', outcome: event.outcome }
  }
}
