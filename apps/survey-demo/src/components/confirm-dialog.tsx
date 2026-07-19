import { useEffect, useRef } from 'react'

type ConfirmDialogProps = {
  readonly open: boolean
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

export const ConfirmDialog = ({ open, onCancel, onConfirm }: ConfirmDialogProps) => {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) dialog.current?.showModal()
    else if (dialog.current?.open === true) dialog.current.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      aria-labelledby="replace-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClose={onCancel}
    >
      <div className="dialog-icon" aria-hidden="true">
        ↻
      </div>
      <h2 id="replace-dialog-title">¿Empezar desde cero?</h2>
      <p>La respuesta guardada en este dispositivo se eliminará y no podrás recuperarla.</p>
      <div>
        <button type="button" className="dialog-cancel" onClick={onCancel}>
          Conservar respuesta
        </button>
        <button type="button" className="dialog-confirm" onClick={onConfirm}>
          Sí, empezar de nuevo
        </button>
      </div>
    </dialog>
  )
}
