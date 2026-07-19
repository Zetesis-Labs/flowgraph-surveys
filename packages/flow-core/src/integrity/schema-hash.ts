import { toSchemaHash, type SchemaHash } from '../domain/ids.js'
import type { FlowSchema } from '../domain/schema.js'
import { canonicalizeSchema } from './canonical-json.js'
import { sha256 } from './sha256.js'
import { utf8Encode } from './utf8.js'

export const hashSchema = (schema: FlowSchema): SchemaHash =>
  toSchemaHash(sha256(utf8Encode(canonicalizeSchema(schema))))
