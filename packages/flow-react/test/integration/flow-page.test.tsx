import { ok, toNodeId, type FlowSchema } from '@flowgraph/core'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { useFlowSurvey } from '../../src/controller/use-flow-survey.js'
import { useDraftRegistration } from '../../src/renderers/use-draft-registration.js'
import type { QuestionRenderer } from '../../src/types.js'
import { FlowPage } from '../../src/view/flow-page.js'
import {
  attachmentSchema,
  createMetaFactory,
  qName,
  startedSession,
  surveySchema,
} from '../support/builders.js'

describe('FlowPage', () => {
  it('renders only the active page and focuses the first rejected question', async () => {
    const user = userEvent.setup()
    const schema = surveySchema()
    const session = startedSession(schema)
    const Harness = () => {
      const controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(10),
      })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByRole('textbox', { name: /nombre/i })).toHaveFocus()
    expect(screen.getAllByText('Este campo es obligatorio.')).toHaveLength(3)
  })

  it('renders no mutable page after the session is sealed', () => {
    const schema = surveySchema()
    const session = startedSession(schema)
    const meta = createMetaFactory(10)
    const page = schema.nodes[toNodeId('profile')]
    if (page?.kind !== 'page') throw new Error('Fixture page missing')
    for (const [question, value] of [
      [page.questions[0], 'Ada'],
      [page.questions[1], 36],
      [page.questions[2], ['sleep']],
    ] as const) {
      if (!question) throw new Error('Fixture question missing')
      session.dispatch({
        kind: 'ANSWER',
        q: question.id,
        value: value as never,
        meta: meta(),
      })
    }
    session.dispatch({ kind: 'NEXT', meta: meta() })
    session.dispatch({ kind: 'NEXT', meta: meta() })

    const Harness = () => {
      const controller = useFlowSurvey({ schema, session, createMeta: meta })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('uses a neutral page title when the schema page has no title', () => {
    const base = surveySchema()
    const page = base.nodes[toNodeId('profile')]
    if (page?.kind !== 'page') throw new Error('Fixture page missing')
    const untitledPage = {
      kind: page.kind,
      questions: page.questions,
      edges: page.edges,
    } as const
    const schema: FlowSchema = {
      ...base,
      nodes: {
        ...base.nodes,
        [toNodeId('profile')]: untitledPage,
      },
    }
    const session = startedSession(schema)
    const Harness = () => {
      const controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(10),
      })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Encuesta' })).toBeInTheDocument()
  })

  it('retains registered renderer focus when custom markup has no native field', async () => {
    const user = userEvent.setup()
    const schema = surveySchema()
    const session = startedSession(schema)
    const focus = vi.fn()
    const Renderer: QuestionRenderer = ({ question, text }) => {
      useDraftRegistration(
        question.id,
        () => false,
        () => ok([]),
        focus,
      )
      return <div>{text}</div>
    }
    const Harness = () => {
      const controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(10),
      })
      return <FlowPage controller={controller} renderers={{ byId: { [qName]: Renderer } }} />
    }
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(focus).toHaveBeenCalledOnce()
  })

  it('renders the default attachment control and focuses it after required rejection', async () => {
    const user = userEvent.setup()
    const schema = attachmentSchema()
    const session = startedSession(schema)
    const Harness = () => {
      const controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(10),
      })
      return <FlowPage controller={controller} />
    }
    render(<Harness />)

    const input = screen.getByLabelText(/adjunta imágenes/i)
    expect(input).not.toHaveAttribute('capture')
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(input).toHaveFocus()
    expect(screen.getByText('Este campo es obligatorio.')).toBeVisible()
  })

  it('removes, replaces, disables, and restores attachment metadata after remount', async () => {
    const user = userEvent.setup()
    const schema = attachmentSchema()
    const session = startedSession(schema)
    const Harness = ({ disabled = false }: { readonly disabled?: boolean }) => {
      const controller = useFlowSurvey({
        schema,
        session,
        createMeta: createMetaFactory(10),
      })
      return <FlowPage controller={controller} disabled={disabled} />
    }
    const first = render(<Harness />)
    const input = screen.getByLabelText(/adjunta imágenes/i)

    await user.upload(input, new File(['first'], 'first.jpg', { type: 'image/jpeg' }))
    expect(screen.getByText('first.jpg')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /quitar first.jpg/i }))
    expect(screen.queryByText('first.jpg')).not.toBeInTheDocument()

    await user.upload(input, new File(['replacement'], 'replacement.webp', { type: 'image/webp' }))
    expect(screen.getByText('replacement.webp')).toBeVisible()
    first.unmount()

    const restored = render(<Harness />)
    expect(screen.getByText('replacement.webp')).toBeVisible()
    expect(screen.getByText(/debes volver a seleccionar/i)).toBeVisible()
    restored.rerender(<Harness disabled />)
    expect(screen.getByLabelText(/adjunta imágenes/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /quitar replacement.webp/i })).toBeDisabled()
  })
})
