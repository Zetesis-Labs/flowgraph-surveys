import type { Event, Result } from '@flowgraph/core'

export type PersistenceProblemCode =
  | 'storage-unavailable'
  | 'invalid-json'
  | 'invalid-envelope'
  | 'invalid-events'
  | 'storage-write-failed'
  | 'storage-clear-failed'

export type PersistenceProblem = {
  readonly code: PersistenceProblemCode
  readonly cause?: unknown
}

export type StorageLike = {
  readonly getItem: (key: string) => string | null
  readonly setItem: (key: string, value: string) => void
  readonly removeItem: (key: string) => void
}

export type BrowserEventStoreOptions = {
  readonly storage: StorageLike
  readonly key: string
}

export type BrowserEventStore = {
  readonly load: () => Result<readonly Event[] | undefined, PersistenceProblem>
  readonly save: (events: readonly Event[]) => Result<void, PersistenceProblem>
  readonly clear: () => Result<void, PersistenceProblem>
}
