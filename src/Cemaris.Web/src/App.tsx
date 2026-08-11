import './App.css'
import { AppLayout } from './layouts/AppLayout'
import { CaseDetailsPage } from './pages/CaseDetailsPage'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'

function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const caseMatch = path.match(/^\/cases\/([^/]+)$/)

  let page = <HomePage />
  if (path === '/search') {
    page = <SearchPage />
  } else if (caseMatch) {
    page = <CaseDetailsPage caseId={decodeURIComponent(caseMatch[1])} />
  }

  return (
    <AppLayout>
      {page}
    </AppLayout>
  )
}

export default App
