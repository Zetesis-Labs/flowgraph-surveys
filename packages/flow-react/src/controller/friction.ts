import type { Problem, QuestionId } from '@flowgraph/core'

import type { FrictionAction, FrictionState } from '../types.js'
import { problemQuestion } from '../view/problem-mapping.js'

export const emptyFriction = (): FrictionState => ({ problems: [] })

export const rejectedFriction = (
  action: FrictionAction,
  problems: readonly Problem[],
): FrictionState => ({ action, problems })

export const clearQuestionFriction = (
  friction: FrictionState,
  question: QuestionId,
): FrictionState => {
  const problems = friction.problems.filter((problem) => problemQuestion(problem) !== question)
  return problems.length === friction.problems.length
    ? friction
    : problems.length === 0
      ? emptyFriction()
      : { problems }
}
