# Research: Attachment Inputs

## Serializable reference boundary

**Decision**: The governed answer stores only opaque id, display name, exact media type,
and safe non-negative byte size.

**Rationale**: These fields are sufficient for deterministic validation, replay, and
display while preserving the functional core and portable JSON event logs.

**Alternatives considered**: Base64 content in events was rejected because it couples
the core to large binary payloads. URLs were rejected because they imply an external
storage lifecycle and authorization model.

## File ownership

**Decision**: Actual files live in an injected volatile adapter store keyed by reference
id.

**Rationale**: Hosts can choose their own durable upload or storage strategy while the
default renderer remains useful and memory-safe.

**Alternatives considered**: A module-global store was rejected because it leaks across
forms and tests. Browser storage was rejected because it changes privacy and quota
semantics.

## Identity

**Decision**: The effectful shell mints opaque reference ids; the core accepts and
validates them without generating values.

**Rationale**: This follows the constitution and makes replay independent of platform
randomness.

**Alternatives considered**: Hashing file content was rejected because reading content
is IO and two selections of the same bytes may legitimately be distinct references.

## Media and size validation

**Decision**: Media types use an exact allowlist and byte limits use inclusive maximums.

**Rationale**: Exact strings are deterministic and readily represented in JSON.
Inclusive boundaries match normal declarative validation expectations.

**Alternatives considered**: Wildcards and filename extensions were deferred because
their matching and trust rules require a broader contract.

## Browser interaction

**Decision**: Use an ordinary multi-file input with `accept`, no `capture`, and an
accessible list of removable selections.

**Rationale**: It works with keyboard and assistive technology while making the
no-camera policy mechanically verifiable.

**Alternatives considered**: Drag-and-drop and previews were deferred as presentation
enhancements that do not affect the horizontal capability.
