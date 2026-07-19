import { FlowPage, type FlowSurveyController } from '@flowgraph/react'

import { demoQuestionIds } from '../fixture/schema.js'
import { ShortTextRenderer } from '../renderers/short-text-renderer.js'

type SurveyScreenProps = {
  readonly controller: FlowSurveyController
}

const sectionMeta: Readonly<Record<string, { readonly step: string; readonly kicker: string }>> = {
  'starting-point': { step: '01', kicker: 'Tu punto de partida' },
  'sleep-context': { step: '02', kicker: 'Una ruta hecha para ti' },
  'stress-context': { step: '02', kicker: 'Una ruta hecha para ti' },
  'change-context': { step: '02', kicker: 'Una ruta hecha para ti' },
  preferences: { step: '03', kicker: 'Preferencias compartidas' },
  adaptation: { step: '04', kicker: 'Adaptación logística' },
  'request-context': { step: '05', kicker: 'Tu prioridad' },
  'spacious-context': { step: '05', kicker: 'Un formato amplio' },
  'focused-context': { step: '05', kicker: 'Un formato enfocado' },
  'final-context': { step: '06', kicker: 'Ya casi está' },
}

export const SurveyScreen = ({ controller }: SurveyScreenProps) => {
  const currentId =
    controller.state.trail[controller.state.trail.length - 1] ?? controller.schema.entry
  const meta = sectionMeta[currentId] ?? { step: '—', kicker: 'Encuesta adaptativa' }
  const isFinal = currentId === 'final-context'

  return (
    <div className="survey-wrap entrance">
      <div className="survey-topline">
        <div>
          <span className="step-number">{meta.step}</span>
          <span>{meta.kicker}</span>
        </div>
        <span className="save-state">
          <span aria-hidden="true">✓</span>
          Guardado
        </span>
      </div>
      <div className="survey-card">
        <FlowPage
          controller={controller}
          backLabel="Atrás"
          nextLabel={isFinal ? 'Enviar respuesta' : 'Continuar'}
          renderers={{
            byId: {
              [demoQuestionIds.preferredName]: ShortTextRenderer,
              [demoQuestionIds.changeWhen]: ShortTextRenderer,
            },
          }}
        />
      </div>
      <p className="survey-help">
        Puedes volver atrás cuando quieras. Las preguntas se adaptarán a tus respuestas.
      </p>
    </div>
  )
}
