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
