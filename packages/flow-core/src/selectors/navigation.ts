import type { FlowSchema, Node } from '../domain/schema.js'
import type { FlowState } from '../domain/state.js'
import { visibleQuestions } from '../semantics/visibility.js'

export const currentNode = (schema: FlowSchema, state: FlowState): Node => {
  const node = schema.nodes[state.trail.at(-1) ?? schema.entry] ?? schema.nodes[schema.entry]
  if (!node) throw new TypeError('FlowState references no schema node')
  return node
}

export const canGoBack = (state: FlowState): boolean =>
  state.status === 'active' && state.trail.length > 1

export const isFinished = (state: FlowState): boolean => state.status === 'finished'

export const outcome = (state: FlowState) => state.outcome

export { visibleQuestions }
