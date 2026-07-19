import type { Command, CommandMeta } from '../domain/command.js'
import type { Event } from '../domain/event.js'
import type { NodeId } from '../domain/ids.js'
import type { Problem } from '../domain/problem.js'
import { err, ok, type Result } from '../domain/result.js'
import type { FlowSchema } from '../domain/schema.js'
import type { FlowState } from '../domain/state.js'
import { hashSchema } from '../integrity/schema-hash.js'
import { evaluateGuard } from '../semantics/evaluate.js'
import { currentPageProblems, structuralAnswerProblems } from '../semantics/validate.js'

const envelope = (meta: CommandMeta) => ({
  v: 1 as const,
  at: meta.at,
  source: meta.source,
  path: meta.path,
})

const lifecycleProblem = (code: Problem['code']): Result<readonly Event[], readonly Problem[]> =>
  err([{ code }])

export const decide = (
  schema: FlowSchema,
  state: FlowState,
  command: Command,
): Result<readonly Event[], readonly Problem[]> => {
  if (state.status === 'not-started') {
    if (command.kind !== 'START') return lifecycleProblem('session-not-started')
    if (command.schemaHash !== hashSchema(schema)) return lifecycleProblem('schema-mismatch')
    return ok([
      {
        ...envelope(command.meta),
        kind: 'SESSION_STARTED',
        schemaId: schema.id,
        schemaVersion: schema.version,
        schemaHash: command.schemaHash,
      },
    ])
  }
  if (command.kind === 'START') return lifecycleProblem('session-already-started')
  if (state.status === 'finished') {
    return command.kind === 'NEXT' ? ok([]) : lifecycleProblem('session-sealed')
  }

  if (command.kind === 'ANSWER') {
    const problems = structuralAnswerProblems(schema, state, command.q, command.value)
    return problems.length > 0
      ? err(problems)
      : ok([
          {
            ...envelope(command.meta),
            kind: 'ANSWERED',
            q: command.q,
            value: command.value,
          },
        ])
  }

  if (command.kind === 'BACK') {
    if (state.trail.length <= 1) return ok([])
    const from = state.trail.at(-1) as NodeId
    const to = state.trail.at(-2) as NodeId
    return ok([{ ...envelope(command.meta), kind: 'WENT_BACK', from, to }])
  }

  const current = state.trail.at(-1)
  const node = current ? schema.nodes[current] : undefined
  if (!current || node?.kind !== 'page') {
    return err([{ code: 'missing-node', where: { node: current ?? schema.entry } }])
  }
  const problems = currentPageProblems(schema, state)
  if (problems.length > 0) return err(problems)
  const selected = node.edges.find((edge) => evaluateGuard(schema, state, edge.when) === 'true')
  if (!selected) return err([{ code: 'no-edge', where: { node: current } }])
  const target = schema.nodes[selected.to]
  if (!target) return err([{ code: 'missing-node', where: { node: selected.to } }])
  const advanced: Event = {
    ...envelope(command.meta),
    kind: 'ADVANCED',
    from: current,
    to: selected.to,
  }
  return target.kind === 'terminal'
    ? ok([
        advanced,
        {
          ...envelope(command.meta),
          kind: 'SESSION_FINISHED',
          outcome: target.outcome,
        },
      ])
    : ok([advanced])
}
