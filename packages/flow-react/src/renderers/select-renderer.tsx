import type { OptionId, SelectQuestion } from '@flowgraph/core'
import { useCallback, useId, useMemo, useRef } from 'react'

import type { QuestionRendererProps } from '../types.js'
import { ProblemMessages } from '../view/problem-messages.js'
import { useDraftRegistration } from './use-draft-registration.js'

export const SelectRenderer = ({
  question,
  text,
  options,
  value,
  problems,
  disabled,
  onAnswer,
}: QuestionRendererProps<SelectQuestion>) => {
  const id = useId()
  const firstInput = useRef<HTMLInputElement>(null)
  const pointerSelection = useRef<OptionId | undefined>(undefined)
  const selected = useMemo(() => new Set(Array.isArray(value) ? value : []), [value])
  const clean = useCallback(() => false, [])
  const flush = useCallback(() => ({ ok: true as const, value: [] }), [])
  const focus = useCallback(() => firstInput.current?.focus(), [])
  useDraftRegistration(question.id, clean, flush, focus)

  const activate = (option: OptionId, multiple: boolean) => {
    if (!multiple) {
      onAnswer([option])
      return
    }
    const changed = new Set(selected)
    if (changed.has(option)) changed.delete(option)
    else changed.add(option)
    onAnswer(
      question.options.map(({ id: optionId }) => optionId).filter((item) => changed.has(item)),
    )
  }
  const description = problems.length > 0 ? `${id}-problems` : undefined

  return (
    <fieldset
      disabled={disabled}
      aria-invalid={problems.length > 0}
      aria-describedby={description}
      data-flowgraph-question={question.id}
    >
      <legend>
        {text}
        {question.required === true ? ' (obligatorio)' : ''}
      </legend>
      {options.map((option, index) => {
        const optionId = `${id}-${String(index)}`
        const multiple = question.multiple === true
        return (
          <div key={option.id}>
            <input
              ref={index === 0 ? firstInput : undefined}
              id={optionId}
              type={multiple ? 'checkbox' : 'radio'}
              name={id}
              value={option.id}
              checked={selected.has(option.id)}
              onChange={() => {
                if (pointerSelection.current === option.id) {
                  pointerSelection.current = undefined
                  return
                }
                activate(option.id, multiple)
              }}
              onMouseDown={(event) => {
                if (event.button !== 0) return
                pointerSelection.current = option.id
                globalThis.setTimeout(() => {
                  pointerSelection.current = undefined
                }, 0)
                activate(option.id, multiple)
              }}
            />
            <label htmlFor={optionId}>{option.text}</label>
          </div>
        )
      })}
      <ProblemMessages id={`${id}-problems`} problems={problems} />
    </fieldset>
  )
}
