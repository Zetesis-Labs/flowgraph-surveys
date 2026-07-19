import type { NodeId } from '../domain/ids.js'
import type { FlowSchema } from '../domain/schema.js'
import type { FlowState, Progress } from '../domain/state.js'

const longestRemaining = (
  schema: FlowSchema,
  nodeId: NodeId,
  visiting: readonly NodeId[] = [],
): number => {
  if (visiting.includes(nodeId)) return 0
  const node = schema.nodes[nodeId]
  if (!node || node.kind === 'terminal') return 0
  return node.edges.length === 0
    ? 0
    : 1 +
        Math.max(
          ...node.edges.map((edge) => longestRemaining(schema, edge.to, [...visiting, nodeId])),
        )
}

export const progress = (schema: FlowSchema, state: FlowState): Progress => {
  if (state.status === 'not-started') {
    return {
      completedEdges: 0,
      maximumRemainingEdges: longestRemaining(schema, schema.entry),
      fraction: 0,
    }
  }
  const completedEdges = Math.max(0, state.trail.length - 1)
  const maximumRemainingEdges =
    state.status === 'finished' ? 0 : longestRemaining(schema, state.trail.at(-1) ?? schema.entry)
  const denominator = completedEdges + maximumRemainingEdges
  return {
    completedEdges,
    maximumRemainingEdges,
    fraction:
      state.status === 'finished' ? 1 : denominator === 0 ? 0 : completedEdges / denominator,
  }
}
