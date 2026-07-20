# Public API Contract: Attachment Inputs

## Core schema and answer

The core exports branded attachment ids, attachment references, the attachment question
variant, strict schema/event parsing, and the same decision/replay APIs used by every
other question kind.

Required behavioral contract:

- Definitions and answers reject unknown fields.
- Count, required, type, size, and duplicate-id failures remain distinguishable.
- Exact maximum count and size are accepted.
- Active truth and route visibility are unchanged.
- `check()` and `probe()` understand the question without platform access.

## React adapter

The adapter exports:

- A factory for an isolated attachment file store.
- An injectable context/provider path through `FlowPage`.
- A default renderer for the attachment question.

The renderer contract:

- Uses a file input whose accepted types and multiplicity match the schema.
- Does not expose a `capture` attribute or invoke camera APIs.
- Calls the governed answer callback before mutating the file store.
- Lists accepted references and provides individually labelled removal controls.
- Preserves the last accepted state when a proposal is rejected.
- Honors disabled state and focuses the input after relevant navigation rejection.

## Persistence boundary

Event storage receives only `AttachmentRef[]`. File objects, buffers, object URLs, and
base64 content are forbidden in governed schemas and events.
