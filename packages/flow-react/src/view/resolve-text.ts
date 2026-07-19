import type { TextRef } from '@flowgraph/core'

import type { ResolveText } from '../types.js'

export const resolveText = (text: TextRef, resolve?: ResolveText): string => {
  const resolved = resolve?.(text)
  return resolved === undefined || resolved === '' ? text.fallback : resolved
}
