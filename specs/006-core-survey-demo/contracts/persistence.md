# Persistence Contract

## Envelope

```json
{
  "formatVersion": 1,
  "events": []
}
```

The existing browser event store owns parsing, upcasting, saving, and clearing. The
application never writes a derived state snapshot.

## Load

- Missing key: create a fresh unstarted session.
- Valid envelope: replay events against the pinned fixture.
- Invalid JSON/envelope/events or replay mismatch: enter recovery state.

## Save

- Subscribe after a valid session is created.
- Persist every committed event batch.
- A failed write shows an on-device persistence warning but does not roll back core
  state or disable the current journey.

## Replace

- Require explicit confirmation whenever retained progress exists.
- Clear the one storage key, create a fresh session, and remount the controller.
- If clearing fails, preserve the current session and surface the failure.
