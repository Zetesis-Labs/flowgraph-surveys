import type { ReactNode } from 'react'

type VisualShellProps = {
  readonly children: ReactNode
  readonly eyebrow: string
  readonly title: string
  readonly detail: string
  readonly progress?: number
  readonly compact?: boolean
}

const Mark = () => (
  <svg aria-hidden="true" viewBox="0 0 44 44" className="size-9">
    <path
      d="M22 3.5c10.2 0 18.5 8.3 18.5 18.5S32.2 40.5 22 40.5 3.5 32.2 3.5 22 11.8 3.5 22 3.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      d="M14 24.5c4.4-8 11.5-8.8 16-3.6-4.7 1-8.6 4.2-10.8 9.7"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="14.3" cy="17.2" r="2.2" fill="currentColor" />
  </svg>
)

export const VisualShell = ({
  children,
  eyebrow,
  title,
  detail,
  progress,
  compact = false,
}: VisualShellProps) => (
  <main className="app-canvas">
    <div className="ambient ambient-one" />
    <div className="ambient ambient-two" />
    <aside className="brand-rail">
      <a className="brand" href="/" aria-label="Pausa, inicio">
        <Mark />
        <span>Pausa</span>
      </a>
      <div className="rail-copy">
        <p className="eyebrow eyebrow-light">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
      <div className="rail-foot">
        <span className="privacy-dot" />
        <span>Privado · Guardado solo en este dispositivo</span>
      </div>
      <div aria-hidden="true" className="rail-orbit">
        <span />
        <span />
      </div>
    </aside>

    <section className={`content-stage${compact ? ' content-stage-compact' : ''}`}>
      <header className="mobile-brand">
        <span className="mobile-brand-name">
          <Mark />
          Pausa
        </span>
        <span className="local-chip">
          <span className="privacy-dot" />
          Local
        </span>
      </header>
      {progress === undefined ? null : (
        <div className="mobile-progress" aria-hidden="true">
          <span style={{ width: `${String(Math.round(progress * 100))}%` }} />
        </div>
      )}
      {children}
      <footer className="stage-footer">
        <span>Experiencia ficticia</span>
        <span>Impulsado por FlowGraph</span>
      </footer>
    </section>
  </main>
)
