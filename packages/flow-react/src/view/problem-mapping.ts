import { toQuestionId, type Problem, type QuestionId } from '@flowgraph/core'

export const problemQuestion = (problem: Problem): QuestionId | undefined => {
  const question = problem.where?.q
  return typeof question === 'string' ? toQuestionId(question) : undefined
}

export const problemsForQuestion = (
  problems: readonly Problem[],
  question: QuestionId,
): readonly Problem[] => problems.filter((problem) => problemQuestion(problem) === question)

export const orderProblems = (
  problems: readonly Problem[],
  questions: readonly QuestionId[],
): readonly Problem[] => {
  const order = new Map(questions.map((question, index) => [question, index]))
  return problems
    .map((problem, index) => ({ problem, index }))
    .sort((left, right) => {
      const leftOrder = order.get(problemQuestion(left.problem) ?? toQuestionId('')) ?? Infinity
      const rightOrder = order.get(problemQuestion(right.problem) ?? toQuestionId('')) ?? Infinity
      return leftOrder - rightOrder || left.index - right.index
    })
    .map(({ problem }) => problem)
}
