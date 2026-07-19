import {
  toNodeId,
  toOptionId,
  toOutcomeId,
  toQuestionId,
  toSafeInt,
  toSchemaId,
  toSchemaVersion,
  type GoldenSuiteV1,
} from '@flowgraph/core'

const q = toQuestionId
const o = toOptionId

const sharedPreferences = [
  { kind: 'ANSWER' as const, q: q('contact-channel'), value: [o('either')] },
  { kind: 'ANSWER' as const, q: q('availability'), value: [o('morning'), o('afternoon')] },
  { kind: 'NEXT' as const },
]

const finalFinish = [
  { kind: 'ANSWER' as const, q: q('age'), value: toSafeInt(31) },
  { kind: 'ANSWER' as const, q: q('additional-note'), value: 'Nada más por ahora.' },
  { kind: 'NEXT' as const },
]

const requestAdaptation = [
  { kind: 'ANSWER' as const, q: q('weekday-minutes'), value: toSafeInt(45) },
  { kind: 'ANSWER' as const, q: q('weekend-minutes'), value: toSafeInt(45) },
  {
    kind: 'ANSWER' as const,
    q: q('interaction-style'),
    value: [o('structured'), o('conversational')],
  },
  {
    kind: 'ANSWER' as const,
    q: q('specific-request'),
    value: 'Quiero ordenar una decisión concreta.',
  },
  {
    kind: 'ANSWER' as const,
    q: q('request-detail'),
    value: 'Salir con los siguientes pasos más claros.',
  },
  { kind: 'NEXT' as const },
  { kind: 'ANSWER' as const, q: q('request-priority'), value: [o('add-context')] },
  { kind: 'NEXT' as const },
  ...finalFinish,
]

const spaciousAdaptation = [
  { kind: 'ANSWER' as const, q: q('weekday-minutes'), value: toSafeInt(60) },
  { kind: 'ANSWER' as const, q: q('weekend-minutes'), value: toSafeInt(45) },
  {
    kind: 'ANSWER' as const,
    q: q('interaction-style'),
    value: [o('conversational'), o('practical')],
  },
  { kind: 'NEXT' as const },
  {
    kind: 'ANSWER' as const,
    q: q('spacious-preference'),
    value: [o('two-short-slots')],
  },
  { kind: 'NEXT' as const },
  ...finalFinish,
]

const focusedAdaptation = [
  { kind: 'ANSWER' as const, q: q('weekday-minutes'), value: toSafeInt(30) },
  { kind: 'ANSWER' as const, q: q('weekend-minutes'), value: toSafeInt(20) },
  {
    kind: 'ANSWER' as const,
    q: q('interaction-style'),
    value: [o('structured')],
  },
  { kind: 'NEXT' as const },
  {
    kind: 'ANSWER' as const,
    q: q('focused-preference'),
    value: [o('flexible-slot')],
  },
  { kind: 'NEXT' as const },
  ...finalFinish,
]

export const demoGoldens: GoldenSuiteV1 = {
  formatVersion: 1,
  schema: {
    id: toSchemaId('demo-wellbeing-intake'),
    version: toSchemaVersion('1.0.0'),
  },
  cases: [
    {
      id: 'sleep-route-with-conditional-detail',
      commands: [
        { kind: 'START' },
        { kind: 'ANSWER', q: q('preferred-name'), value: 'Alex' },
        { kind: 'ANSWER', q: q('consultation-reason'), value: [o('sleep')] },
        { kind: 'NEXT' },
        { kind: 'ANSWER', q: q('sleep-hours'), value: toSafeInt(6) },
        {
          kind: 'ANSWER',
          q: q('sleep-patterns'),
          value: [o('waking-up'), o('other-pattern')],
        },
        { kind: 'ANSWER', q: q('sleep-other-detail'), value: 'Sueño muy ligero.' },
        { kind: 'NEXT' },
        ...sharedPreferences,
        ...requestAdaptation,
      ],
      expect: {
        outcome: toOutcomeId('submitted'),
        state: {
          current: toNodeId('submitted'),
          trail: [
            toNodeId('starting-point'),
            toNodeId('sleep-context'),
            toNodeId('preferences'),
            toNodeId('adaptation'),
            toNodeId('request-context'),
            toNodeId('final-context'),
            toNodeId('submitted'),
          ],
        },
      },
    },
    {
      id: 'stress-route',
      commands: [
        { kind: 'START' },
        { kind: 'ANSWER', q: q('preferred-name'), value: 'Sam' },
        { kind: 'ANSWER', q: q('consultation-reason'), value: [o('stress')] },
        { kind: 'NEXT' },
        { kind: 'ANSWER', q: q('stress-level'), value: toSafeInt(7) },
        { kind: 'ANSWER', q: q('stress-sources'), value: [o('work')] },
        { kind: 'ANSWER', q: q('stress-description'), value: 'Demasiadas tareas juntas.' },
        { kind: 'NEXT' },
        ...sharedPreferences,
        ...spaciousAdaptation,
      ],
      expect: { outcome: toOutcomeId('submitted') },
    },
    {
      id: 'life-change-route',
      commands: [
        { kind: 'START' },
        { kind: 'ANSWER', q: q('preferred-name'), value: 'Dani' },
        { kind: 'ANSWER', q: q('consultation-reason'), value: [o('life-change')] },
        { kind: 'NEXT' },
        { kind: 'ANSWER', q: q('change-kind'), value: [o('home')] },
        { kind: 'ANSWER', q: q('change-when'), value: 'Hace dos meses' },
        {
          kind: 'ANSWER',
          q: q('change-description'),
          value: 'Estoy adaptándome a una nueva ciudad.',
        },
        { kind: 'NEXT' },
        ...sharedPreferences,
        ...focusedAdaptation,
      ],
      expect: { outcome: toOutcomeId('submitted') },
    },
    {
      id: 'route-correction',
      commands: [
        { kind: 'START' },
        { kind: 'ANSWER', q: q('preferred-name'), value: 'Noa' },
        { kind: 'ANSWER', q: q('consultation-reason'), value: [o('sleep')] },
        { kind: 'NEXT' },
        { kind: 'ANSWER', q: q('sleep-hours'), value: toSafeInt(5) },
        { kind: 'ANSWER', q: q('sleep-patterns'), value: [o('tired')] },
        { kind: 'BACK' },
        { kind: 'ANSWER', q: q('consultation-reason'), value: [o('stress')] },
        { kind: 'NEXT' },
        { kind: 'ANSWER', q: q('stress-level'), value: toSafeInt(8) },
        { kind: 'ANSWER', q: q('stress-sources'), value: [o('family')] },
        { kind: 'NEXT' },
        ...sharedPreferences,
        ...focusedAdaptation,
      ],
      expect: {
        outcome: toOutcomeId('submitted'),
        state: {
          activeAnswers: {
            [q('preferred-name')]: 'Noa',
            [q('consultation-reason')]: [o('stress')],
            [q('stress-level')]: toSafeInt(8),
            [q('stress-sources')]: [o('family')],
            [q('contact-channel')]: [o('either')],
            [q('availability')]: [o('morning'), o('afternoon')],
            [q('weekday-minutes')]: toSafeInt(30),
            [q('weekend-minutes')]: toSafeInt(20),
            [q('interaction-style')]: [o('structured')],
            [q('focused-preference')]: [o('flexible-slot')],
            [q('age')]: toSafeInt(31),
            [q('additional-note')]: 'Nada más por ahora.',
          },
        },
      },
    },
  ],
}
