import {
  isSafeInt,
  toNodeId,
  toSafeInt,
  type NodeId,
  type OptionId,
  type QuestionId,
} from '../domain/ids.js'
import type {
  AnswerValue,
  FlowSchema,
  Guard,
  NumericExpr,
  NumericResult,
  Question,
  Truth,
} from '../domain/schema.js'
import type { FlowState } from '../domain/state.js'
import { allTruth, anyTruth, notTruth } from './truth.js'

export type QuestionLocation = {
  readonly page: NodeId
  readonly index: number
  readonly question: Question
}

export const findQuestion = (
  schema: FlowSchema,
  questionId: QuestionId,
): QuestionLocation | undefined => {
  for (const [nodeId, node] of Object.entries(schema.nodes)) {
    if (node.kind !== 'page') continue
    const index = node.questions.findIndex((question) => question.id === questionId)
    const question = node.questions[index]
    if (question) return { page: toNodeId(nodeId), index, question }
  }
  return undefined
}

export const isTypedAnswer = (question: Question, value: AnswerValue): boolean => {
  switch (question.kind) {
    case 'text':
      return typeof value === 'string'
    case 'number':
      return isSafeInt(value)
    case 'select':
      return Array.isArray(value) && value.every((option) => typeof option === 'string')
  }
}

const activeValue = (
  schema: FlowSchema,
  state: FlowState,
  questionId: QuestionId,
  visiting: readonly QuestionId[],
): { readonly question: Question; readonly value: AnswerValue } | undefined => {
  const location = findQuestion(schema, questionId)
  if (!location || !state.trail.includes(location.page)) return undefined
  const value = state.answers[questionId]
  if (
    value === undefined ||
    !isTypedAnswer(location.question, value) ||
    !isQuestionVisible(schema, state, questionId, visiting)
  ) {
    return undefined
  }
  return { question: location.question, value }
}

export const isQuestionVisible = (
  schema: FlowSchema,
  state: FlowState,
  questionId: QuestionId,
  visiting: readonly QuestionId[] = [],
): boolean => {
  const location = findQuestion(schema, questionId)
  if (!location || !state.trail.includes(location.page) || visiting.includes(questionId)) {
    return false
  }
  return (
    location.question.visibleWhen === undefined ||
    evaluateGuardInternal(schema, state, location.question.visibleWhen, [
      ...visiting,
      questionId,
    ]) === 'true'
  )
}

const known = (value: bigint): NumericResult =>
  value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
    ? { kind: 'known', value: toSafeInt(Number(value)) }
    : { kind: 'unknown' }

const evaluateNumericInternal = (
  schema: FlowSchema,
  state: FlowState,
  expression: NumericExpr,
  visiting: readonly QuestionId[],
): NumericResult => {
  switch (expression.kind) {
    case 'num':
      return { kind: 'known', value: expression.value }
    case 'answer': {
      const active = activeValue(schema, state, expression.q, visiting)
      return active?.question.kind === 'number' && typeof active.value === 'number'
        ? { kind: 'known', value: active.value }
        : { kind: 'unknown' }
    }
    case 'score': {
      const active = activeValue(schema, state, expression.q, visiting)
      if (!active) return { kind: 'unknown' }
      if (active.question.kind !== 'select') return { kind: 'unknown' }
      const question = active.question
      const selectedValues = active.value as readonly OptionId[]
      const weights = selectedValues.map((selected) => {
        const option = question.options.find((candidate) => candidate.id === selected)
        return option ? BigInt(option.weight ?? 0) : undefined
      })
      if (weights.some((weight) => weight === undefined)) return { kind: 'unknown' }
      return known(
        weights
          .filter((weight): weight is bigint => weight !== undefined)
          .reduce<bigint>((total, weight) => total + weight, 0n),
      )
    }
    case 'sum': {
      const values = expression.values.map((value) =>
        evaluateNumericInternal(schema, state, value, visiting),
      )
      return values.some((value) => value.kind === 'unknown')
        ? { kind: 'unknown' }
        : known(
            values.reduce(
              (total, value) =>
                total + BigInt((value as NumericResult & { readonly kind: 'known' }).value),
              0n,
            ),
          )
    }
  }
}

export const evaluateNumeric = (
  schema: FlowSchema,
  state: FlowState,
  expression: NumericExpr,
): NumericResult => evaluateNumericInternal(schema, state, expression, [])

const compare = (left: number, right: number, op: Guard & { readonly kind: 'cmp' }): boolean => {
  switch (op.op) {
    case 'eq':
      return left === right
    case 'ne':
      return left !== right
    case 'lt':
      return left < right
    case 'lte':
      return left <= right
    case 'gt':
      return left > right
    case 'gte':
      return left >= right
  }
}

const evaluateGuardInternal = (
  schema: FlowSchema,
  state: FlowState,
  guard: Guard,
  visiting: readonly QuestionId[],
): Truth => {
  switch (guard.kind) {
    case 'always':
      return 'true'
    case 'answered':
      return activeValue(schema, state, guard.q, visiting) ? 'true' : 'false'
    case 'selected': {
      const active = activeValue(schema, state, guard.q, visiting)
      return active?.question.kind === 'select' && Array.isArray(active.value)
        ? active.value.includes(guard.option)
          ? 'true'
          : 'false'
        : 'unknown'
    }
    case 'not':
      return notTruth(evaluateGuardInternal(schema, state, guard.value, visiting))
    case 'all':
      return allTruth(
        guard.values.map((value) => evaluateGuardInternal(schema, state, value, visiting)),
      )
    case 'any':
      return anyTruth(
        guard.values.map((value) => evaluateGuardInternal(schema, state, value, visiting)),
      )
    case 'cmp': {
      const left = evaluateNumericInternal(schema, state, guard.left, visiting)
      const right = evaluateNumericInternal(schema, state, guard.right, visiting)
      return left.kind === 'known' && right.kind === 'known'
        ? compare(left.value, right.value, guard)
          ? 'true'
          : 'false'
        : 'unknown'
    }
  }
}

export const evaluateGuard = (schema: FlowSchema, state: FlowState, guard: Guard): Truth =>
  evaluateGuardInternal(schema, state, guard, [])
