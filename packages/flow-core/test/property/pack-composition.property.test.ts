import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  compileComposition,
  namespaceNodeId,
  namespaceOptionId,
  namespaceOutcomeId,
  namespaceQuestionId,
  toNodeId,
  toOptionId,
  toOutcomeId,
  toPackInstanceId,
  toQuestionId,
} from '../../src/index.js'
import { validComposition } from '../support/packs.js'

const item = <Value>(values: readonly Value[], index: number): Value => {
  const value = values[index]
  if (value === undefined) throw new Error(`missing fixture item ${String(index)}`)
  return value
}

describe('pack composition properties', () => {
  it('keeps every namespace injective across arbitrary instance/local pairs', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
        ),
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
        ),
        ([firstInstance, firstLocal], [secondInstance, secondLocal]) => {
          fc.pre(firstInstance !== secondInstance || firstLocal !== secondLocal)
          const first = toPackInstanceId(firstInstance)
          const second = toPackInstanceId(secondInstance)
          expect(namespaceNodeId(first, toNodeId(firstLocal))).not.toBe(
            namespaceNodeId(second, toNodeId(secondLocal)),
          )
          expect(namespaceQuestionId(first, toQuestionId(firstLocal))).not.toBe(
            namespaceQuestionId(second, toQuestionId(secondLocal)),
          )
          expect(namespaceOptionId(first, toOptionId(firstLocal))).not.toBe(
            namespaceOptionId(second, toOptionId(secondLocal)),
          )
          expect(namespaceOutcomeId(first, toOutcomeId(firstLocal))).not.toBe(
            namespaceOutcomeId(second, toOutcomeId(secondLocal)),
          )
        },
      ),
      { numRuns: 100 },
    )
  })

  it('compiles deterministically without mutating arbitrary instance identities', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (decisionId, terminalId) => {
          fc.pre(decisionId !== terminalId)
          const base = validComposition()
          const composition = {
            ...base,
            entry: { instance: toPackInstanceId(decisionId), entry: base.entry.entry },
            instances: [
              { id: toPackInstanceId(decisionId), pack: item(base.instances, 0).pack },
              { id: toPackInstanceId(terminalId), pack: item(base.instances, 1).pack },
            ],
            connections: base.connections.map((connection) => ({
              from: {
                instance: toPackInstanceId(decisionId),
                outlet: connection.from.outlet,
              },
              to: {
                instance: toPackInstanceId(terminalId),
                entry: connection.to.entry,
              },
            })),
          }
          const before = JSON.stringify(composition)
          const first = compileComposition(composition)
          const second = compileComposition(composition)
          expect(first).toEqual(second)
          expect(first.ok).toBe(true)
          expect(JSON.stringify(composition)).toBe(before)
        },
      ),
      { numRuns: 50 },
    )
  })
})
