import { ok, type Event, type Problem, type QuestionId, type Result } from '@flowgraph/core'

export type DraftRegistration = {
  readonly question: QuestionId
  readonly order: number
  readonly dirty: () => boolean
  readonly flush: () => Result<readonly Event[], readonly Problem[]>
  readonly focus: () => void
}

export type DraftRegistry = {
  readonly register: (registration: DraftRegistration) => () => void
  readonly flush: () => Result<readonly Event[], readonly Problem[]>
  readonly focusFirst: (problems: readonly Problem[]) => boolean
}

export const createDraftRegistry = (): DraftRegistry => {
  const registrations = new Map<
    QuestionId,
    { readonly token: symbol; readonly value: DraftRegistration }
  >()

  return {
    register: (registration) => {
      const token = Symbol(registration.question)
      registrations.set(registration.question, { token, value: registration })
      let active = true
      return () => {
        if (!active) return
        active = false
        if (registrations.get(registration.question)?.token === token) {
          registrations.delete(registration.question)
        }
      }
    },
    flush: () => {
      const events: Event[] = []
      const ordered = [...registrations.values()]
        .map(({ value }) => value)
        .sort((left, right) => left.order - right.order)
      for (const registration of ordered) {
        if (!registration.dirty()) continue
        const result = registration.flush()
        if (!result.ok) return result
        events.push(...result.value)
      }
      return ok(events)
    },
    focusFirst: (problems) => {
      const questions = new Set(
        problems.flatMap((problem) => {
          const question = problem.where?.q
          return typeof question === 'string' ? [question] : []
        }),
      )
      const target = [...registrations.values()]
        .map(({ value }) => value)
        .filter(({ question }) => questions.has(question))
        .sort((left, right) => left.order - right.order)[0]
      if (!target) return false
      target.focus()
      return true
    },
  }
}
