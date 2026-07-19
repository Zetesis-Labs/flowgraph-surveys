import type { QuestionId, SafeInt, SchemaHash } from './ids.js'
import type { AnswerValue } from './schema.js'

export type Source = 'human' | 'agent' | 'import'

export type PathSegment = {
  readonly flow: string
  readonly instance?: string
}

export type CommandMeta = {
  readonly at: SafeInt
  readonly source: Source
  readonly path: readonly PathSegment[]
}

export type Command =
  | {
      readonly kind: 'START'
      readonly meta: CommandMeta
      readonly schemaHash: SchemaHash
    }
  | {
      readonly kind: 'ANSWER'
      readonly meta: CommandMeta
      readonly q: QuestionId
      readonly value: AnswerValue
    }
  | { readonly kind: 'NEXT'; readonly meta: CommandMeta }
  | { readonly kind: 'BACK'; readonly meta: CommandMeta }
