import type { Problem } from '@flowgraph/core'
import type { QuestionRenderer } from '@flowgraph/react'
import { useEffect, useId, useRef } from 'react'

const message = ({ code }: Problem): string => {
  if (code === 'required') return 'Este campo es obligatorio.'
  if (code === 'too-long') return 'El texto supera la longitud permitida.'
  return 'Revisa este valor antes de continuar.'
}

export const ShortTextRenderer: QuestionRenderer = ({
  question,
  text,
  value,
  problems,
  disabled,
  onAnswer,
}) => {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const previousProblemCount = useRef(problems.length)
  const current = typeof value === 'string' ? value : ''
  const description = problems.length > 0 ? `${id}-problems` : undefined

  if (question.kind !== 'text') throw new Error('ShortTextRenderer requires a text question')

  useEffect(() => {
    if (previousProblemCount.current === 0 && problems.length > 0) input.current?.focus()
    previousProblemCount.current = problems.length
  }, [problems.length])

  return (
    <div data-flowgraph-question={question.id}>
      <label htmlFor={id}>
        {text}
        {question.required === true ? ' (obligatorio)' : ''}
      </label>
      <input
        ref={input}
        id={id}
        type="text"
        value={current}
        required={question.required === true}
        maxLength={question.maxLength}
        disabled={disabled}
        aria-invalid={problems.length > 0}
        aria-describedby={description}
        onChange={(event) => onAnswer(event.currentTarget.value)}
      />
      {question.maxLength === undefined ? null : (
        <small>
          {Array.from(current).length}/{question.maxLength}
        </small>
      )}
      {problems.length === 0 ? null : (
        <div id={`${id}-problems`}>
          <ul>
            {problems.map((problem, index) => (
              <li key={`${problem.code}-${String(index)}`}>{message(problem)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
