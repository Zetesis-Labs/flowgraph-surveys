import { z } from 'zod'

import type { FlowComposition, FlowPack } from '../domain/pack.js'
import type { ParseProblem } from '../domain/problem.js'
import { err, ok, type Result } from '../domain/result.js'
import { guardWireSchema, nodeWireSchema } from './schema.js'
import { nonEmptyStringSchema, toParseProblems } from './shared.js'

const entryWireSchema = z.strictObject({
  id: nonEmptyStringSchema,
  node: nonEmptyStringSchema,
})

const outletWireSchema = z.strictObject({
  id: nonEmptyStringSchema,
  from: nonEmptyStringSchema,
  when: guardWireSchema,
  required: z.boolean().optional(),
})

export const packWireSchema = z.strictObject({
  id: nonEmptyStringSchema,
  version: nonEmptyStringSchema,
  entry: nonEmptyStringSchema,
  entries: z.array(entryWireSchema),
  nodes: z.record(nonEmptyStringSchema, nodeWireSchema),
  outlets: z.array(outletWireSchema),
})

const targetWireSchema = z.strictObject({
  instance: nonEmptyStringSchema,
  entry: nonEmptyStringSchema,
})

const connectionWireSchema = z.strictObject({
  from: z.strictObject({
    instance: nonEmptyStringSchema,
    outlet: nonEmptyStringSchema,
  }),
  to: targetWireSchema,
})

const compositionWireSchema = z.strictObject({
  id: nonEmptyStringSchema,
  version: nonEmptyStringSchema,
  entry: targetWireSchema,
  instances: z.array(
    z.strictObject({
      id: nonEmptyStringSchema,
      pack: packWireSchema,
    }),
  ),
  connections: z.array(connectionWireSchema),
})

const parsed = <Value>(
  result: z.ZodSafeParseResult<unknown>,
): Result<Value, readonly ParseProblem[]> =>
  result.success ? ok(result.data as Value) : err(toParseProblems(result.error.issues))

export const parsePack = (input: unknown): Result<FlowPack, readonly ParseProblem[]> =>
  parsed(packWireSchema.safeParse(input))

export const parseComposition = (
  input: unknown,
): Result<FlowComposition, readonly ParseProblem[]> =>
  parsed(compositionWireSchema.safeParse(input))
