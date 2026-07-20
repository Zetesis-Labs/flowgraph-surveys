# Wire Contract: Concrete Packs and Compositions

Both documents use strict object parsing. Unknown fields, empty identities, unsafe
versions, malformed nodes/guards, and malformed ports fail closed.

## Concrete pack

```json
{
  "id": "identity",
  "version": "1.0.0",
  "entry": "start",
  "entries": [{ "id": "start", "node": "profile" }],
  "nodes": {},
  "outlets": [
    {
      "id": "completed",
      "from": "profile",
      "when": { "kind": "always" },
      "required": true
    }
  ]
}
```

Nodes, questions, edges, guards, and expressions use the existing strict schema grammar.

## Composition

```json
{
  "id": "incident-report",
  "version": "1.0.0",
  "entry": { "instance": "identity", "entry": "start" },
  "instances": [{ "id": "identity", "pack": {} }],
  "connections": [
    {
      "from": { "instance": "identity", "outlet": "completed" },
      "to": { "instance": "details", "entry": "start" }
    }
  ]
}
```

Compilation consumes fully embedded concrete packs. Registry references and unresolved
factory parameters are not part of this format.
