import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, createLegalBasisVersion, getLegalBasisVersions, setLegalBasisVersionActive } from '../api/cemarisApi'
import type { LegalBasisVersion } from '../types/noticeDrafts'

export function LegalBasisVersionsPage() {
  const [items, setItems] = useState<LegalBasisVersion[]>([])
  const [name, setName] = useState('')
  const [versionDate, setVersionDate] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getLegalBasisVersions(false, controller.signal).then(setItems).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Satzungsversionen konnten nicht geladen werden.'))
    return () => controller.abort()
  }, [])

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('')
    try {
      const result = await createLegalBasisVersion({ name, versionDate })
      setItems(current => [...current, result.value].sort(compare)); setName(''); setVersionDate('')
      setMessage('Neue unveränderliche Satzungsversion wurde inaktiv angelegt.')
    } catch (error) { setMessage(errorMessage(error)) }
  }

  async function toggle(item: LegalBasisVersion) {
    setMessage('')
    try {
      const result = await setLegalBasisVersionActive(item, !item.isActive)
      setItems(current => current.map(value => value.id === item.id ? result.value : value).sort(compare))
      setMessage(result.value.isActive ? 'Satzungsversion aktiviert.' : 'Satzungsversion deaktiviert.')
    } catch (error) { setMessage(errorMessage(error)) }
  }

  return <div className="work-page form-page">
    <div className="work-page-heading"><div><p className="eyebrow">Nur Administration</p><h1>Satzungsversionen</h1><p>Name und Fassungsstand einer angelegten Version sind unveränderlich. Eine Aktivierung bedeutet keine rechtliche Freigabe.</p></div></div>
    <form className="editor-card creation-card" onSubmit={(event) => void create(event)}>
      <header className="card-heading"><span className="card-heading-icon" aria-hidden="true">＋</span><div><h2>Version anlegen</h2><p>Neue manuell auswählbare Stammdatenversion</p></div></header>
      <div className="editor-grid"><label>Satzungsname<input required maxLength={300} value={name} onChange={event => setName(event.target.value)} /></label><label>Fassungsstand<input type="date" required value={versionDate} onChange={event => setVersionDate(event.target.value)} /></label></div>
      <button className="button button--primary" type="submit">Inaktive Version anlegen</button>
    </form>
    {message && <p className="form-message" role="status">{message}</p>}
    <div className="account-list">{items.map(item => <article className="editor-card account-card" key={item.id}><header><div><h2>{item.name}</h2><p>Fassungsstand {formatDate(item.versionDate)} · Version {item.version}</p><p className="technical-id">{item.id}</p></div><span className={item.isActive ? 'account-status account-status--active' : 'account-status'}>{item.isActive ? 'Aktiv' : 'Inaktiv'}</span></header><button className="button" type="button" onClick={() => void toggle(item)}>{item.isActive ? 'Deaktivieren' : 'Aktivieren'}</button></article>)}</div>
  </div>
}

function compare(left: LegalBasisVersion, right: LegalBasisVersion) { return left.name.localeCompare(right.name, 'de') || right.versionDate.localeCompare(left.versionDate) }
function formatDate(value: string) { return new Intl.DateTimeFormat('de-DE').format(new Date(`${value}T00:00:00`)) }
function errorMessage(error: unknown) { return error instanceof ApiError || error instanceof Error ? error.message : 'Die Satzungsversion konnte nicht verarbeitet werden.' }
