import type { NodeId, OutcomeId, QuestionId, SchemaHash, SchemaId, SchemaVersion } from './ids.js'
import type { AnswerValue } from './schema.js'
import type { SchemaProblem } from './problem.js'

export type FlowState = {
  readonly status: 'not-started' | 'active' | 'finished'
  readonly schemaId: SchemaId
  readonly schemaVersion: SchemaVersion
  readonly schemaHash?: SchemaHash
  readonly trail: readonly NodeId[]
  readonly answers: Readonly<Record<QuestionId, AnswerValue>>
  readonly outcome?: OutcomeId
}

export type Progress = {
  readonly completedEdges: number
  readonly maximumRemainingEdges: number
  readonly fraction: number
}

export type ProbeWitness = {
  readonly answers: Readonly<Record<QuestionId, AnswerValue>>
}

export type ProbePageReport = {
  readonly node: NodeId
  readonly candidateSpace: string
  readonly explored: number
  readonly truncated: boolean
  readonly numericSampling: boolean
  readonly deadEndsFound: number
  readonly witnesses: readonly ProbeWitness[]
}

export type ProbeReport = {
  readonly complete: boolean
  readonly pages: readonly ProbePageReport[]
  readonly problems: readonly SchemaProblem[]
}

type GoldenProvenance = {
  readonly source?: 'human' | 'agent' | 'import'
  readonly at?: number
}

export type GoldenCommand =
  | (GoldenProvenance & { readonly kind: 'START' | 'NEXT' | 'BACK' })
  | (GoldenProvenance & {
      readonly kind: 'ANSWER'
      readonly q: QuestionId
      readonly value: AnswerValue
    })

export type GoldenCase = {
  readonly id: string
  readonly commands: readonly GoldenCommand[]
  readonly expect: {
    readonly outcome: OutcomeId
    readonly state?: {
      readonly current?: NodeId
      readonly trail?: readonly NodeId[]
      readonly activeAnswers?: Readonly<Record<QuestionId, AnswerValue>>
    }
  }
}

export type GoldenSuiteV1 = {
  readonly formatVersion: 1
  readonly schema: {
    readonly id: SchemaId
    readonly version: SchemaVersion
  }
  readonly cases: readonly GoldenCase[]
}

export type EdgeCoverage = {
  readonly total: number
  readonly covered: number
  readonly ratio: number
  readonly edges: readonly {
    readonly from: NodeId
    readonly to: NodeId
    readonly index: number
    readonly hits: number
    readonly cases: readonly string[]
  }[]
}

export type GoldenCaseReport = {
  readonly id: string
  readonly passed: boolean
}

export type GoldenReport = {
  readonly cases: readonly GoldenCaseReport[]
  readonly coverage: EdgeCoverage
}
