import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ApiError,
  createNoticeNumberConfiguration,
  getNoticeNumberConfiguration,
  updateNoticeNumberConfiguration,
} from '../api/cemarisApi'
import type { NoticeNumberConfiguration } from '../types/noticeDrafts'
import type { Versioned } from '../types/personUsageRights'

export function NoticeNumberConfigurationPage() {
  const [configuration, setConfiguration] = useState<Versioned<NoticeNumberConfiguration> | null>()
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [conflict, setConflict] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    getNoticeNumberConfiguration(controller.signal)
      .then(setConfiguration)
      .catch((reason: unknown) => showError(reason))
    return () => controller.abort()
  }, [])

  function showError(reason: unknown) {
    const versionConflict = reason instanceof ApiError && reason.status === 412
    setError(true)
    setConflict(versionConflict)
    setMessage(versionConflict
      ? 'Die Nummernkonfiguration wurde zwischenzeitlich geändert. Laden Sie den aktuellen Stand; Ihre Eingaben bleiben erhalten.'
      : reason instanceof Error ? reason.message : 'Die Nummernkonfiguration konnte nicht verarbeitet werden.')
  }

  function showSuccess(value: string) {
    setError(false)
    setConflict(false)
    setMessage(value)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input = {
      financialProduct: data.get('financialProduct'),
      runningNumberWidth: Number(data.get('runningNumberWidth')),
      ...(configuration ? { reason: data.get('reason') } : {}),
    }
    try {
      const saved = configuration
        ? await updateNoticeNumberConfiguration(configuration.value.id, configuration.etag, input)
        : await createNoticeNumberConfiguration(input)
      setConfiguration(saved)
      showSuccess(configuration ? 'Nummernkonfiguration prospektiv und historisiert geändert.' : 'Nummernkonfiguration angelegt.')
      const reason = formRef.current?.querySelector<HTMLInputElement>('[name="reason"]')
      if (reason) reason.value = ''
    } catch (reason) {
      showError(reason)
    }
  }

  async function reload() {
    try {
      setConfiguration(await getNoticeNumberConfiguration())
      showSuccess('Aktueller Konfigurationsstand geladen. Nicht gespeicherte Eingaben bleiben erhalten.')
    } catch (reason) {
      showError(reason)
    }
  }

  return <div className="work-page configuration-page">
    <div className="work-page-heading"><div><p className="eyebrow">Administrative Programmkonfiguration</p><h1>Bescheidnummern</h1><p>Installationweite, versionierte Nummernfakten für neue manuelle Bescheidentwürfe. Änderungen wirken ausschließlich prospektiv.</p></div><div className="configuration-badge" role="note"><strong>Administration</strong><span>Keine Festsetzung oder Bescheiderzeugung</span></div></div>
    <div className="projection-boundary-note" role="note"><strong>Rechtlich wirkungsloser Entwurfskern:</strong> Das Finanzprodukt und die Stellenzahl bilden nur die kanonische Arbeitsnummer <code>Finanzprodukt.JJJJlaufendeNummer</code>. Bestehende Entwürfe behalten ihren Snapshot.</div>
    {message && <div className={`workspace-message configuration-message${error ? ' workspace-message--error' : ''}`} role={error ? 'alert' : 'status'}><span>{message}</span>{conflict && <button className="button" type="button" onClick={() => void reload()}>Aktuellen Stand laden</button>}</div>}
    {configuration === undefined
      ? <div className="state-message detail-state">Nummernkonfiguration wird geladen …</div>
      : <div className="configuration-layout notice-number-configuration">
          <section className="configuration-section" aria-labelledby="notice-number-current-heading">
            <header><div><p className="section-kicker">Aktueller Stand</p><h2 id="notice-number-current-heading">Nummernformat</h2></div>{configuration && <span className="status-chip status-chip--active">Version {configuration.value.version}</span>}</header>
            <form ref={formRef} className="configuration-rule-card compact-form" onSubmit={(event) => void save(event)}>
              <div className="compact-form-grid">
                <label>Finanzprodukt<input name="financialProduct" maxLength={50} defaultValue={configuration?.value.financialProduct} required /></label>
                <label>Stellenzahl der laufenden Nummer<input name="runningNumberWidth" type="number" min="1" max="9" defaultValue={configuration?.value.runningNumberWidth ?? 6} required /></label>
                {configuration && <label className="field--wide">Begründung der Änderung<input name="reason" maxLength={1000} required /></label>}
              </div>
              <p className="selection-notice">Beispiel für das aktuelle Jahr: <strong>{configuration?.value.financialProduct ?? 'FINANZPRODUKT'}.{new Date().getUTCFullYear()}{'1'.padStart(configuration?.value.runningNumberWidth ?? 6, '0')}</strong></p>
              <button className="button button--primary" type="submit">{configuration ? 'Prospektiv versioniert ändern' : 'Nummernkonfiguration anlegen'}</button>
            </form>
            {!configuration && <div className="workspace-empty"><strong>Konfiguration fehlt</strong><span>Bis zur erstmaligen Anlage können keine manuellen Bescheidentwürfe angelegt werden.</span></div>}
          </section>
          <aside className="configuration-create" aria-labelledby="notice-number-history-heading"><div className="sidebar-heading"><p className="section-kicker">Geschützte Historie</p><h2 id="notice-number-history-heading">Revisionen</h2><p>Frühere Konfigurationen bleiben vollständig nachvollziehbar.</p></div>{configuration ? <ol className="revision-list">{configuration.value.revisions.map((revision) => <li key={revision.id}><strong>Version {revision.resultingVersion} · {revision.financialProduct}</strong><span>Breite {revision.runningNumberWidth} · {revision.reason ?? 'Anlage'}</span><small>{revision.actorDisplayName} · {new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(revision.occurredAtUtc))}</small></li>)}</ol> : <p className="workspace-empty">Noch keine Revision vorhanden.</p>}</aside>
        </div>}
  </div>
}
