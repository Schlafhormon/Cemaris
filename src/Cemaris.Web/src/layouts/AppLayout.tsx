import type { PropsWithChildren } from 'react'
import type { CurrentAccount } from '../types/identity'

interface AppLayoutProps extends PropsWithChildren {
  caseEditingEnabled: boolean
  account: CurrentAccount
  onLogout: () => Promise<void>
}

export function AppLayout({ children, caseEditingEnabled, account, onLogout }: AppLayoutProps) {
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
          {caseEditingEnabled && (
            <a
              className={currentPath === '/cases/new' ? 'active' : undefined}
              href="/cases/new"
              aria-current={currentPath === '/cases/new' ? 'page' : undefined}
            >
              Neue Fallakte
            </a>
          )}
          {account.role === 'Administration' && (
            <a className={currentPath === '/admin/accounts' ? 'active' : undefined} href="/admin/accounts" aria-current={currentPath === '/admin/accounts' ? 'page' : undefined}>Benutzerverwaltung</a>
          )}
        </nav>
        <div className="account-menu"><span><strong>{account.displayName}</strong><small>{account.role}</small></span><a href="/account/password">Passwort</a><button type="button" onClick={() => void onLogout()}>Abmelden</button></div>
      </header>

      <main className="page-content">{children}</main>

      <footer className="site-footer">
        <span>Cemaris · Open Source für Kommunen</span>
        <span>Noch nicht für den Produktivbetrieb freigegeben</span>
      </footer>
    </div>
  )
}
