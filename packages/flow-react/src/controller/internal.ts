import type { FlowSurveyController } from '../types.js'
import type { DraftRegistry } from './draft-registry.js'
import { createContext, useContext } from 'react'

export const draftRegistrySymbol: unique symbol = Symbol('flowgraph.draft-registry')
export const DraftRegistryContext = createContext<DraftRegistry | undefined>(undefined)
export const QuestionOrderContext = createContext(0)

export type InternalFlowSurveyController = FlowSurveyController & {
  readonly [draftRegistrySymbol]: DraftRegistry
}

export const draftRegistryOf = (controller: FlowSurveyController): DraftRegistry =>
  (controller as InternalFlowSurveyController)[draftRegistrySymbol]

export const useDraftRegistry = (): DraftRegistry => {
  const registry = useContext(DraftRegistryContext)
  if (!registry) throw new Error('Default FlowGraph renderers require FlowPage draft context')
  return registry
}
