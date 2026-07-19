import fc from 'fast-check'
import { describe, it } from 'vitest'

import {
  apply,
  decide,
  hashSchema,
  initialState,
  replay,
  toQuestionId,
  toSafeInt,
  type Event,
} from '../../src/index.js'
import { command, event, simpleSchema } from '../support/builders.js'
import { validationSchema } from '../support/scenarios.js'

describe('replay properties', () => {
  it('is deterministic and round-trips event/state JSON for valid logs', () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { maxLength: 20 }), (values) => {
        const schema = validationSchema()
        let state = initialState(schema)
        const start = decide(schema, state, command('START', { schemaHash: hashSchema(schema) }))
        if (!start.ok) return false
        state = start.value.reduce(apply, state)
        let log: readonly Event[] = [...start.value]

        for (const value of values) {
          const result = decide(
            schema,
            state,
            command('ANSWER', { q: toQuestionId('notes'), value }),
          )
          if (!result.ok) return false
          state = result.value.reduce(apply, state)
          log = [...log, ...result.value]
        }

        const parsedLog = JSON.parse(JSON.stringify(log)) as readonly Event[]
        const first = replay(schema, parsedLog)
        const second = replay(schema, parsedLog)
        return (
          JSON.stringify(first) === JSON.stringify(second) &&
          first.ok &&
          JSON.stringify(first.value) === JSON.stringify(JSON.parse(JSON.stringify(state)))
        )
      }),
    )
  })

  it('keeps decide deterministic for identical provenance metadata', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
        fc.constantFrom('human', 'agent', 'import'),
        (at, source) => {
          const schema = simpleSchema()
          const input = command('START', {
            schemaHash: hashSchema(schema),
            meta: { at: toSafeInt(at), source, path: [] },
          })
          return (
            JSON.stringify(decide(schema, initialState(schema), input)) ===
            JSON.stringify(decide(schema, initialState(schema), input))
          )
        },
      ),
    )
  })

  it('rejects every second start and every event appended after finish', () => {
    fc.assert(
      fc.property(fc.nat({ max: 10_000 }), (at) => {
        const schema = simpleSchema()
        const startResult = decide(
          schema,
          initialState(schema),
          command('START', { schemaHash: hashSchema(schema) }),
        )
        if (!startResult.ok || !startResult.value[0]) return false
        const start = startResult.value[0]
        const active = apply(initialState(schema), start)
        const finishResult = decide(
          schema,
          active,
          command('NEXT', { meta: { at: toSafeInt(at), source: 'human', path: [] } }),
        )
        if (!finishResult.ok) return false
        const finishedLog = [start, ...finishResult.value]
        return (
          !replay(schema, [start, start]).ok &&
          !replay(schema, [...finishedLog, event('ANSWERED')]).ok
        )
      }),
    )
  })
})
