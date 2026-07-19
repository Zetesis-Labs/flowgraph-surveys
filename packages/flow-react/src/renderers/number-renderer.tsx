import { err, isSafeInt, ok, toSafeInt, type NumberQuestion, type Problem } from '@flowgraph/core'
import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react'

import type { QuestionRendererProps } from '../types.js'
import { ProblemMessages } from '../view/problem-messages.js'
import { useDraftRegistration } from './use-draft-registration.js'

export const NumberRenderer = ({
  question,
  text,
  value,
  problems,
  disabled,
  onAnswer,
}: QuestionRendererProps<NumberQuestion>) => {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const dirty = useRef(false)
  const [draft, setDraft] = useState(typeof value === 'number' ? String(value) : '')
  const [localProblems, setLocalProblems] = useState<readonly Problem[]>([])

  useEffect(() => {
    if (!dirty.current) setDraft(typeof value === 'number' ? String(value) : '')
  }, [value])

  const flush = useCallback(() => {
    if (!dirty.current) return ok([])
    const numeric = Number(draft)
    if (!/^-?(0|[1-9]\d*)$/.test(draft) || !isSafeInt(numeric)) {
      const invalid: Problem = {
        code: 'answer-kind-mismatch',
        where: { q: question.id },
      }
      setLocalProblems([invalid])
      return err([invalid])
    }
    const result = onAnswer(toSafeInt(numeric))
    if (result.ok) {
      dirty.current = false
      setLocalProblems([])
    }
    return result
  }, [draft, onAnswer, question.id])

  const isDirty = useCallback(() => dirty.current, [])
  const focus = useCallback(() => input.current?.focus(), [])
  useDraftRegistration(question.id, isDirty, flush, focus)

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    dirty.current = true
    setDraft(event.currentTarget.value)
    setLocalProblems([])
  }
  const visibleProblems = [...localProblems, ...problems]
  const description = visibleProblems.length > 0 ? `${id}-problems` : undefined

  return (
    <div data-flowgraph-question={question.id}>
      <label htmlFor={id}>
        {text}
        {question.required === true ? ' (obligatorio)' : ''}
      </label>
      <input
        ref={input}
        id={id}
        type="number"
        inputMode="numeric"
        step={1}
        min={question.min}
        max={question.max}
        value={draft}
        required={question.required === true}
        disabled={disabled}
        aria-invalid={visibleProblems.length > 0}
        aria-describedby={description}
        onChange={change}
        onBlur={() => {
          flush()
        }}
      />
      <ProblemMessages id={`${id}-problems`} problems={visibleProblems} />
    </div>
  )
}
