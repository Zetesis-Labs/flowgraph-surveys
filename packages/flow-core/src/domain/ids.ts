declare const brand: unique symbol

export type Brand<Name extends string> = {
  readonly [brand]: Name
}

export type SchemaId = string & Brand<'SchemaId'>
export type SchemaVersion = string & Brand<'SchemaVersion'>
export type SchemaHash = string & Brand<'SchemaHash'>
export type NodeId = string & Brand<'NodeId'>
export type QuestionId = string & Brand<'QuestionId'>
export type OptionId = string & Brand<'OptionId'>
export type OutcomeId = string & Brand<'OutcomeId'>
export type SafeInt = number & Brand<'SafeInt'>

export type TextRef = {
  readonly key: string
  readonly fallback: string
}

export const normalizeSafeInt = (value: number): number => (Object.is(value, -0) ? 0 : value)

export const isSafeInt = (value: unknown): value is SafeInt =>
  typeof value === 'number' && Number.isSafeInteger(value)

export const toSafeInt = (value: number): SafeInt => normalizeSafeInt(value) as SafeInt

export const toSchemaId = (value: string): SchemaId => value as SchemaId
export const toSchemaVersion = (value: string): SchemaVersion => value as SchemaVersion
export const toSchemaHash = (value: string): SchemaHash => value as SchemaHash
export const toNodeId = (value: string): NodeId => value as NodeId
export const toQuestionId = (value: string): QuestionId => value as QuestionId
export const toOptionId = (value: string): OptionId => value as OptionId
export const toOutcomeId = (value: string): OutcomeId => value as OutcomeId
