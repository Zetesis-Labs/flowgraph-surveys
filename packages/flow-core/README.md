# @flowgraph/core

Pure, synchronous event-sourced engine for immutable survey graphs. It owns schema
parsing, Strong Kleene guard evaluation, `decide`/`apply`/`replay`, selectors,
structural checking, bounded probing, golden journeys, and edge coverage.

Import only from `@flowgraph/core`; the package exposes no deep subpaths and ships as
ESM for Node.js 22+ and browser-oriented ES2022 toolchains.

```ts
import { decide, hashSchema, initialState, parseSchema } from '@flowgraph/core'
```

All numeric constraints, weights, timestamps, and numeric answers are safe integers.
Commands carry host-supplied provenance. Persist the immutable event log rather than a
state snapshot, and restore untrusted or stored data with `replay()`, which returns a
`Result` and verifies schema identity, hash, ordering, and transitions.

The core reads no clock, random source, storage, network, DOM, or Node platform API.

## Composable schema packs

Use packs to keep groups of pages and conditional edges reusable at authoring time.
Each concrete pack exposes named entries and outlets while keeping local node and
question ids private. A composition gives every use an instance id and connects outlets
to entries:

```ts
import { compileComposition, parseComposition } from '@flowgraph/core'

const parsed = parseComposition(input)
if (parsed.ok) {
  const compiled = compileComposition(parsed.value)
  if (compiled.ok) {
    const schemaJson = JSON.stringify(compiled.value)
  }
}
```

Compilation namespaces every node, question, option, and outcome id, validates the
result with the ordinary checker, and returns one self-contained `FlowSchema`. The
runtime, event log, and exported JSON contain no pack-specific constructs. For
configuration, expose a pure typed factory that returns a fully resolved concrete pack;
factories and unresolved parameters never enter runtime data.
