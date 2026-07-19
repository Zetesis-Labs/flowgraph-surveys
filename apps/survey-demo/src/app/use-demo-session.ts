import { hashSchema, toSafeInt, type CommandMeta } from '@flowgraph/core'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { demoSchema } from '../fixture/schema.js'
import {
  loadDemoSession,
  replaceDemoSession,
  subscribeDemoPersistence,
  type DemoSessionLoad,
} from '../session/browser-session.js'

const meta = (): CommandMeta => ({
  at: toSafeInt(Date.now()),
  source: 'human',
  path: [],
})

export const useDemoSession = (storage: Storage) => {
  const [generation, setGeneration] = useState(0)
  const [loaded, setLoaded] = useState<DemoSessionLoad>(() => loadDemoSession(storage))
  const [persistenceProblem, setPersistenceProblem] = useState(
    loaded.kind === 'ready' ? loaded.persistenceProblem : undefined,
  )

  useEffect(() => {
    if (loaded.kind !== 'ready') return undefined
    return subscribeDemoPersistence(loaded.session, storage, setPersistenceProblem)
  }, [loaded, storage])

  const start = useCallback(() => {
    if (loaded.kind !== 'ready') return
    loaded.session.dispatch({
      kind: 'START',
      schemaHash: hashSchema(demoSchema),
      meta: meta(),
    })
  }, [loaded])

  const replace = useCallback(() => {
    const replaced = replaceDemoSession(storage)
    if (!replaced.ok) {
      setPersistenceProblem(replaced.problem)
      return false
    }
    setPersistenceProblem(undefined)
    setLoaded({ kind: 'ready', session: replaced.session, retained: false })
    setGeneration((value) => value + 1)
    return true
  }, [storage])

  return useMemo(
    () => ({
      loaded,
      generation,
      persistenceProblem,
      createMeta: meta,
      start,
      replace,
      dismissPersistenceProblem: () => {
        setPersistenceProblem(undefined)
      },
    }),
    [generation, loaded, persistenceProblem, replace, start],
  )
}
