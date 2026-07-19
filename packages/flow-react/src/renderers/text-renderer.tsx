import { ok, type TextQuestion } from '@flowgraph/core'
import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react'

import type { QuestionRendererProps } from '../types.js'
import { ProblemMessages } from '../view/problem-messages.js'
import { useDraftRegistration } from './use-draft-registration.js'

export const TextRenderer = ({
  question,
  text,
  value,
  problems,
  disabled,
  onAnswer,
}: QuestionRendererProps<TextQuestion>) => {
  const id = useId()
  const input = useRef<HTMLTextAreaElement>(null)
  const dirty = useRef(false)
  const [draft, setDraft] = useState(typeof value === 'string' ? value : '')

  useEffect(() => {
    if (!dirty.current) setDraft(typeof value === 'string' ? value : '')
  }, [value])

  const flush = useCallback(() => {
    if (!dirty.current) return ok([])
    const result = onAnswer(draft)
    if (result.ok) dirty.current = false
    return result
  }, [draft, onAnswer])

  const isDirty = useCallback(() => dirty.current, [])
  const focus = useCallback(() => input.current?.focus(), [])
  useDraftRegistration(question.id, isDirty, flush, focus)

  const change = (event: ChangeEvent<HTMLTextAreaElement>) => {
    dirty.current = true
    setDraft(event.currentTarget.value)
  }
  const description = problems.length > 0 ? `${id}-problems` : undefined

  return (
    <div data-flowgraph-question={question.id}>
      <label htmlFor={id}>
        {text}
        {question.required === true ? ' (obligatorio)' : ''}
      </label>
      <textarea
        ref={input}
        id={id}
        value={draft}
        required={question.required === true}
        disabled={disabled}
        aria-invalid={problems.length > 0}
        aria-describedby={description}
        onChange={change}
        onBlur={() => {
          flush()
        }}
      />
      {question.maxLength === undefined ? null : (
        <small>
          {Array.from(draft).length}/{question.maxLength}
        </small>
      )}
      <ProblemMessages id={`${id}-problems`} problems={problems} />
    </div>
  )
}
