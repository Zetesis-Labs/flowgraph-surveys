type IntroScreenProps = {
  readonly onStart: () => void
}

const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
    <path
      d="M4 10h11m-4-4 4 4-4 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IntroScreen = ({ onStart }: IntroScreenProps) => (
  <div className="intro-panel entrance">
    <p className="eyebrow">Una pausa para ordenar ideas</p>
    <h2>Cuéntanos cómo estás, a tu ritmo.</h2>
    <p className="intro-lead">
      Esta encuesta adapta sus preguntas a lo que vayas contando. No hay respuestas correctas: solo
      un recorrido breve para probar cómo funciona FlowGraph.
    </p>

    <div className="intro-facts">
      <div>
        <span className="fact-icon" aria-hidden="true">
          08
        </span>
        <span>
          <strong>Unos 8 minutos</strong>
          <small>Puedes parar y volver</small>
        </span>
      </div>
      <div>
        <span className="fact-icon shield" aria-hidden="true">
          ✓
        </span>
        <span>
          <strong>Todo queda en local</strong>
          <small>Nada sale de este navegador</small>
        </span>
      </div>
      <div>
        <span className="fact-icon path" aria-hidden="true">
          ↝
        </span>
        <span>
          <strong>Recorrido adaptativo</strong>
          <small>Verás solo lo que encaje contigo</small>
        </span>
      </div>
    </div>

    <div className="demo-note">
      <span aria-hidden="true">i</span>
      <p>
        <strong>Esto es una demostración.</strong> No ofrece evaluación, diagnóstico ni orientación
        psicológica. Usa datos inventados, no información real.
      </p>
    </div>

    <button className="primary-action" type="button" onClick={onStart}>
      Empezar la encuesta <Arrow />
    </button>
  </div>
)
