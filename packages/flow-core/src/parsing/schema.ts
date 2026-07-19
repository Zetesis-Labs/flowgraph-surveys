import { z } from 'zod'

import type { FlowSchema } from '../domain/schema.js'
import type { ParseProblem } from '../domain/problem.js'
import { err, ok, type Result } from '../domain/result.js'
import { nonEmptyStringSchema, safeIntSchema, textRefSchema, toParseProblems } from './shared.js'

const numericExprSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('num'), value: safeIntSchema }),
    z.strictObject({ kind: z.literal('answer'), q: nonEmptyStringSchema }),
    z.strictObject({ kind: z.literal('score'), q: nonEmptyStringSchema }),
    z.strictObject({ kind: z.literal('sum'), values: z.array(numericExprSchema) }),
  ]),
)

const guardSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('always') }),
    z.strictObject({ kind: z.literal('answered'), q: nonEmptyStringSchema }),
    z.strictObject({
      kind: z.literal('selected'),
      q: nonEmptyStringSchema,
      option: nonEmptyStringSchema,
    }),
    z.strictObject({ kind: z.literal('not'), value: guardSchema }),
    z.strictObject({ kind: z.literal('all'), values: z.array(guardSchema) }),
    z.strictObject({ kind: z.literal('any'), values: z.array(guardSchema) }),
    z.strictObject({
      kind: z.literal('cmp'),
      op: z.enum(['eq', 'ne', 'lt', 'lte', 'gt', 'gte']),
      left: numericExprSchema,
      right: numericExprSchema,
    }),
  ]),
)

const questionCommon = {
  id: nonEmptyStringSchema,
  text: textRefSchema,
  required: z.boolean().optional(),
  visibleWhen: guardSchema.optional(),
}

const optionSchema = z.strictObject({
  id: nonEmptyStringSchema,
  text: textRefSchema,
  weight: safeIntSchema.optional(),
})

const questionSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('text'),
    ...questionCommon,
    maxLength: safeIntSchema.refine((value) => value >= 0).optional(),
  }),
  z.strictObject({
    kind: z.literal('number'),
    ...questionCommon,
    min: safeIntSchema.optional(),
    max: safeIntSchema.optional(),
  }),
  z.strictObject({
    kind: z.literal('select'),
    ...questionCommon,
    multiple: z.boolean().optional(),
    options: z.array(optionSchema),
  }),
])

const edgeSchema = z.strictObject({
  to: nonEmptyStringSchema,
  when: guardSchema,
})

const nodeSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('page'),
    title: textRefSchema.optional(),
    questions: z.array(questionSchema),
    edges: z.array(edgeSchema),
  }),
  z.strictObject({
    kind: z.literal('terminal'),
    outcome: nonEmptyStringSchema,
  }),
])

const flowSchema = z.strictObject({
  id: nonEmptyStringSchema,
  version: nonEmptyStringSchema,
  entry: nonEmptyStringSchema,
  nodes: z.record(nonEmptyStringSchema, nodeSchema),
})

export const parseSchema = (input: unknown): Result<FlowSchema, readonly ParseProblem[]> => {
  const parsed = flowSchema.safeParse(input)
  return parsed.success
    ? ok(parsed.data as unknown as FlowSchema)
    : err(toParseProblems(parsed.error.issues))
}
