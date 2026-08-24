import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError, getParty, getPartyDirectory } from '../api/cemarisApi'
import { PartyCreateForm, PartyDetails } from '../components/PartyManagement'
import type { Party, PartyDirectoryPage, Versioned } from '../types/personUsageRights'

const pageSizeOptions = [10, 25, 50] as const

function directoryStateFromLocation() {
  const parameters = new URLSearchParams(window.location.search)
  const requestedPage = Number(parameters.get('page'))
  const requestedPageSize = Number(parameters.get('pageSize'))
  return {
    query: parameters.get('query')?.trim() ?? '',
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: pageSizeOptions.includes(requestedPageSize as 10 | 25 | 50) ? requestedPageSize : 10,
  }
}

function updateDirectoryLocation(query: string, page: number, pageSize: number) {
  const parameters = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (query) parameters.set('query', query)
  window.history.replaceState(null, '', `/parties?${parameters.toString()}`)
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

export function PartiesPage() {
  const initialDirectoryState = useRef(directoryStateFromLocation()).current
  const [party, setParty] = useState<Versioned<Party> | null>()
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'success' | 'error'>('success')
  const [conflict, setConflict] = useState(false)
  const [draftQuery, setDraftQuery] = useState(initialDirectoryState.query)
  const [appliedQuery, setAppliedQuery] = useState(initialDirectoryState.query)
  const [page, setPage] = useState(initialDirectoryState.page)
  const [pageSize, setPageSize] = useState(initialDirectoryState.pageSize)
  const [directory, setDirectory] = useState<PartyDirectoryPage>()
  const [directoryLoading, setDirectoryLoading] = useState(true)
  const [directoryError, setDirectoryError] = useState(false)
  const [directoryRevision, setDirectoryRevision] = useState(0)
  const messageRef = useRef<HTMLDivElement>(null)
  const latestDirectoryRequest = useRef(0)
  const selectionController = useRef<AbortController | undefined>(undefined)

  useEffect(() => { if (conflict) messageRef.current?.focus() }, [conflict])

  useEffect(() => {
    updateDirectoryLocation(appliedQuery, page, pageSize)
  }, [appliedQuery, page, pageSize])

  useEffect(() => {
    const controller = new AbortController()
    const requestId = ++latestDirectoryRequest.current
    setDirectoryLoading(true)
    setDirectoryError(false)

    getPartyDirectory(appliedQuery, page, pageSize, controller.signal)
      .then((response) => {
        if (requestId !== latestDirectoryRequest.current) return
        const lastAvailablePage = response.totalPages === 0 ? 1 : response.totalPages
        if (page > lastAvailablePage) {
          setPage(lastAvailablePage)
          return
        }
        setDirectory(response)
        setDirectoryLoading(false)
      })
      .catch((error: unknown) => {
        if (requestId !== latestDirectoryRequest.current || isAbortError(error)) return
        setDirectoryError(true)
        setDirectoryLoading(false)
      })

    return () => controller.abort()
  }, [appliedQuery, page, pageSize, directoryRevision])

  useEffect(() => () => selectionController.current?.abort(), [])

  function showError(error: unknown) {
    setTone('error')
    setConflict(error instanceof ApiError && error.status === 412)
    setMessage(error instanceof Error ? error.message : 'Die Beteiligtenaktion konnte nicht ausgeführt werden.')
  }

  function showSuccess(value: string) {
    setTone('success')
    setConflict(false)
    setMessage(value)
  }

  async function reloadParty() {
    if (!party) return
    try {
      const current = await getParty(party.value.id)
      if (current) setParty(current)
      setConflict(false)
      setMessage('Aktueller Beteiligtenstand geladen. Nicht gespeicherte Formulareingaben bleiben erhalten.')
      setTone('success')
    } catch (error) { showError(error) }
  }

  async function selectParty(id: string) {
    selectionController.current?.abort()
    const controller = new AbortController()
    selectionController.current = controller
    try {
      const selected = await getParty(id, controller.signal)
      if (selected && !controller.signal.aborted) setParty(selected)
    } catch (error) {
      if (!isAbortError(error)) showError(error)
    }
  }

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = draftQuery.trim()
    setDraftQuery(nextQuery)
    setAppliedQuery(nextQuery)
    setPage(1)
    setDirectoryRevision((current) => current + 1)
  }

  function clearFilter() {
    setDraftQuery('')
    setAppliedQuery('')
    setPage(1)
    setDirectoryRevision((current) => current + 1)
  }

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(1)
  }

  function partyChanged(value: Versioned<Party>) {
    setParty(value)
    setDirectoryRevision((current) => current + 1)
  }

  const resultStart = directory && directory.items.length > 0
    ? ((directory.page - 1) * directory.pageSize) + 1
    : 0
  const resultEnd = directory ? resultStart + directory.items.length - 1 : 0

  return (
    <div className="work-page parties-page">
      <div className="work-page-heading">
        <div>
          <p className="eyebrow">Fallunabhängige Stammdaten</p>
          <h1>Beteiligte</h1>
          <p>Kanonische natürliche Personen und Organisationen suchen und pflegen – ohne Fallbezug.</p>
        </div>
        <div className="synthetic-badge" role="note">Ausschließlich synthetische Daten</div>
      </div>

      {message && (
        <div ref={messageRef} tabIndex={-1} className={`workspace-message parties-page-message${tone === 'error' ? ' workspace-message--error' : ''}`} role={tone === 'error' ? 'alert' : 'status'}>
          <span>{message}</span>
          {conflict && <button className="button" type="button" onClick={() => void reloadParty()}>Aktuellen Stand neu laden</button>}
        </div>
      )}

      <section className="detail-section detail-section--wide usage-right-workspace" aria-labelledby="parties-workspace-heading">
        <header className="usage-right-header">
          <div>
            <p className="section-kicker">Kanonische Identitäten</p>
            <h2 id="parties-workspace-heading">Beteiligtenbestand</h2>
            <p>Suche, Detail, Namenskorrektur und historische Postanschriften verwenden dieselben Verträge wie der Nutzungsrechtsbereich.</p>
          </div>
          <span className="scope-badge">Fallübergreifend</span>
        </header>
        <div className="usage-right-layout parties-workspace-layout">
          <section className="workspace-card" aria-labelledby="party-search-heading">
            <div className="workspace-card-heading"><div><span className="step-number" aria-hidden="true">1</span><div><h3 id="party-search-heading">Beteiligtenbestand durchsuchen</h3><p>Serverseitig sortierte Seite auswählen und vorhandene Fakten historisiert korrigieren</p></div></div>{party && <span className="status-chip">Ausgewählt</span>}</div>
            <div className="party-directory">
              <form className="party-search-form party-directory-filter" onSubmit={applyFilter}>
                <label htmlFor="party-directory-query">Beteiligtenbestand nach Name filtern</label>
                <div className="search-control">
                  <input id="party-directory-query" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} minLength={2} maxLength={200} placeholder="Optional, mindestens zwei Zeichen" />
                  <button className="button button--primary" type="submit">Filter anwenden</button>
                  <button className="button" type="button" onClick={clearFilter}>Filter löschen</button>
                </div>
              </form>

              <section className="party-directory-results" aria-label="Paginierter Beteiligtenbestand" aria-busy={directoryLoading}>
                <div className="party-directory-summary">
                  <strong>Beteiligte</strong>
                  {!directoryLoading && !directoryError && directory && (
                    <span>{directory.totalMatches === 0 ? '0 Treffer' : `${resultStart}–${resultEnd} von ${directory.totalMatches}`}</span>
                  )}
                </div>
                {directoryLoading && <div className="state-message">Beteiligtenbestand wird geladen …</div>}
                {directoryError && <div className="state-message state-message--error" role="alert">Der Beteiligtenbestand konnte nicht geladen werden. Bitte versuchen Sie es erneut.</div>}
                {!directoryLoading && !directoryError && directory?.totalMatches === 0 && !appliedQuery && <div className="state-message">Noch keine Beteiligten vorhanden.</div>}
                {!directoryLoading && !directoryError && directory?.totalMatches === 0 && appliedQuery && <div className="state-message">Keine Beteiligten für den angewendeten Namensfilter.</div>}
                {!directoryLoading && !directoryError && directory && directory.items.length > 0 && (
                  <ul className="party-directory-list">
                    {directory.items.map((item) => (
                      <li key={item.id}>
                        <button type="button" className={party?.value.id === item.id ? 'party-directory-item party-directory-item--selected' : 'party-directory-item'} aria-current={party?.value.id === item.id ? 'true' : undefined} onClick={() => void selectParty(item.id)}>
                          <span><strong>{item.displayName}</strong><small>{item.partyType === 'NaturalPerson' ? 'Natürliche Person' : 'Organisation'}{item.currentPrimaryAddress && ` · ${item.currentPrimaryAddress}`}</small></span>
                          <span aria-hidden="true">Auswählen →</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!directoryLoading && !directoryError && directory && directory.totalMatches > 0 && (
                  <nav className="search-pagination party-directory-pagination" aria-label="Beteiligtenseiten">
                    <label>Einträge pro Seite<select aria-label="Einträge pro Beteiligtenseite" value={pageSize} onChange={(event) => changePageSize(Number(event.target.value))}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
                    <div className="pagination-controls">
                      <button className="pagination-arrow" type="button" aria-label="Vorherige Beteiligtenseite" disabled={directoryLoading || page <= 1} onClick={() => setPage((current) => current - 1)}>←</button>
                      <button className="pagination-arrow" type="button" aria-label="Nächste Beteiligtenseite" disabled={directoryLoading || directory.totalPages === 0 || page >= directory.totalPages} onClick={() => setPage((current) => current + 1)}>→</button>
                    </div>
                    <span className="pagination-summary">Seite {directory.page} von {directory.totalPages}</span>
                  </nav>
                )}
              </section>
            </div>
            {party && <PartyDetails party={party} onChanged={partyChanged} onError={showError} onSuccess={showSuccess} />}
          </section>
          <aside aria-label="Neue beteiligte Identität">
            <PartyCreateForm onCreated={(value) => { partyChanged(value); showSuccess('Beteiligte Identität angelegt.') }} onError={showError} />
          </aside>
        </div>
      </section>
    </div>
  )
}
