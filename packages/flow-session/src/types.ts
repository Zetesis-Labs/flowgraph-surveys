import type { Command, Event, FlowState, Problem, Result } from '@flowgraph/core'

export type StateListener = () => void
export type EventListener = (batch: readonly Event[]) => void
export type Unsubscribe = () => void

export type FlowSession = {
  readonly dispatch: (command: Command) => Result<readonly Event[], readonly Problem[]>
  readonly getSnapshot: () => FlowState
  readonly getEvents: () => readonly Event[]
  readonly subscribe: (listener: StateListener) => Unsubscribe
  readonly subscribeEvents: (listener: EventListener) => Unsubscribe
}
