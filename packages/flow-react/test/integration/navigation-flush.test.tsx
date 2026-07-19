import { toSafeInt } from '@flowgraph/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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

describe('navigation draft flushing', () => {
  it('flushes multiple drafts in question order with distinct command metadata', () => {
    const schema = surveySchema()
    const session = startedSession(schema)
    session.dispatch({
      kind: 'ANSWER',
      q: qReason,
      value: [optionSleep],
      meta: createMetaFactory(10)(),
    })
    const baseline = session.getEvents().length
    const createMeta = vi.fn(createMetaFactory(20))
    const Harness = () => {
      const controller = useFlowSurvey({ schema, session, createMeta })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    fireEvent.change(screen.getByRole('textbox', { name: /nombre/i }), {
      target: { value: 'Ada' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /edad/i }), {
      target: { value: '36' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    expect(session.getEvents().slice(baseline)).toMatchObject([
      { kind: 'ANSWERED', q: qName, value: 'Ada', at: 20 },
      { kind: 'ANSWERED', q: qAge, value: toSafeInt(36), at: 21 },
      { kind: 'ADVANCED', at: 22 },
    ])
    expect(createMeta).toHaveBeenCalledTimes(3)
  })

  it('stops at the first rejected draft and does not dispatch navigation', () => {
    const schema = surveySchema()
    const session = startedSession(schema)
    const createMeta = vi.fn(createMetaFactory(30))
    const Harness = () => {
      const controller = useFlowSurvey({ schema, session, createMeta })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    fireEvent.change(screen.getByRole('textbox', { name: /nombre/i }), {
      target: { value: 'Ada' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /edad/i }), {
      target: { value: '9007199254740992' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    expect(session.getEvents().filter(({ kind }) => kind === 'ANSWERED')).toMatchObject([
      { q: qName, value: 'Ada', at: 30 },
    ])
    expect(session.getEvents().some(({ kind }) => kind === 'ADVANCED')).toBe(false)
    expect(createMeta).toHaveBeenCalledOnce()
    expect(screen.getByRole('spinbutton')).toHaveValue(9007199254740992)
    expect(screen.getByRole('spinbutton')).toHaveAccessibleDescription(/entero válido/i)
  })
})
