import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { FlowPage, useFlowSurvey } from '../../src/index.js'
import {
  createMetaFactory,
  librarySurveySchema,
  optionDigital,
  qBookFormat,
  qBookTitle,
  startedSession,
} from '../support/builders.js'

describe('cross-fixture conformance', () => {
  it('completes a non-psychology survey through only the public adapter surface', async () => {
    const user = userEvent.setup()
    const schema = librarySurveySchema()
    const session = startedSession(schema)
    const Harness = () => {
      const controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(130),
      })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    await user.type(screen.getByRole('textbox', { name: /último libro/i }), 'Solaris')
    await user.click(screen.getByRole('radio', { name: 'Digital' }))
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByRole('heading', { name: 'Lectura digital' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    expect(session.getSnapshot()).toMatchObject({
      status: 'finished',
      answers: {
        [qBookTitle]: 'Solaris',
        [qBookFormat]: [optionDigital],
      },
      outcome: 'reading-submitted',
    })
  })

  it('renders a new core-derived route after going back and changing the routing answer', async () => {
    const user = userEvent.setup()
    const schema = librarySurveySchema()
    const session = startedSession(schema)
    const Harness = () => {
      const controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(140),
      })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    await user.type(screen.getByRole('textbox', { name: /último libro/i }), 'Solaris')
    await user.click(screen.getByRole('radio', { name: 'Digital' }))
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByRole('heading', { name: 'Lectura digital' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /atrás/i }))
    await user.click(screen.getByRole('radio', { name: 'Papel' }))
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    expect(screen.getByRole('heading', { name: 'Lectura en papel' })).toBeInTheDocument()
  })
})
