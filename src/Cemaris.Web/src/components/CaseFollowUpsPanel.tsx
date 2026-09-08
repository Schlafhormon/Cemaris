import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import { ApiError, changeCaseFollowUp, createCaseFollowUp, getCaseFollowUp, getCaseFollowUps } from '../api/cemarisApi'
import type { CaseFollowUp, CaseFollowUpAction, CaseFollowUpInput, CaseFollowUpPage, CaseFollowUpStatus } from '../types/caseFollowUps'
import type { Versioned } from '../types/personUsageRights'
import { FormErrorSummary } from './FormErrorSummary'
import { useFormFeedback } from './useFormFeedback'
import './CaseFollowUpsPanel.css'

const statusLabels: Record<CaseFollowUpStatus, string> = { Open: 'Offen', Completed: 'Erledigt', Cancelled: 'Abgebrochen' }
const operationLabels = { Created: 'Angelegt', Changed: 'Angaben geändert / verschoben', Completed: 'Erledigt', Cancelled: 'Abgebrochen', Reopened: 'Wieder geöffnet' }
const actionLabels: Record<CaseFollowUpAction, string> = { change: 'Änderung speichern', complete: 'Erledigen', cancel: 'Abbrechen', reopen: 'Wieder öffnen' }

// Reine Zeichenzerlegung: auch sehr frühe Kalenderjahre bleiben ohne Zeitzonenverschiebung erhalten.
function calendarDate(value: string) { const [year, month, day] = value.split('-'); return `${day}.${month}.${year}` }
function timestamp(value: string) { return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }

export function CaseFollowUpsPanel({ caseId, canCreate = true }: { caseId?: string; canCreate?: boolean }) {
  const [search, setSearch] = useState(window.location.search)
  const [refresh, setRefresh] = useState(0)
  const [page, setPage] = useState<CaseFollowUpPage>()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const params = new URLSearchParams(search)
  const status = params.get('followUpStatus') ?? 'Open'
  const dueUntil = params.get('followUpDueUntil') ?? ''
  const pageNumber = params.get('followUpPage') ?? '1'
  const pageSize = params.get('followUpPageSize') ?? '10'
  const selectedId = params.get('followUpId') ?? ''
  const selectedCaseId = caseId ?? params.get('followUpCaseId') ?? ''

  useEffect(() => {
    const update = () => setSearch(window.location.search)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setPage(undefined); setError('')
    const query = new URLSearchParams({ status, page: pageNumber, pageSize })
    if (dueUntil) query.set('dueUntil', dueUntil)
    getCaseFollowUps(caseId, query, controller.signal)
      .then(value => { if (!controller.signal.aborted) setPage(value) })
      .catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof ApiError ? e.message : 'Wiedervorlagen konnten nicht geladen werden.') })
    return () => controller.abort()
  }, [caseId, status, dueUntil, pageNumber, pageSize, refresh])

  function navigate(values: Record<string, string | null>) {
    const next = new URLSearchParams(window.location.search)
    for (const [key, value] of Object.entries(values)) { if (value === null) next.delete(key); else next.set(key, value) }
    window.history.pushState(null, '', `${window.location.pathname}?${next}`)
    setSearch(window.location.search)
  }
  function changed(value: Versioned<CaseFollowUp>, created = false) {
    setMessage(created ? 'Wiedervorlage angelegt. Das Anlageformular ist geleert.' : 'Wiedervorlage historisiert gespeichert.')
    setRefresh(n => n + 1)
    if (created) navigate({ followUpId: value.value.state.id, followUpCaseId: value.value.state.caseId })
  }
  function filters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    navigate({ followUpStatus: String(data.get('status')), followUpDueUntil: String(data.get('dueUntil')) || null,
      followUpPageSize: String(data.get('pageSize')), followUpPage: '1', followUpId: null, followUpCaseId: null })
  }

  return <section className="detail-section detail-section--wide follow-up-workspace" aria-label={caseId ? 'Wiedervorlagen dieser Fallakte' : 'Gemeinsame Wiedervorlagen'}>
    <header><h2>{caseId ? 'Wiedervorlagen dieser Fallakte' : 'Arbeitsvorrat'}</h2><p>Manuelles Datum, keine automatische Fristberechnung. Die Bearbeitung verändert keinen Grab- oder Nutzungsrechtsstatus.</p></header>
    {message && <p className="workspace-message" role="status">{message}</p>}
    <form key={`${status}-${dueUntil}-${pageSize}`} className="follow-up-filters" onSubmit={filters} aria-label="Wiedervorlagen filtern">
      <label>Status<select name="status" defaultValue={status}><option value="Open">Offen</option><option value="Completed">Erledigt</option><option value="Cancelled">Abgebrochen</option><option value="All">Alle Zustände</option></select></label>
      <label>Fällig bis<input name="dueUntil" type="date" min="0001-01-01" max="9999-12-31" defaultValue={dueUntil} /></label>
      <label>Einträge pro Seite<select name="pageSize" defaultValue={pageSize}><option>10</option><option>25</option><option>50</option></select></label>
      <button type="submit" className="button">Filter anwenden</button>
    </form>
    {error ? <div role="alert" className="workspace-message workspace-message--error">{error}<button type="button" className="button" onClick={() => setRefresh(n => n + 1)}>Liste erneut laden</button></div>
      : !page ? <p role="status">Wiedervorlagen werden geladen …</p>
        : <><p>{page.totalMatches} Wiedervorlagen · Seite {page.page} von {page.totalPages || 1}</p>
          {page.items.length === 0 ? <p>Keine Wiedervorlagen auf dieser Seite.</p> : <ul className="follow-up-list">{page.items.map(item => {
            const returnTo = `${window.location.pathname}${search}`
            const caseQuery = new URLSearchParams({ returnTo, followUpId: item.id, followUpStatus: status })
            const grave = [item.grave.cemetery?.trim() || 'Friedhof nicht angegeben', item.grave.field?.trim() || 'Feld nicht angegeben', item.grave.graveNumber?.trim() || 'Grabnummer nicht angegeben'].join(' / ')
            return <li key={item.id}><div><strong>{item.title}</strong><span><time dateTime={item.dueDate}>{calendarDate(item.dueDate)}</time> · {statusLabels[item.status]}</span><a href={`/cases/${encodeURIComponent(item.caseId)}?${caseQuery}`}>{grave}<small>Fall {item.caseId}</small></a></div><button className="button" type="button" aria-label={`${item.title} öffnen`} onClick={() => navigate({ followUpId: item.id, followUpCaseId: item.caseId })}>Öffnen</button></li>
          })}</ul>}
          <nav className="follow-up-pagination" aria-label="Wiedervorlagenseiten"><button className="button" type="button" disabled={page.page <= 1} onClick={() => navigate({ followUpPage: String(page.page - 1), followUpId: null, followUpCaseId: null })}>Vorherige Seite</button><button className="button" type="button" disabled={page.page >= page.totalPages} onClick={() => navigate({ followUpPage: String(page.page + 1), followUpId: null, followUpCaseId: null })}>Nächste Seite</button></nav></>}
    {selectedId && selectedCaseId && <FollowUpDetails key={`${selectedCaseId}-${selectedId}`} caseId={selectedCaseId} id={selectedId} onChanged={changed} onReload={() => setRefresh(n => n + 1)} />}
    {caseId && canCreate && <section className="workspace-card"><h3>Wiedervorlage anlegen</h3><p>Fest zu dieser Fallakte gehörend.</p><FollowUpForm key={caseId} caseId={caseId} onChanged={value => changed(value, true)} /></section>}
  </section>
}

function FollowUpDetails({ caseId, id, onChanged, onReload }: { caseId: string; id: string; onChanged: (value: Versioned<CaseFollowUp>) => void; onReload: () => void }) {
  const [value, setValue] = useState<Versioned<CaseFollowUp> | null>()
  const [reload, setReload] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const reloaded = useEffectEvent(onReload)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    getCaseFollowUp(caseId, id, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setValue(result); if (reload > 0) reloaded() } })
      .catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof ApiError ? e.message : 'Die Wiedervorlage konnte nicht geladen werden.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [caseId, id, reload])
  const state = value?.value.state
  return <section className="workspace-card" aria-label="Geöffnete Wiedervorlage">
    <h3>{state?.title ?? 'Wiedervorlage öffnen'}</h3>
    {loading && <p role="status">Wiedervorlage wird geladen …</p>}
    {error && <p role="alert">{error}</p>}
    <button className="button" type="button" disabled={loading} onClick={() => setReload(n => n + 1)}>Aktuellen Stand laden</button>
    <p>Neuladen aktualisiert den gespeicherten Stand und die Version. Ungespeicherte Eingaben bleiben erhalten; prüfen Sie diese vor erneutem Speichern.</p>
    {value && state && <>
      <dl className="detail-list"><div><dt>Status</dt><dd>{statusLabels[state.status]} · Version {state.version}</dd></div><div><dt>Manuelles Datum</dt><dd>{calendarDate(state.dueDate)}</dd></div><div><dt>Beschreibung</dt><dd className="follow-up-text">{state.description ?? 'Nicht angegeben'}</dd></div><div><dt>Zuletzt bearbeitet</dt><dd>{timestamp(state.updatedAtUtc)} · {value.value.revisions.at(-1)?.actorDisplayName}</dd></div></dl>
      <FollowUpForm caseId={caseId} current={value} loading={loading || Boolean(error)} onChanged={next => { setValue(next); onChanged(next) }} />
      <details className="history-disclosure"><summary>Fachhistorie ({value.value.revisions.length})</summary><ol className="revision-list">{value.value.revisions.map(revision => <li key={revision.id}><strong>Version {revision.state.version} · {operationLabels[revision.operation]} · {statusLabels[revision.state.status]}</strong><span>{revision.actorDisplayName} · {timestamp(revision.occurredAtUtc)}</span><span className="follow-up-text">Begründung: {revision.reason ?? 'Erstanlage'}</span><span>{revision.state.title} · {calendarDate(revision.state.dueDate)}</span><span className="follow-up-text">{revision.state.description ?? 'Keine Beschreibung'}</span></li>)}</ol></details>
    </>}
  </section>
}

function FollowUpForm({ caseId, current, loading = false, onChanged }: { caseId: string; current?: Versioned<CaseFollowUp>; loading?: boolean; onChanged: (value: Versioned<CaseFollowUp>) => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const alive = useRef(true)
  const [working, setWorking] = useState(false)
  const [conflict, setConflict] = useState('')
  const feedback = useFormFeedback(formRef, { title: 'title', description: 'description', dueDate: 'dueDate', reason: 'reason' }, () => setConflict('Die Wiedervorlage wurde zwischenzeitlich geändert. Ihre Eingaben bleiben erhalten. Laden Sie bewusst den aktuellen Stand.'))
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (working || loading) return
    const form = event.currentTarget
    const data = new FormData(form)
    const action = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value as CaseFollowUpAction || 'change'
    const input: CaseFollowUpInput & { reason: string } = { title: String(data.get('title') ?? ''), description: String(data.get('description') ?? ''), dueDate: String(data.get('dueDate') ?? ''), reason: String(data.get('reason') ?? '') }
    feedback.clear(); setConflict(''); setWorking(true)
    try {
      const next = current ? await changeCaseFollowUp(caseId, current.value.state.id, current.etag, action, input) : await createCaseFollowUp(caseId, input)
      if (!alive.current) return
      onChanged(next)
      if (!current) form.reset()
      else { const reason = form.elements.namedItem('reason'); if (reason instanceof HTMLTextAreaElement) reason.value = '' }
    } catch (e) { if (alive.current) feedback.report(e) }
    finally { if (alive.current) setWorking(false) }
  }
  const open = !current || current.value.state.status === 'Open'
  return <form ref={formRef} className="compact-form compact-form--inset" aria-label={current ? 'Wiedervorlage bearbeiten' : 'Wiedervorlage anlegen'} onSubmit={event => void submit(event)}>
    <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
    {conflict && <p role="alert">{conflict}</p>}
    <fieldset disabled={working || loading}><legend>{current ? 'Begründete Bearbeitung' : 'Manuelle Angaben'}</legend>
      <div className="compact-form-grid">
        <label className="field--wide">Titel<input name="title" required={open} disabled={!open} maxLength={200} defaultValue={current?.value.state.title} {...feedback.fieldProps('title')} />{feedback.fieldErrors('title')}</label>
        <label>Wiedervorlagedatum<input name="dueDate" type="date" min="0001-01-01" max="9999-12-31" required={open} disabled={!open} defaultValue={current?.value.state.dueDate} {...feedback.fieldProps('dueDate')} />{feedback.fieldErrors('dueDate')}</label>
        <label className="field--wide">Beschreibung (optional)<textarea name="description" disabled={!open} maxLength={2000} defaultValue={current?.value.state.description ?? ''} {...feedback.fieldProps('description')} />{feedback.fieldErrors('description')}</label>
        {current && <label className="field--wide">Begründung<textarea name="reason" required maxLength={1000} {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label>}
      </div>
      <div className="follow-up-actions">{!current ? <button className="button button--primary" type="submit">Wiedervorlage anlegen</button>
        : (open ? ['change', 'complete', 'cancel'] as const : ['reopen'] as const).map(action => <button key={action} className="button" type="submit" value={action}>{actionLabels[action]}</button>)}</div>
    </fieldset>
    {working && <p role="status">Wiedervorlage wird gespeichert …</p>}
  </form>
}
