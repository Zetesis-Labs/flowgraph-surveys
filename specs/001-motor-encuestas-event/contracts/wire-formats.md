# Wire Format Contract

**Format version**: v1
**Encoding**: JSON-compatible values

## Shared constraints

- All object unions use a required `kind`.
- Unknown fields and unknown kinds are rejected.
- Ids and text keys are non-empty strings.
- Numeric values are safe integers; `-0` normalizes to `0`.
- Hashes are 64-character lowercase hexadecimal strings.
- Arrays retain declared order.
- `path` is always `[]` in v1.

## Schema document

```json
{
  "id": "patient-intake",
  "version": "1.0.0",
  "entry": "intro",
  "nodes": {
    "intro": {
      "kind": "page",
      "title": {
        "key": "intro.title",
        "fallback": "Introduction"
      },
      "questions": [],
      "edges": [
        {
          "to": "reason",
          "when": { "kind": "always" }
        }
      ]
    },
    "done": {
      "kind": "terminal",
      "outcome": "submitted"
    }
  }
}
```

Page questions use one of:

```json
{
  "kind": "text",
  "id": "notes",
  "text": { "key": "notes", "fallback": "Notes" },
  "required": false,
  "maxLength": 500,
  "visibleWhen": { "kind": "answered", "q": "reason" }
}
```

```json
{
  "kind": "number",
  "id": "age",
  "text": { "key": "age", "fallback": "Age" },
  "required": true,
  "min": 18,
  "max": 120
}
```

```json
{
  "kind": "select",
  "id": "reason",
  "text": { "key": "reason", "fallback": "Main reason" },
  "required": true,
  "multiple": false,
  "options": [
    {
      "id": "stress",
      "text": { "key": "reason.stress", "fallback": "Stress" },
      "weight": 1
    }
  ]
}
```

Resolved/localized labels never flow back into the schema or events.

## Guard and expression documents

```json
{ "kind": "always" }
{ "kind": "answered", "q": "reason" }
{ "kind": "selected", "q": "reason", "option": "stress" }
{ "kind": "not", "value": { "kind": "answered", "q": "notes" } }
{ "kind": "all", "values": [] }
{ "kind": "any", "values": [] }
{
  "kind": "cmp",
  "op": "gte",
  "left": {
    "kind": "sum",
    "values": [
      { "kind": "score", "q": "q1" },
      { "kind": "score", "q": "q2" }
    ]
  },
  "right": { "kind": "num", "value": 3 }
}
```

Supported comparison operators are `eq`, `ne`, `lt`, `lte`, `gt`, and `gte`.

## Commands

Every command carries shell-supplied metadata:

```json
{
  "kind": "START",
  "meta": {
    "at": 1784419200000,
    "source": "human",
    "path": []
  },
  "schemaHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

```json
{
  "kind": "ANSWER",
  "meta": {
    "at": 1784419201000,
    "source": "human",
    "path": []
  },
  "q": "reason",
  "value": ["stress"]
}
```

```json
{
  "kind": "NEXT",
  "meta": {
    "at": 1784419202000,
    "source": "human",
    "path": []
  }
}
```

```json
{
  "kind": "BACK",
  "meta": {
    "at": 1784419203000,
    "source": "human",
    "path": []
  }
}
```

`source` is one of `human`, `agent`, or `import`. Metadata is provenance; engine
semantics depend only on log order and command content.

## Events

All events contain `v`, `at`, `source`, `path`, and a kind payload.

```json
{
  "v": 1,
  "kind": "SESSION_STARTED",
  "at": 1784419200000,
  "source": "human",
  "path": [],
  "schemaId": "patient-intake",
  "schemaVersion": "1.0.0",
  "schemaHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

```json
{
  "v": 1,
  "kind": "ANSWERED",
  "at": 1784419201000,
  "source": "human",
  "path": [],
  "q": "reason",
  "value": ["stress"]
}
```

```json
{
  "v": 1,
  "kind": "ADVANCED",
  "at": 1784419202000,
  "source": "human",
  "path": [],
  "from": "reason",
  "to": "stress-follow-up"
}
```

```json
{
  "v": 1,
  "kind": "WENT_BACK",
  "at": 1784419203000,
  "source": "human",
  "path": [],
  "from": "stress-follow-up",
  "to": "reason"
}
```

```json
{
  "v": 1,
  "kind": "SESSION_FINISHED",
  "at": 1784419204000,
  "source": "human",
  "path": [],
  "outcome": "submitted"
}
```

When one `NEXT` reaches a terminal, `ADVANCED` and `SESSION_FINISHED` use the same
metadata and appear consecutively in that order.

## Canonical schema hash

The hash input is the parsed schema value, not its original whitespace or object-key
order. JCS canonicalization recursively sorts object keys, retains arrays, and encodes
the resulting text as UTF-8. SHA-256 output is lowercase hex.

Hashing includes all schema content, including `TextRef` fallback text, question order,
edge order, options, weights, and constraints. Changing any semantic or presentation
content creates a new hash even when `id` and `version` were incorrectly reused.

## Event evolution

The read boundary applies one composed pure upcast before v1 parsing. It never rewrites
persisted events. Unknown future versions return `unsupported-event-version`. A v1
event with non-empty `path` fails closed. Adding or changing event kinds requires the
project's constitutional amendment process.
