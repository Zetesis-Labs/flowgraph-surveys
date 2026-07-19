import { err, ok, toQuestionId, type Problem } from '@flowgraph/core'
import { describe, expect, it, vi } from 'vitest'

import { createDraftRegistry } from '../../src/controller/draft-registry.js'

describe('draft registry', () => {
  it('registers by question, replaces registrations, and cleans up idempotently', () => {
    const registry = createDraftRegistry()
    const question = toQuestionId('name')
    const first = vi.fn(() => ok([]))
    const second = vi.fn(() => ok([]))
    const removeFirst = registry.register({
      question,
      order: 0,
      dirty: () => true,
      flush: first,
      focus: vi.fn(),
    })
    const removeSecond = registry.register({
      question,
      order: 0,
      dirty: () => true,
      flush: second,
      focus: vi.fn(),
    })

    removeFirst()
    expect(registry.flush().ok).toBe(true)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()

    removeSecond()
    removeSecond()
    expect(registry.flush()).toEqual(ok([]))
  })

  it('flushes dirty drafts in stable order and accumulates events', () => {
    const registry = createDraftRegistry()
    const calls: string[] = []
    for (const [question, order] of [
      ['late', 2],
      ['first', 0],
      ['middle', 1],
    ] as const) {
      registry.register({
        question: toQuestionId(question),
        order,
        dirty: () => question !== 'middle',
        flush: () => {
          calls.push(question)
          return ok([])
        },
        focus: vi.fn(),
      })
    }

    expect(registry.flush()).toEqual(ok([]))
    expect(calls).toEqual(['first', 'late'])
  })

  it('stops on the first rejection', () => {
    const registry = createDraftRegistry()
    const problem: Problem = { code: 'too-long', where: { q: 'first' } }
    const later = vi.fn(() => ok([]))
    registry.register({
      question: toQuestionId('first'),
      order: 0,
      dirty: () => true,
      flush: () => err([problem]),
      focus: vi.fn(),
    })
    registry.register({
      question: toQuestionId('later'),
      order: 1,
      dirty: () => true,
      flush: later,
      focus: vi.fn(),
    })

    expect(registry.flush()).toEqual(err([problem]))
    expect(later).not.toHaveBeenCalled()
  })

  it('focuses the first registered question problem or returns false', () => {
    const registry = createDraftRegistry()
    const focus = vi.fn()
    registry.register({
      question: toQuestionId('age'),
      order: 1,
      dirty: () => false,
      flush: () => ok([]),
      focus,
    })

    expect(
      registry.focusFirst([
        { code: 'required', where: { q: 'missing' } },
        { code: 'out-of-range', where: { q: 'age' } },
      ]),
    ).toBe(true)
    expect(focus).toHaveBeenCalledOnce()
    expect(registry.focusFirst([{ code: 'no-edge' }])).toBe(false)
  })
})
