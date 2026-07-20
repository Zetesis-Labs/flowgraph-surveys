import {
  type AttachmentRef,
  type Command,
  type CommandMeta,
  type Event,
  type FlowSchema,
  type FlowState,
  type NodeId,
  toAttachmentId,
  toNodeId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaHash,
  toSchemaId,
  toSchemaVersion,
} from '../../src/index.js'

export const TEST_HASH = toSchemaHash('a'.repeat(64))

export const attachment = (
  name = 'fit.jpg',
  overrides: Partial<AttachmentRef> = {},
): AttachmentRef => ({
  id: toAttachmentId(`attachment-${name}`),
  name,
  mediaType: 'image/jpeg',
  size: toSafeInt(1024),
  ...overrides,
})

export const attachmentSchema = (): FlowSchema => ({
  id: toSchemaId('attachments'),
  version: toSchemaVersion('1.0.0'),
  entry: toNodeId('page'),
  nodes: {
    page: {
      kind: 'page',
      questions: [
        {
          kind: 'attachment',
          id: toQuestionId('photos'),
          text: { key: 'photos', fallback: 'Photos' },
          required: true,
          minFiles: toSafeInt(1),
          maxFiles: toSafeInt(4),
          accept: ['image/jpeg', 'image/png', 'image/webp'],
          maxFileSize: toSafeInt(8 * 1024 * 1024),
        },
      ],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    done: { kind: 'terminal', outcome: toOutcomeId('submitted') },
  } as Readonly<Record<NodeId, FlowSchema['nodes'][NodeId]>>,
})

export const meta = (at = 1, source: CommandMeta['source'] = 'human'): CommandMeta => ({
  at: toSafeInt(at),
  source,
  path: [],
})

export const simpleSchema = (): FlowSchema => ({
  id: toSchemaId('survey'),
  version: toSchemaVersion('1.0.0'),
  entry: toNodeId('page'),
  nodes: {
    page: {
      kind: 'page',
      questions: [],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    done: { kind: 'terminal', outcome: toOutcomeId('submitted') },
  } as Readonly<Record<NodeId, FlowSchema['nodes'][NodeId]>>,
})

export const initialState = (schema = simpleSchema()): FlowState => ({
  status: 'not-started',
  schemaId: schema.id,
  schemaVersion: schema.version,
  trail: [schema.entry],
  answers: {},
})

export const command = (
  kind: Command['kind'],
  overrides: Readonly<Record<string, unknown>> = {},
): Command =>
  ({
    kind,
    meta: meta(),
    ...(kind === 'START' ? { schemaHash: TEST_HASH } : {}),
    ...(kind === 'ANSWER' ? { q: toQuestionId('q'), value: 'answer' } : {}),
    ...overrides,
  }) as Command

export const event = (
  kind: Event['kind'],
  overrides: Readonly<Record<string, unknown>> = {},
): Event => {
  const payload: Record<Event['kind'], Readonly<Record<string, unknown>>> = {
    SESSION_STARTED: {
      schemaId: toSchemaId('survey'),
      schemaVersion: toSchemaVersion('1.0.0'),
      schemaHash: TEST_HASH,
    },
    ANSWERED: { q: toQuestionId('q'), value: 'answer' },
    ADVANCED: { from: toNodeId('page'), to: toNodeId('done') },
    WENT_BACK: { from: toNodeId('review'), to: toNodeId('page') },
    SESSION_FINISHED: { outcome: toOutcomeId('submitted') },
  }
  return { v: 1, kind, ...meta(), ...payload[kind], ...overrides } as Event
}
