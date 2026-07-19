import { toNodeId, type Question, type QuestionId } from '@flowgraph/core'
import { describe, expect, it } from 'vitest'

import type { QuestionRenderer, RendererRegistry } from '../../src/types.js'
import { defaultRenderers } from '../../src/renderers/default-renderers.js'
import { resolveQuestionRenderer } from '../../src/renderers/renderer-registry.js'
import { qName, qReason, surveySchema } from '../support/builders.js'

const RendererA: QuestionRenderer = () => null
const RendererB: QuestionRenderer = () => null

const question = (id: QuestionId): Question => {
  const node = surveySchema().nodes[toNodeId('profile')]
  const found = node?.kind === 'page' ? node.questions.find((item) => item.id === id) : undefined
  if (!found) throw new Error('Renderer fixture question is missing')
  return found
}

describe('resolveQuestionRenderer', () => {
  it('uses the closed default map when no override matches', () => {
    const definition = question(qName)
    expect(resolveQuestionRenderer(definition)).toBe(defaultRenderers.text)
  })

  it('uses kind overrides and gives question-id overrides precedence', () => {
    const registry: RendererRegistry = {
      byKind: { text: RendererA },
      byId: { [qName]: RendererB },
    }

    expect(resolveQuestionRenderer(question(qReason), registry)).toBe(defaultRenderers.select)
    expect(resolveQuestionRenderer(question(qName), { byKind: { text: RendererA } })).toBe(
      RendererA,
    )
    expect(resolveQuestionRenderer(question(qName), registry)).toBe(RendererB)
  })

  it('does not mutate frozen registry configuration', () => {
    const registry = Object.freeze({
      byKind: Object.freeze({ text: RendererA }),
      byId: Object.freeze({}),
    }) satisfies RendererRegistry

    expect(resolveQuestionRenderer(question(qName), registry)).toBe(RendererA)
    expect(Object.isFrozen(registry.byKind)).toBe(true)
  })

  it('throws a developer-facing error when no renderer can be resolved', () => {
    const definition = question(qName)
    expect(() =>
      resolveQuestionRenderer(definition, undefined, {} as typeof defaultRenderers),
    ).toThrow(`No renderer configured for question "${qName}" of kind "text"`)
  })
})
