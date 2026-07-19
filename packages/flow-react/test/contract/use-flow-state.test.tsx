import { hashSchema } from '@flowgraph/core'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useFlowState } from '../../src/hooks/use-flow-state.js'
import { createMetaFactory, freshSession, qName, surveySchema } from '../support/builders.js'

describe('useFlowState', () => {
  it('returns the exact cached snapshot and updates only after a non-empty commit', () => {
    const schema = surveySchema()
    const session = freshSession(schema)
    const initial = session.getSnapshot()
    const renders = vi.fn()
    const { result } = renderHook(() => {
      renders()
      return useFlowState(session)
    })

    expect(result.current).toBe(initial)
    act(() => {
      session.dispatch({
        kind: 'ANSWER',
        q: qName,
        value: 'ignored',
        meta: createMetaFactory()(),
      })
    })
    expect(result.current).toBe(initial)
    expect(renders).toHaveBeenCalledOnce()

    act(() => {
      session.dispatch({
        kind: 'START',
        schemaHash: hashSchema(schema),
        meta: createMetaFactory()(),
      })
    })
    expect(result.current).toBe(session.getSnapshot())
    expect(result.current).not.toBe(initial)
    expect(renders).toHaveBeenCalledTimes(2)

    const started = result.current
    act(() => {
      session.dispatch({ kind: 'BACK', meta: createMetaFactory()() })
    })
    expect(result.current).toBe(started)
    expect(renders).toHaveBeenCalledTimes(2)
  })

  it('unsubscribes on unmount and resubscribes when the session changes', () => {
    const first = freshSession()
    const second = freshSession()
    const firstUnsubscribe = vi.fn()
    const secondUnsubscribe = vi.fn()
    const withObservedCleanup = (session: typeof first, cleanup: () => void): typeof first => ({
      ...session,
      subscribe: (listener) => {
        const unsubscribe = session.subscribe(listener)
        return () => {
          unsubscribe()
          cleanup()
        }
      },
    })
    const observedFirst = withObservedCleanup(first, firstUnsubscribe)
    const observedSecond = withObservedCleanup(second, secondUnsubscribe)
    const { rerender, unmount } = renderHook(({ session }) => useFlowState(session), {
      initialProps: { session: observedFirst },
    })

    rerender({ session: observedSecond })
    expect(firstUnsubscribe).toHaveBeenCalledOnce()
    unmount()
    expect(secondUnsubscribe).toHaveBeenCalledOnce()
  })
})
