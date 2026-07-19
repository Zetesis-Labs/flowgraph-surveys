import type { QuestionRenderer } from '../types.js'
import { NumberRenderer } from './number-renderer.js'
import { SelectRenderer } from './select-renderer.js'
import { TextRenderer } from './text-renderer.js'

export const defaultRenderers = {
  text: TextRenderer as QuestionRenderer,
  number: NumberRenderer as QuestionRenderer,
  select: SelectRenderer as QuestionRenderer,
} satisfies Readonly<Record<'text' | 'number' | 'select', QuestionRenderer>>
