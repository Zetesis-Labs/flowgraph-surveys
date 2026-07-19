import { ok, type Command, type Event, type Problem, type Result } from '@flowgraph/core'
import { useCallback, useMemo, useState } from 'react'

import { useFlowState } from '../hooks/use-flow-state.js'
import { deriveFlowView } from '../hooks/use-flow-view.js'
import type {
  AnswerResult,
  FlowSurveyController,
  FrictionAction,
  UseFlowSurveyOptions,
} from '../types.js'
import { createDraftRegistry } from './draft-registry.js'
import { clearQuestionFriction, emptyFriction, rejectedFriction } from './friction.js'
import { draftRegistrySymbol, type InternalFlowSurveyController } from './internal.js'

export const useFlowSurvey = ({
  schema,
  session,
  createMeta,
}: UseFlowSurveyOptions): FlowSurveyController => {
  const state = useFlowState(session)
  const view = useMemo(() => deriveFlowView(schema, state), [schema, state])
  const [friction, setFriction] = useState(emptyFriction)
  const drafts = useMemo(createDraftRegistry, [])

  const dispatch = useCallback(
    (command: Command, action: FrictionAction): Result<readonly Event[], readonly Problem[]> => {
      const result = session.dispatch(command)
      if (!result.ok) setFriction(rejectedFriction(action, result.error))
      else if (action !== 'answer') setFriction(emptyFriction())
      return result
    },
    [session],
  )

  const answer = useCallback<FlowSurveyController['answer']>(
    (question, value) => {
      const result = dispatch({ kind: 'ANSWER', q: question, value, meta: createMeta() }, 'answer')
      if (result.ok) {
        setFriction((current) => clearQuestionFriction(current, question))
      }
      return result
    },
    [createMeta, dispatch],
  )

  const navigate = useCallback(
    (kind: 'NEXT' | 'BACK', action: 'next' | 'back'): AnswerResult => {
      const flushed = drafts.flush()
      if (!flushed.ok) {
        setFriction(rejectedFriction(action, flushed.error))
        return flushed
      }
      const navigated = dispatch({ kind, meta: createMeta() }, action)
      return navigated.ok ? ok([...flushed.value, ...navigated.value]) : navigated
    },
    [createMeta, dispatch, drafts],
  )

  const clearFriction = useCallback(() => {
    setFriction(emptyFriction())
  }, [])

  return useMemo<InternalFlowSurveyController>(
    () => ({
      schema,
      session,
      state,
      view,
      friction,
      answer,
      next: () => navigate('NEXT', 'next'),
      back: () => navigate('BACK', 'back'),
      clearFriction,
      [draftRegistrySymbol]: drafts,
    }),
    [answer, clearFriction, drafts, friction, navigate, schema, session, state, view],
  )
}
