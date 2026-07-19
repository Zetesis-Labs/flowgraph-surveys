export type {
  NodeId,
  OptionId,
  OutcomeId,
  QuestionId,
  SafeInt,
  SchemaHash,
  SchemaId,
  SchemaVersion,
  TextRef,
} from './domain/ids.js'
export {
  isSafeInt,
  normalizeSafeInt,
  toNodeId,
  toOptionId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaHash,
  toSchemaId,
  toSchemaVersion,
} from './domain/ids.js'
export type { Command, CommandMeta, PathSegment, Source } from './domain/command.js'
export type { Event, EventEnvelope } from './domain/event.js'
export type {
  GoldenProblem,
  ParseProblem,
  Problem,
  ProblemCode,
  SchemaProblem,
  SchemaProblemCode,
} from './domain/problem.js'
export type { Result } from './domain/result.js'
export { err, ok } from './domain/result.js'
export type {
  AnswerValue,
  ComparisonOperator,
  Edge,
  FlowSchema,
  Guard,
  Node,
  NumberQuestion,
  NumericExpr,
  NumericResult,
  Option,
  PageNode,
  Question,
  SelectQuestion,
  TerminalNode,
  TextQuestion,
  Truth,
} from './domain/schema.js'
export type {
  EdgeCoverage,
  FlowState,
  GoldenCase,
  GoldenCaseReport,
  GoldenCommand,
  GoldenReport,
  GoldenSuiteV1,
  ProbePageReport,
  ProbeReport,
  ProbeWitness,
  Progress,
} from './domain/state.js'
export { parseCommand, parseEvents } from './parsing/event.js'
export { parseSchema } from './parsing/schema.js'
export { upcastEvents } from './parsing/upcast.js'
export { allTruth, anyTruth, notTruth } from './semantics/truth.js'
export { evaluateGuard, evaluateNumeric } from './semantics/evaluate.js'
export { activeAnswers, storedAnswer } from './semantics/active-truth.js'
export {
  currentPageProblems,
  questionProblems,
  structuralAnswerProblems,
} from './semantics/validate.js'
export { canonicalizeSchema } from './integrity/canonical-json.js'
export { utf8Encode } from './integrity/utf8.js'
export { sha256 } from './integrity/sha256.js'
export { hashSchema } from './integrity/schema-hash.js'
export { initialState } from './engine/initial-state.js'
export { apply } from './engine/apply.js'
export { decide } from './engine/decide.js'
export { replay } from './engine/replay.js'
export {
  canGoBack,
  currentNode,
  isFinished,
  outcome,
  visibleQuestions,
} from './selectors/navigation.js'
export { progress } from './selectors/progress.js'
export { check } from './authoring/check.js'
export { probe } from './authoring/probe.js'
export { runGoldens } from './authoring/golden.js'
