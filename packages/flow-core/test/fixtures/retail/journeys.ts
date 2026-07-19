import retailJson from './schema.json' with { type: 'json' }

import { parseSchema, type FlowSchema } from '../../../src/index.js'

const parsed = parseSchema(retailJson)
if (!parsed.ok) throw new Error('Invalid governed retail fixture')

export const retailSchema: FlowSchema = parsed.value
