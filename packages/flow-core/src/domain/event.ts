import type {
  NodeId,
  OutcomeId,
  QuestionId,
  SafeInt,
  SchemaHash,
  SchemaId,
  SchemaVersion,
} from './ids.js'
import type { Source, PathSegment } from './command.js'
import type { AnswerValue } from './schema.js'

export type EventEnvelope = {
  readonly v: 1
  readonly at: SafeInt
  readonly source: Source
  readonly path: readonly PathSegment[]
}

export type Event =
  | (EventEnvelope & {
      readonly kind: 'SESSION_STARTED'
      readonly schemaId: SchemaId
      readonly schemaVersion: SchemaVersion
      readonly schemaHash: SchemaHash
    })
  | (EventEnvelope & {
      readonly kind: 'ANSWERED'
      readonly q: QuestionId
      readonly value: AnswerValue
    })
  | (EventEnvelope & {
      readonly kind: 'ADVANCED'
      readonly from: NodeId
      readonly to: NodeId
    })
  | (EventEnvelope & {
      readonly kind: 'WENT_BACK'
      readonly from: NodeId
      readonly to: NodeId
    })
  | (EventEnvelope & {
      readonly kind: 'SESSION_FINISHED'
      readonly outcome: OutcomeId
    })
