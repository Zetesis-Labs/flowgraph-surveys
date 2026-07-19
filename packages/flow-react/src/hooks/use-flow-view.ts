import {
  activeAnswers,
  canGoBack,
  currentNode,
  isFinished,
  outcome,
  progress,
  storedAnswer,
  visibleQuestions,
  type FlowSchema,
  type FlowState,
} from '@flowgraph/core'
import type { FlowSession } from '@flowgraph/session'
import { useMemo } from 'react'

import type { FlowView } from '../types.js'
import { useFlowState } from './use-flow-state.js'

export const deriveFlowView = (schema: FlowSchema, state: FlowState): FlowView => ({
  status: state.status,
  current: currentNode(schema, state),
  questions: visibleQuestions(schema, state).map((question, order) => ({
    question,
    value: storedAnswer(state, question.id),
    order,
  })),
  progress: progress(schema, state),
  canGoBack: canGoBack(state),
  finished: isFinished(state),
  outcome: outcome(state),
  activeAnswers: activeAnswers(schema, state),
})

export const useFlowView = (schema: FlowSchema, session: FlowSession): FlowView => {
  const state = useFlowState(session)
  return useMemo(() => deriveFlowView(schema, state), [schema, state])
}
