# @flowgraph/session

Observable, single-writer shell around `@flowgraph/core`. It provides
`createSession()`, synchronous command dispatch, stable snapshot/event references, and
ordered state and atomic event-batch subscriptions.

```ts
import { createSession } from '@flowgraph/session'
```

Creation and restoration return a `Result`; restoration always goes through core
`replay()`. Successful non-empty dispatches commit their full event batch before
notifications. Rejected and empty dispatches do not change references or notify.
Nested notification-time dispatch is rejected with `reentrant-dispatch`.

The package is ESM-only for Node.js 22+ and exposes only its public root.
