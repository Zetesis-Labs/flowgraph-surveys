export type ProblemCode =
  | 'required'
  | 'out-of-range'
  | 'too-long'
  | 'no-edge'
  | 'missing-node'
  | 'unknown-question'
  | 'answer-kind-mismatch'
  | 'unknown-option'
  | 'arity-mismatch'
  | 'duplicate-option'
  | 'duplicate-attachment'
  | 'attachment-count'
  | 'unsupported-file-type'
  | 'file-too-large'
  | 'not-current-page'
  | 'session-not-started'
  | 'session-already-started'
  | 'session-sealed'
  | 'schema-mismatch'
  | 'log-schema-mismatch'
  | 'unsupported-event-version'
  | 'reentrant-dispatch'

export type Problem = {
  readonly code: ProblemCode
  readonly where?: Readonly<Record<string, string | number>>
  readonly details?: Readonly<Record<string, unknown>>
}

export type ParseProblem = {
  readonly code: 'invalid-wire-value'
  readonly path: readonly (string | number)[]
  readonly details?: Readonly<Record<string, unknown>>
}

export type SchemaProblemCode =
  | 'missing-entry'
  | 'entry-not-page'
  | 'dangling-node'
  | 'unreachable-node'
  | 'no-terminal-reachable'
  | 'cycle-detected'
  | 'duplicate-question'
  | 'duplicate-option'
  | 'duplicate-edge-target'
  | 'shadowed-edge'
  | 'ill-founded-visibility'
  | 'invalid-expression-reference'
  | 'invalid-constraint'
  | 'missing-default-edge'
  | 'empty-all'
  | 'empty-any'
  | 'weight-overflow-risk'
  | 'probe-budget-exceeded'
  | 'semantic-dead-end'

export type SchemaProblem = {
  readonly severity: 'error' | 'warning'
  readonly code: SchemaProblemCode
  readonly where: Readonly<Record<string, string | number>>
  readonly suggestion?: string
  readonly details?: Readonly<Record<string, unknown>>
}

export type GoldenProblem = {
  readonly code:
    | 'invalid-golden'
    | 'schema-identity-mismatch'
    | 'schema-invalid'
    | 'command-rejected'
    | 'expectation-mismatch'
  readonly caseId?: string
  readonly step?: number
  readonly details?: Readonly<Record<string, unknown>>
}
