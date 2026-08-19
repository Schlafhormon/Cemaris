import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ApiError,
  correctUsageRight,
  createUsageRight,
  extendUsageRight,
  getParty,
  getUsageRightByGraveSite,
  transferUsageRight,
} from '../api/cemarisApi'
import type { Party, UsageRight, Versioned } from '../types/personUsageRights'
import { FormErrorSummary } from './FormErrorSummary'
import { partyDisplayName } from './partyDisplayName'
import { PartyCreateForm, PartySearchAndDetails } from './PartyManagement'
import { useFormFeedback } from './useFormFeedback'

type ConflictTarget = 'party' | 'right' | null

export function PersonUsageRightsPanel({ graveSiteId }: { graveSiteId: string }) {
  const [right, setRight] = useState<Versioned<UsageRight> | null>()
  const [party, setParty] = useState<Versioned<Party> | null>()
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success')
  const [conflictTarget, setConflictTarget] = useState<ConflictTarget>(null)
  const alertRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getUsageRightByGraveSite(graveSiteId).then(setRight).catch((error: unknown) => handleError(error, 'right'))
  }, [graveSiteId])
  useEffect(() => { if (conflictTarget) alertRef.current?.focus() }, [conflictTarget])

  function handleError(error: unknown, target: Exclude<ConflictTarget, null>) {
    setMessageTone('error')
    if (error instanceof ApiError && error.status === 412) {
      setConflictTarget(target)
      setMessage(target === 'party'
        ? 'Die beteiligte Identität wurde zwischenzeitlich geändert. Bitte den aktuellen Beteiligtenstand neu laden; Ihre Eingaben bleiben erhalten.'
        : 'Das Nutzungsrecht wurde zwischenzeitlich geändert. Bitte den aktuellen Rechtstand neu laden; Ihre Eingaben bleiben erhalten.')
    } else {
      setConflictTarget(null)
      setMessage(error instanceof Error ? error.message : 'Die Aktion konnte nicht ausgeführt werden.')
    }
  }

  function showSuccess(value: string) {
    setMessage(value)
    setMessageTone('success')
    setConflictTarget(null)
  }

  async function reloadConflict() {
    try {
      if (conflictTarget === 'party' && party) {
        const currentParty = await getParty(party.value.id)
        if (currentParty) setParty(currentParty)
        showSuccess('Aktueller Beteiligtenstand geladen. Nicht gespeicherte Formulareingaben bleiben erhalten.')
      } else if (conflictTarget === 'right') {
        setRight(await getUsageRightByGraveSite(graveSiteId))
        showSuccess('Aktueller Nutzungsrechtstand geladen. Nicht gespeicherte Formulareingaben bleiben erhalten.')
      }
    } catch (error) {
      handleError(error, conflictTarget ?? 'right')
    }
  }

  return (
    <section className="detail-section detail-section--wide usage-right-workspace" aria-labelledby="canonical-right-heading">
      <header className="usage-right-header">
        <div>
          <p className="section-kicker">Beteiligte und Nutzungsrecht</p>
          <h2 id="canonical-right-heading">Kanonisches Nutzungsrecht</h2>
          <p>Manuell erfasster, historisierter 5b-Kern. Es werden keine Laufzeit, kein Status und keine Wiedervorlage berechnet.</p>
        </div>
        <span className="scope-badge">Manueller Nachweis</span>
      </header>

      {message && (
        <div ref={alertRef} tabIndex={-1} className={`workspace-message${messageTone === 'error' ? ' workspace-message--error' : ''}`} role={messageTone === 'error' ? 'alert' : 'status'}>
          <span>{message}</span>
          {conflictTarget && <button className="button" type="button" onClick={() => void reloadConflict()}>Aktuellen Stand neu laden</button>}
        </div>
      )}

      <div className="usage-right-layout">
        <div className="usage-right-main">
          <section className="workspace-card" aria-labelledby="right-status-heading">
            <div className="workspace-card-heading">
              <div><span className="step-number" aria-hidden="true">1</span><div><h3 id="right-status-heading">Nutzungsrecht</h3><p>Aktueller manueller Stand und unveränderliche Fachhistorie</p></div></div>
              {right && <span className="status-chip status-chip--active">Offen · Version {right.value.version}</span>}
            </div>
            {right === undefined
              ? <p className="workspace-empty" role="status">Recht wird geladen …</p>
              : right
                ? <RightDetails right={right} party={party} onChanged={(value) => { setRight(value); showSuccess('Änderung gespeichert.') }} onError={(error) => handleError(error, 'right')} />
                : <div className="workspace-empty"><strong>Noch kein Nutzungsrecht erfasst</strong><span>Wählen oder erfassen Sie zuerst einen Beteiligten. Anschließend kann das Recht angelegt werden.</span></div>}
          </section>

          <section className="workspace-card" aria-labelledby="party-selection-heading">
            <div className="workspace-card-heading">
              <div><span className="step-number" aria-hidden="true">2</span><div><h3 id="party-selection-heading">Beteiligten auswählen</h3><p>Fallübergreifende Identität suchen oder neu erfassen</p></div></div>
              {party && <span className="status-chip">Ausgewählt</span>}
            </div>
            <PartySearchAndDetails party={party} onPartyChanged={setParty} onError={(error) => handleError(error, 'party')} onSuccess={showSuccess} />
          </section>

          {!right && party && (
            <section className="workspace-card workspace-card--accent" aria-labelledby="right-create-heading">
              <div className="workspace-card-heading"><div><span className="step-number" aria-hidden="true">3</span><div><h3 id="right-create-heading">Nutzungsrecht anlegen</h3><p>Manuellen Zeitraum und Quelle verbindlich erfassen</p></div></div></div>
              <RightCreateForm graveSiteId={graveSiteId} partyId={party.value.id} onCreated={(value) => { setRight(value); showSuccess('Nutzungsrecht angelegt.') }} onError={(error) => handleError(error, 'right')} />
            </section>
          )}
        </div>

        <aside className="usage-right-sidebar" aria-label="Neue beteiligte Identität">
          <PartyCreateForm onCreated={(value) => { setParty(value); showSuccess('Beteiligte Identität angelegt.') }} onError={(error) => handleError(error, 'party')} />
        </aside>
      </div>
    </section>
  )
}

function RightCreateForm({ graveSiteId, partyId, onCreated, onError }: {
  graveSiteId: string
  partyId: string
  onCreated: (value: Versioned<UsageRight>) => void
  onError: (error: unknown) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, { startDate: 'startDate', endDate: 'endDate', sourceReference: 'sourceReference', reference: 'sourceReference' }, onError)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    feedback.clear()
    try {
      onCreated(await createUsageRight({ graveSiteId, holderPartyId: partyId, startDate: data.get('startDate'), endDate: data.get('endDate'), sourceReference: data.get('sourceReference') }))
    } catch (error) { feedback.report(error) }
  }
  return (
    <form ref={formRef} className="compact-form" onSubmit={(event) => void submit(event)}>
      <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
      <div className="compact-form-grid compact-form-grid--three">
        <label>Beginn<input name="startDate" type="date" required {...feedback.fieldProps('startDate')} />{feedback.fieldErrors('startDate')}</label>
        <label>Manuell erfasstes Ende<input name="endDate" type="date" required {...feedback.fieldProps('endDate')} />{feedback.fieldErrors('endDate')}</label>
        <label>Quellenreferenz<input name="sourceReference" required {...feedback.fieldProps('sourceReference')} />{feedback.fieldErrors('sourceReference')}</label>
      </div>
      <div className="form-submit-row"><p>Der aktuell ausgewählte Beteiligte wird als erster Inhaber eingetragen.</p><button className="button button--primary" type="submit">Nutzungsrecht anlegen</button></div>
    </form>
  )
}

function RightDetails({ right, party, onChanged, onError }: {
  right: Versioned<UsageRight>
  party: Versioned<Party> | null | undefined
  onChanged: (value: Versioned<UsageRight>) => void
  onError: (error: unknown) => void
}) {
  const value = right.value
  return (
    <article className="right-details">
      <dl className="right-facts">
        <div><dt>Manueller Zeitraum</dt><dd><strong>{value.startDate}</strong><span aria-hidden="true">→</span><strong>{value.endDate}</strong></dd></div>
        <div><dt>Quellenreferenz</dt><dd>{value.sourceReference}</dd></div>
        <div><dt>Startregel-Snapshot</dt><dd><strong>{value.startRuleCodeSnapshot}</strong><span>{value.startRuleDisplayNameSnapshot}</span></dd></div>
      </dl>
      <div className="holder-history"><h4>Inhaberzeiträume</h4><ol>{value.holderPeriods.map((holder) => <li key={holder.id}><span className="timeline-marker" aria-hidden="true" /><div><strong>{holder.validUntilExclusive ? 'Früherer Inhaber' : 'Aktueller Inhaber'}</strong><code>{holder.partyId}</code><small>Ab {holder.validFromInclusive}{holder.validUntilExclusive ? ` bis ${holder.validUntilExclusive} (exklusiv)` : ' · aktuell'}</small></div></li>)}</ol></div>
      <div className="right-actions" aria-label="Nutzungsrecht bearbeiten">
        <details className="action-disclosure">
          <summary>Übertragen <span aria-hidden="true">＋</span></summary>
          {party ? <TransferForm right={right} party={party} onChanged={onChanged} onError={onError} /> : <p className="workspace-empty">Zuerst unten einen neuen Inhaber suchen und auswählen.</p>}
        </details>
        <details className="action-disclosure"><summary>Verlängern <span aria-hidden="true">＋</span></summary><ExtensionForm right={right} onChanged={onChanged} onError={onError} /></details>
        <details className="action-disclosure"><summary>Fakten korrigieren <span aria-hidden="true">＋</span></summary><RightCorrectionForm right={right} onChanged={onChanged} onError={onError} /></details>
      </div>
      <details className="history-disclosure"><summary>Vollständige Fachrevisionen <span>{value.revisions.length}</span></summary><ol className="revision-list">{value.revisions.map((revision) => <li key={revision.id}><strong>Version {revision.resultingVersion} · {revision.mutationType}</strong><span>{revision.reason ?? 'Anlage'} · Zeitraum {revision.startDate}–{revision.endDate} · {revision.startRuleCodeSnapshot}</span></li>)}</ol></details>
    </article>
  )
}

interface RightMutationProps {
  right: Versioned<UsageRight>
  onChanged: (value: Versioned<UsageRight>) => void
  onError: (error: unknown) => void
}

function TransferForm({ right, party, onChanged, onError }: RightMutationProps & { party: Versioned<Party> }) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, { validFromInclusive: 'validFromInclusive', reason: 'reason', reference: null }, onError)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); feedback.clear()
    try { onChanged(await transferUsageRight(right.value.id, right.etag, { newHolderPartyId: party.value.id, validFromInclusive: data.get('validFromInclusive'), reason: data.get('reason') })) } catch (error) { feedback.report(error) }
  }
  return (
    <form ref={formRef} className="compact-form compact-form--inset right-action-form" onSubmit={(event) => void submit(event)}>
      <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
      <p className="selection-notice">Neuer Inhaber: <strong>{partyDisplayName(party.value)}</strong></p>
      <div className="compact-form-grid"><label>Wirksam ab<input name="validFromInclusive" type="date" required {...feedback.fieldProps('validFromInclusive')} />{feedback.fieldErrors('validFromInclusive')}</label><label>Begründung<input name="reason" required {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label></div>
      <button className="button button--primary" type="submit">Historisiert übertragen</button>
    </form>
  )
}

function ExtensionForm({ right, onChanged, onError }: RightMutationProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, { newEndDate: 'newEndDate', reason: 'reason', reference: null }, onError)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); feedback.clear()
    try { onChanged(await extendUsageRight(right.value.id, right.etag, { newEndDate: data.get('newEndDate'), reason: data.get('reason') })) } catch (error) { feedback.report(error) }
  }
  return (
    <form ref={formRef} className="compact-form compact-form--inset right-action-form" onSubmit={(event) => void submit(event)}>
      <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
      <div className="compact-form-grid"><label>Neues manuelles Ende<input name="newEndDate" type="date" required {...feedback.fieldProps('newEndDate')} />{feedback.fieldErrors('newEndDate')}</label><label>Begründung<input name="reason" required {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label></div>
      <button className="button button--primary" type="submit">Verlängern</button>
    </form>
  )
}

function RightCorrectionForm({ right, onChanged, onError }: RightMutationProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const value = right.value
  const feedback = useFormFeedback(formRef, { startDate: 'startDate', endDate: 'endDate', sourceReference: 'sourceReference', reference: 'sourceReference', reason: 'reason' }, onError)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); feedback.clear()
    try { onChanged(await correctUsageRight(value.id, right.etag, { graveSiteId: value.graveSiteId, startDate: data.get('startDate'), endDate: data.get('endDate'), sourceReference: data.get('sourceReference'), usageRightStartRuleId: value.usageRightStartRuleId, reason: data.get('reason') })) } catch (error) { feedback.report(error) }
  }
  return (
    <form ref={formRef} className="compact-form compact-form--inset right-action-form" onSubmit={(event) => void submit(event)}>
      <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
      <div className="compact-form-grid compact-form-grid--three">
        <label>Beginn<input name="startDate" type="date" defaultValue={value.startDate} required {...feedback.fieldProps('startDate')} />{feedback.fieldErrors('startDate')}</label>
        <label>Ende<input name="endDate" type="date" defaultValue={value.endDate} required {...feedback.fieldProps('endDate')} />{feedback.fieldErrors('endDate')}</label>
        <label>Quellenreferenz<input name="sourceReference" defaultValue={value.sourceReference} required {...feedback.fieldProps('sourceReference')} />{feedback.fieldErrors('sourceReference')}</label>
        <label className="field--wide">Begründung<input name="reason" required {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label>
      </div>
      <button className="button button--primary" type="submit">Fakten korrigieren</button>
    </form>
  )
}
