import type { QuestionId } from '../domain/ids.js'
import type { AnswerValue, FlowSchema } from '../domain/schema.js'
import type { FlowState } from '../domain/state.js'
import { findQuestion, isQuestionVisible, isTypedAnswer } from './evaluate.js'

export const storedAnswer = (state: FlowState, question: QuestionId): AnswerValue | undefined =>
  state.answers[question]

export const activeAnswers = (
  schema: FlowSchema,
  state: FlowState,
): Readonly<Record<QuestionId, AnswerValue>> =>
  Object.fromEntries(
    Object.entries(state.answers).filter(([questionId, value]) => {
      const location = findQuestion(schema, questionId as QuestionId)
      return (
        location !== undefined &&
        state.trail.includes(location.page) &&
        isTypedAnswer(location.question, value) &&
        isQuestionVisible(schema, state, questionId as QuestionId)
      )
    }),
  )
