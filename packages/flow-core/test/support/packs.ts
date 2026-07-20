import {
  toNodeId,
  toOptionId,
  toOutcomeId,
  toPackId,
  toPackInstanceId,
  toPackPortId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type FlowComposition,
  type FlowPack,
  type NodeId,
  type PackFactory,
} from '../../src/index.js'

export const startPort = toPackPortId('start')
export const yesPort = toPackPortId('yes')
export const noPort = toPackPortId('no')
export const donePort = toPackPortId('done')

export const configurablePack: PackFactory<{
  readonly label: string
  readonly maxLength: number
}> = ({ label, maxLength }) => ({
  id: toPackId(`decision-${label}`),
  version: toSchemaVersion('1.0.0'),
  entry: startPort,
  entries: [{ id: startPort, node: toNodeId('start') }],
  nodes: {
    start: {
      kind: 'page',
      title: { key: `decision.${label}`, fallback: label },
      questions: [
        {
          kind: 'text',
          id: toQuestionId('name'),
          text: { key: 'name', fallback: 'Name' },
          required: true,
          maxLength: toSafeInt(maxLength),
        },
        {
          kind: 'number',
          id: toQuestionId('age'),
          text: { key: 'age', fallback: 'Age' },
          required: true,
          visibleWhen: { kind: 'answered', q: toQuestionId('name') },
          min: toSafeInt(0),
          max: toSafeInt(120),
        },
        {
          kind: 'select',
          id: toQuestionId('choice'),
          text: { key: 'choice', fallback: 'Choice' },
          required: true,
          options: [
            {
              id: toOptionId('yes'),
              text: { key: 'yes', fallback: 'Yes' },
              weight: toSafeInt(1),
            },
            {
              id: toOptionId('no'),
              text: { key: 'no', fallback: 'No' },
              weight: toSafeInt(0),
            },
          ],
        },
        {
          kind: 'attachment',
          id: toQuestionId('files'),
          text: { key: 'files', fallback: 'Files' },
          visibleWhen: {
            kind: 'selected',
            q: toQuestionId('choice'),
            option: toOptionId('yes'),
          },
        },
      ],
      edges: [
        {
          to: toNodeId('accepted'),
          when: {
            kind: 'all',
            values: [
              {
                kind: 'selected',
                q: toQuestionId('choice'),
                option: toOptionId('yes'),
              },
              { kind: 'answered', q: toQuestionId('name') },
              {
                kind: 'any',
                values: [
                  {
                    kind: 'cmp',
                    op: 'gte',
                    left: { kind: 'answer', q: toQuestionId('age') },
                    right: { kind: 'num', value: toSafeInt(18) },
                  },
                  {
                    kind: 'not',
                    value: {
                      kind: 'cmp',
                      op: 'eq',
                      left: {
                        kind: 'sum',
                        values: [{ kind: 'score', q: toQuestionId('choice') }],
                      },
                      right: { kind: 'num', value: toSafeInt(0) },
                    },
                  },
                ],
              },
            ],
          },
        },
        { to: toNodeId('declined'), when: { kind: 'always' } },
      ],
    },
    accepted: {
      kind: 'page',
      questions: [],
      edges: [
        {
          to: toNodeId('exceptional'),
          when: {
            kind: 'cmp',
            op: 'gt',
            left: { kind: 'answer', q: toQuestionId('age') },
            right: { kind: 'num', value: toSafeInt(100) },
          },
        },
      ],
    },
    declined: { kind: 'page', questions: [], edges: [] },
    exceptional: { kind: 'terminal', outcome: toOutcomeId('exceptional') },
  },
  outlets: [
    { id: yesPort, from: toNodeId('accepted'), when: { kind: 'always' }, required: true },
    { id: noPort, from: toNodeId('declined'), when: { kind: 'always' }, required: true },
  ],
})

export const decisionPack = (): FlowPack => configurablePack({ label: 'Decision', maxLength: 40 })

export const terminalPack = (): FlowPack => ({
  id: toPackId('terminal'),
  version: toSchemaVersion('1.0.0'),
  entry: startPort,
  entries: [{ id: startPort, node: toNodeId('finish') }],
  nodes: {
    finish: {
      kind: 'page',
      questions: [],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    done: { kind: 'terminal', outcome: toOutcomeId('submitted') },
  } as Readonly<Record<NodeId, FlowPack['nodes'][NodeId]>>,
  outlets: [],
})

export const validComposition = (): FlowComposition => ({
  id: toSchemaId('composed-form'),
  version: toSchemaVersion('1.0.0'),
  entry: { instance: toPackInstanceId('decision'), entry: startPort },
  instances: [
    { id: toPackInstanceId('decision'), pack: decisionPack() },
    { id: toPackInstanceId('terminal'), pack: terminalPack() },
  ],
  connections: [
    {
      from: { instance: toPackInstanceId('decision'), outlet: yesPort },
      to: { instance: toPackInstanceId('terminal'), entry: startPort },
    },
    {
      from: { instance: toPackInstanceId('decision'), outlet: noPort },
      to: { instance: toPackInstanceId('terminal'), entry: startPort },
    },
  ],
})
