import type { PersistenceProblem } from '@flowgraph/react'

type StorageNoticeProps = {
  readonly problem: PersistenceProblem
  readonly onDismiss?: () => void
}

export const StorageNotice = ({ problem: _, onDismiss }: StorageNoticeProps) => (
  <div className="storage-notice" role="status">
    <span aria-hidden="true">!</span>
    <p>
      <strong>No podemos guardar en este navegador.</strong> Puedes continuar, pero perderás el
      progreso si cierras o recargas.
    </p>
    {onDismiss === undefined ? null : (
      <button type="button" onClick={onDismiss} aria-label="Cerrar aviso">
        ×
      </button>
    )}
  </div>
)
