import {
  hashSchema,
  toNodeId,
  toOptionId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type FlowSchema,
  type NodeId,
} from '@flowgraph/core'
import { FlowPage, useFlowSurvey } from '@flowgraph/react'
import { createSession, type FlowSession } from '@flowgraph/session'
import { useCallback, useState } from 'react'

const name = toQuestionId('name')
const age = toQuestionId('age')
const reason = toQuestionId('reason')
const channels = toQuestionId('channels')

const schema: FlowSchema = {
  id: toSchemaId('browser-adapter-harness'),
  version: toSchemaVersion('1.0.0'),
  entry: toNodeId('survey'),
  nodes: {
    survey: {
      kind: 'page',
      title: { key: 'page.survey', fallback: 'Encuesta de demostración' },
      questions: [
        {
          kind: 'text',
          id: name,
          text: { key: 'question.name', fallback: 'Nombre ficticio' },
          required: true,
          maxLength: toSafeInt(40),
        },
        {
          kind: 'number',
          id: age,
          text: { key: 'question.age', fallback: 'Edad ficticia' },
          required: true,
          min: toSafeInt(18),
          max: toSafeInt(120),
        },
        {
          kind: 'select',
          id: reason,
          text: { key: 'question.reason', fallback: 'Motivo de consulta' },
          required: true,
          options: [
            {
              id: toOptionId('sleep'),
              text: { key: 'option.sleep', fallback: 'Sueño' },
            },
            {
              id: toOptionId('stress'),
              text: { key: 'option.stress', fallback: 'Estrés' },
            },
          ],
        },
        {
          kind: 'select',
          id: channels,
          text: { key: 'question.channels', fallback: 'Canales preferidos' },
          multiple: true,
          options: [
            {
              id: toOptionId('email'),
              text: { key: 'option.email', fallback: 'Correo' },
            },
            {
              id: toOptionId('phone'),
              text: { key: 'option.phone', fallback: 'Teléfono' },
            },
          ],
        },
      ],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    done: {
      kind: 'terminal',
      outcome: toOutcomeId('submitted'),
    },
  } as Readonly<Record<NodeId, FlowSchema['nodes'][NodeId]>>,
}

const pageErrorSchema: FlowSchema = {
  ...schema,
  id: toSchemaId('browser-adapter-page-error'),
  nodes: {
    survey: {
      kind: 'page',
      title: { key: 'page.error', fallback: 'Encuesta sin ruta' },
      questions: [],
      edges: [],
    },
    done: {
      kind: 'terminal',
      outcome: toOutcomeId('submitted'),
    },
  } as Readonly<Record<NodeId, FlowSchema['nodes'][NodeId]>>,
}

const newSession = (definition: FlowSchema): FlowSession => {
  const result = createSession(definition)
  if (!result.ok) throw new Error(result.error.code)
  return result.value
}

export const AdapterHarness = () => {
  const definition =
    new URLSearchParams(globalThis.location.search).get('scenario') === 'page-error'
      ? pageErrorSchema
      : schema
  const [session] = useState(() => newSession(definition))
  const createMeta = useCallback(
    () => ({
      at: toSafeInt(Date.now()),
      source: 'human' as const,
      path: [],
    }),
    [],
  )
  const controller = useFlowSurvey({ schema: definition, session, createMeta })

  if (controller.state.status === 'not-started') {
    return (
      <main>
        <h1>FlowGraph</h1>
        <p>Demostración local con respuestas ficticias.</p>
        <button
          type="button"
          onClick={() => {
            session.dispatch({
              kind: 'START',
              schemaHash: hashSchema(definition),
              meta: createMeta(),
            })
          }}
        >
          Comenzar
        </button>
      </main>
    )
  }

  if (controller.state.status === 'finished') {
    return (
      <main>
        <h1>Respuesta enviada</h1>
        <p>La respuesta ficticia se ha guardado localmente.</p>
      </main>
    )
  }

  return (
    <main>
      <h1>FlowGraph</h1>
      <FlowPage controller={controller} />
    </main>
  )
}
