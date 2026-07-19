type CompletionScreenProps = {
  readonly onNew: () => void
}

export const CompletionScreen = ({ onNew }: CompletionScreenProps) => (
  <div className="completion-panel entrance">
    <div className="completion-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path
          d="m20 32 8 8 17-18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <p className="eyebrow">Recorrido completado</p>
    <h2>Gracias por dedicarte este momento.</h2>
    <p>
      Tu respuesta de demostración se ha enviado y ha quedado cerrada en este dispositivo. No se ha
      compartido con nadie.
    </p>
    <div className="completion-card">
      <span aria-hidden="true">✓</span>
      <div>
        <strong>Respuesta guardada localmente</strong>
        <small>La sesión ya no puede modificarse ni enviarse de nuevo.</small>
      </div>
    </div>
    <button className="secondary-action" type="button" onClick={onNew}>
      Iniciar una nueva demostración
    </button>
  </div>
)
