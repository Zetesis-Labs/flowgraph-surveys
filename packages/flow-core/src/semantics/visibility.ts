import type { FlowSchema, Question } from '../domain/schema.js'
import type { FlowState } from '../domain/state.js'
import { isQuestionVisible } from './evaluate.js'

export const visibleQuestions = (schema: FlowSchema, state: FlowState): readonly Question[] => {
  const current = state.trail.at(-1)
  const node = current ? schema.nodes[current] : undefined
  return node?.kind === 'page'
    ? node.questions.filter((question) => isQuestionVisible(schema, state, question.id))
    : []
}
