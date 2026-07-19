import { z } from 'zod'

import type { Command } from '../domain/command.js'
import type { Event } from '../domain/event.js'
import type { ParseProblem } from '../domain/problem.js'
import { err, ok, type Result } from '../domain/result.js'
import {
  answerValueSchema,
  commandMetaSchema,
  nonEmptyStringSchema,
  nonNegativeSafeIntSchema,
  schemaHashSchema,
  toParseProblems,
} from './shared.js'

const commandSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('START'),
    meta: commandMetaSchema,
    schemaHash: schemaHashSchema,
  }),
  z.strictObject({
    kind: z.literal('ANSWER'),
    meta: commandMetaSchema,
    q: nonEmptyStringSchema,
    value: answerValueSchema,
  }),
  z.strictObject({ kind: z.literal('NEXT'), meta: commandMetaSchema }),
  z.strictObject({ kind: z.literal('BACK'), meta: commandMetaSchema }),
])

const envelope = {
  v: z.literal(1),
  at: nonNegativeSafeIntSchema,
  source: z.enum(['human', 'agent', 'import']),
  path: z.array(z.never()).length(0),
}

const eventSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    ...envelope,
    kind: z.literal('SESSION_STARTED'),
    schemaId: nonEmptyStringSchema,
    schemaVersion: nonEmptyStringSchema,
    schemaHash: schemaHashSchema,
  }),
  z.strictObject({
    ...envelope,
    kind: z.literal('ANSWERED'),
    q: nonEmptyStringSchema,
    value: answerValueSchema,
  }),
  z.strictObject({
    ...envelope,
    kind: z.literal('ADVANCED'),
    from: nonEmptyStringSchema,
    to: nonEmptyStringSchema,
  }),
  z.strictObject({
    ...envelope,
    kind: z.literal('WENT_BACK'),
    from: nonEmptyStringSchema,
    to: nonEmptyStringSchema,
  }),
  z.strictObject({
    ...envelope,
    kind: z.literal('SESSION_FINISHED'),
    outcome: nonEmptyStringSchema,
  }),
])

export const parseCommand = (input: unknown): Result<Command, readonly ParseProblem[]> => {
  const parsed = commandSchema.safeParse(input)
  return parsed.success
    ? ok(parsed.data as unknown as Command)
    : err(toParseProblems(parsed.error.issues))
}

export const parseEvents = (input: unknown): Result<readonly Event[], readonly ParseProblem[]> => {
  const parsed = z.array(eventSchema).safeParse(input)
  return parsed.success
    ? ok(parsed.data as unknown as readonly Event[])
    : err(toParseProblems(parsed.error.issues))
}
