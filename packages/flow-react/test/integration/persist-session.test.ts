import { err, ok, toSafeInt, type Event } from '@flowgraph/core'
import { describe, expect, it, vi } from 'vitest'

import { persistSession } from '../../src/persistence/persist-session.js'
import type { BrowserEventStore, PersistenceProblem } from '../../src/persistence/types.js'
import { createMetaFactory, qAge, startedSession, surveySchema } from '../support/builders.js'

describe('persistSession', () => {
  it('saves the complete committed log and stops after idempotent unsubscribe', () => {
    const session = startedSession(surveySchema())
    const save = vi.fn((_: readonly Event[]) => ok(undefined))
    const store: BrowserEventStore = {
      load: () => ok(undefined),
      save,
      clear: () => ok(undefined),
    }
    const onProblem = vi.fn()
    const unsubscribe = persistSession(session, store, onProblem)

    session.dispatch({
      kind: 'ANSWER',
      q: qAge,
      value: toSafeInt(36),
      meta: createMetaFactory(90)(),
    })
    expect(save).toHaveBeenCalledOnce()
    expect(save).toHaveBeenLastCalledWith(session.getEvents())
    expect(onProblem).not.toHaveBeenCalled()

    unsubscribe()
    unsubscribe()
    session.dispatch({
      kind: 'ANSWER',
      q: qAge,
      value: toSafeInt(37),
      meta: createMetaFactory(91)(),
    })
    expect(save).toHaveBeenCalledOnce()
  })

  it('reports one save failure without throwing or retrying the committed command', () => {
    const session = startedSession(surveySchema())
    const problem: PersistenceProblem = { code: 'storage-write-failed' }
    const save = vi.fn(() => err(problem))
    const onProblem = vi.fn()
    persistSession(
      session,
      {
        load: () => ok(undefined),
        save,
        clear: () => ok(undefined),
      },
      onProblem,
    )

    expect(() =>
      session.dispatch({
        kind: 'ANSWER',
        q: qAge,
        value: toSafeInt(36),
        meta: createMetaFactory(100)(),
      }),
    ).not.toThrow()
    expect(session.getSnapshot().answers[qAge]).toBe(toSafeInt(36))
    expect(save).toHaveBeenCalledOnce()
    expect(onProblem).toHaveBeenCalledOnce()
    expect(onProblem).toHaveBeenCalledWith(problem)
  })

  it('contains an unexpected store exception inside the persistence listener', () => {
    const session = startedSession(surveySchema())
    const cause = new Error('unexpected adapter failure')
    const onProblem = vi.fn()
    persistSession(
      session,
      {
        load: () => ok(undefined),
        save: () => {
          throw cause
        },
        clear: () => ok(undefined),
      },
      onProblem,
    )

    expect(() =>
      session.dispatch({
        kind: 'ANSWER',
        q: qAge,
        value: toSafeInt(36),
        meta: createMetaFactory(101)(),
      }),
    ).not.toThrow()
    expect(onProblem).toHaveBeenCalledWith({ code: 'storage-write-failed', cause })
  })
})
