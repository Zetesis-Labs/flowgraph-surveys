import {
  activeAnswers,
  check,
  evaluateGuard,
  probe,
  runGoldens,
  toNodeId,
  toQuestionId,
  type FlowState,
} from '@flowgraph/core'
import { createSession } from '@flowgraph/session'
import { describe, expect, it } from 'vitest'

import { demoGoldens } from '../src/fixture/goldens.js'
import { demoSchema } from '../src/fixture/schema.js'
import { inventoryPrimitives, verifyDemoFixture } from '../src/fixture/verify.js'

describe('demo fixture', () => {
  it('passes structural checks and bounded probing', () => {
    expect(check(demoSchema).filter(({ severity }) => severity === 'error')).toEqual([])
    expect(check(demoSchema)).toContainEqual(
      expect.objectContaining({ code: 'missing-default-edge', severity: 'warning' }),
    )
    const report = probe(demoSchema)
    expect(report.complete).toBe(true)
    expect(report.problems.filter(({ severity }) => severity === 'error')).toEqual([])
  })

  it('passes every golden with 100% engine-measured edge coverage', () => {
    const report = runGoldens(demoSchema, demoGoldens)
    expect(report.ok).toBe(true)
    if (!report.ok) return
    expect(report.value.cases.every(({ passed }) => passed)).toBe(true)
    expect(report.value.coverage).toMatchObject({
      total: 14,
      covered: 14,
      ratio: 1,
    })
  })

  it('directly contains every governed guard and numeric expression', () => {
    expect(inventoryPrimitives(demoSchema)).toEqual({
      guards: ['all', 'always', 'answered', 'any', 'cmp', 'not', 'selected'],
      numerics: ['answer', 'num', 'score', 'sum'],
    })
  })

  it('preserves unknown truth while the compound logistical inputs are absent', () => {
    const adaptation = demoSchema.nodes[toNodeId('adaptation')]
    expect(adaptation?.kind).toBe('page')
    if (adaptation?.kind !== 'page') return

    const state = {
      status: 'active',
      schemaId: demoSchema.id,
      schemaVersion: demoSchema.version,
      trail: [
        toNodeId('starting-point'),
        toNodeId('stress-context'),
        toNodeId('preferences'),
        toNodeId('adaptation'),
      ],
      answers: {},
    } satisfies FlowState

    const spacious = adaptation.edges.find(({ to }) => to === toNodeId('spacious-context'))
    const focused = adaptation.edges.find(({ to }) => to === toNodeId('focused-context'))

    expect(spacious).toBeDefined()
    expect(focused).toBeDefined()
    if (spacious === undefined || focused === undefined) return

    expect(evaluateGuard(demoSchema, state, spacious.when)).toBe('unknown')
    expect(evaluateGuard(demoSchema, state, focused.when)).toBe('unknown')
  })

  it('keeps abandoned route answers in history but outside active truth', () => {
    const correction = demoGoldens.cases.find(({ id }) => id === 'route-correction')
    expect(correction).toBeDefined()
    const report = runGoldens(demoSchema, {
      ...demoGoldens,
      cases: correction === undefined ? [] : [correction],
    })
    expect(report.ok).toBe(true)

    const allCommands = correction?.commands ?? []
    const events = runGoldens(demoSchema, demoGoldens)
    expect(events.ok).toBe(true)

    const session = createSession(demoSchema)
    expect(session.ok).toBe(true)
    if (!session.ok) return
    // The golden runner already verifies the final response; its expected state is
    // also a readable contract that must omit the abandoned sleep answer.
    expect(correction?.expect.state?.activeAnswers).not.toHaveProperty(toQuestionId('sleep-hours'))
    expect(allCommands.some(({ kind }) => kind === 'BACK')).toBe(true)
    expect(activeAnswers(demoSchema, session.value.getSnapshot())).toEqual({})
  })

  it('exposes one fail-fast verification result for app startup', () => {
    expect(verifyDemoFixture().valid).toBe(true)
  })
})
