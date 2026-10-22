/* Page flows ported from Sunrise CMS views/login.ejs, _header.ejs and theme.ts.
 * Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
 * MIT notice: /THIRD-PARTY-NOTICES.txt. */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { request } from './api'
import type { Session, User } from './api'
import { initialLanguage, isLanguage, loadCatalogs, translator } from './i18n'
import { AppSettings, UserManagement, UserSettings } from './pages'
import { Dashboard, UpdateLog } from './dashboard'
import { Reports } from './reports'
import { CatalogManagement } from './catalogs'
import { AdminAuditLog, AdminDatabase } from './administration'
import type { DatabaseMaintenance } from './administration'
import { Places } from './places'
import { ContractPages } from './contracts'
import { WorkOrderPages } from './work-orders'
import { ErrorMessage, Link, Modal, navigate, pageAllowed, safeRedirect } from './ui'
import { appUrl, applicationLocation, COOKIE_PATH } from './paths'

export default function App() {
  const [language, setLanguage] = useState(initialLanguage)
  const t = useMemo(() => translator(language), [language])
  const [location, setLocation] = useState(applicationLocation)
  const [session, setSession] = useState<Session | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [expired, setExpired] = useState(false)
  const [menu, setMenu] = useState(false)
  const [quickSearch, setQuickSearch] = useState(false)
  const [auditLogEnabled, setAuditLogEnabled] = useState(false)
  const path = location.split('?')[0].replace(/\/$/, '') || '/'
  const routePath = path.toLowerCase()

  useEffect(() => {
    const listener = () => { setLocation(applicationLocation()); setMenu(false) }
    window.addEventListener('popstate', listener)
    return () => window.removeEventListener('popstate', listener)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    Promise.all([request<Session>('/api/session', undefined, controller.signal), loadCatalogs(controller.signal)])
      .then(([value]) => { if (!controller.signal.aborted) { setSession(value); setLanguage(value.language) } })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    document.documentElement.lang = language
    if (session?.user && (routePath.startsWith('/workorders') || /^\/(?:cemeteries|burialsites|contracts|funeralhomes)(?:\/(?:new|\d+)(?:\/(?:edit|next|previous))?)?$/.test(routePath) || /^\/burialsites\/(?:map|creator|gpscapture)$/.test(routePath))) return
    const title = !session?.user ? t('login:title') : routePath === '/admin/users' ? t('admin:userManagement')
      : routePath === '/admin/settings' ? t('admin:settingsManagement') : routePath === '/admin/database' ? t('admin:databaseMaintenance') : routePath === '/admin/auditlog' ? t('admin:auditLog') : routePath === '/admin/burialsitetypes' ? t('admin:burialSiteTypeManagement')
        : routePath === '/admin/contracttypes' ? t('admin:contractTypeManagement') : routePath === '/admin/fees' ? t('admin:feeManagement')
          : routePath === '/admin/tables' ? t('admin:configTableManagement') : routePath === '/dashboard/usersettings' ? t('dashboard.userSettings')
            : routePath.startsWith('/cemeteries') ? t('cemeteries') : routePath.startsWith('/burialsites') ? t('cemeteries.burialSites') : t('dashboard.title')
    document.title = `${title}: Cemaris`
  }, [language, path, session, t])

  useEffect(() => {
    if (!session?.user?.userProperties.isAdmin) { setAuditLogEnabled(false); return }
    const controller = new AbortController()
    request<DatabaseMaintenance>('/api/admin/database', undefined, controller.signal).then((value) => {
      if (!controller.signal.aborted) setAuditLogEnabled(value.auditLogEnabled)
    }).catch(() => { /* Page requests display operational errors. */ })
    return () => controller.abort()
  }, [session?.user?.username, session?.user?.userProperties.isAdmin])

  useEffect(() => {
    if (session && !session.user) {
      try { localStorage.clear() } catch { /* Storage may be disabled. */ }
    }
  }, [session])

  useEffect(() => {
    if (!session) return
    if (!session.user && routePath !== '/login') {
      const redirect = routePath === '/' ? '/dashboard' : location
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`, true)
    } else if (session.user && (routePath === '/' || routePath === '/login')) {
      const redirect = new URLSearchParams(window.location.search).get('redirect')
      navigate(safeRedirect(redirect), true)
    } else if (session.user && !pageAllowed(path, session.user)) {
      navigate('/dashboard/?error=accessDenied', true)
    }
  }, [session, path, location])

  useEffect(() => {
    function expire() {
      setExpired(true)
      setSession((current) => current ? { ...current, user: null } : null)
      setAttempt((current) => current + 1)
    }
    window.addEventListener('cemaris-session-expired', expire)
    return () => window.removeEventListener('cemaris-session-expired', expire)
  }, [])

  useEffect(() => {
    if (!session?.user || !session.auth.doKeepAlive) return
    const interval = window.setInterval(() => {
      request<{ activeSession: boolean }>('/api/keep-alive', {}).then((value) => {
        if (!value.activeSession) window.dispatchEvent(new Event('cemaris-session-expired'))
      }).catch(() => { /* A transient network error is retried; API 401 handles expiry. */ })
    }, Math.max(1, Math.trunc(session.auth.maxAgeMillis / 2)))
    return () => window.clearInterval(interval)
  }, [session])

  function changeLanguage(value: string) {
    if (!isLanguage(value)) return
    document.cookie = `i18next=${value}; Path=${COOKIE_PATH}; SameSite=Lax`
    setLanguage(value)
    const url = new URL(window.location.href)
    url.searchParams.set('lng', value)
    navigate(url.pathname + url.search, true)
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true); setError(null)
    try {
      const result = await request<{ user: User; redirect: string }>('/api/login', {
        username: data.get('username'), password: data.get('password'), redirect: new URLSearchParams(window.location.search).get('redirect') || '',
      })
      setSession((value) => value ? { ...value, user: result.user } : value)
      setExpired(false)
      navigate(result.redirect || '/dashboard', true)
    } catch (reason) { setError(reason); (form.elements.namedItem('password') as HTMLInputElement).value = '' } finally { setBusy(false) }
  }

  async function logout() {
    if (!window.confirm(t('logoutConfirm'))) return
    setBusy(true)
    try {
      await request('/api/logout', {})
      try { localStorage.clear() } catch { /* Storage may be disabled. */ }
      setSession((value) => value ? { ...value, user: null } : value)
      setError(null); navigate('/login', true)
    } catch (reason) { setError(reason) } finally { setBusy(false) }
  }

  const languageControl = <div className="language-control"><label htmlFor="language">{t('cemaris:language')}</label><select id="language" value={language} onChange={(event) => changeLanguage(event.target.value)}><option value="de" lang="de">Deutsch</option><option value="en" lang="en">English</option></select></div>
  const footer = <footer className="footer"><span><strong>Cemaris</strong> · v0.2.0</span><a href={appUrl("/THIRD-PARTY-NOTICES.txt")}>{t('cemaris:notices')}</a></footer>

  if (!session) return <><main className="login-main"><section className="box connection-box"><img className="application-logo" src={appUrl("/branding/cemaris-logo.png")} alt="Cemaris" /><div role="status">{error ? <><ErrorMessage error={error} t={t} /><button onClick={() => setAttempt((value) => value + 1)}>{t('cemaris:retry')}</button></> : t('cemaris:checking')}</div></section></main>{footer}</>

  if (!session.user) return <><a className="skip-link" href={appUrl("#main")}>{t('cemaris:skip')}</a><div className="login-language">{languageControl}</div><main id="main" className="login-main"><section className="box login-box"><div className="logo-column"><img className="application-logo" src={appUrl("/branding/cemaris-logo.png")} alt="Cemaris" /></div><div><h1 className="login-title">Cemaris</h1><form id="form--login" onSubmit={login}><label className="sr-only" htmlFor="login--username">{t('login:username')}</label><div className="input-addons">{session.auth.domain && <span className="domain">{session.auth.domain}&#92;</span>}<input id="login--username" name="username" autoComplete="username" placeholder={t('login:username')} autoFocus required /></div><label className="sr-only" htmlFor="login--password">{t('login:password')}</label><input id="login--password" name="password" type="password" autoComplete="current-password" placeholder={t('login:password')} required />{session.auth.useTestDatabases && <p className="notification warning">{t('login:testingDatabasesInUse')}</p>}{expired && <p className="notification warning" role="alert">{t('cemaris:expired')}</p>}{Boolean(error) && <ErrorMessage error={error} t={t} login />}<div className="actions"><button className="primary" disabled={busy} type="submit">{t('login:loginButton')}</button></div></form></div></section></main>{footer}</>

  const user = session.user
  const admin = routePath.startsWith('/admin')
  return <><a className="skip-link" href={appUrl("#main")}>{t('cemaris:skip')}</a><header className="navbar"><nav className="navbar-inner" aria-label={t('cemaris:navigation')}><Link className="brand" href="/dashboard"><img src={appUrl("/branding/cemaris-icon.png")} width="28" height="28" alt="" /><strong>Cemaris</strong></Link><button className="menu-toggle" aria-expanded={menu} onClick={() => setMenu(!menu)} aria-label={t('cemaris:navigation')}>☰</button><div className={`navbar-links ${menu ? 'expanded' : ''}`}><Link href="/contracts">{t('contracts')}</Link><Link href="/workOrders">{t('workOrders')}</Link><details><summary>{t('moreOptions')}</summary><div className="dropdown"><Link href="/funeralHomes">{t('contracts.funeralHomes')}</Link><Link href="/burialSites">{t('cemeteries.burialSites')}</Link><Link href="/cemeteries">{t('cemeteries')}</Link><hr /><Link href="/reports">{t('dashboard.reportLibrary')}</Link></div></details><div className="nav-spacer" /><button id="navbar--quickSearch" className="nav-button" onClick={() => setQuickSearch(true)}>{t('search')}</button><details><summary>{user.username}</summary><div className="dropdown right"><Link href="/dashboard/userSettings">{t('dashboard.userSettings')}</Link>{user.userProperties.isAdmin && <><Link href="/admin/users">{t('admin:userManagement')}</Link><Link href="/admin/settings">{t('admin:settingsManagement')}</Link></>}<button className="nav-button" disabled={busy} onClick={logout}>{t('logout')}</button></div></details>{languageControl}</div></nav></header><main id="main" className="main" tabIndex={-1} data-can-update-cemeteries={String(user.userProperties.canUpdateCemeteries)} data-can-update-contracts={String(user.userProperties.canUpdateContracts)} data-can-update-work-orders={String(user.userProperties.canUpdateWorkOrders)} data-is-admin={String(user.userProperties.isAdmin)}>{Boolean(error) && <ErrorMessage error={error} t={t} />}<div className={admin ? 'admin-layout' : ''}>{admin && user.userProperties.isAdmin && <aside className="admin-menu" aria-label={t('admin:adminTools')}><h2>{t('admin:adminTools')}</h2>{[['fees', 'contracts.fees'], ['contractTypes', 'contracts.contractTypes'], ['burialSiteTypes', 'cemeteries.burialSiteTypes'], ['tables', 'admin:configTables'], ['users', 'admin:users'], ['settings', 'admin:settings'], ['database', 'admin:database'], ...(auditLogEnabled ? [['auditLog', 'admin:auditLog']] : [])].map(([route, label]) => <Link className={routePath === `/admin/${route.toLowerCase()}` ? 'active-link' : ''} href={`/admin/${route}`} key={route}>{t(label)}</Link>)}</aside>}<section className="page-content">{!pageAllowed(path, user) ? null : routePath === '/admin/users' ? <UserManagement t={t} /> : routePath === '/admin/settings' ? <AppSettings key={language} t={t} /> : routePath === '/admin/database' ? <AdminDatabase t={t} language={language} /> : routePath === '/admin/auditlog' ? <AdminAuditLog t={t} language={language} /> : ['/admin/burialsitetypes', '/admin/contracttypes', '/admin/fees', '/admin/tables'].includes(routePath) ? <CatalogManagement t={t} language={language} page={routePath.split('/')[2]} /> : (/^\/(?:cemeteries|burialsites)(?:\/(?:new|\d+)(?:\/(?:edit|next|previous))?)?$/.test(routePath) || /^\/burialsites\/(?:map|creator|gpscapture)$/.test(routePath)) ? <Places t={t} language={language} user={user} location={location} /> : /^\/(?:contracts|funeralhomes)(?:\/(?:new|\d+)(?:\/(?:edit|next|previous))?)?$/.test(routePath) ? <ContractPages t={t} language={language} user={user} location={location} /> : routePath.startsWith('/workorders') ? <WorkOrderPages t={t} language={language} user={user} location={location} /> : routePath === '/dashboard/usersettings' ? <UserSettings t={t} language={language} onLanguage={changeLanguage} /> : routePath === '/reports' ? <Reports t={t} language={language} location={location} /> : routePath === '/dashboard/updatelog' ? <UpdateLog t={t} language={language} user={user} /> : routePath === '/dashboard' ? <Dashboard t={t} user={user} error={new URLSearchParams(window.location.search).get('error') ?? undefined} /> : <><h1>{t('errors:notFound')}</h1><Link href="/dashboard">{t('errors:goHome')}</Link></>}</section></div></main>{footer}{quickSearch && <QuickSearch t={t} onClose={() => setQuickSearch(false)} />}</>
}

function QuickSearch({ t, onClose }: { t: ReturnType<typeof translator>; onClose: () => void }) {
  const searchInput = useRef<HTMLInputElement>(null)
  useEffect(() => { searchInput.current?.focus() }, [])
  return <Modal title={t('cemaris:quickSearch')} onClose={onClose}>
    <div className="page-heading"><h2>{t('contracts')}</h2><Link id="quickSearch--contractsLink" href="/contracts" onClick={onClose}>{t('contracts.contractSearch')}</Link></div>
    <form id="form--quickSearchContract" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const field = String(data.get('searchField')); if (!['contractNumber', 'deceasedName'].includes(field)) { window.alert(t('cemaris:invalidSearch')); return }; navigate(`/contracts/?${field}=${encodeURIComponent(String(data.get('searchValue')))}`); onClose() }}>
      <label htmlFor="quickSearchContract--searchField">{t('search')}</label><select id="quickSearchContract--searchField" name="searchField"><option value="contractNumber">{t('cemaris:contractNumber')}</option><option value="deceasedName">{t('cemaris:deceasedName')}</option></select>
      <input ref={searchInput} id="quickSearchContract--searchValue" name="searchValue" required aria-label={t('search')} autoFocus /><button type="submit">{t('search')}</button>
    </form><hr />
    <div className="page-heading"><h2>{t('workOrders')}</h2><Link id="quickSearch--workOrdersLink" href="/workOrders" onClick={onClose}>{t('workOrders.workOrderSearch')}</Link></div>
    <form id="form--quickSearchWorkOrder" onSubmit={(event) => { event.preventDefault(); navigate(`/workOrders/byWorkOrderNumber/${encodeURIComponent(String(new FormData(event.currentTarget).get('workOrderNumber')))}`); onClose() }}>
      <label htmlFor="quickSearchWorkOrder--workOrderNumber">{t('workOrders.workOrderNumber')}</label><input id="quickSearchWorkOrder--workOrderNumber" name="workOrderNumber" required /><button type="submit">{t('search')}</button>
    </form>
  </Modal>
}
