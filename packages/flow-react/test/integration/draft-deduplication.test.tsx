import { toSafeInt } from '@flowgraph/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useFlowSurvey } from '../../src/controller/use-flow-survey.js'
import { FlowPage } from '../../src/view/flow-page.js'
import {
  createMetaFactory,
  optionSleep,
  qAge,
  qName,
  qReason,
  startedSession,
  surveySchema,
} from '../support/builders.js'

describe('draft deduplication', () => {
  it('does not answer a blurred draft again when Continue flushes', () => {
    const schema = surveySchema()
    const session = startedSession(schema)
    const meta = createMetaFactory(40)
    session.dispatch({ kind: 'ANSWER', q: qAge, value: toSafeInt(36), meta: meta() })
    session.dispatch({ kind: 'ANSWER', q: qReason, value: [optionSleep], meta: meta() })
    const baseline = session.getEvents().length
    const Harness = () => {
      const controller = useFlowSurvey({ schema, session, createMeta: meta })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    const input = screen.getByRole('textbox', { name: /nombre/i })
    fireEvent.change(input, { target: { value: 'Ada' } })
    fireEvent.blur(input)
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    const added = session.getEvents().slice(baseline)
    expect(added.filter((event) => event.kind === 'ANSWERED' && event.q === qName)).toHaveLength(1)
    expect(added.at(-1)?.kind).toBe('ADVANCED')
  })

  it('keeps an invalid raw draft visible when navigation rejects it', () => {
    const schema = surveySchema()
    const session = startedSession(schema)
    const Harness = () => {
      const controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(50),
      })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    const input = screen.getByRole('spinbutton', { name: /edad/i })
    fireEvent.change(input, { target: { value: '9007199254740992' } })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    expect(input).toHaveValue(9007199254740992)
    expect(input).toHaveAccessibleDescription(/entero válido/i)
  })
})
