import phq2Goldens from '../fixtures/phq2/goldens.json' with { type: 'json' }
import retailGoldens from '../fixtures/retail/goldens.json' with { type: 'json' }

import { describe, expect, it } from 'vitest'

import { runGoldens, type FlowSchema, type GoldenSuiteV1 } from '../../src/index.js'
import { phq2Schema } from '../fixtures/phq2/journeys.js'
import { retailSchema } from '../fixtures/retail/journeys.js'

describe('runGoldens', () => {
  it.each([
    ['retail', retailSchema, retailGoldens],
    ['PHQ-2', phq2Schema, phq2Goldens],
  ])('executes %s JSON cases through replay and measures every edge', (_name, schema, suite) => {
    const result = runGoldens(schema, suite as unknown as GoldenSuiteV1)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.cases.every(({ passed }) => passed)).toBe(true)
      expect(result.value.coverage.covered).toBe(result.value.coverage.total)
      expect(result.value.coverage.ratio).toBe(1)
      expect(result.value.coverage.edges.every(({ hits }) => hits > 0)).toBe(true)
    }
  })

  it('rejects asserted coverage/hash and malformed command shapes', () => {
    const suite = {
      ...phq2Goldens,
      coverage: 1,
      schema: { ...phq2Goldens.schema, hash: 'forbidden' },
    }
    expect(runGoldens(phq2Schema, suite as unknown as GoldenSuiteV1)).toEqual({
      ok: false,
      error: [{ code: 'invalid-golden' }],
    })
  })

  it('reports identity, rejected-command, and projection failures explicitly', () => {
    expect(
      runGoldens(phq2Schema, {
        ...phq2Goldens,
        schema: { ...phq2Goldens.schema, id: 'other' },
      } as unknown as GoldenSuiteV1),
    ).toMatchObject({ ok: false, error: [{ code: 'schema-identity-mismatch' }] })

    const rejected = {
      ...phq2Goldens,
      cases: [
        {
          id: 'rejected',
          commands: [{ kind: 'NEXT' }],
          expect: { outcome: 'negative' },
        },
      ],
    }
    expect(runGoldens(phq2Schema, rejected as unknown as GoldenSuiteV1)).toMatchObject({
      ok: false,
      error: [{ code: 'command-rejected', caseId: 'rejected', step: 0 }],
    })

    const mismatch = {
      ...phq2Goldens,
      cases: [{ ...phq2Goldens.cases[0], expect: { outcome: 'negative' } }],
    }
    expect(runGoldens(phq2Schema, mismatch as unknown as GoldenSuiteV1)).toMatchObject({
      ok: false,
      error: [{ code: 'expectation-mismatch', caseId: 'referral-route' }],
    })
  })

  it('rejects duplicate case ids and structurally invalid schemas', () => {
    expect(
      runGoldens(phq2Schema, {
        ...phq2Goldens,
        cases: [phq2Goldens.cases[0], phq2Goldens.cases[0]],
      } as unknown as GoldenSuiteV1),
    ).toEqual({ ok: false, error: [{ code: 'invalid-golden' }] })

    const invalid = {
      ...phq2Schema,
      entry: 'missing',
    } as FlowSchema
    expect(runGoldens(invalid, phq2Goldens as unknown as GoldenSuiteV1)).toMatchObject({
      ok: false,
      error: [{ code: 'schema-invalid' }],
    })
  })

  it('compares optional trail and active-answer projections deeply', () => {
    const trailMismatch = {
      ...phq2Goldens,
      cases: [
        {
          ...phq2Goldens.cases[0],
          expect: {
            outcome: 'referral',
            state: {
              trail: ['screen', 'referral', 'extra'],
              activeAnswers: { q1: 'wrong-kind' },
            },
          },
        },
      ],
    }
    expect(runGoldens(phq2Schema, trailMismatch as unknown as GoldenSuiteV1)).toMatchObject({
      ok: false,
      error: [{ code: 'expectation-mismatch' }],
    })

    const answerMismatch = {
      ...phq2Goldens,
      cases: [
        {
          ...phq2Goldens.cases[0],
          expect: {
            outcome: 'referral',
            state: {
              activeAnswers: { q1: ['never'], q2: ['often'] },
            },
          },
        },
      ],
    }
    expect(runGoldens(phq2Schema, answerMismatch as unknown as GoldenSuiteV1)).toMatchObject({
      ok: false,
      error: [{ code: 'expectation-mismatch' }],
    })
  })
})
