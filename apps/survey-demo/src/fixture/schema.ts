import {
  toNodeId,
  toOptionId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type FlowSchema,
  type TextRef,
} from '@flowgraph/core'

const text = (key: string, fallback: string): TextRef => ({ key, fallback })
const q = toQuestionId
const option = toOptionId

export const demoSchema: FlowSchema = {
  id: toSchemaId('demo-wellbeing-intake'),
  version: toSchemaVersion('1.0.0'),
  entry: toNodeId('starting-point'),
  nodes: {
    [toNodeId('starting-point')]: {
      kind: 'page',
      title: text('start.title', 'Empecemos por ti'),
      questions: [
        {
          kind: 'text',
          id: q('preferred-name'),
          text: text('start.name', '¿Cómo te gustaría que te llamáramos?'),
          required: true,
          maxLength: toSafeInt(60),
        },
        {
          kind: 'select',
          id: q('consultation-reason'),
          text: text('start.reason', '¿Qué te gustaría explorar hoy?'),
          required: true,
          options: [
            {
              id: option('sleep'),
              text: text('reason.sleep', 'Descanso y sueño'),
            },
            {
              id: option('stress'),
              text: text('reason.stress', 'Estrés y sobrecarga'),
            },
            {
              id: option('life-change'),
              text: text('reason.change', 'Un cambio importante'),
            },
          ],
        },
      ],
      edges: [
        {
          to: toNodeId('sleep-context'),
          when: {
            kind: 'selected',
            q: q('consultation-reason'),
            option: option('sleep'),
          },
        },
        {
          to: toNodeId('stress-context'),
          when: {
            kind: 'selected',
            q: q('consultation-reason'),
            option: option('stress'),
          },
        },
        {
          to: toNodeId('change-context'),
          when: {
            kind: 'selected',
            q: q('consultation-reason'),
            option: option('life-change'),
          },
        },
      ],
    },
    [toNodeId('sleep-context')]: {
      kind: 'page',
      title: text('sleep.title', 'Tu descanso últimamente'),
      questions: [
        {
          kind: 'number',
          id: q('sleep-hours'),
          text: text('sleep.hours', '¿Cuántas horas duermes de media?'),
          required: true,
          min: toSafeInt(0),
          max: toSafeInt(16),
        },
        {
          kind: 'select',
          id: q('sleep-patterns'),
          text: text('sleep.patterns', '¿Qué situaciones reconoces?'),
          required: true,
          multiple: true,
          options: [
            {
              id: option('falling-asleep'),
              text: text('sleep.falling', 'Me cuesta conciliar el sueño'),
            },
            {
              id: option('waking-up'),
              text: text('sleep.waking', 'Me despierto durante la noche'),
            },
            {
              id: option('tired'),
              text: text('sleep.tired', 'Me levanto con poca energía'),
            },
            {
              id: option('other-pattern'),
              text: text('sleep.other', 'Hay algo diferente'),
            },
          ],
        },
        {
          kind: 'text',
          id: q('sleep-other-detail'),
          text: text('sleep.detail', 'Cuéntanos brevemente qué ocurre'),
          required: true,
          maxLength: toSafeInt(240),
          visibleWhen: {
            kind: 'selected',
            q: q('sleep-patterns'),
            option: option('other-pattern'),
          },
        },
      ],
      edges: [{ to: toNodeId('preferences'), when: { kind: 'always' } }],
    },
    [toNodeId('stress-context')]: {
      kind: 'page',
      title: text('stress.title', 'Cómo se presenta la sobrecarga'),
      questions: [
        {
          kind: 'number',
          id: q('stress-level'),
          text: text('stress.level', 'Del 0 al 10, ¿qué intensidad tiene ahora?'),
          required: true,
          min: toSafeInt(0),
          max: toSafeInt(10),
        },
        {
          kind: 'select',
          id: q('stress-sources'),
          text: text('stress.sources', '¿Dónde notas más presión?'),
          required: true,
          multiple: true,
          options: [
            { id: option('work'), text: text('stress.work', 'Trabajo o estudios') },
            { id: option('family'), text: text('stress.family', 'Familia o cuidados') },
            { id: option('social'), text: text('stress.social', 'Relaciones') },
            { id: option('unclear'), text: text('stress.unclear', 'No sabría concretarlo') },
          ],
        },
        {
          kind: 'text',
          id: q('stress-description'),
          text: text(
            'stress.description',
            'Si quieres, describe una situación reciente en la que lo hayas notado',
          ),
          maxLength: toSafeInt(480),
        },
      ],
      edges: [{ to: toNodeId('preferences'), when: { kind: 'always' } }],
    },
    [toNodeId('change-context')]: {
      kind: 'page',
      title: text('change.title', 'Sobre ese cambio'),
      questions: [
        {
          kind: 'select',
          id: q('change-kind'),
          text: text('change.kind', '¿Con qué área se relaciona principalmente?'),
          required: true,
          options: [
            { id: option('home'), text: text('change.home', 'Hogar o ciudad') },
            { id: option('relationship'), text: text('change.relationship', 'Relaciones') },
            { id: option('work-change'), text: text('change.work', 'Trabajo o estudios') },
            { id: option('other-change'), text: text('change.other', 'Otro cambio') },
          ],
        },
        {
          kind: 'text',
          id: q('change-when'),
          text: text('change.when', '¿Cuándo comenzó aproximadamente?'),
          required: true,
          maxLength: toSafeInt(80),
        },
        {
          kind: 'text',
          id: q('change-description'),
          text: text('change.description', '¿Qué ha cambiado en tu día a día?'),
          required: true,
          maxLength: toSafeInt(480),
        },
      ],
      edges: [{ to: toNodeId('preferences'), when: { kind: 'always' } }],
    },
    [toNodeId('preferences')]: {
      kind: 'page',
      title: text('preferences.title', 'Cómo prefieres continuar'),
      questions: [
        {
          kind: 'select',
          id: q('contact-channel'),
          text: text('preferences.contact', '¿Qué formato te resulta más cómodo?'),
          required: true,
          options: [
            { id: option('video'), text: text('contact.video', 'Videollamada') },
            { id: option('in-person'), text: text('contact.person', 'Presencial') },
            { id: option('either'), text: text('contact.either', 'Cualquiera de los dos') },
          ],
        },
        {
          kind: 'select',
          id: q('availability'),
          text: text('preferences.availability', '¿Qué momentos suelen encajarte?'),
          required: true,
          multiple: true,
          options: [
            { id: option('morning'), text: text('availability.morning', 'Mañanas') },
            { id: option('afternoon'), text: text('availability.afternoon', 'Tardes') },
            { id: option('evening'), text: text('availability.evening', 'Última hora') },
          ],
        },
      ],
      edges: [{ to: toNodeId('adaptation'), when: { kind: 'always' } }],
    },
    [toNodeId('adaptation')]: {
      kind: 'page',
      title: text('adaptation.title', 'Cómo encaja en tu semana'),
      questions: [
        {
          kind: 'number',
          id: q('weekday-minutes'),
          text: text('adaptation.weekday', '¿Cuántos minutos podrías reservar entre semana?'),
          required: true,
          min: toSafeInt(0),
          max: toSafeInt(120),
        },
        {
          kind: 'number',
          id: q('weekend-minutes'),
          text: text('adaptation.weekend', '¿Y cuántos minutos durante el fin de semana?'),
          required: true,
          min: toSafeInt(0),
          max: toSafeInt(120),
        },
        {
          kind: 'select',
          id: q('interaction-style'),
          text: text('adaptation.style', '¿Qué formas de conversación te resultan más cómodas?'),
          required: true,
          multiple: true,
          options: [
            {
              id: option('structured'),
              text: text('style.structured', 'Preguntas concretas y ordenadas'),
              weight: toSafeInt(1),
            },
            {
              id: option('conversational'),
              text: text('style.conversational', 'Conversación abierta'),
              weight: toSafeInt(2),
            },
            {
              id: option('practical'),
              text: text('style.practical', 'Ejemplos y ejercicios prácticos'),
              weight: toSafeInt(2),
            },
          ],
        },
        {
          kind: 'text',
          id: q('specific-request'),
          text: text('adaptation.request', '¿Hay algo concreto que quieras priorizar? (opcional)'),
          maxLength: toSafeInt(180),
        },
        {
          kind: 'text',
          id: q('request-detail'),
          text: text(
            'adaptation.request-detail',
            '¿Qué te gustaría poder llevarte de esa conversación?',
          ),
          required: true,
          maxLength: toSafeInt(300),
          visibleWhen: {
            kind: 'answered',
            q: q('specific-request'),
          },
        },
      ],
      edges: [
        {
          to: toNodeId('request-context'),
          when: { kind: 'answered', q: q('specific-request') },
        },
        {
          to: toNodeId('spacious-context'),
          when: {
            kind: 'all',
            values: [
              {
                kind: 'cmp',
                op: 'gte',
                left: {
                  kind: 'sum',
                  values: [
                    { kind: 'answer', q: q('weekday-minutes') },
                    { kind: 'answer', q: q('weekend-minutes') },
                  ],
                },
                right: { kind: 'num', value: toSafeInt(90) },
              },
              {
                kind: 'cmp',
                op: 'gte',
                left: { kind: 'score', q: q('interaction-style') },
                right: { kind: 'num', value: toSafeInt(3) },
              },
            ],
          },
        },
        {
          to: toNodeId('focused-context'),
          when: {
            kind: 'any',
            values: [
              {
                kind: 'cmp',
                op: 'lt',
                left: {
                  kind: 'sum',
                  values: [
                    { kind: 'answer', q: q('weekday-minutes') },
                    { kind: 'answer', q: q('weekend-minutes') },
                  ],
                },
                right: { kind: 'num', value: toSafeInt(90) },
              },
              {
                kind: 'not',
                value: {
                  kind: 'cmp',
                  op: 'gte',
                  left: { kind: 'score', q: q('interaction-style') },
                  right: { kind: 'num', value: toSafeInt(3) },
                },
              },
            ],
          },
        },
      ],
    },
    [toNodeId('request-context')]: {
      kind: 'page',
      title: text('request.title', 'Lo que te gustaría priorizar'),
      questions: [
        {
          kind: 'select',
          id: q('request-priority'),
          text: text('request.priority', '¿Cómo prefieres abordar ese tema?'),
          required: true,
          options: [
            {
              id: option('start-directly'),
              text: text('request.directly', 'Empezar directamente por ahí'),
            },
            {
              id: option('add-context'),
              text: text('request.context', 'Compartir antes un poco de contexto'),
            },
            {
              id: option('decide-later'),
              text: text('request.later', 'Decidirlo durante la conversación'),
            },
          ],
        },
      ],
      edges: [{ to: toNodeId('final-context'), when: { kind: 'always' } }],
    },
    [toNodeId('spacious-context')]: {
      kind: 'page',
      title: text('spacious.title', 'Un formato con más espacio'),
      questions: [
        {
          kind: 'select',
          id: q('spacious-preference'),
          text: text('spacious.preference', '¿Cómo distribuirías mejor ese tiempo?'),
          required: true,
          options: [
            {
              id: option('one-long-slot'),
              text: text('spacious.long', 'En un único bloque más largo'),
            },
            {
              id: option('two-short-slots'),
              text: text('spacious.short', 'En dos momentos más breves'),
            },
            {
              id: option('no-slot-preference'),
              text: text('spacious.either', 'No tengo preferencia'),
            },
          ],
        },
      ],
      edges: [{ to: toNodeId('final-context'), when: { kind: 'always' } }],
    },
    [toNodeId('focused-context')]: {
      kind: 'page',
      title: text('focused.title', 'Un formato fácil de encajar'),
      questions: [
        {
          kind: 'select',
          id: q('focused-preference'),
          text: text('focused.preference', '¿Qué opción te resultaría más sencilla?'),
          required: true,
          options: [
            {
              id: option('brief-slot'),
              text: text('focused.brief', 'Un momento breve y muy enfocado'),
            },
            {
              id: option('flexible-slot'),
              text: text('focused.flexible', 'Un horario que pueda moverse'),
            },
            {
              id: option('no-focused-preference'),
              text: text('focused.either', 'Cualquiera de las dos'),
            },
          ],
        },
      ],
      edges: [{ to: toNodeId('final-context'), when: { kind: 'always' } }],
    },
    [toNodeId('final-context')]: {
      kind: 'page',
      title: text('final.title', 'Un último poco de contexto'),
      questions: [
        {
          kind: 'number',
          id: q('age'),
          text: text('final.age', '¿Qué edad tienes?'),
          required: true,
          min: toSafeInt(16),
          max: toSafeInt(100),
        },
        {
          kind: 'text',
          id: q('additional-note'),
          text: text('final.note', '¿Hay algo más que te gustaría dejar anotado?'),
          maxLength: toSafeInt(600),
        },
      ],
      edges: [{ to: toNodeId('submitted'), when: { kind: 'always' } }],
    },
    [toNodeId('submitted')]: {
      kind: 'terminal',
      outcome: toOutcomeId('submitted'),
    },
  },
}

export const demoQuestionIds = {
  preferredName: q('preferred-name'),
  changeWhen: q('change-when'),
} as const
