import {
  createBrowserEventStore,
  defaultRenderers,
  FlowPage,
  persistSession,
  useFlowState,
  useFlowSurvey,
  useFlowView,
} from '@flowgraph/react'

for (const exported of [
  createBrowserEventStore,
  FlowPage,
  persistSession,
  useFlowState,
  useFlowSurvey,
  useFlowView,
]) {
  if (typeof exported !== 'function') throw new Error('Published React export is missing')
}

if (!defaultRenderers.text || !defaultRenderers.number || !defaultRenderers.select) {
  throw new Error('Published default renderer registry is incomplete')
}
