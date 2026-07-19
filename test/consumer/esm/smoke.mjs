import { hashSchema, parseSchema } from '@flowgraph/core'
import { createSession } from '@flowgraph/session'

const parsed = parseSchema({
  id: 'consumer',
  version: '1',
  entry: 'page',
  nodes: {
    page: {
      kind: 'page',
      questions: [],
      edges: [{ to: 'done', when: { kind: 'always' } }],
    },
    done: { kind: 'terminal', outcome: 'done' },
  },
})

if (!parsed.ok) throw new Error('Published core parser failed')
if (hashSchema(parsed.value).length !== 64) throw new Error('Published hash failed')
if (!createSession(parsed.value).ok) throw new Error('Published session factory failed')
