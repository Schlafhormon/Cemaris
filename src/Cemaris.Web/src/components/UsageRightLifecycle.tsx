import { rightStatusLabel } from './rightStatusLabel'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { changeUsageRightLifecycle, getUsageRightHistory, getUsageRightSequence } from '../api/cemarisApi'
import type { UsageRight, UsageRightListItem, UsageRightPage, Versioned } from '../types/personUsageRights'
import { FormErrorSummary } from './FormErrorSummary'
import { useFormFeedback } from './useFormFeedback'

export function UsageRightHistory({ graveSiteId, refresh, selectedId, onSelect }: {
  graveSiteId: string; refresh: number; selectedId?: string; onSelect: (id: string) => void
}) {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<UsageRightPage>()
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setResult(undefined)
    setError('')
    getUsageRightHistory(graveSiteId, page, controller.signal).then((value) => { if (!controller.signal.aborted) setResult(value) })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Rechteverlauf konnte nicht geladen werden.') })
    return () => controller.abort()
  }, [graveSiteId, page, refresh, retry])
  return <section className="workspace-card" aria-label="Rechteverlauf">
    <h3>Rechteverlauf der Grabstelle</h3>
    {error ? <p role="alert">{error} <button type="button" className="button" onClick={() => setRetry((v) => v + 1)}>Verlauf erneut laden</button></p>
      : !result ? <p role="status">Rechteverlauf wird geladen …</p> : <>
        <p>{result.totalMatches} Rechte · Seite {result.page} von {Math.max(1, result.totalPages)}</p>
        {result.items.length === 0 && <p>Auf dieser Seite sind keine Rechte vorhanden.</p>}
        <ol>{result.items.map((item) => <li key={item.id}><button type="button" className="button" aria-pressed={selectedId === item.id} onClick={() => onSelect(item.id)}>
          {item.startDate} – {item.endDate} · {rightStatusLabel(item.status)} · {item.id}
        </button></li>)}</ol>
        <div className="form-submit-row"><button type="button" className="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Vorherige Rechteseite</button>
          <button type="button" className="button" disabled={page >= result.totalPages} onClick={() => setPage(page + 1)}>Nächste Rechteseite</button></div>
      </>}
  </section>
}

export function UsageRightLifecycleForms({ right, partyId, onChanged, onError }: {
  right: Versioned<UsageRight>; partyId?: string; onChanged: (value: Versioned<UsageRight>) => void; onError: (error: unknown) => void
}) {
  const ended = right.value.status === 'Ended'
  const [action, setAction] = useState('terminations')
  const [pending, setPending] = useState(false)
  const [sequence, setSequence] = useState<UsageRightListItem[]>()
  const [previewError, setPreviewError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const alive = useRef(true)
  const previewRequest = useRef<AbortController | null>(null)
  const effectiveAction = ended ? (action === 'terminations' ? 'termination-reversals' : action) : 'terminations'
  const feedback = useFormFeedback(formRef, { terminationDate: 'terminationDate', sourceReference: 'sourceReference', reason: 'reason', startDate: 'startDate', endDate: 'endDate', manualReviewConfirmed: 'manualReviewConfirmed', confirmSequenceCorrection: 'confirmSequenceCorrection', members: null }, onError)
  useEffect(() => {
    alive.current = true
    setSequence(undefined)
    const checkbox = formRef.current?.elements.namedItem('confirmSequenceCorrection')
    if (checkbox instanceof HTMLInputElement) checkbox.checked = false
    return () => { alive.current = false; previewRequest.current?.abort() }
  }, [right.etag])

  async function preview() {
    previewRequest.current?.abort()
    const controller = new AbortController()
    previewRequest.current = controller
    setSequence(undefined)
    setPreviewError('')
    try {
      const rows = await getUsageRightSequence(right.value.id, controller.signal)
      if (!controller.signal.aborted) setSequence(rows)
    } catch (error) { if (!controller.signal.aborted) setPreviewError(error instanceof Error ? error.message : 'Folge konnte nicht geladen werden.') }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    const data = new FormData(form)
    const input = { reason: data.get('reason'), terminationDate: data.get('terminationDate'), kind: data.get('kind'),
      sourceReference: data.get('sourceReference'), startDate: data.get('startDate'), endDate: data.get('endDate'), holderPartyId: partyId,
      manualReviewConfirmed: data.get('manualReviewConfirmed') === 'on', confirmSequenceCorrection: data.get('confirmSequenceCorrection') === 'on',
      members: sequence?.map((item) => ({ id: item.id, version: item.version })) }
    setPending(true)
    feedback.clear()
    try {
      const saved = await changeUsageRightLifecycle(right.value.id, right.etag, effectiveAction, input)
      if (alive.current) {
        form.reset()
        setSequence(undefined)
      }
      onChanged(saved)
    } catch (error) { if (alive.current) { setSequence(undefined); feedback.report(error) } }
    finally { if (alive.current) setPending(false) }
  }

  return <details className="action-disclosure"><summary>Manueller Nutzungsrechtslebenszyklus</summary>
    <form ref={formRef} className="compact-form compact-form--inset" onSubmit={(event) => void submit(event)}>
      <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
      <fieldset disabled={pending} className="compact-form-grid">
        <legend>{ended ? 'Beendigung bearbeiten' : 'Beendigung dokumentieren'}</legend>
        {ended && <label>Vorgang<select value={effectiveAction} onChange={(event) => { setAction(event.target.value); setSequence(undefined) }}>
          <option value="termination-reversals">Beendigung zurücknehmen</option><option value="successors">Manuell neu vergeben</option><option value="sequence-corrections">Rechtefolge gemeinsam korrigieren</option>
        </select></label>}
        {!ended && <><label>Art<select name="kind"><option value="Returned">Rückgabe</option><option value="Other">Sonstige Beendigung</option></select></label>
          <label>Beendet ab (UTC-Kalendertag)<input name="terminationDate" type="date" required max={new Date().toISOString().slice(0, 10)} {...feedback.fieldProps('terminationDate')} />{feedback.fieldErrors('terminationDate')}</label></>}
        {effectiveAction === 'successors' && <><p>Neuer Inhaber: {partyId ?? 'Bitte unten einen Beteiligten auswählen.'}</p>
          <label>Neuer Beginn<input name="startDate" type="date" required min={right.value.termination?.terminationDate} {...feedback.fieldProps('startDate')} />{feedback.fieldErrors('startDate')}</label>
          <label>Neues Laufzeitende<input name="endDate" type="date" required {...feedback.fieldProps('endDate')} />{feedback.fieldErrors('endDate')}</label></>}
        {(!ended || effectiveAction === 'successors') && <><label>Quellenreferenz<input name="sourceReference" required maxLength={250} {...feedback.fieldProps('sourceReference')} />{feedback.fieldErrors('sourceReference')}</label>
          <label><input type="checkbox" name="manualReviewConfirmed" required {...feedback.fieldProps('manualReviewConfirmed')} /> Voraussetzungen manuell geprüft. Keine automatische Ruhezeit- oder Zulässigkeitsprüfung.</label></>}
        <label>Begründung<textarea name="reason" required maxLength={1000} {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label>
        {effectiveAction === 'sequence-corrections' && <div className="field--wide">
          <button className="button" type="button" onClick={() => void preview()}>Betroffene Rechte laden</button>
          {previewError && <p role="alert">{previewError}</p>}
          {sequence && <><ol>{sequence.map((item, index) => <li key={item.id}><code>{item.id}</code> · {rightStatusLabel(item.status)} · Version {item.version} → {index === 0 ? 'wieder offen' : 'Irrtümlich angelegt'}</li>)}</ol>
            <label><input key={JSON.stringify(sequence)} type="checkbox" name="confirmSequenceCorrection" required /> Ich bestätige die gemeinsame Korrektur aller angezeigten Rechte und die Historisierung der Nachfolger als irrtümlich angelegt.</label></>}
        </div>}
        <button className="button button--primary" type="submit" disabled={effectiveAction === 'successors' && !partyId || effectiveAction === 'sequence-corrections' && !sequence}>
          {pending ? 'Wird gespeichert …' : effectiveAction === 'terminations' ? 'Beendigung dokumentieren' : effectiveAction === 'successors' ? 'Neues Recht vergeben' : effectiveAction === 'sequence-corrections' ? 'Rechtefolge gemeinsam korrigieren' : 'Beendigung zurücknehmen'}
        </button>
      </fieldset>
    </form>
  </details>
}
