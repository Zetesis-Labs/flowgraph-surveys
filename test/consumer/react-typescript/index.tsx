import type { FlowSchema } from '@flowgraph/core'
import {
  FlowPage,
  type QuestionRenderer,
  type RendererRegistry,
  useFlowSurvey,
} from '@flowgraph/react'
import type { FlowSession } from '@flowgraph/session'

declare const schema: FlowSchema
declare const session: FlowSession
declare const Renderer: QuestionRenderer

const registry: RendererRegistry = { byKind: { text: Renderer } }

export const Survey = () => {
  const controller = useFlowSurvey({
    schema,
    session,
    createMeta: () => ({ at: 1 as never, source: 'human', path: [] }),
  })
  return <FlowPage controller={controller} renderers={registry} />
}

// @ts-expect-error The package intentionally exposes no deep source subpaths.
await import('@flowgraph/react/src/types.js')
