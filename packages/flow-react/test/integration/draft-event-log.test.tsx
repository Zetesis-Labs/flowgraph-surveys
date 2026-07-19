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

describe('draft event log', () => {
  it('records deliberate answers once in visible order before navigation', () => {
    const schema = surveySchema()
    const session = startedSession(schema)
    const meta = createMetaFactory(80)
    session.dispatch({
      kind: 'ANSWER',
      q: qReason,
      value: [optionSleep],
      meta: meta(),
    })
    const baseline = session.getEvents().length
    const Harness = () => {
      const controller = useFlowSurvey({ schema, session, createMeta: meta })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    const name = screen.getByRole('textbox', { name: /nombre/i })
    fireEvent.change(name, { target: { value: 'A' } })
    fireEvent.change(name, { target: { value: 'Ad' } })
    fireEvent.change(name, { target: { value: 'Ada' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: /edad/i }), {
      target: { value: '36' },
    })

    expect(session.getEvents()).toHaveLength(baseline)
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    expect(session.getEvents().slice(baseline)).toEqual([
      {
        kind: 'ANSWERED',
        q: qName,
        value: 'Ada',
        v: 1,
        at: 81,
        source: 'human',
        path: [],
      },
      {
        kind: 'ANSWERED',
        q: qAge,
        value: toSafeInt(36),
        v: 1,
        at: 82,
        source: 'human',
        path: [],
      },
      {
        kind: 'ADVANCED',
        from: 'profile',
        to: 'details',
        v: 1,
        at: 83,
        source: 'human',
        path: [],
      },
    ])
  })
})
