import { toQuestionId, type Problem } from '@flowgraph/core'
import { describe, expect, it } from 'vitest'

import {
  orderProblems,
  problemQuestion,
  problemsForQuestion,
} from '../../src/view/problem-mapping.js'
import { resolveText } from '../../src/view/resolve-text.js'

describe('presentation mapping', () => {
  it('uses a resolved value and falls back for missing or empty resolutions', () => {
    const ref = { key: 'question.name', fallback: 'Nombre' }

    expect(resolveText(ref)).toBe('Nombre')
    expect(resolveText(ref, () => 'Name')).toBe('Name')
    expect(resolveText(ref, () => undefined)).toBe('Nombre')
    expect(resolveText(ref, () => '')).toBe('Nombre')
  })

  it('extracts question ids only from string problem locations', () => {
    expect(problemQuestion({ code: 'required', where: { q: 'name' } })).toBe('name')
    expect(problemQuestion({ code: 'no-edge', where: { node: 'page' } })).toBeUndefined()
    expect(problemQuestion({ code: 'required', where: { q: 4 } })).toBeUndefined()
  })

  it('orders question problems by visible order and leaves page problems last', () => {
    const age = toQuestionId('age')
    const name = toQuestionId('name')
    const problems: readonly Problem[] = [
      { code: 'no-edge' },
      { code: 'required', where: { q: age } },
      { code: 'too-long', where: { q: name } },
      { code: 'out-of-range', where: { q: age } },
    ]

    expect(orderProblems(problems, [name, age])).toEqual([
      problems[2],
      problems[1],
      problems[3],
      problems[0],
    ])
    expect(problemsForQuestion(problems, age)).toEqual([problems[1], problems[3]])

    const unknown: Problem = { code: 'required', where: { q: 'unknown' } }
    const pageProblem: Problem = { code: 'no-edge' }
    expect(orderProblems([unknown, pageProblem], [name, age])).toEqual([unknown, pageProblem])
  })
})
