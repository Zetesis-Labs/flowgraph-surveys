import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { useFlowSurvey } from '../../src/controller/use-flow-survey.js'
import type { QuestionRenderer, QuestionRendererProps } from '../../src/types.js'
import { FlowPage } from '../../src/view/flow-page.js'
import { createMetaFactory, qName, startedSession, surveySchema } from '../support/builders.js'

const CustomTextRenderer = ((props: QuestionRendererProps) => (
  <button type="button" onClick={() => props.onAnswer('custom answer')}>
    Custom {props.text}
  </button>
)) satisfies QuestionRenderer

describe('custom renderer contract', () => {
  it('receives only closed question presentation props and answers through the controller', async () => {
    const user = userEvent.setup()
    const schema = surveySchema()
    const session = startedSession(schema)
    const observed = vi.fn()
    const Renderer: QuestionRenderer = (props) => {
      observed(Object.keys(props).sort())
      return <CustomTextRenderer {...props} />
    }
    const Harness = () => {
      const controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(20),
      })
      return <FlowPage controller={controller} renderers={{ byId: { [qName]: Renderer } }} />
    }
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Custom Nombre' }))

    expect(session.getSnapshot().answers[qName]).toBe('custom answer')
    expect(observed).toHaveBeenLastCalledWith([
      'disabled',
      'onAnswer',
      'options',
      'problems',
      'question',
      'text',
      'value',
    ])
  })
})
