import { ok, toNodeId, type SelectQuestion } from '@flowgraph/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createDraftRegistry } from '../../src/controller/draft-registry.js'
import type { DraftRegistration, DraftRegistry } from '../../src/controller/draft-registry.js'
import { DraftRegistryContext } from '../../src/controller/internal.js'
import { SelectRenderer } from '../../src/renderers/select-renderer.js'
import {
  optionEmail,
  optionPhone,
  optionSleep,
  optionStress,
  qChannels,
  qReason,
  surveySchema,
} from '../support/builders.js'

const question = (id: typeof qReason): SelectQuestion => {
  const node = surveySchema().nodes[toNodeId('profile')]
  const value = node?.kind === 'page' ? node.questions.find((item) => item.id === id) : undefined
  if (value?.kind !== 'select') throw new Error('Select fixture is missing')
  return value
}

describe('SelectRenderer', () => {
  it('renders a radio group and confirms one option immediately', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn(() => ok([]))
    const definition = question(qReason)
    render(
      <DraftRegistryContext.Provider value={createDraftRegistry()}>
        <SelectRenderer
          question={definition}
          text="Motivo"
          options={definition.options.map(({ id, text }) => ({ id, text: text.fallback }))}
          value={undefined}
          problems={[]}
          disabled={false}
          onAnswer={onAnswer}
        />
      </DraftRegistryContext.Provider>,
    )

    await user.click(screen.getByRole('radio', { name: /sueño/i }))
    expect(onAnswer).toHaveBeenCalledWith([optionSleep])

    fireEvent.click(screen.getByRole('radio', { name: /estrés/i }))
    expect(onAnswer).toHaveBeenLastCalledWith([optionStress])
    fireEvent.mouseDown(screen.getByRole('radio', { name: /estrés/i }), { button: 1 })
    expect(onAnswer).toHaveBeenCalledTimes(2)
  })

  it('renders ordered checkboxes and confirms the complete ordered selection', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn(() => ok([]))
    const definition = question(qChannels)
    const registry = createDraftRegistry()
    render(
      <DraftRegistryContext.Provider value={registry}>
        <SelectRenderer
          question={definition}
          text="Canales"
          options={definition.options.map(({ id, text }) => ({ id, text: text.fallback }))}
          value={[optionPhone]}
          problems={[]}
          disabled={false}
          onAnswer={onAnswer}
        />
      </DraftRegistryContext.Provider>,
    )

    expect(screen.getByRole('checkbox', { name: /teléfono/i })).toBeChecked()
    expect(registry.flush()).toEqual(ok([]))
    expect(registry.focusFirst([{ code: 'required', where: { q: qChannels } }])).toBe(true)
    expect(screen.getByRole('checkbox', { name: /correo/i })).toHaveFocus()
    await user.click(screen.getByRole('checkbox', { name: /correo/i }))
    expect(onAnswer).toHaveBeenCalledWith([optionEmail, optionPhone])
    await user.click(screen.getByRole('checkbox', { name: /teléfono/i }))
    expect(onAnswer).toHaveBeenLastCalledWith([])
  })

  it('registers its focus target with a clean no-op flush', () => {
    let registration: DraftRegistration | undefined
    const registry: DraftRegistry = {
      register: (value) => {
        registration = value
        return () => undefined
      },
      flush: () => ok([]),
      focusFirst: () => false,
    }
    const definition = question(qReason)
    render(
      <DraftRegistryContext.Provider value={registry}>
        <SelectRenderer
          question={definition}
          text="Motivo"
          options={definition.options.map(({ id, text }) => ({ id, text: text.fallback }))}
          value={undefined}
          problems={[]}
          disabled={false}
          onAnswer={() => ok([])}
        />
      </DraftRegistryContext.Provider>,
    )

    expect(registration?.flush()).toEqual(ok([]))
    registration?.focus()
    expect(screen.getByRole('radio', { name: /sueño/i })).toHaveFocus()
  })
})
