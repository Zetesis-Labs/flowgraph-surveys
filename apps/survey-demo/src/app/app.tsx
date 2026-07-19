import { useFlowSurvey } from '@flowgraph/react'
import { useState } from 'react'

import { CompletionScreen } from '../components/completion-screen.js'
import { ConfirmDialog } from '../components/confirm-dialog.js'
import { IntroScreen } from '../components/intro-screen.js'
import { StorageNotice } from '../components/storage-notice.js'
import { SurveyScreen } from '../components/survey-screen.js'
import { VisualShell } from '../components/visual-shell.js'
import { demoSchema } from '../fixture/schema.js'
import { verifyDemoFixture } from '../fixture/verify.js'
import { useDemoSession } from './use-demo-session.js'

const fixtureVerification = verifyDemoFixture()

type ExperienceProps = {
  readonly storage: Storage
}

const ReadyExperience = ({
  model,
  onRequestNew,
}: {
  readonly model: ReturnType<typeof useDemoSession>
  readonly onRequestNew: () => void
}) => {
  if (model.loaded.kind !== 'ready') return null
  const controller = useFlowSurvey({
    schema: demoSchema,
    session: model.loaded.session,
    createMeta: model.createMeta,
  })
  const { view } = controller

  const content =
    view.status === 'not-started' ? (
      <IntroScreen onStart={model.start} />
    ) : view.status === 'finished' ? (
      <CompletionScreen onNew={onRequestNew} />
    ) : (
      <SurveyScreen controller={controller} />
    )

  const shellCopy =
    view.status === 'not-started'
      ? {
          eyebrow: 'Demo adaptativa · FlowGraph',
          title: 'Escuchar empieza por preguntar bien.',
          detail:
            'Una experiencia local para mostrar cómo un mismo grafo acompaña recorridos distintos sin perder el hilo.',
        }
      : view.status === 'finished'
        ? {
            eyebrow: 'Todo listo',
            title: 'Un recorrido claro, de principio a fin.',
            detail:
              'La respuesta queda sellada como un único historial reproducible en este dispositivo.',
          }
        : {
            eyebrow: 'Encuesta en curso',
            title: 'Cada respuesta abre el camino adecuado.',
            detail:
              'Puedes avanzar, volver y cambiar de ruta. FlowGraph mantiene activa solo la información relevante.',
          }

  return (
    <VisualShell
      {...shellCopy}
      compact={view.status === 'active'}
      {...(view.status === 'active' ? { progress: view.progress.fraction } : {})}
    >
      {model.persistenceProblem === undefined ? null : (
        <StorageNotice
          problem={model.persistenceProblem}
          onDismiss={model.dismissPersistenceProblem}
        />
      )}
      {content}
    </VisualShell>
  )
}

export const App = ({ storage = window.localStorage }: Partial<ExperienceProps>) => {
  const model = useDemoSession(storage)
  const [confirming, setConfirming] = useState(false)

  if (!fixtureVerification.valid) {
    return (
      <main className="fatal-screen">
        <h1>El fixture de la demo no es válido</h1>
        <p>La aplicación se ha detenido antes de iniciar una sesión inconsistente.</p>
      </main>
    )
  }

  if (model.loaded.kind === 'recovery') {
    return (
      <VisualShell
        eyebrow="Recuperación local"
        title="No vamos a inventar lo que falta."
        detail="El historial guardado no puede reconstruirse con seguridad."
      >
        <div className="recovery-panel entrance">
          <span className="recovery-icon" aria-hidden="true">
            !
          </span>
          <p className="eyebrow">No se pudo recuperar el progreso</p>
          <h2>Los datos guardados no tienen un formato válido.</h2>
          <p>
            No mostraremos contenido incompleto ni intentaremos adivinar respuestas. Puedes eliminar
            esta copia local y comenzar una demostración vacía.
          </p>
          <button className="primary-action" type="button" onClick={() => setConfirming(true)}>
            Descartar y empezar de nuevo
          </button>
          <ConfirmDialog
            open={confirming}
            onCancel={() => setConfirming(false)}
            onConfirm={() => {
              if (model.replace()) setConfirming(false)
            }}
          />
        </div>
      </VisualShell>
    )
  }

  return (
    <>
      <ReadyExperience model={model} onRequestNew={() => setConfirming(true)} />
      <ConfirmDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          if (model.replace()) setConfirming(false)
        }}
      />
    </>
  )
}
