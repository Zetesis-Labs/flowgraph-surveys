import { err, ok, toNodeId, type Problem } from '@flowgraph/core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createDraftRegistry } from '../../src/controller/draft-registry.js'
import { DraftRegistryContext, QuestionOrderContext } from '../../src/controller/internal.js'
import { NumberRenderer } from '../../src/renderers/number-renderer.js'
import { TextRenderer } from '../../src/renderers/text-renderer.js'
import { qAge, qName, surveySchema } from '../support/builders.js'

const questions = () => {
  const page = surveySchema().nodes[toNodeId('profile')]
  if (page?.kind !== 'page') throw new Error('Draft fixture page is missing')
  const text = page.questions.find(({ id }) => id === qName)
  const number = page.questions.find(({ id }) => id === qAge)
  if (text?.kind !== 'text' || number?.kind !== 'number') {
    throw new Error('Draft fixture questions are missing')
  }
  return { text, number }
}

describe('draft lifecycle', () => {
  it('flushes a dirty draft once, stays clean, and unregisters on unmount', () => {
    const registry = createDraftRegistry()
    const onAnswer = vi.fn(() => ok([]))
    const { text } = questions()
    const rendered = render(
      <DraftRegistryContext.Provider value={registry}>
        <QuestionOrderContext.Provider value={0}>
          <TextRenderer
            question={text}
            text="Nombre"
            options={undefined}
            value={undefined}
            problems={[]}
            disabled={false}
            onAnswer={onAnswer}
          />
        </QuestionOrderContext.Provider>
      </DraftRegistryContext.Provider>,
    )

    expect(registry.flush()).toEqual(ok([]))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ada' } })
    expect(registry.flush()).toEqual(ok([]))
    expect(registry.flush()).toEqual(ok([]))
    expect(onAnswer).toHaveBeenCalledOnce()

    rendered.unmount()
    expect(registry.flush()).toEqual(ok([]))
  })

  it('retains rejected numeric text and discards it when conditionally removed', () => {
    const registry = createDraftRegistry()
    const invalid: Problem = { code: 'answer-kind-mismatch', where: { q: qAge } }
    const onAnswer = vi.fn(() => err([invalid]))
    const { number } = questions()
    const view = (visible: boolean) => (
      <DraftRegistryContext.Provider value={registry}>
        <QuestionOrderContext.Provider value={1}>
          {visible ? (
            <NumberRenderer
              question={number}
              text="Edad"
              options={undefined}
              value={undefined}
              problems={[]}
              disabled={false}
              onAnswer={onAnswer}
            />
          ) : null}
        </QuestionOrderContext.Provider>
      </DraftRegistryContext.Provider>
    )
    const rendered = render(view(true))
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '36' } })

    act(() => {
      expect(registry.flush()).toEqual(err([invalid]))
    })
    expect(input).toHaveValue(36)

    rendered.rerender(view(false))
    expect(registry.flush()).toEqual(ok([]))
  })
})
