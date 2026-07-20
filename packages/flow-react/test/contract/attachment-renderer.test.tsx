import {
  err,
  ok,
  toNodeId,
  toSafeInt,
  type AnswerValue,
  type AttachmentQuestion,
  type AttachmentRef,
} from '@flowgraph/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AttachmentStoreContext } from '../../src/attachments/context.js'
import { createAttachmentFileStore } from '../../src/attachments/attachment-store.js'
import {
  createDraftRegistry,
  type DraftRegistration,
  type DraftRegistry,
} from '../../src/controller/draft-registry.js'
import { DraftRegistryContext } from '../../src/controller/internal.js'
import { AttachmentRenderer } from '../../src/renderers/attachment-renderer.js'
import type { AnswerResult } from '../../src/types.js'
import { attachmentRef, attachmentSchema, qPhotos } from '../support/builders.js'

const definition = (): AttachmentQuestion => {
  const page = attachmentSchema().nodes[toNodeId('photos')]
  const question = page?.kind === 'page' ? page.questions[0] : undefined
  if (question?.kind !== 'attachment') throw new Error('attachment fixture missing')
  return question
}

type AttachmentAnswerMock = ReturnType<typeof vi.fn<(value: AnswerValue) => AnswerResult>>

const setup = (
  value: AnswerValue | undefined = [],
  question = definition(),
  onAnswer: AttachmentAnswerMock = vi.fn<(value: AnswerValue) => AnswerResult>(() => ok([])),
) => {
  const store = createAttachmentFileStore()
  const baseRegistry = createDraftRegistry()
  let registration: DraftRegistration | undefined
  const registry: DraftRegistry = {
    ...baseRegistry,
    register: (next) => {
      registration = next
      return baseRegistry.register(next)
    },
  }
  render(
    <AttachmentStoreContext.Provider value={store}>
      <DraftRegistryContext.Provider value={registry}>
        <AttachmentRenderer
          question={question}
          text="Adjunta imágenes"
          options={undefined}
          value={value}
          problems={[]}
          disabled={false}
          onAnswer={onAnswer}
        />
      </DraftRegistryContext.Provider>
    </AttachmentStoreContext.Provider>,
  )
  return { store, onAnswer, registration: () => registration }
}

describe('AttachmentRenderer', () => {
  it('selects existing files without a camera capture affordance', async () => {
    const user = userEvent.setup()
    const { store, onAnswer } = setup()
    const input = screen.getByLabelText(/adjunta imágenes/i)
    expect(input).toHaveAttribute('type', 'file')
    expect(input).not.toHaveAttribute('capture')
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')

    const file = new File(['pixels'], 'front.webp', { type: 'image/webp' })
    await user.upload(input, file)

    expect(onAnswer).toHaveBeenCalledOnce()
    const answer = onAnswer.mock.calls[0]?.[0]
    expect(answer).toEqual([
      expect.objectContaining({
        name: 'front.webp',
        mediaType: 'image/webp',
        size: file.size,
      }),
    ])
    const reference =
      Array.isArray(answer) && typeof answer[0] === 'object'
        ? (answer[0] as AttachmentRef)
        : undefined
    expect(reference !== undefined && store.has(reference.id)).toBe(true)
  })

  it('removes committed files and reports unavailable restored metadata', async () => {
    const user = userEvent.setup()
    const reference = attachmentRef()
    const { store, onAnswer } = setup([reference])
    expect(screen.getByText(/debes volver a seleccionar/i)).toBeVisible()

    store.put(reference, new File(['pixels'], reference.name, { type: reference.mediaType }))
    await user.click(screen.getByRole('button', { name: /quitar front.jpg/i }))
    expect(onAnswer).toHaveBeenCalledWith([])
    expect(store.has(reference.id)).toBe(false)
  })

  it('disables selection and removal when sealed', () => {
    const reference = attachmentRef()
    const store = createAttachmentFileStore()
    store.put(reference, new File(['pixels'], reference.name, { type: reference.mediaType }))
    render(
      <AttachmentStoreContext.Provider value={store}>
        <DraftRegistryContext.Provider value={createDraftRegistry()}>
          <AttachmentRenderer
            question={definition()}
            text="Adjunta imágenes"
            options={undefined}
            value={[reference]}
            problems={[]}
            disabled
            onAnswer={() => ok([])}
          />
        </DraftRegistryContext.Provider>
      </AttachmentStoreContext.Provider>,
    )
    expect(screen.getByLabelText(/adjunta imágenes/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /quitar front.jpg/i })).toBeDisabled()
  })

  it('registers the native file input as the question focus target', () => {
    const store = createAttachmentFileStore()
    const registry = createDraftRegistry()
    render(
      <AttachmentStoreContext.Provider value={store}>
        <DraftRegistryContext.Provider value={registry}>
          <AttachmentRenderer
            question={definition()}
            text="Adjunta imágenes"
            options={undefined}
            value={[]}
            problems={[{ code: 'required', where: { q: qPhotos } }]}
            disabled={false}
            onAnswer={() => ok([])}
          />
        </DraftRegistryContext.Provider>
      </AttachmentStoreContext.Provider>,
    )
    expect(registry.focusFirst([{ code: 'required', where: { q: qPhotos } }])).toBe(true)
    expect(screen.getByLabelText(/adjunta imágenes/i)).toHaveFocus()
  })

  it('exposes a clean no-op draft flush for immediate attachment answers', () => {
    const { registration } = setup()
    expect(registration()?.dirty()).toBe(false)
    expect(registration()?.flush()).toEqual({ ok: true, value: [] })
  })

  it('preserves available files on addition and formats megabyte references', async () => {
    const user = userEvent.setup()
    const reference = { ...attachmentRef(), size: toSafeInt(2 * 1024 * 1024) }
    const { store, onAnswer } = setup([reference])
    store.put(reference, new File(['old'], reference.name, { type: reference.mediaType }))
    expect(screen.getByText(/2\.0 MB/)).toBeVisible()

    await user.upload(
      screen.getByLabelText(/adjunta imágenes/i),
      new File(['new'], 'detail.png', { type: 'image/png' }),
    )
    expect(onAnswer).toHaveBeenCalledWith([
      reference,
      expect.objectContaining({ name: 'detail.png' }),
    ])
  })

  it('uses a deterministic fallback when random UUID support is absent', async () => {
    const user = userEvent.setup()
    const originalCrypto = globalThis.crypto
    try {
      vi.stubGlobal('crypto', undefined)
      const first = setup()
      await user.upload(
        screen.getByLabelText(/adjunta imágenes/i),
        new File(['one'], 'fallback.jpg', { type: 'image/jpeg' }),
      )
      const answer = first.onAnswer.mock.calls[0]?.[0]
      expect(Array.isArray(answer)).toBe(true)
      if (Array.isArray(answer)) {
        expect((answer[0] as AttachmentRef | undefined)?.id.startsWith('attachment-')).toBe(true)
      }
    } finally {
      vi.stubGlobal('crypto', originalCrypto)
    }
  })

  it('handles an empty native file list and an optional malformed initial value', () => {
    const optional = { ...definition(), required: false }
    const { onAnswer } = setup('not-an-attachment', optional)
    const input = screen.getByLabelText('Adjunta imágenes')
    expect(input).not.toHaveAttribute('required')
    expect(input).not.toHaveAttribute('capture')
    expect(screen.queryByRole('list', { name: /archivos adjuntos/i })).not.toBeInTheDocument()
    fireEvent.change(input, { target: { files: null } })
    expect(onAnswer).toHaveBeenCalledWith([])
  })

  it('leaves store state untouched when additions or removals are rejected', async () => {
    const user = userEvent.setup()
    const rejected = vi.fn<(value: AnswerValue) => AnswerResult>(() =>
      err([{ code: 'required' as const }]),
    )
    const reference = attachmentRef()
    const { store } = setup([reference], definition(), rejected)
    store.put(reference, new File(['old'], reference.name, { type: reference.mediaType }))

    await user.upload(
      screen.getByLabelText(/adjunta imágenes/i),
      new File(['new'], 'rejected.png', { type: 'image/png' }),
    )
    expect(store.has(reference.id)).toBe(true)
    await user.click(screen.getByRole('button', { name: /quitar front.jpg/i }))
    expect(store.has(reference.id)).toBe(true)
  })

  it('retains the remaining live reference when one of two files is removed', async () => {
    const user = userEvent.setup()
    const front = attachmentRef()
    const side = attachmentRef('side.jpg')
    const { store, onAnswer } = setup([front, side])
    store.put(front, new File(['front'], front.name, { type: front.mediaType }))
    store.put(side, new File(['side'], side.name, { type: side.mediaType }))

    await user.click(screen.getByRole('button', { name: /quitar front.jpg/i }))
    expect(onAnswer).toHaveBeenCalledWith([side])
    expect(store.has(front.id)).toBe(false)
    expect(store.has(side.id)).toBe(true)
  })

  it('throws a developer-facing error without an attachment store provider', () => {
    expect(() =>
      render(
        <DraftRegistryContext.Provider value={createDraftRegistry()}>
          <AttachmentRenderer
            question={definition()}
            text="Adjunta imágenes"
            options={undefined}
            value={[]}
            problems={[]}
            disabled={false}
            onAnswer={() => ok([])}
          />
        </DraftRegistryContext.Provider>,
      ),
    ).toThrow('Attachment renderer requires an attachment store')
  })
})
