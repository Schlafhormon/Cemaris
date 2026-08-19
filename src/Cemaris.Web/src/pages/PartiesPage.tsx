import { useEffect, useRef, useState } from 'react'
import { ApiError, getParty } from '../api/cemarisApi'
import { PartyCreateForm, PartySearchAndDetails } from '../components/PartyManagement'
import type { Party, Versioned } from '../types/personUsageRights'

export function PartiesPage() {
  const [party, setParty] = useState<Versioned<Party> | null>()
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'success' | 'error'>('success')
  const [conflict, setConflict] = useState(false)
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (conflict) messageRef.current?.focus() }, [conflict])

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
            <div className="workspace-card-heading"><div><span className="step-number" aria-hidden="true">1</span><div><h3 id="party-search-heading">Beteiligten suchen und pflegen</h3><p>Identität auswählen und vorhandene Fakten historisiert korrigieren</p></div></div>{party && <span className="status-chip">Ausgewählt</span>}</div>
            <PartySearchAndDetails party={party} onPartyChanged={setParty} onError={showError} onSuccess={showSuccess} />
          </section>
          <aside aria-label="Neue beteiligte Identität">
            <PartyCreateForm onCreated={(value) => { setParty(value); showSuccess('Beteiligte Identität angelegt.') }} onError={showError} />
          </aside>
        </div>
      </section>
    </div>
  )
}
