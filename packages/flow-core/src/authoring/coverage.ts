import { toNodeId, type NodeId } from '../domain/ids.js'
import type { Event } from '../domain/event.js'
import type { FlowSchema } from '../domain/schema.js'
import type { EdgeCoverage } from '../domain/state.js'
import { replay } from '../engine/replay.js'

export type CoverageCaseLog = {
  readonly id: string
  readonly events: readonly Event[]
}

const edgeKey = (from: NodeId, to: NodeId): string => `${from}\u0000${to}`

export const calculateCoverage = (
  schema: FlowSchema,
  logs: readonly CoverageCaseLog[],
): EdgeCoverage => {
  const declared = Object.entries(schema.nodes).flatMap(([rawFrom, node]) => {
    const from = toNodeId(rawFrom)
    return node.kind === 'page'
      ? node.edges.map(({ to }, index) => ({
          from,
          to,
          index,
          hits: 0,
          caseIds: new Set<string>(),
        }))
      : []
  })
  const byKey = new Map(declared.map((edge) => [edgeKey(edge.from, edge.to), edge]))

  for (const log of logs) {
    replay(schema, log.events)
    for (const event of log.events) {
      if (event.kind !== 'ADVANCED') continue
      const edge = byKey.get(edgeKey(event.from, event.to)) as (typeof declared)[number]
      edge.hits += 1
      edge.caseIds.add(log.id)
    }
  }

  const covered = declared.filter(({ hits }) => hits > 0).length
  return {
    total: declared.length,
    covered,
    ratio: covered / declared.length,
    edges: declared.map(({ caseIds, ...edge }) => ({ ...edge, cases: [...caseIds] })),
  }
}
