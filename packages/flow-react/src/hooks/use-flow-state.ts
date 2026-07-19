import type { FlowState } from '@flowgraph/core'
import type { FlowSession } from '@flowgraph/session'
import { useSyncExternalStore } from 'react'

export const useFlowState = (session: FlowSession): FlowState =>
  useSyncExternalStore(session.subscribe, session.getSnapshot)
