import type { PropsWithChildren } from 'react'

export function AppLayout({ children }: PropsWithChildren) {
  const currentPath = window.location.pathname

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Cemaris Startseite">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span className="brand-name">Cemaris</span>
        </a>
        <nav className="primary-navigation" aria-label="Hauptnavigation">
          <a
            className={currentPath === '/' ? 'active' : undefined}
            href="/"
            aria-current={currentPath === '/' ? 'page' : undefined}
          >
            Projektstatus
          </a>
          <a
            className={currentPath.startsWith('/search') ? 'active' : undefined}
            href="/search"
            aria-current={currentPath.startsWith('/search') ? 'page' : undefined}
          >
            Suche
          </a>
        </nav>
        <span className="header-phase">Read-only MVP</span>
      </header>

      <main className="page-content">{children}</main>

      <footer className="site-footer">
        <span>Cemaris · Open Source für Kommunen</span>
        <span>Noch nicht für den Produktivbetrieb freigegeben</span>
      </footer>
    </div>
  )
}
