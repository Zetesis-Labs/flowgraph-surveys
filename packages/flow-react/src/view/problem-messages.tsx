import type { Problem } from '@flowgraph/core'

const problemCopy: Readonly<Record<Problem['code'], string>> = {
  required: 'Este campo es obligatorio.',
  'out-of-range': 'Introduce un valor dentro del intervalo permitido.',
  'too-long': 'El texto supera la longitud permitida.',
  'no-edge': 'No se puede continuar con las respuestas actuales.',
  'missing-node': 'No se puede mostrar el siguiente paso.',
  'unknown-question': 'La pregunta no está disponible.',
  'answer-kind-mismatch': 'Introduce un número entero válido.',
  'unknown-option': 'Selecciona una opción disponible.',
  'arity-mismatch': 'Selecciona el número de opciones permitido.',
  'duplicate-option': 'Una opción está seleccionada más de una vez.',
  'duplicate-attachment': 'El mismo archivo adjunto aparece más de una vez.',
  'attachment-count': 'Selecciona una cantidad de archivos dentro del límite permitido.',
  'unsupported-file-type': 'Selecciona un archivo con un formato permitido.',
  'file-too-large': 'Uno de los archivos supera el tamaño permitido.',
  'not-current-page': 'La pregunta ya no está activa.',
  'session-not-started': 'La encuesta todavía no ha comenzado.',
  'session-already-started': 'La encuesta ya ha comenzado.',
  'session-sealed': 'La respuesta ya está enviada.',
  'schema-mismatch': 'La definición de la encuesta no coincide.',
  'log-schema-mismatch': 'El progreso guardado pertenece a otra encuesta.',
  'unsupported-event-version': 'La versión del progreso guardado no es compatible.',
  'reentrant-dispatch': 'Espera a que termine la acción actual.',
}

export const messageForProblem = (problem: Problem): string => problemCopy[problem.code]

export type ProblemMessagesProps = {
  readonly id: string
  readonly problems: readonly Problem[]
  readonly live?: boolean
  readonly focusRef?: (element: HTMLDivElement | null) => void
}

export const ProblemMessages = ({ id, problems, live = false, focusRef }: ProblemMessagesProps) =>
  problems.length === 0 ? null : (
    <div
      id={id}
      ref={focusRef}
      role={live ? 'alert' : undefined}
      aria-live={live ? 'polite' : undefined}
      tabIndex={live ? -1 : undefined}
    >
      <ul>
        {problems.map((problem, index) => (
          <li key={`${problem.code}-${String(index)}`}>{messageForProblem(problem)}</li>
        ))}
      </ul>
    </div>
  )
