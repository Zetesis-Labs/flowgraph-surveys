import {
  toNodeId,
  toOptionId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type AnswerValue,
  type FlowSchema,
  type FlowState,
} from '../../src/index.js'

const text = (key: string) => ({ key, fallback: key })

export const evaluationSchema = (): FlowSchema => ({
  id: toSchemaId('evaluation'),
  version: toSchemaVersion('1'),
  entry: toNodeId('page'),
  nodes: {
    page: {
      kind: 'page',
      questions: [
        {
          kind: 'number',
          id: toQuestionId('count'),
          text: text('count'),
        },
        {
          kind: 'select',
          id: toQuestionId('choice'),
          text: text('choice'),
          multiple: true,
          options: [
            { id: toOptionId('heavy'), text: text('heavy'), weight: toSafeInt(2) },
            { id: toOptionId('light'), text: text('light'), weight: toSafeInt(1) },
          ],
        },
      ],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    done: { kind: 'terminal', outcome: toOutcomeId('done') },
  } as FlowSchema['nodes'],
})

export const branchSchema = (): FlowSchema => ({
  id: toSchemaId('branch'),
  version: toSchemaVersion('1'),
  entry: toNodeId('choice'),
  nodes: {
    choice: {
      kind: 'page',
      questions: [
        {
          kind: 'select',
          id: toQuestionId('route'),
          text: text('route'),
          options: [
            { id: toOptionId('a'), text: text('a') },
            { id: toOptionId('b'), text: text('b') },
          ],
        },
        {
          kind: 'text',
          id: toQuestionId('detail'),
          text: text('detail'),
          visibleWhen: {
            kind: 'selected',
            q: toQuestionId('route'),
            option: toOptionId('a'),
          },
        },
      ],
      edges: [
        {
          to: toNodeId('branch-a'),
          when: { kind: 'selected', q: toQuestionId('route'), option: toOptionId('a') },
        },
        {
          to: toNodeId('branch-b'),
          when: { kind: 'selected', q: toQuestionId('route'), option: toOptionId('b') },
        },
      ],
    },
    'branch-a': {
      kind: 'page',
      questions: [],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    'branch-b': {
      kind: 'page',
      questions: [{ kind: 'text', id: toQuestionId('b'), text: text('b') }],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    done: { kind: 'terminal', outcome: toOutcomeId('done') },
  } as FlowSchema['nodes'],
})

export const validationSchema = (): FlowSchema => ({
  id: toSchemaId('validation'),
  version: toSchemaVersion('1'),
  entry: toNodeId('page'),
  nodes: {
    page: {
      kind: 'page',
      questions: [
        {
          kind: 'text',
          id: toQuestionId('notes'),
          text: text('notes'),
          maxLength: toSafeInt(3),
        },
        {
          kind: 'number',
          id: toQuestionId('age'),
          text: text('age'),
          min: toSafeInt(18),
          max: toSafeInt(120),
        },
        {
          kind: 'select',
          id: toQuestionId('choice'),
          text: text('choice'),
          multiple: true,
          options: [
            { id: toOptionId('a'), text: text('a') },
            { id: toOptionId('b'), text: text('b') },
          ],
        },
        {
          kind: 'select',
          id: toQuestionId('single'),
          text: text('single'),
          required: true,
          options: [
            { id: toOptionId('a'), text: text('a') },
            { id: toOptionId('b'), text: text('b') },
          ],
        },
      ],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    done: { kind: 'terminal', outcome: toOutcomeId('done') },
  } as FlowSchema['nodes'],
})

export const stateOnTrail = (
  schema: FlowSchema,
  trail: readonly string[],
  answers: Readonly<Record<string, AnswerValue>>,
): FlowState => ({
  status: 'active',
  schemaId: schema.id,
  schemaVersion: schema.version,
  trail: trail.map(toNodeId),
  answers,
})

export const stateOn = (
  schema: FlowSchema,
  node: string,
  answers: Readonly<Record<string, AnswerValue>> = {},
): FlowState => stateOnTrail(schema, [node], answers)
