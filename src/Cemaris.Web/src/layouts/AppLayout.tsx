import { useEffect, useId, useRef, useState, type PropsWithChildren } from 'react'
import type { CurrentAccount } from '../types/identity'

interface AppLayoutProps extends PropsWithChildren {
  caseEditingEnabled: boolean
  cemeteryMasterDataEditingEnabled: boolean
  personUsageRightsEditingEnabled: boolean
  account: CurrentAccount
  onLogout: () => Promise<void>
}

interface NavigationItem {
  label: string
  description: string
  href: string
  active: boolean
}

export function AppLayout({ children, caseEditingEnabled, cemeteryMasterDataEditingEnabled, personUsageRightsEditingEnabled, account, onLogout }: AppLayoutProps) {
  const currentPath = window.location.pathname
  const searchAreaActive = currentPath.startsWith('/search')
    || (currentPath.startsWith('/cases/') && currentPath !== '/cases/new')
  const caseItems: NavigationItem[] = [
    { label: 'Suche', description: 'Fall- und Grabstellen finden', href: '/search', active: searchAreaActive },
    ...(caseEditingEnabled
      ? [{ label: 'Neue Fallakte', description: 'Synthetischen Fall anlegen', href: '/cases/new', active: currentPath === '/cases/new' }]
      : []),
  ]
  const masterDataItems: NavigationItem[] = cemeteryMasterDataEditingEnabled
    ? [{ label: 'Friedhofsstammdaten', description: 'Struktur, Grabarten und Grabstellen', href: '/master-data/cemeteries', active: currentPath.startsWith('/master-data/cemeteries') }]
    : []
  const administrationItems: NavigationItem[] = account.role === 'Administration'
    ? [
        { label: 'Benutzerverwaltung', description: 'Lokale Konten und Rollen', href: '/admin/accounts', active: currentPath === '/admin/accounts' },
        ...(personUsageRightsEditingEnabled
          ? [{ label: 'Nutzungsrecht-Startbezug', description: 'Versionierte Regeln je Friedhof', href: '/program-configuration/usage-right-start-rules', active: currentPath === '/program-configuration/usage-right-start-rules' }]
          : []),
      ]
    : []

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Cemaris Startseite">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span className="brand-copy"><span className="brand-name">Cemaris</span><small>Friedhofsverwaltung</small></span>
        </a>
        <nav className="primary-navigation" aria-label="Hauptnavigation">
          <a className={currentPath === '/' ? 'nav-link active' : 'nav-link'} href="/" aria-current={currentPath === '/' ? 'page' : undefined}>Übersicht</a>
          <NavigationMenu label="Fallakten" items={caseItems} />
          {masterDataItems.length > 0 && <NavigationMenu label="Stammdaten" items={masterDataItems} />}
          {administrationItems.length > 0 && <NavigationMenu label="Administration" items={administrationItems} align="right" />}
        </nav>
        <AccountMenu account={account} onLogout={onLogout} />
      </header>

      <main className="page-content">{children}</main>

      <footer className="site-footer">
        <span>Cemaris · Open Source für Kommunen</span>
        <span>Noch nicht für den Produktivbetrieb freigegeben</span>
      </footer>
    </div>
  )
}

function NavigationMenu({ label, items, align = 'left' }: { label: string; items: NavigationItem[]; align?: 'left' | 'right' }) {
  const { open, setOpen, rootRef, triggerRef } = useDismissibleDropdown()
  const menuId = useId()
  const active = items.some(item => item.active)

  return <div className="nav-menu" ref={rootRef}>
    <button ref={triggerRef} className={active ? 'nav-menu-trigger active' : 'nav-menu-trigger'} type="button" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(value => !value)}>
      {label}<span className="menu-chevron" aria-hidden="true">⌄</span>
    </button>
    {open && <div className={`nav-dropdown nav-dropdown--${align}`} id={menuId}>
      <p className="nav-dropdown-label">{label}</p>
      {items.map(item => <a className={item.active ? 'nav-dropdown-item active' : 'nav-dropdown-item'} href={item.href} aria-current={item.active ? 'page' : undefined} key={item.href} onClick={() => setOpen(false)}><span>{item.label}</span><small>{item.description}</small></a>)}
    </div>}
  </div>
}

function AccountMenu({ account, onLogout }: { account: CurrentAccount; onLogout: () => Promise<void> }) {
  const { open, setOpen, rootRef, triggerRef } = useDismissibleDropdown()
  const menuId = useId()

  return <div className="account-menu" ref={rootRef}>
    <button ref={triggerRef} className="account-menu-trigger" type="button" aria-expanded={open} aria-controls={menuId} aria-label={`Kontomenü für ${account.displayName}`} onClick={() => setOpen(value => !value)}>
      <span className="account-avatar" aria-hidden="true">{account.displayName.trim().charAt(0).toUpperCase()}</span>
      <span className="account-copy"><strong>{account.displayName}</strong><small>{account.role}</small></span>
      <span className="menu-chevron" aria-hidden="true">⌄</span>
    </button>
    {open && <div className="account-dropdown" id={menuId}>
      <div className="account-dropdown-heading"><strong>{account.displayName}</strong><span>{account.username}</span><small>{account.role}</small></div>
      <a href="/account/password" onClick={() => setOpen(false)}><span>Passwort ändern</span><small>Kontosicherheit verwalten</small></a>
      <button type="button" onClick={() => { setOpen(false); void onLogout() }}><span>Abmelden</span><small>Aktuelle Sitzung beenden</small></button>
    </div>}
  </div>
}

function useDismissibleDropdown() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function dismissOnPointer(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', dismissOnPointer)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOnPointer)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [open])

  return { open, setOpen, rootRef, triggerRef }
}
