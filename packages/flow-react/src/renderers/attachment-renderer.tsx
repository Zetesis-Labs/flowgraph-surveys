import {
  toAttachmentId,
  toSafeInt,
  type AttachmentQuestion,
  type AttachmentRef,
} from '@flowgraph/core'
import { useCallback, useId, useRef, type ChangeEvent } from 'react'

import { useAttachmentFileStore } from '../attachments/context.js'
import type { QuestionRendererProps } from '../types.js'
import { ProblemMessages } from '../view/problem-messages.js'
import { useDraftRegistration } from './use-draft-registration.js'

let fallbackSequence = 0

const browserCrypto = (): { readonly randomUUID?: () => string } | undefined => globalThis.crypto

const createId = () => {
  const randomId = browserCrypto()?.randomUUID?.()
  if (randomId !== undefined) return toAttachmentId(randomId)
  fallbackSequence += 1
  return toAttachmentId(`attachment-${String(Date.now())}-${String(fallbackSequence)}`)
}

const attachmentValues = (
  value: QuestionRendererProps<AttachmentQuestion>['value'],
): readonly AttachmentRef[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null)
    ? (value as readonly AttachmentRef[])
    : []

const formatBytes = (size: number) =>
  size < 1024 * 1024
    ? `${String(Math.max(1, Math.round(size / 1024)))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`

export const AttachmentRenderer = ({
  question,
  text,
  value,
  problems,
  disabled,
  onAnswer,
}: QuestionRendererProps<AttachmentQuestion>) => {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const store = useAttachmentFileStore()
  const selected = attachmentValues(value)
  const clean = useCallback(() => false, [])
  const flush = useCallback(() => ({ ok: true as const, value: [] }), [])
  const focus = useCallback(() => input.current?.focus(), [])
  useDraftRegistration(question.id, clean, flush, focus)

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.currentTarget.files ?? [])]
    const available = selected.filter(({ id: attachmentId }) => store.has(attachmentId))
    const additions = files.map((file) => ({
      reference: {
        id: createId(),
        name: file.name,
        mediaType: file.type,
        size: toSafeInt(file.size),
      } satisfies AttachmentRef,
      file,
    }))
    const proposed = [...available, ...additions.map(({ reference }) => reference)]
    const result = onAnswer(proposed)
    if (result.ok) {
      store.retain(proposed.map(({ id: attachmentId }) => attachmentId))
      additions.forEach(({ reference, file }) => {
        store.put(reference, file)
      })
    }
    event.currentTarget.value = ''
  }

  const remove = (reference: AttachmentRef) => {
    const proposed = selected.filter(({ id: attachmentId }) => attachmentId !== reference.id)
    const result = onAnswer(proposed)
    if (!result.ok) return
    store.delete(reference.id)
    store.retain(proposed.map(({ id: attachmentId }) => attachmentId))
  }

  const description = problems.length > 0 ? `${id}-problems` : undefined
  return (
    <div
      className="flowgraph-attachments"
      data-flowgraph-question={question.id}
      aria-invalid={problems.length > 0}
    >
      <label htmlFor={id}>
        {text}
        {question.required === true ? ' (obligatorio)' : ''}
      </label>
      <input
        ref={input}
        id={id}
        type="file"
        multiple={question.maxFiles !== 1}
        accept={question.accept?.join(',')}
        disabled={disabled}
        required={question.required === true}
        aria-describedby={description}
        onChange={change}
      />
      {selected.length === 0 ? null : (
        <ul aria-label="Archivos adjuntos">
          {selected.map((reference) => (
            <li key={reference.id}>
              <span>
                <strong>{reference.name}</strong>
                <small>
                  {formatBytes(reference.size)}
                  {store.has(reference.id) ? '' : ' · Debes volver a seleccionar este archivo'}
                </small>
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  remove(reference)
                }}
                aria-label={`Quitar ${reference.name}`}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
      <ProblemMessages id={`${id}-problems`} problems={problems} />
    </div>
  )
}
