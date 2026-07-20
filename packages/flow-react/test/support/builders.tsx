import {
  hashSchema,
  toAttachmentId,
  toNodeId,
  toOptionId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type CommandMeta,
  type FlowSchema,
  type NodeId,
} from '@flowgraph/core'
import { createSession, type FlowSession } from '@flowgraph/session'

export const qName = toQuestionId('name')
export const qAge = toQuestionId('age')
export const qReason = toQuestionId('reason')
export const qChannels = toQuestionId('channels')
export const qNotes = toQuestionId('notes')
export const qPhotos = toQuestionId('photos')

export const optionSleep = toOptionId('sleep')
export const optionStress = toOptionId('stress')
export const optionEmail = toOptionId('email')
export const optionPhone = toOptionId('phone')
export const qBookTitle = toQuestionId('book-title')
export const qBookFormat = toQuestionId('book-format')
export const optionPaper = toOptionId('paper')
export const optionDigital = toOptionId('digital')

export const attachmentSchema = (): FlowSchema => ({
  id: toSchemaId('react-attachment-survey'),
  version: toSchemaVersion('1.0.0'),
  entry: toNodeId('photos'),
  nodes: {
    photos: {
      kind: 'page',
      title: { key: 'page.photos', fallback: 'Fotografías' },
      questions: [
        {
          kind: 'attachment',
          id: qPhotos,
          text: { key: 'question.photos', fallback: 'Adjunta imágenes' },
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

export const attachmentRef = (name = 'front.jpg') => ({
  id: toAttachmentId(`ref-${name}`),
  name,
  mediaType: 'image/jpeg',
  size: toSafeInt(1024),
})

export const surveySchema = (): FlowSchema => ({
  id: toSchemaId('react-adapter-survey'),
  version: toSchemaVersion('1.0.0'),
  entry: toNodeId('profile'),
  nodes: {
    profile: {
      kind: 'page',
      title: { key: 'page.profile', fallback: 'Perfil' },
      questions: [
        {
          kind: 'text',
          id: qName,
          text: { key: 'question.name', fallback: 'Nombre' },
          required: true,
          maxLength: toSafeInt(10),
        },
        {
          kind: 'number',
          id: qAge,
          text: { key: 'question.age', fallback: 'Edad' },
          required: true,
          min: toSafeInt(0),
          max: toSafeInt(120),
        },
        {
          kind: 'select',
          id: qReason,
          text: { key: 'question.reason', fallback: 'Motivo' },
          required: true,
          options: [
            {
              id: optionSleep,
              text: { key: 'option.sleep', fallback: 'Sueño' },
            },
            {
              id: optionStress,
              text: { key: 'option.stress', fallback: 'Estrés' },
            },
          ],
        },
        {
          kind: 'select',
          id: qChannels,
          text: { key: 'question.channels', fallback: 'Canales' },
          multiple: true,
          options: [
            {
              id: optionEmail,
              text: { key: 'option.email', fallback: 'Correo' },
            },
            {
              id: optionPhone,
              text: { key: 'option.phone', fallback: 'Teléfono' },
            },
          ],
        },
      ],
      edges: [{ to: toNodeId('details'), when: { kind: 'always' } }],
    },
    details: {
      kind: 'page',
      title: { key: 'page.details', fallback: 'Detalles' },
      questions: [
        {
          kind: 'text',
          id: qNotes,
          text: { key: 'question.notes', fallback: 'Notas' },
          maxLength: toSafeInt(100),
        },
      ],
      edges: [{ to: toNodeId('done'), when: { kind: 'always' } }],
    },
    done: {
      kind: 'terminal',
      outcome: toOutcomeId('submitted'),
    },
  } as Readonly<Record<NodeId, FlowSchema['nodes'][NodeId]>>,
})

export const librarySurveySchema = (): FlowSchema => ({
  id: toSchemaId('library-reading-survey'),
  version: toSchemaVersion('1.0.0'),
  entry: toNodeId('reading'),
  nodes: {
    reading: {
      kind: 'page',
      title: { key: 'page.reading', fallback: 'Hábitos de lectura' },
      questions: [
        {
          kind: 'text',
          id: qBookTitle,
          text: { key: 'question.book-title', fallback: 'Último libro leído' },
          required: true,
          maxLength: toSafeInt(80),
        },
        {
          kind: 'select',
          id: qBookFormat,
          text: { key: 'question.book-format', fallback: 'Formato preferido' },
          required: true,
          options: [
            {
              id: optionPaper,
              text: { key: 'option.paper', fallback: 'Papel' },
            },
            {
              id: optionDigital,
              text: { key: 'option.digital', fallback: 'Digital' },
            },
          ],
        },
      ],
      edges: [
        {
          to: toNodeId('digital-reading'),
          when: { kind: 'selected', q: qBookFormat, option: optionDigital },
        },
        { to: toNodeId('paper-reading'), when: { kind: 'always' } },
      ],
    },
    'digital-reading': {
      kind: 'page',
      title: { key: 'page.digital-reading', fallback: 'Lectura digital' },
      questions: [],
      edges: [{ to: toNodeId('reading-done'), when: { kind: 'always' } }],
    },
    'paper-reading': {
      kind: 'page',
      title: { key: 'page.paper-reading', fallback: 'Lectura en papel' },
      questions: [],
      edges: [{ to: toNodeId('reading-done'), when: { kind: 'always' } }],
    },
    'reading-done': {
      kind: 'terminal',
      outcome: toOutcomeId('reading-submitted'),
    },
  } as Readonly<Record<NodeId, FlowSchema['nodes'][NodeId]>>,
})

export const createMetaFactory = (start = 1): (() => CommandMeta) => {
  let at = start
  return () => ({
    at: toSafeInt(at++),
    source: 'human',
    path: [],
  })
}

export const freshSession = (schema = surveySchema()): FlowSession => {
  const created = createSession(schema)
  if (!created.ok) throw new Error(created.error.code)
  return created.value
}

export const startedSession = (schema = surveySchema()): FlowSession => {
  const session = freshSession(schema)
  const started = session.dispatch({
    kind: 'START',
    schemaHash: hashSchema(schema),
    meta: createMetaFactory()(),
  })
  if (!started.ok) throw new Error(started.error[0]?.code)
  return session
}
