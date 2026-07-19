import phq2Json from './schema.json' with { type: 'json' }

import { parseSchema, type FlowSchema } from '../../../src/index.js'

const parsed = parseSchema(phq2Json)
if (!parsed.ok) throw new Error('Invalid governed PHQ-2 fixture')

export const phq2Schema: FlowSchema = parsed.value
