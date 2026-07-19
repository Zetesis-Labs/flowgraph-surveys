import { hashSchema, type FlowSchema, type Result } from '@flowgraph/core'
import { createSession, type FlowSession } from '@flowgraph/session'

declare const schema: FlowSchema
const hash: string = hashSchema(schema)
const created: Result<FlowSession, unknown> = createSession(schema)

void hash
void created

// @ts-expect-error The package intentionally exposes no deep source subpaths.
await import('@flowgraph/core/src/index.js')
