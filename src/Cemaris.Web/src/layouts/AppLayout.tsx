import type { PropsWithChildren } from 'react'

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Cemaris Startseite">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span className="brand-name">Cemaris</span>
        </a>
        <span className="header-phase">Konzeptionsphase</span>
      </header>

      <main className="page-content">{children}</main>

      <footer className="site-footer">
        <span>Cemaris · Open Source für Kommunen</span>
        <span>Noch nicht für den Produktivbetrieb freigegeben</span>
      </footer>
    </div>
  )
}
