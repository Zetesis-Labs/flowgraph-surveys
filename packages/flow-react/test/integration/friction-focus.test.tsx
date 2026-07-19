import { toNodeId, toSafeInt, type FlowSchema } from '@flowgraph/core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useFlowSurvey } from '../../src/controller/use-flow-survey.js'
import type { FlowSurveyController } from '../../src/types.js'
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

describe('friction clearing and focus', () => {
  it('clears only the corrected question friction', () => {
    const schema = surveySchema()
    const session = startedSession(schema)
    let controller: FlowSurveyController | undefined
    const Harness = () => {
      controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(60),
      })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    act(() => {
      controller?.next()
    })
    expect(controller?.friction.problems).toHaveLength(3)

    act(() => {
      controller?.answer(qName, 'Ada')
    })
    expect(controller?.friction.problems.map((problem) => problem.where?.q)).toEqual([
      qAge,
      qReason,
    ])

    act(() => {
      controller?.answer(qAge, toSafeInt(36))
      controller?.answer(qReason, [optionSleep])
    })
    expect(controller?.friction.problems).toEqual([])
  })

  it('focuses page friction once and clears it after successful navigation', () => {
    const base = surveySchema()
    const page = base.nodes[toNodeId('profile')]
    if (page?.kind !== 'page') throw new Error('Friction fixture page is missing')
    const schema: FlowSchema = {
      ...base,
      nodes: {
        ...base.nodes,
        [toNodeId('profile')]: { ...page, questions: [], edges: [] },
      },
    }
    const session = startedSession(schema)
    let controller: FlowSurveyController | undefined
    const Harness = () => {
      controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(70),
      })
      return (
        <>
          <FlowPage controller={controller} />
          <button type="button">Host rerender target</button>
        </>
      )
    }
    const rendered = render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveFocus()

    const host = screen.getByRole('button', { name: /host rerender/i })
    host.focus()
    rendered.rerender(<Harness />)
    expect(host).toHaveFocus()

    act(() => {
      controller?.back()
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
