import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, createUsageRightStartRule, getCemeteryMasterData, getUsageRightStartRules, updateUsageRightStartRule } from '../api/cemarisApi'
import type { CemeteryMasterData } from '../types/cemeteries'
import type { StartRule } from '../types/personUsageRights'

export function UsageRightStartRulesPage() {
  const [rules, setRules] = useState<StartRule[]>([])
  const [master, setMaster] = useState<CemeteryMasterData>()
  const [message, setMessage] = useState('')
  const load = () => { const controller = new AbortController(); Promise.all([getUsageRightStartRules(controller.signal), getCemeteryMasterData(controller.signal, true)]).then(([nextRules, nextMaster]) => { setRules(nextRules); setMaster(nextMaster) }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Konfiguration konnte nicht geladen werden.')); return controller }
  useEffect(() => { const controller = load(); return () => controller.abort() }, [])

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    try { const created = await createUsageRightStartRule({ cemeteryId: data.get('cemeteryId'), code: data.get('code'), displayName: data.get('displayName') }); setRules((current) => [...current, created.value]); setMessage('Startbezug angelegt.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Anlage fehlgeschlagen.') }
  }

  async function update(event: FormEvent<HTMLFormElement>, rule: StartRule) {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    try { const changed = await updateUsageRightStartRule(rule.id, `"${rule.version}"`, { cemeteryId: rule.cemeteryId, code: data.get('code'), displayName: data.get('displayName'), reason: data.get('reason') }); setRules((current) => current.map((item) => item.id === rule.id ? changed.value : item)); setMessage('Startbezug historisiert geändert.') }
    catch (error) { setMessage(error instanceof ApiError && error.status === 412 ? 'Zwischenzeitliche Änderung erkannt. Bitte Seite neu laden.' : error instanceof Error ? error.message : 'Änderung fehlgeschlagen.') }
  }

  const configured = new Set(rules.map((rule) => rule.cemeteryId))
  return <div className="work-page configuration-page">
    <div className="work-page-heading"><div><p className="eyebrow">Administrative Programmkonfiguration</p><h1>Startbezug für Nutzungsrechte</h1><p>Versionierte Bezeichnung des manuellen Nachweises je Friedhof. Es werden weder Datum noch Laufzeit oder Status berechnet.</p></div><div className="configuration-badge" role="note"><strong>Administration</strong><span>Änderungen werden historisiert</span></div></div>
    {message && <div className="workspace-message configuration-message" role="status">{message}</div>}
    <div className="configuration-layout">
      <section className="configuration-section" aria-labelledby="configured-rules-heading">
        <header><div><p className="section-kicker">Aktuelle Konfiguration</p><h2 id="configured-rules-heading">Regeln je Friedhof</h2></div><span className="count-badge">{rules.length}</span></header>
        {rules.length === 0 && <div className="workspace-empty"><strong>Noch keine Startregel vorhanden</strong><span>Legen Sie rechts die erste Regel für einen Friedhof an.</span></div>}
        <div className="configuration-rule-list">{rules.map((rule) => <form className="configuration-rule-card compact-form" key={rule.id} onSubmit={(event) => void update(event, rule)}><header><div><span className="configuration-icon" aria-hidden="true">§</span><div><h3>{master?.cemeteries.find((x) => x.id === rule.cemeteryId)?.name ?? rule.cemeteryId}</h3><p>Version {rule.version}</p></div></div><span className="status-chip status-chip--active">Aktiv</span></header><div className="compact-form-grid"><label>Stabiler Code<input name="code" defaultValue={rule.code} required /></label><label>Anzeige<input name="displayName" defaultValue={rule.displayName} required /></label><label className="field--wide">Begründung der Änderung<input name="reason" required /></label></div><div className="configuration-card-actions"><details className="history-disclosure"><summary>Revisionen <span>{rule.revisions.length}</span></summary><ol className="revision-list">{rule.revisions.map((revision) => <li key={revision.id}><strong>Version {revision.resultingVersion} · {revision.code}</strong><span>{revision.displayName} · {revision.reason ?? 'Anlage'}</span></li>)}</ol></details><button className="button button--primary" type="submit">Versioniert ändern</button></div></form>)}</div>
      </section>
      <aside className="configuration-create" aria-labelledby="create-rule-heading"><div className="sidebar-heading"><p className="section-kicker">Neue Zuordnung</p><h2 id="create-rule-heading">Startbezug anlegen</h2><p>Pro Friedhof kann genau eine aktuelle Regel bestehen.</p></div><form className="compact-form" onSubmit={(event) => void create(event)}><div className="compact-form-grid"><label className="field--wide">Friedhof<select name="cemeteryId" required defaultValue=""><option value="" disabled>Friedhof auswählen</option>{master?.cemeteries.filter((item) => !configured.has(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Stabiler Code<input name="code" required /></label><label>Anzeige<input name="displayName" required /></label></div><button className="button button--primary button--full" type="submit">Startbezug anlegen</button></form></aside>
    </div>
  </div>
}
