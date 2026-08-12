import { useEffect, useState } from 'react'
import './App.css'
import { getSystemInformation } from './api/cemarisApi'
import { AppLayout } from './layouts/AppLayout'
import { CaseDetailsPage } from './pages/CaseDetailsPage'
import { HomePage } from './pages/HomePage'
import { CaseEditPage } from './pages/CaseEditPage'
import { NewCasePage } from './pages/NewCasePage'
import { SearchPage } from './pages/SearchPage'

function App() {
  const [path, setPath] = useState(window.location.pathname.replace(/\/$/, '') || '/')
  const [caseEditingEnabled, setCaseEditingEnabled] = useState<boolean>()

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname.replace(/\/$/, '') || '/')
    window.addEventListener('popstate', updatePath)
    return () => window.removeEventListener('popstate', updatePath)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getSystemInformation(controller.signal)
      .then((information) => setCaseEditingEnabled(information.caseEditingEnabled))
      .catch(() => setCaseEditingEnabled(false))
    return () => controller.abort()
  }, [])

  const caseMatch = path.match(/^\/cases\/([^/]+)$/)
  const editMatch = path.match(/^\/cases\/([^/]+)\/edit$/)

  let page = <HomePage />
  if (path === '/search') {
    page = <SearchPage caseEditingEnabled={caseEditingEnabled === true} />
  } else if (path === '/cases/new') {
    page = caseEditingEnabled === true ? (
      <NewCasePage />
    ) : (
      <FeatureUnavailablePage loading={caseEditingEnabled === undefined} />
    )
  } else if (editMatch) {
    page = caseEditingEnabled === true ? (
      <CaseEditPage caseId={decodeURIComponent(editMatch[1])} />
    ) : (
      <FeatureUnavailablePage loading={caseEditingEnabled === undefined} />
    )
  } else if (caseMatch) {
    page = (
      <CaseDetailsPage
        caseId={decodeURIComponent(caseMatch[1])}
        caseEditingEnabled={caseEditingEnabled === true}
      />
    )
  }

  return (
    <AppLayout caseEditingEnabled={caseEditingEnabled === true}>
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
