import type { Problem } from '@flowgraph/core'
import { useEffect, useMemo, useRef } from 'react'

import { AttachmentStoreContext } from '../attachments/context.js'
import {
  createAttachmentFileStore,
  type AttachmentFileStore,
} from '../attachments/attachment-store.js'
import {
  DraftRegistryContext,
  QuestionOrderContext,
  draftRegistryOf,
} from '../controller/internal.js'
import { resolveQuestionRenderer } from '../renderers/renderer-registry.js'
import type { FlowSurveyController, RendererRegistry, ResolveText } from '../types.js'
import { problemQuestion, problemsForQuestion } from './problem-mapping.js'
import { ProblemMessages } from './problem-messages.js'
import { resolveText } from './resolve-text.js'

export type FlowPageProps = {
  readonly controller: FlowSurveyController
  readonly resolveText?: ResolveText
  readonly renderers?: RendererRegistry
  readonly disabled?: boolean
  readonly backLabel?: string
  readonly nextLabel?: string
  readonly attachmentStore?: AttachmentFileStore
}

export const FlowPage = ({
  controller,
  resolveText: resolver,
  renderers,
  disabled = false,
  backLabel = 'Atrás',
  nextLabel = 'Continuar',
  attachmentStore,
}: FlowPageProps) => {
  const { view, friction } = controller
  const drafts = draftRegistryOf(controller)
  const page = useRef<HTMLElement>(null)
  const summary = useRef<HTMLDivElement>(null)
  const focusedFriction = useRef(friction)
  const localAttachmentStore = useMemo(createAttachmentFileStore, [])
  const resolvedAttachmentStore = attachmentStore ?? localAttachmentStore
  const pageProblems = friction.problems.filter(
    (problem: Problem) => problemQuestion(problem) === undefined,
  )

  useEffect(() => {
    if (
      friction === focusedFriction.current ||
      friction.problems.length === 0 ||
      (friction.action !== 'next' && friction.action !== 'back')
    ) {
      return
    }
    focusedFriction.current = friction
    const firstQuestion = friction.problems
      .map(problemQuestion)
      .find((question) => question !== undefined)
    const draftFocused = drafts.focusFirst(friction.problems)
    const pageElement = page.current as HTMLElement
    const questionGroup = [...pageElement.querySelectorAll('[data-flowgraph-question]')].find(
      (element) => element.getAttribute('data-flowgraph-question') === firstQuestion,
    )
    const field = questionGroup?.querySelector<HTMLElement>('input, textarea, select, button')
    if (field !== undefined && field !== null) field.focus()
    else if (!draftFocused) summary.current?.focus()
  }, [drafts, friction])

  if (view.status !== 'active' || view.current.kind !== 'page') return null

  return (
    <AttachmentStoreContext.Provider value={resolvedAttachmentStore}>
      <DraftRegistryContext.Provider value={drafts}>
        <section ref={page} aria-labelledby="flowgraph-page-title">
          <h2 id="flowgraph-page-title">
            {view.current.title ? resolveText(view.current.title, resolver) : 'Encuesta'}
          </h2>
          <progress aria-label="Progreso" max={1} value={view.progress.fraction} />
          <ProblemMessages
            id="flowgraph-page-problems"
            problems={pageProblems}
            live
            focusRef={(element) => {
              summary.current = element
            }}
          />
          {view.questions.map(({ question, value, order }) => {
            const Renderer = resolveQuestionRenderer(question, renderers)
            const options =
              question.kind === 'select'
                ? question.options.map((option) => ({
                    id: option.id,
                    text: resolveText(option.text, resolver),
                  }))
                : undefined
            return (
              <QuestionOrderContext.Provider key={question.id} value={order}>
                <Renderer
                  question={question}
                  text={resolveText(question.text, resolver)}
                  options={options}
                  value={value}
                  problems={problemsForQuestion(friction.problems, question.id)}
                  disabled={disabled}
                  onAnswer={(answer) => controller.answer(question.id, answer)}
                />
              </QuestionOrderContext.Provider>
            )
          })}
          <nav aria-label="Navegación de la encuesta">
            <button type="button" disabled={disabled || !view.canGoBack} onClick={controller.back}>
              {backLabel}
            </button>
            <button type="button" disabled={disabled} onClick={controller.next}>
              {nextLabel}
            </button>
          </nav>
        </section>
      </DraftRegistryContext.Provider>
    </AttachmentStoreContext.Provider>
  )
}
