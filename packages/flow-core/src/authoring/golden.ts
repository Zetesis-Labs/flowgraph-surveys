import { z } from 'zod'

import type { Command } from '../domain/command.js'
import type { Event } from '../domain/event.js'
import {
  toNodeId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
} from '../domain/ids.js'
import type { GoldenProblem } from '../domain/problem.js'
import { err, ok, type Result } from '../domain/result.js'
import type { AnswerValue, FlowSchema } from '../domain/schema.js'
import type { GoldenCommand, GoldenSuiteV1, GoldenReport } from '../domain/state.js'
import { decide } from '../engine/decide.js'
import type { initialState } from '../engine/initial-state.js'
import { replay } from '../engine/replay.js'
import { hashSchema } from '../integrity/schema-hash.js'
import {
  answerValueSchema,
  nonEmptyStringSchema,
  nonNegativeSafeIntSchema,
} from '../parsing/shared.js'
import { activeAnswers } from '../semantics/active-truth.js'
import { check } from './check.js'
import { calculateCoverage, type CoverageCaseLog } from './coverage.js'

const provenance = {
  source: z.enum(['human', 'agent', 'import']).optional(),
  at: nonNegativeSafeIntSchema.optional(),
}

const goldenCommandSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('START'), ...provenance }),
  z.strictObject({
    kind: z.literal('ANSWER'),
    q: nonEmptyStringSchema,
    value: answerValueSchema,
    ...provenance,
  }),
  z.strictObject({ kind: z.literal('NEXT'), ...provenance }),
  z.strictObject({ kind: z.literal('BACK'), ...provenance }),
])

const expectedStateSchema = z.strictObject({
  current: nonEmptyStringSchema.optional(),
  trail: z.array(nonEmptyStringSchema).optional(),
  activeAnswers: z.record(nonEmptyStringSchema, answerValueSchema).optional(),
})

const goldenSuiteSchema = z
  .strictObject({
    formatVersion: z.literal(1),
    schema: z.strictObject({
      id: nonEmptyStringSchema,
      version: nonEmptyStringSchema,
    }),
    cases: z.array(
      z.strictObject({
        id: nonEmptyStringSchema,
        commands: z.array(goldenCommandSchema),
        expect: z.strictObject({
          outcome: nonEmptyStringSchema,
          state: expectedStateSchema.optional(),
        }),
      }),
    ),
  })
  .superRefine(({ cases }, context) => {
    if (new Set(cases.map(({ id }) => id)).size !== cases.length) {
      context.addIssue({ code: 'custom', message: 'Golden case ids must be unique' })
    }
  })

const parseSuite = (input: unknown): GoldenSuiteV1 | undefined => {
  const parsed = goldenSuiteSchema.safeParse(input)
  if (!parsed.success) return undefined
  const convertCommand = (
    command: (typeof parsed.data.cases)[number]['commands'][number],
  ): GoldenCommand => {
    const optional = {
      ...(command.source !== undefined ? { source: command.source } : {}),
      ...(command.at !== undefined ? { at: command.at } : {}),
    }
    return command.kind === 'ANSWER'
      ? {
          kind: 'ANSWER',
          q: toQuestionId(command.q),
          value: command.value as AnswerValue,
          ...optional,
        }
      : { kind: command.kind, ...optional }
  }
  return {
    formatVersion: 1,
    schema: {
      id: toSchemaId(parsed.data.schema.id),
      version: toSchemaVersion(parsed.data.schema.version),
    },
    cases: parsed.data.cases.map((testCase) => ({
      id: testCase.id,
      commands: testCase.commands.map(convertCommand),
      expect: {
        outcome: toOutcomeId(testCase.expect.outcome),
        ...(testCase.expect.state
          ? {
              state: {
                ...(testCase.expect.state.current
                  ? { current: toNodeId(testCase.expect.state.current) }
                  : {}),
                ...(testCase.expect.state.trail
                  ? { trail: testCase.expect.state.trail.map(toNodeId) }
                  : {}),
                ...(testCase.expect.state.activeAnswers
                  ? {
                      activeAnswers: Object.fromEntries(
                        Object.entries(testCase.expect.state.activeAnswers).map(([id, value]) => [
                          toQuestionId(id),
                          value as AnswerValue,
                        ]),
                      ),
                    }
                  : {}),
              },
            }
          : {}),
      },
    })),
  }
}

const materialize = (
  schema: FlowSchema,
  intent: GoldenSuiteV1['cases'][number]['commands'][number],
  step: number,
): Command => {
  const meta = {
    at: toSafeInt(intent.at ?? step),
    source: intent.source ?? ('human' as const),
    path: [],
  }
  switch (intent.kind) {
    case 'START':
      return { kind: 'START', meta, schemaHash: hashSchema(schema) }
    case 'ANSWER':
      return {
        kind: 'ANSWER',
        meta,
        q: intent.q,
        value: intent.value,
      }
    case 'NEXT':
      return { kind: 'NEXT', meta }
    case 'BACK':
      return { kind: 'BACK', meta }
  }
}

const equalData = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((value, index) => equalData(value, right[index]))
    )
  }
  if (
    typeof left === 'object' &&
    left !== null &&
    !Array.isArray(left) &&
    typeof right === 'object' &&
    right !== null &&
    !Array.isArray(right)
  ) {
    const leftRecord = left as Readonly<Record<string, unknown>>
    const rightRecord = right as Readonly<Record<string, unknown>>
    const keys = Object.keys(leftRecord)
    return (
      keys.length === Object.keys(rightRecord).length &&
      keys.every((key) => equalData(leftRecord[key], rightRecord[key]))
    )
  }
  return false
}

export const runGoldens = (
  schema: FlowSchema,
  input: GoldenSuiteV1,
): Result<GoldenReport, readonly GoldenProblem[]> => {
  const suite = parseSuite(input)
  if (!suite) return err([{ code: 'invalid-golden' }])
  if (suite.schema.id !== schema.id || suite.schema.version !== schema.version) {
    return err([{ code: 'schema-identity-mismatch' }])
  }
  const structural = check(schema).filter(({ severity }) => severity === 'error')
  if (structural.length > 0) {
    return err([{ code: 'schema-invalid', details: { problems: structural } }])
  }

  const logs: CoverageCaseLog[] = []
  for (const testCase of suite.cases) {
    let events: readonly Event[] = []
    for (const [step, intent] of testCase.commands.entries()) {
      const restored = replay(schema, events) as {
        readonly ok: true
        readonly value: ReturnType<typeof initialState>
      }
      const decided = decide(schema, restored.value, materialize(schema, intent, step))
      if (!decided.ok) {
        return err([
          {
            code: 'command-rejected',
            caseId: testCase.id,
            step,
            details: { problems: decided.error },
          },
        ])
      }
      events = [...events, ...decided.value]
      replay(schema, events)
    }

    const restored = replay(schema, events) as {
      readonly ok: true
      readonly value: ReturnType<typeof initialState>
    }
    const expectedState = testCase.expect.state
    const actualActive = activeAnswers(schema, restored.value)
    if (
      restored.value.outcome !== testCase.expect.outcome ||
      (expectedState?.current !== undefined &&
        restored.value.trail.at(-1) !== expectedState.current) ||
      (expectedState?.trail !== undefined &&
        !equalData(restored.value.trail, expectedState.trail)) ||
      (expectedState?.activeAnswers !== undefined &&
        !equalData(actualActive, expectedState.activeAnswers))
    ) {
      return err([{ code: 'expectation-mismatch', caseId: testCase.id }])
    }
    logs.push({ id: testCase.id, events })
  }

  return ok({
    cases: suite.cases.map(({ id }) => ({ id, passed: true })),
    coverage: calculateCoverage(schema, logs),
  })
}
