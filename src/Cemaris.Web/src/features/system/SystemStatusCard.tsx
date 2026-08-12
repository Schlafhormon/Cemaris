import { StatusIndicator } from '../../components/StatusIndicator'
import { useSystemStatus } from '../../hooks/useSystemStatus'

export function SystemStatusCard() {
  const { connection, health, information, retry } = useSystemStatus()

  const summary =
    connection === 'online'
      ? 'Frontend und API kommunizieren erfolgreich.'
      : connection === 'loading'
        ? 'Die Verbindung zur lokalen API wird geprüft.'
        : 'Die API ist derzeit nicht erreichbar. Das Frontend bleibt nutzbar.'

  return (
    <aside className="status-card" aria-labelledby="system-status-heading">
      <div className="status-card-header">
        <p className="status-card-label">Technischer Status</p>
        <StatusIndicator state={connection} />
      </div>

      <h2 id="system-status-heading">Systemverbindung</h2>
      <p className="status-summary">{summary}</p>

      <dl className="status-details">
        <div>
          <dt>API</dt>
          <dd>{health?.service ?? 'Cemaris.Api'}</dd>
        </div>
        <div>
          <dt>Projektphase</dt>
          <dd>{information?.status ?? 'Produktentwicklung'}</dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{information?.version ?? '–'}</dd>
        </div>
      </dl>

      {connection === 'offline' && (
        <button className="retry-button" type="button" onClick={retry}>
          Verbindung erneut prüfen
        </button>
      )}
    </aside>
  )
}
