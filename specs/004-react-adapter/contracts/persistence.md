# Browser Persistence Contract

**Feature**: `004-react-adapter`
**Contract version**: v1

## Storage boundary

```ts
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
  readonly save: (
    events: readonly Event[],
  ) => Result<void, PersistenceProblem>
  readonly clear: () => Result<void, PersistenceProblem>
}
```

The application creates the store and chooses its namespace. The adapter never reads a
global storage object implicitly.

## Wire envelope

```json
{
  "formatVersion": 1,
  "events": []
}
```

`events` is the complete ordered event log. Every save replaces the one key with a
complete JSON envelope. No snapshot, rendered text, draft, friction, or resolved view
is persisted.

## Load

1. `null` returns `ok(undefined)`.
2. Storage access exceptions return `storage-unavailable`.
3. Invalid JSON returns `invalid-json`.
4. Wrong envelope structure or `formatVersion` returns `invalid-envelope`.
5. Events cross the existing upcast and parse boundary; failure returns
   `invalid-events`.
6. Successful typed events are still untrusted until
   `createSession(schema, events)` verifies ordering and schema identity.

The store does not swallow or partially repair invalid events.

## Save

On every committed event batch, `persistSession` reads `session.getEvents()` after the
commit and saves that complete reference. It does not append the callback batch to a
private mirror.

Storage exceptions and serialization failures return `storage-write-failed`.
`persistSession` catches that result and invokes `onProblem`; it must not throw from
the session listener.

## Clear and replacement

`clear` removes the configured key. Failure returns `storage-clear-failed`.

Feature 006's “start new demonstration” sequence is:

1. Obtain explicit respondent confirmation.
2. Clear the retained event log.
3. Create a fresh session.
4. Replace the mounted binding.
5. Subscribe the new session for persistence.

If step 2 fails, replacement stops and the retained session remains mounted. The
adapter itself does not show confirmation UI or retain multiple sessions.

## Failure reporting

`PersistenceProblem` contains a stable code and may contain an opaque `cause` for
developer diagnostics. Respondent UI receives host-authored safe copy, never the stored
payload or exception stack.

A save failure after a session commit means:

- the in-memory command remains committed;
- the UI renders the committed snapshot;
- the host warns that refresh may lose recent progress;
- the command is never retried automatically.
