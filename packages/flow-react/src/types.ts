import type {
  AnswerValue,
  activeAnswers,
  CommandMeta,
  Event,
  FlowSchema,
  FlowState,
  Node,
  OptionId,
  Problem,
  Progress,
  Question,
  QuestionId,
  TextRef,
} from '@flowgraph/core'
import type { FlowSession } from '@flowgraph/session'
import type { ComponentType } from 'react'

import type { AttachmentFileStore } from './attachments/attachment-store.js'

export type CommandMetaFactory = () => CommandMeta

export type FlowView = {
  readonly status: FlowState['status']
  readonly current: Node
  readonly questions: readonly QuestionView[]
  readonly progress: Progress
  readonly canGoBack: boolean
  readonly finished: boolean
  readonly outcome: FlowState['outcome']
  readonly activeAnswers: ReturnType<typeof activeAnswers>
}

export type QuestionView = {
  readonly question: Question
  readonly value: AnswerValue | undefined
  readonly order: number
}

export type FrictionAction = 'answer' | 'next' | 'back' | 'restore'

export type FrictionState = {
  readonly action?: FrictionAction
  readonly problems: readonly Problem[]
}

export type ResolvedOption = {
  readonly id: OptionId
  readonly text: string
}

export type AnswerResult =
  | {
      readonly ok: true
      readonly value: readonly Event[]
    }
  | {
      readonly ok: false
      readonly error: readonly Problem[]
    }

export type QuestionRendererProps<Q extends Question = Question> = {
  readonly question: Q
  readonly text: string
  readonly options: Q extends { readonly kind: 'select' } ? readonly ResolvedOption[] : undefined
  readonly value: AnswerValue | undefined
  readonly problems: readonly Problem[]
  readonly disabled: boolean
  readonly onAnswer: (value: AnswerValue) => AnswerResult
}

export type QuestionRenderer<Q extends Question = Question> = ComponentType<
  QuestionRendererProps<Q>
>

export type RendererRegistry = {
  readonly byKind?: Readonly<Partial<Record<Question['kind'], QuestionRenderer>>>
  readonly byId?: Readonly<Partial<Record<QuestionId, QuestionRenderer>>>
}

export type { AttachmentFileStore }

export type ResolveText = (text: TextRef) => string | undefined

export type UseFlowSurveyOptions = {
  readonly schema: FlowSchema
  readonly session: FlowSession
  readonly createMeta: CommandMetaFactory
}

export type FlowSurveyController = {
  readonly schema: FlowSchema
  readonly session: FlowSession
  readonly state: FlowState
  readonly view: FlowView
  readonly friction: FrictionState
  readonly answer: (question: QuestionId, value: AnswerValue) => AnswerResult
  readonly next: () => AnswerResult
  readonly back: () => AnswerResult
  readonly clearFriction: () => void
}
