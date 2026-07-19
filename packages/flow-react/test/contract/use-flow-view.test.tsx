import { toSafeInt } from '@flowgraph/core'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useFlowView } from '../../src/hooks/use-flow-view.js'
import {
  createMetaFactory,
  optionEmail,
  optionSleep,
  qAge,
  qChannels,
  qName,
  qReason,
  startedSession,
  surveySchema,
} from '../support/builders.js'

describe('useFlowView', () => {
  it('derives current page, visible questions, values, progress, back, and completion', () => {
    const schema = surveySchema()
    const session = startedSession(schema)
    const meta = createMetaFactory(10)
    const { result } = renderHook(() => useFlowView(schema, session))

    expect(result.current.status).toBe('active')
    expect(result.current.current.kind).toBe('page')
    expect(result.current.questions.map(({ question }) => question.id)).toEqual([
      qName,
      qAge,
      qReason,
      qChannels,
    ])
    expect(result.current.progress.fraction).toBe(0)
    expect(result.current.canGoBack).toBe(false)
    expect(result.current.finished).toBe(false)

    act(() => {
      session.dispatch({ kind: 'ANSWER', q: qName, value: 'Ada', meta: meta() })
      session.dispatch({ kind: 'ANSWER', q: qAge, value: toSafeInt(36), meta: meta() })
      session.dispatch({ kind: 'ANSWER', q: qReason, value: [optionSleep], meta: meta() })
      session.dispatch({ kind: 'ANSWER', q: qChannels, value: [optionEmail], meta: meta() })
    })
    expect(result.current.questions[0]?.value).toBe('Ada')
    expect(result.current.activeAnswers[qName]).toBe('Ada')

    act(() => {
      session.dispatch({ kind: 'NEXT', meta: meta() })
    })
    expect(result.current.questions).toHaveLength(1)
    expect(result.current.canGoBack).toBe(true)
    expect(result.current.progress.completedEdges).toBe(1)

    act(() => {
      session.dispatch({ kind: 'NEXT', meta: meta() })
    })
    expect(result.current.finished).toBe(true)
    expect(result.current.status).toBe('finished')
    expect(result.current.questions).toEqual([])
    expect(result.current.outcome).toBe('submitted')
    expect(result.current.progress.fraction).toBe(1)
  })
})
