import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useFlowSurvey } from '../../src/controller/use-flow-survey.js'
import {
  createMetaFactory,
  freshSession,
  qName,
  startedSession,
  surveySchema,
} from '../support/builders.js'

describe('useFlowSurvey', () => {
  it('dispatches answers with injected metadata and clears relevant friction', () => {
    const schema = surveySchema()
    const session = startedSession(schema)
    const createMeta = vi.fn(createMetaFactory(20))
    const { result } = renderHook(() => useFlowSurvey({ schema, session, createMeta }))

    let answerResult: ReturnType<typeof result.current.answer> | undefined
    act(() => {
      answerResult = result.current.answer(qName, 'Ada')
    })
    expect(answerResult?.ok).toBe(true)
    expect(session.getEvents().at(-1)).toMatchObject({
      kind: 'ANSWERED',
      q: qName,
      value: 'Ada',
      at: 20,
      source: 'human',
      path: [],
    })
    expect(createMeta).toHaveBeenCalledOnce()
    expect(result.current.friction.problems).toEqual([])
  })

  it('surfaces rejection as ephemeral friction without changing the snapshot', () => {
    const schema = surveySchema()
    const session = freshSession(schema)
    const before = session.getSnapshot()
    const { result } = renderHook(() =>
      useFlowSurvey({ schema, session, createMeta: createMetaFactory() }),
    )

    act(() => {
      result.current.answer(qName, 'Ada')
    })
    expect(session.getSnapshot()).toBe(before)
    expect(result.current.friction).toEqual({
      action: 'answer',
      problems: [{ code: 'session-not-started' }],
    })

    act(() => {
      result.current.clearFriction()
    })
    expect(result.current.friction).toEqual({ problems: [] })
  })

  it('runs next and back through the session and preserves no-op reference stability', () => {
    const schema = surveySchema()
    const session = startedSession(schema)
    const { result } = renderHook(() =>
      useFlowSurvey({ schema, session, createMeta: createMetaFactory() }),
    )
    const before = session.getSnapshot()

    act(() => {
      result.current.back()
    })
    expect(session.getSnapshot()).toBe(before)

    act(() => {
      result.current.next()
    })
    expect(result.current.friction.problems.map(({ code }) => code)).toEqual([
      'required',
      'required',
      'required',
    ])
  })
})
