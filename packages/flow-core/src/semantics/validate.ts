import type { Problem } from '../domain/problem.js'
import type { AnswerValue, FlowSchema, Question } from '../domain/schema.js'
import type { FlowState } from '../domain/state.js'
import type { QuestionId } from '../domain/ids.js'
import { findQuestion, isQuestionVisible, isTypedAnswer } from './evaluate.js'
import { visibleQuestions } from './visibility.js'

const problem = (code: Problem['code'], q: QuestionId): Problem => ({
  code,
  where: { q },
})

export const structuralAnswerProblems = (
  schema: FlowSchema,
  state: FlowState,
  questionId: QuestionId,
  value: AnswerValue,
): readonly Problem[] => {
  const location = findQuestion(schema, questionId)
  if (!location) return [problem('unknown-question', questionId)]
  if (state.trail.at(-1) !== location.page || !isQuestionVisible(schema, state, questionId)) {
    return [problem('not-current-page', questionId)]
  }
  if (!isTypedAnswer(location.question, value)) {
    return [problem('answer-kind-mismatch', questionId)]
  }
  const question = location.question
  if (question.kind !== 'select' || !Array.isArray(value)) return []
  if (new Set(value).size !== value.length) return [problem('duplicate-option', questionId)]
  if (value.some((selected) => !question.options.some((option) => option.id === selected))) {
    return [problem('unknown-option', questionId)]
  }
  return question.multiple !== true && value.length > 1
    ? [problem('arity-mismatch', questionId)]
    : []
}

const isEmpty = (question: Question, value: AnswerValue | undefined): boolean =>
  value === undefined ||
  (question.kind === 'text' && value === '') ||
  (question.kind === 'select' && Array.isArray(value) && value.length === 0)

export const questionProblems = (
  schema: FlowSchema,
  state: FlowState,
  questionId: QuestionId,
): readonly Problem[] => {
  const location = findQuestion(schema, questionId)
  if (!location || !isQuestionVisible(schema, state, questionId)) return []
  const { question } = location
  const value = state.answers[questionId]
  const required =
    question.required === true && isEmpty(question, value) ? [problem('required', questionId)] : []
  if (value === undefined || !isTypedAnswer(question, value)) return required

  if (
    question.kind === 'number' &&
    typeof value === 'number' &&
    ((question.min !== undefined && value < question.min) ||
      (question.max !== undefined && value > question.max))
  ) {
    return [...required, problem('out-of-range', questionId)]
  }
  if (
    question.kind === 'text' &&
    typeof value === 'string' &&
    question.maxLength !== undefined &&
    Array.from(value).length > question.maxLength
  ) {
    return [...required, problem('too-long', questionId)]
  }
  return required
}

export const currentPageProblems = (schema: FlowSchema, state: FlowState): readonly Problem[] =>
  visibleQuestions(schema, state).flatMap((question) =>
    questionProblems(schema, state, question.id),
  )
