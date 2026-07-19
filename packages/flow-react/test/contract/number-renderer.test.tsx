import { ok, toNodeId, toSafeInt, type NumberQuestion } from '@flowgraph/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createDraftRegistry } from '../../src/controller/draft-registry.js'
import { DraftRegistryContext } from '../../src/controller/internal.js'
import { NumberRenderer } from '../../src/renderers/number-renderer.js'
import { qAge, surveySchema } from '../support/builders.js'

const question = (): NumberQuestion => {
  const node = surveySchema().nodes[toNodeId('profile')]
  const value = node?.kind === 'page' ? node.questions.find(({ id }) => id === qAge) : undefined
  if (value?.kind !== 'number') throw new Error('Number fixture is missing')
  return value
}

describe('NumberRenderer', () => {
  it('keeps raw input and commits one safe integer on blur', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn(() => ok([]))
    const registry = createDraftRegistry()
    render(
      <DraftRegistryContext.Provider value={registry}>
        <NumberRenderer
          question={question()}
          text="Edad"
          options={undefined}
          value={toSafeInt(35)}
          problems={[]}
          disabled={false}
          onAnswer={onAnswer}
        />
      </DraftRegistryContext.Provider>,
    )

    const input = screen.getByRole('spinbutton', { name: /edad/i })
    expect(registry.flush()).toEqual(ok([]))
    expect(registry.focusFirst([{ code: 'required', where: { q: qAge } }])).toBe(true)
    expect(input).toHaveFocus()
    fireEvent.blur(input)
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '120')
    await user.clear(input)
    await user.type(input, '36')
    expect(onAnswer).not.toHaveBeenCalled()
    await user.tab()
    expect(onAnswer).toHaveBeenCalledWith(toSafeInt(36))
  })

  it('retains an unsafe value as visible local friction', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn(() => ok([]))
    render(
      <DraftRegistryContext.Provider value={createDraftRegistry()}>
        <NumberRenderer
          question={question()}
          text="Edad"
          options={undefined}
          value={undefined}
          problems={[]}
          disabled={false}
          onAnswer={onAnswer}
        />
      </DraftRegistryContext.Provider>,
    )

    const input = screen.getByRole('spinbutton', { name: /edad/i })
    await user.type(input, '9007199254740992')
    await user.tab()
    expect(onAnswer).not.toHaveBeenCalled()
    expect(input).toHaveAccessibleDescription(/entero válido/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('renders a non-required number without required copy', () => {
    const definition = question()
    const optional: NumberQuestion = {
      kind: 'number',
      id: definition.id,
      text: definition.text,
    }
    render(
      <DraftRegistryContext.Provider value={createDraftRegistry()}>
        <NumberRenderer
          question={optional}
          text="Cantidad"
          options={undefined}
          value={undefined}
          problems={[]}
          disabled={false}
          onAnswer={() => ok([])}
        />
      </DraftRegistryContext.Provider>,
    )

    expect(screen.getByRole('spinbutton', { name: 'Cantidad' })).not.toBeRequired()
  })

  it('does not replace a dirty raw value when a confirmed prop arrives', () => {
    const definition = question()
    const view = (value: number | undefined) => (
      <DraftRegistryContext.Provider value={createDraftRegistry()}>
        <NumberRenderer
          question={definition}
          text="Edad"
          options={undefined}
          value={value === undefined ? undefined : toSafeInt(value)}
          problems={[]}
          disabled={false}
          onAnswer={() => ok([])}
        />
      </DraftRegistryContext.Provider>
    )
    const rendered = render(view(undefined))
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '36' } })
    rendered.rerender(view(40))

    expect(input).toHaveValue(36)
  })
})
