import type { Event, Problem, QuestionId, Result } from '@flowgraph/core'
import { useContext, useEffect } from 'react'

import { QuestionOrderContext, useDraftRegistry } from '../controller/internal.js'

export const useDraftRegistration = (
  question: QuestionId,
  dirty: () => boolean,
  flush: () => Result<readonly Event[], readonly Problem[]>,
  focus: () => void,
): void => {
  const registry = useDraftRegistry()
  const order = useContext(QuestionOrderContext)
  useEffect(
    () => registry.register({ question, order, dirty, flush, focus }),
    [dirty, flush, focus, order, question, registry],
  )
}
