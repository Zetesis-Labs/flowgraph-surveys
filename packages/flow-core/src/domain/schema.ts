import type {
  AttachmentId,
  NodeId,
  OptionId,
  OutcomeId,
  QuestionId,
  SafeInt,
  SchemaId,
  SchemaVersion,
  TextRef,
} from './ids.js'

export type FlowSchema = {
  readonly id: SchemaId
  readonly version: SchemaVersion
  readonly entry: NodeId
  readonly nodes: Readonly<Record<NodeId, Node>>
}

export type Node = PageNode | TerminalNode

export type PageNode = {
  readonly kind: 'page'
  readonly title?: TextRef
  readonly questions: readonly Question[]
  readonly edges: readonly Edge[]
}

export type TerminalNode = {
  readonly kind: 'terminal'
  readonly outcome: OutcomeId
}

export type Edge = {
  readonly to: NodeId
  readonly when: Guard
}

export type Question = TextQuestion | NumberQuestion | SelectQuestion | AttachmentQuestion

export type QuestionBase = {
  readonly id: QuestionId
  readonly text: TextRef
  readonly required?: boolean
  readonly visibleWhen?: Guard
}

export type TextQuestion = QuestionBase & {
  readonly kind: 'text'
  readonly maxLength?: SafeInt
}

export type NumberQuestion = QuestionBase & {
  readonly kind: 'number'
  readonly min?: SafeInt
  readonly max?: SafeInt
}

export type SelectQuestion = QuestionBase & {
  readonly kind: 'select'
  readonly multiple?: boolean
  readonly options: readonly Option[]
}

export type AttachmentQuestion = QuestionBase & {
  readonly kind: 'attachment'
  readonly minFiles?: SafeInt
  readonly maxFiles?: SafeInt
  readonly accept?: readonly string[]
  readonly maxFileSize?: SafeInt
}

export type AttachmentRef = {
  readonly id: AttachmentId
  readonly name: string
  readonly mediaType: string
  readonly size: SafeInt
}

export type Option = {
  readonly id: OptionId
  readonly text: TextRef
  readonly weight?: SafeInt
}

export type AnswerValue = string | SafeInt | readonly OptionId[] | readonly AttachmentRef[]

export type Truth = 'true' | 'false' | 'unknown'

export type Guard =
  | { readonly kind: 'always' }
  | { readonly kind: 'answered'; readonly q: QuestionId }
  | { readonly kind: 'selected'; readonly q: QuestionId; readonly option: OptionId }
  | { readonly kind: 'not'; readonly value: Guard }
  | { readonly kind: 'all'; readonly values: readonly Guard[] }
  | { readonly kind: 'any'; readonly values: readonly Guard[] }
  | {
      readonly kind: 'cmp'
      readonly op: ComparisonOperator
      readonly left: NumericExpr
      readonly right: NumericExpr
    }

export type ComparisonOperator = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte'

export type NumericExpr =
  | { readonly kind: 'num'; readonly value: SafeInt }
  | { readonly kind: 'answer'; readonly q: QuestionId }
  | { readonly kind: 'score'; readonly q: QuestionId }
  | { readonly kind: 'sum'; readonly values: readonly NumericExpr[] }

export type NumericResult =
  { readonly kind: 'known'; readonly value: SafeInt } | { readonly kind: 'unknown' }
