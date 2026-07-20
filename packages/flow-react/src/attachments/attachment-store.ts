import type { AttachmentId, AttachmentRef } from '@flowgraph/core'

export type AttachmentFileStore = {
  readonly put: (reference: AttachmentRef, file: File) => void
  readonly get: (id: AttachmentId) => File | undefined
  readonly has: (id: AttachmentId) => boolean
  readonly delete: (id: AttachmentId) => void
  readonly retain: (ids: readonly AttachmentId[]) => void
  readonly clear: () => void
}

export const createAttachmentFileStore = (): AttachmentFileStore => {
  const files = new Map<AttachmentId, File>()
  return {
    put: ({ id }, file) => {
      files.set(id, file)
    },
    get: (id) => files.get(id),
    has: (id) => files.has(id),
    delete: (id) => {
      files.delete(id)
    },
    retain: (ids) => {
      const retained = new Set(ids)
      for (const id of files.keys()) {
        if (!retained.has(id)) files.delete(id)
      }
    },
    clear: () => {
      files.clear()
    },
  }
}
