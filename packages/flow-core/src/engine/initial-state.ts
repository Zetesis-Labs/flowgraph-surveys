import type { FlowSchema } from '../domain/schema.js'
import type { FlowState } from '../domain/state.js'

export const initialState = (schema: FlowSchema): FlowState => ({
  status: 'not-started',
  schemaId: schema.id,
  schemaVersion: schema.version,
  trail: [schema.entry],
  answers: {},
})
