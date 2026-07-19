import type { Event } from '../domain/event.js'
import type { Problem } from '../domain/problem.js'
import { err, ok, type Result } from '../domain/result.js'
import { parseEvents } from './event.js'

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const upcastEvents = (input: readonly unknown[]): Result<readonly Event[], Problem> => {
  if (input.some((value) => isRecord(value) && value.v !== undefined && value.v !== 1)) {
    return err({ code: 'unsupported-event-version' })
  }
  const parsed = parseEvents(input)
  return parsed.ok ? ok(parsed.value) : err({ code: 'log-schema-mismatch' })
}
