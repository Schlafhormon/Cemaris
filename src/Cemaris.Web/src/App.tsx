import { useEffect, useState } from 'react'
import './App.css'
import { getSystemInformation } from './api/cemarisApi'
import { AppLayout } from './layouts/AppLayout'
import { CaseDetailsPage } from './pages/CaseDetailsPage'
import { HomePage } from './pages/HomePage'
import { CaseEditPage } from './pages/CaseEditPage'
import { NewCasePage } from './pages/NewCasePage'
import { SearchPage } from './pages/SearchPage'
import { useAuth } from './auth/useAuth'
import { LoginPage } from './pages/LoginPage'
import { PasswordPage } from './pages/PasswordPage'
import { UserAdministrationPage } from './pages/UserAdministrationPage'

function App() {
  const { state: authState, account, logout } = useAuth()
  const [path, setPath] = useState(window.location.pathname.replace(/\/$/, '') || '/')
  const [caseEditingEnabled, setCaseEditingEnabled] = useState<boolean>()
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname.replace(/\/$/, '') || '/')
    window.addEventListener('popstate', updatePath)
    return () => window.removeEventListener('popstate', updatePath)
  }, [])

  useEffect(() => {
    const showForbidden = () => setForbidden(true)
    window.addEventListener('cemaris-forbidden', showForbidden)
    return () => window.removeEventListener('cemaris-forbidden', showForbidden)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getSystemInformation(controller.signal)
      .then((information) => setCaseEditingEnabled(information.caseEditingEnabled))
      .catch(() => setCaseEditingEnabled(false))
    return () => controller.abort()
  }, [])

  if (authState === 'loading') {
    return <div className="state-message detail-state">Sitzung wird geprüft …</div>
  }

  if (authState === 'anonymous' || !account) {
    return <LoginPage />
  }

  const caseMatch = path.match(/^\/cases\/([^/]+)$/)
  const editMatch = path.match(/^\/cases\/([^/]+)\/edit$/)

  let page = account.mustChangePassword ? <PasswordPage required /> : <HomePage />
  if (!account.mustChangePassword && path === '/search') {
    page = <SearchPage caseEditingEnabled={caseEditingEnabled === true} />
  } else if (!account.mustChangePassword && path === '/account/password') {
    page = <PasswordPage />
  } else if (!account.mustChangePassword && path === '/admin/accounts') {
    page = account.role === 'Administration'
      ? <UserAdministrationPage />
      : <div className="state-message state-message--error detail-state" role="alert">Für die Benutzerverwaltung fehlt die administrative Berechtigung.</div>
  } else if (!account.mustChangePassword && path === '/cases/new') {
    page = caseEditingEnabled === true ? (
      <NewCasePage />
    ) : (
      <FeatureUnavailablePage loading={caseEditingEnabled === undefined} />
    )
  } else if (!account.mustChangePassword && editMatch) {
    page = caseEditingEnabled === true ? (
      <CaseEditPage caseId={decodeURIComponent(editMatch[1])} />
    ) : (
      <FeatureUnavailablePage loading={caseEditingEnabled === undefined} />
    )
  } else if (!account.mustChangePassword && caseMatch) {
    page = (
      <CaseDetailsPage
        caseId={decodeURIComponent(caseMatch[1])}
        caseEditingEnabled={caseEditingEnabled === true}
      />
    )
  }

  return (
    <AppLayout account={account} caseEditingEnabled={caseEditingEnabled === true} onLogout={logout}>
      {forbidden && <div className="permission-banner" role="alert"><span>Diese Aktion ist für Ihr Konto nicht erlaubt. Ihre Eingaben bleiben erhalten.</span><button type="button" onClick={() => setForbidden(false)}>Hinweis schließen</button></div>}
      {page}
    </AppLayout>
  )
}

function FeatureUnavailablePage({ loading }: { loading: boolean }) {
  return (
    <div className="state-message detail-state" role="status">
      {loading
        ? 'Systemfähigkeit wird geprüft …'
        : 'Die synthetische Fallaktenbearbeitung ist in dieser Umgebung nicht aktiviert.'}
    </div>
  )
}

export default App
