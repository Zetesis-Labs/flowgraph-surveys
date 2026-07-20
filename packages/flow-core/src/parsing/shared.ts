import { z } from 'zod'

import { normalizeSafeInt } from '../domain/ids.js'
import type { ParseProblem } from '../domain/problem.js'

export const nonEmptyStringSchema = z.string().min(1)

export const safeIntSchema = z.number().refine(Number.isSafeInteger).transform(normalizeSafeInt)

export const nonNegativeSafeIntSchema = safeIntSchema.refine((value) => value >= 0)

export const schemaHashSchema = z.string().regex(/^[0-9a-f]{64}$/u)

export const textRefSchema = z.strictObject({
  key: nonEmptyStringSchema,
  fallback: nonEmptyStringSchema,
})

export const pathSegmentSchema = z.strictObject({
  flow: nonEmptyStringSchema,
  instance: nonEmptyStringSchema.optional(),
})

export const commandMetaSchema = z.strictObject({
  at: nonNegativeSafeIntSchema,
  source: z.enum(['human', 'agent', 'import']),
  path: z.array(pathSegmentSchema).length(0),
})

export const attachmentRefSchema = z.strictObject({
  id: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  mediaType: nonEmptyStringSchema,
  size: nonNegativeSafeIntSchema,
})

export const answerValueSchema = z.union([
  z.string(),
  safeIntSchema,
  z.array(nonEmptyStringSchema).superRefine((values, context) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({ code: 'custom', message: 'Option ids must be unique' })
    }
  }),
  z.array(attachmentRefSchema).superRefine((values, context) => {
    if (new Set(values.map(({ id }) => id)).size !== values.length) {
      context.addIssue({ code: 'custom', message: 'Attachment ids must be unique' })
    }
  }),
])

export const toParseProblems = (issues: readonly z.core.$ZodIssue[]): readonly ParseProblem[] =>
  issues.map((issue) => ({
    code: 'invalid-wire-value',
    path: issue.path.map((part) => (typeof part === 'number' ? part : String(part))),
    details: { message: issue.message },
  }))
