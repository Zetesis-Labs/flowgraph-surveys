import type { Question } from '@flowgraph/core'

import type { QuestionRenderer, RendererRegistry } from '../types.js'
import { defaultRenderers } from './default-renderers.js'

type DefaultRendererMap = Readonly<Partial<Record<Question['kind'], QuestionRenderer>>>

export const resolveQuestionRenderer = (
  question: Question,
  registry?: RendererRegistry,
  defaults: DefaultRendererMap = defaultRenderers,
): QuestionRenderer => {
  const renderer =
    registry?.byId?.[question.id] ?? registry?.byKind?.[question.kind] ?? defaults[question.kind]

  if (!renderer) {
    throw new Error(
      `No renderer configured for question "${question.id}" of kind "${question.kind}"`,
    )
  }
  return renderer
}
