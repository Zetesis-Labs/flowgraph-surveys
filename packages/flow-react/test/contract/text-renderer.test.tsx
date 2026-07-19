import { err, ok, toNodeId, type TextQuestion } from '@flowgraph/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createDraftRegistry } from '../../src/controller/draft-registry.js'
import { DraftRegistryContext } from '../../src/controller/internal.js'
import { TextRenderer } from '../../src/renderers/text-renderer.js'
import { qName, surveySchema } from '../support/builders.js'

const question = (): TextQuestion => {
  const node = surveySchema().nodes[toNodeId('profile')]
  const value = node?.kind === 'page' ? node.questions.find(({ id }) => id === qName) : undefined
  if (value?.kind !== 'text') throw new Error('Text fixture is missing')
  return value
}

describe('TextRenderer', () => {
  it('keeps a labeled required draft and commits exactly once on blur', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn(() => ok([]))
    const registry = createDraftRegistry()
    render(
      <DraftRegistryContext.Provider value={registry}>
        <TextRenderer
          question={question()}
          text="Nombre"
          options={undefined}
          value="Ada"
          problems={[]}
          disabled={false}
          onAnswer={onAnswer}
        />
      </DraftRegistryContext.Provider>,
    )

    const input = screen.getByRole('textbox', { name: /nombre/i })
    expect(registry.flush()).toEqual(ok([]))
    fireEvent.blur(input)
    expect(input).toHaveValue('Ada')
    expect(input).toBeRequired()
    await user.clear(input)
    await user.type(input, 'Grace')
    expect(onAnswer).not.toHaveBeenCalled()
    await user.tab()
    expect(onAnswer).toHaveBeenCalledOnce()
    expect(onAnswer).toHaveBeenCalledWith('Grace')
  })

  it('associates problems and honors disabled state', () => {
    render(
      <DraftRegistryContext.Provider value={createDraftRegistry()}>
        <TextRenderer
          question={question()}
          text="Nombre"
          options={undefined}
          value={undefined}
          problems={[{ code: 'required', where: { q: qName } }]}
          disabled
          onAnswer={() => ok([])}
        />
      </DraftRegistryContext.Provider>,
    )

    const input = screen.getByRole('textbox', { name: /nombre/i })
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/obligatorio/i)
  })

  it('omits the length counter when no maximum is defined', () => {
    const definition = question()
    const optional: TextQuestion = {
      kind: 'text',
      id: definition.id,
      text: definition.text,
    }
    render(
      <DraftRegistryContext.Provider value={createDraftRegistry()}>
        <TextRenderer
          question={optional}
          text="Comentario"
          options={undefined}
          value={undefined}
          problems={[]}
          disabled={false}
          onAnswer={() => ok([])}
        />
      </DraftRegistryContext.Provider>,
    )

    expect(screen.getByRole('textbox', { name: 'Comentario' })).not.toBeRequired()
    expect(screen.queryByText('/')).not.toBeInTheDocument()
  })

  it('preserves a dirty draft across prop updates and rejected confirmation', () => {
    const definition = question()
    const problem = { code: 'too-long', where: { q: qName } } as const
    const onAnswer = vi.fn(() => err([problem]))
    const view = (value: string | undefined) => (
      <DraftRegistryContext.Provider value={createDraftRegistry()}>
        <TextRenderer
          question={definition}
          text="Nombre"
          options={undefined}
          value={value}
          problems={[]}
          disabled={false}
          onAnswer={onAnswer}
        />
      </DraftRegistryContext.Provider>
    )
    const rendered = render(view(undefined))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'borrador' } })
    rendered.rerender(view('confirmado externo'))
    fireEvent.blur(input)

    expect(input).toHaveValue('borrador')
    expect(onAnswer).toHaveBeenCalledWith('borrador')
  })
})
