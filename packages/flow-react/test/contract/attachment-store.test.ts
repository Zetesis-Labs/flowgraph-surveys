import { describe, expect, it } from 'vitest'

import { createAttachmentFileStore } from '../../src/attachments/attachment-store.js'
import { attachmentRef } from '../support/builders.js'

describe('AttachmentFileStore', () => {
  it('retains live files by opaque id and clears them deterministically', () => {
    const store = createAttachmentFileStore()
    const front = attachmentRef('front.jpg')
    const side = attachmentRef('side.jpg')
    const frontFile = new File(['front'], front.name, { type: front.mediaType })
    const sideFile = new File(['side'], side.name, { type: side.mediaType })

    store.put(front, frontFile)
    store.put(side, sideFile)
    expect(store.get(front.id)).toBe(frontFile)
    expect(store.has(side.id)).toBe(true)

    store.retain([side.id])
    expect(store.has(front.id)).toBe(false)
    expect(store.get(side.id)).toBe(sideFile)

    store.clear()
    expect(store.has(side.id)).toBe(false)
  })
})
