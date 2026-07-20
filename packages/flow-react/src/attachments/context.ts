import { createContext, useContext } from 'react'

import type { AttachmentFileStore } from './attachment-store.js'

export const AttachmentStoreContext = createContext<AttachmentFileStore | undefined>(undefined)

export const useAttachmentFileStore = (): AttachmentFileStore => {
  const store = useContext(AttachmentStoreContext)
  if (store === undefined) throw new Error('Attachment renderer requires an attachment store')
  return store
}
