import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import {
  ApiError,
  correctNoticeDraft,
  createNoticeDraft,
  discardNoticeDraft,
  generateNoticeDraft,
  getLegalBasisVersions,
  getParty,
  getNoticeDraft,
  getNoticeDrafts,
  getUsageRightByGraveSite,
} from '../api/cemarisApi'
import type { NoticeDraft, NoticeDraftListItem } from '../types/noticeDrafts'
import type { LegalBasisVersion, NoticeGenerationFormat } from '../types/noticeDrafts'
import type { BurialDetails } from '../types/cases'
import type { Party, Versioned } from '../types/personUsageRights'
import { FormErrorSummary } from './FormErrorSummary'
import { PartySearchAndDetails } from './PartyManagement'
import { useFormFeedback } from './useFormFeedback'

interface NoticeDraftPanelProps {
  caseId: string
  graveSiteId?: string
  burials?: BurialDetails[]
  noticeGenerationEnabled?: boolean
}

export function NoticeDraftPanel({ caseId, graveSiteId, burials = [], noticeGenerationEnabled = false }: NoticeDraftPanelProps) {
  const [drafts, setDrafts] = useState<NoticeDraftListItem[]>()
  const [selected, setSelected] = useState<Versioned<NoticeDraft> | null>(null)
  const [payer, setPayer] = useState<Versioned<Party> | null>()
  const [suggestedPayer, setSuggestedPayer] = useState<Versioned<Party> | null>()
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'success' | 'error'>('success')
  const [conflict, setConflict] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getNoticeDrafts(caseId, controller.signal)
      .then(setDrafts)
      .catch((error: unknown) => { if (!controller.signal.aborted) showError(error) })
    return () => controller.abort()
  }, [caseId])

  useEffect(() => {
    const controller = new AbortController()
    if (!graveSiteId) {
      setSuggestedPayer(null)
      return () => controller.abort()
    }
    void getUsageRightByGraveSite(graveSiteId, controller.signal)
      .then((right) => right?.value.holderPeriods.find((holder) => holder.validUntilExclusive === null) ?? null)
      .then((holder) => holder ? getParty(holder.partyId, controller.signal) : null)
      .then((party) => setSuggestedPayer(party))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) showError(error)
      })
    return () => controller.abort()
  }, [graveSiteId])

  function showError(error: unknown) {
    setTone('error')
    setConflict(error instanceof ApiError && error.status === 412)
    setMessage(error instanceof ApiError && error.status === 412
      ? 'Der Bescheidentwurf wurde zwischenzeitlich geändert. Laden Sie den aktuellen Stand; Ihre Formulareingaben bleiben erhalten.'
      : error instanceof Error ? error.message : 'Der Bescheidentwurf konnte nicht verarbeitet werden.')
  }

  function showSuccess(value: string) {
    setTone('success')
    setConflict(false)
    setMessage(value)
  }

  function updateDraft(value: Versioned<NoticeDraft>, success: string) {
    setSelected(value)
    setDrafts((current) => current?.map((item) => item.id === value.value.id ? listItem(value.value) : item))
    showSuccess(success)
  }

  async function selectDraft(id: string) {
    try {
      setSelected(await getNoticeDraft(id))
      setConflict(false)
    } catch (error) {
      showError(error)
    }
  }

  async function reloadConflict() {
    if (!selected) return
    try {
      setSelected(await getNoticeDraft(selected.value.id))
      showSuccess('Aktueller Entwurfsstand geladen. Nicht gespeicherte Formulareingaben bleiben erhalten.')
    } catch (error) {
      showError(error)
    }
  }

  function created(value: Versioned<NoticeDraft>) {
    setDrafts((current) => [listItem(value.value), ...(current ?? [])])
    setSelected(value)
    showSuccess('Rechtlich wirkungsloser Bescheidentwurf angelegt.')
  }

  return (
    <section className="detail-section detail-section--wide notice-draft-workspace" aria-labelledby="notice-draft-heading">
      <header className="usage-right-header">
        <div>
          <p className="section-kicker">Kanonischer manueller Entwurfskern</p>
          <h2 id="notice-draft-heading">Kanonische Bescheidentwürfe</h2>
          <p>Manuelle Arbeitsstände mit geschützter Fachhistorie. Es erfolgen keine Festsetzung, Bekanntgabe, Bescheiderzeugung oder Gebührenberechnung.</p>
        </div>
        <span className="scope-badge scope-badge--warning">Rechtlich wirkungslos</span>
      </header>

      {message && <div className={`workspace-message${tone === 'error' ? ' workspace-message--error' : ''}`} role={tone === 'error' ? 'alert' : 'status'}><span>{message}</span>{conflict && <button className="button" type="button" onClick={() => void reloadConflict()}>Aktuellen Entwurfsstand laden</button>}</div>}

      <div className="notice-draft-layout">
        <div className="notice-draft-main">
          <section className="workspace-card" aria-labelledby="draft-list-heading">
            <div className="workspace-card-heading"><div><span className="step-number" aria-hidden="true">1</span><div><h3 id="draft-list-heading">Entwürfe dieses Falls</h3><p>Getrennt von der vorläufigen Bescheid- und Gebührenprojektion</p></div></div><span className="count-badge">{drafts?.length ?? 0}</span></div>
            {drafts === undefined
              ? <p className="workspace-empty" role="status">Bescheidentwürfe werden geladen …</p>
              : drafts.length === 0
                ? <div className="workspace-empty"><strong>Noch kein kanonischer Entwurf</strong><span>Wählen Sie rechts einen Zahlungspflichtigen und erfassen Sie den manuellen Arbeitsstand.</span></div>
                : <div className="notice-draft-list">{drafts.map((draft) => <article className={`notice-draft-card${selected?.value.id === draft.id ? ' notice-draft-card--selected' : ''}`} key={draft.id}><div><strong>{draft.noticeNumber}</strong><span>{draft.payerDisplayNameSnapshot} · {formatAmount(draft.totalAmount, draft.currency)}</span><small>{formatDate(draft.noticeDate)} · Version {draft.version}</small></div><div><span className={`status-chip${draft.status === 'Draft' ? ' status-chip--active' : ''}`}>{draft.status === 'Draft' ? 'Entwurf' : 'Verworfen'}</span><button className="button" type="button" onClick={() => void selectDraft(draft.id)}>Öffnen</button></div></article>)}</div>}
          </section>

          {selected && <DraftDetails draft={selected} payer={payer} burials={burials} noticeGenerationEnabled={noticeGenerationEnabled} onChanged={updateDraft} onError={showError} onSuccess={showSuccess} />}
        </div>

        <aside className="usage-right-sidebar notice-draft-sidebar" aria-labelledby="payer-selection-heading">
          <div className="sidebar-heading"><p className="section-kicker">Zahlungspflichtiger</p><h3 id="payer-selection-heading">Kanonischen Beteiligten wählen</h3><p>Die Auswahl gilt nur für die nächste Anlage oder Korrektur und muss aktiv bestätigt werden.</p></div>
          {suggestedPayer && <div className="selection-notice notice-draft-suggestion"><p>Aktueller Nutzungsberechtigter als unverbindlicher Vorschlag: <strong>{displayParty(suggestedPayer.value)}</strong></p><button className="button" type="button" onClick={() => setPayer(suggestedPayer)}>Vorschlag auswählen</button><small>Keine automatische Übernahme; die konkrete Zahlungspflichtigenauswahl muss danach aktiv bestätigt werden.</small></div>}
          <PartySearchAndDetails party={payer} onPartyChanged={setPayer} onError={showError} onSuccess={showSuccess} />
          {payer
            ? <DraftCreateForm caseId={caseId} payer={payer} onCreated={created} onError={showError} />
            : <p className="workspace-empty">Für die Entwurfsanlage zuerst einen Beteiligten auswählen.</p>}
        </aside>
      </div>
    </section>
  )
}

function DraftCreateForm({ caseId, payer, onCreated, onError }: {
  caseId: string
  payer: Versioned<Party>
  onCreated: (value: Versioned<NoticeDraft>) => void
  onError: (error: unknown) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, fieldMap, onError)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    feedback.clear()
    try {
      onCreated(await createNoticeDraft(caseId, draftInput(data, payer.value.id)))
      form.reset()
    } catch (error) {
      feedback.report(error)
    }
  }
  return <form ref={formRef} className="compact-form compact-form--inset notice-draft-create" onSubmit={(event) => void submit(event)}>
    <h4>Entwurf anlegen</h4>
    <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
    <DraftFactFields feedback={feedback} />
    <label className="confirmation-field"><input name="payerSelectionConfirmed" type="checkbox" required {...feedback.fieldProps('payerSelectionConfirmed')} /><span>Ich bestätige <strong>{displayParty(payer.value)}</strong> als konkreten Zahlungspflichtigen dieses Entwurfs.</span></label>
    {feedback.fieldErrors('payerSelectionConfirmed')}
    <button className="button button--primary button--full" type="submit">Rechtlich wirkungslosen Entwurf anlegen</button>
  </form>
}

function DraftDetails({ draft, payer, burials, noticeGenerationEnabled, onChanged, onError, onSuccess }: {
  draft: Versioned<NoticeDraft>
  payer: Versioned<Party> | null | undefined
  burials: BurialDetails[]
  noticeGenerationEnabled: boolean
  onChanged: (value: Versioned<NoticeDraft>, success: string) => void
  onError: (error: unknown) => void
  onSuccess: (message: string) => void
}) {
  const value = draft.value
  return <section className="workspace-card notice-draft-details" aria-labelledby="selected-draft-heading">
    <div className="workspace-card-heading"><div><span className="step-number" aria-hidden="true">2</span><div><h3 id="selected-draft-heading">{value.noticeNumber}</h3><p>Unveränderliche Nummernfakten und aktueller manueller Stand</p></div></div><span className={`status-chip${value.status === 'Draft' ? ' status-chip--active' : ''}`}>{value.status === 'Draft' ? `Entwurf · Version ${value.version}` : `Verworfen · Version ${value.version}`}</span></div>
    <dl className="right-facts notice-draft-facts">
      <div><dt>Zahlungspflichtiger</dt><dd><strong>{value.payerDisplayNameSnapshot}</strong><code>{value.payerPartyId}</code></dd></div>
      <div><dt>Betrag</dt><dd><strong>{formatAmount(value.totalAmount, value.currency)}</strong><span>{value.accountAssignment}</span></dd></div>
      <div><dt>Datum und Fälligkeit</dt><dd><strong>{formatDate(value.noticeDate)}</strong><span>Fällig {formatDate(value.dueDate)}</span></dd></div>
      <div><dt>Nummernsnapshot</dt><dd><strong>{value.financialProductSnapshot} · {value.assignmentYear} · #{value.runningNumber}</strong><span>Konfiguration v{value.noticeNumberConfigurationVersion}, Breite {value.runningNumberWidthSnapshot}</span></dd></div>
      <div className="field--wide"><dt>Gebührengrund oder Quelle</dt><dd>{value.feeReasonOrSource}</dd></div>
    </dl>
    {value.status === 'Draft' && <div className="right-actions" aria-label="Bescheidentwurf bearbeiten">
      <details className="action-disclosure"><summary>Fakten korrigieren <span aria-hidden="true">＋</span></summary><DraftCorrectionForm draft={draft} payer={payer} onChanged={onChanged} onError={onError} /></details>
      <details className="action-disclosure"><summary>Entwurf verwerfen <span aria-hidden="true">＋</span></summary><DraftDiscardForm draft={draft} onChanged={onChanged} onError={onError} /></details>
    </div>}
    {value.status === 'Draft' && noticeGenerationEnabled && <NoticeGenerationForm draft={draft} burials={burials} onError={onError} onSuccess={onSuccess} />}
    <details className="history-disclosure"><summary>Vollständige Fachrevisionen <span>{value.revisions.length}</span></summary><ol className="revision-list">{value.revisions.map((revision) => <li key={revision.id}><strong>Version {revision.resultingVersion} · {revision.mutationType}</strong><span>{revision.reason ?? 'Anlage'} · {revision.actorDisplayName} · {formatDateTime(revision.occurredAtUtc)}</span><small>{revision.payerDisplayNameSnapshot} · {formatAmount(revision.totalAmount, revision.currency)} · {revision.status === 'Draft' ? 'Entwurf' : 'Verworfen'}</small></li>)}</ol></details>
  </section>
}

function NoticeGenerationForm({ draft, burials, onError, onSuccess }: { draft: Versioned<NoticeDraft>; burials: BurialDetails[]; onError: (error: unknown) => void; onSuccess: (message: string) => void }) {
  const [legalBases, setLegalBases] = useState<LegalBasisVersion[]>([])
  const [burialId, setBurialId] = useState('')
  const [legalBasisVersionId, setLegalBasisVersionId] = useState('')
  const [format, setFormat] = useState<NoticeGenerationFormat>('Docx')
  const [working, setWorking] = useState(false)
  const reportError = useEffectEvent(onError)
  const eligibleBurials = burials.filter(item => item.burialDate && item.deceasedPersonId && item.graveSiteId)

  useEffect(() => {
    const controller = new AbortController()
    getLegalBasisVersions(true, controller.signal).then(setLegalBases)
      .catch((error: unknown) => { if (!controller.signal.aborted) reportError(error) })
    return () => controller.abort()
  }, [draft.value.id])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWorking(true)
    try {
      const artifact = await generateNoticeDraft(draft.value.id, draft.etag, burialId, legalBasisVersionId, format)
      const url = URL.createObjectURL(artifact.blob)
      try {
        const link = document.createElement('a'); link.href = url; link.download = artifact.fileName
        document.body.appendChild(link); link.click(); link.remove()
      } finally { URL.revokeObjectURL(url) }
      onSuccess(format === 'Pdf'
        ? 'PDF-Entwurf heruntergeladen. Zum Drucken öffnen Sie die lokale Datei bewusst in einem PDF-Programm.'
        : 'DOCX-Entwurf heruntergeladen.')
    } catch (error) { onError(error) } finally { setWorking(false) }
  }

  return <form className="compact-form compact-form--inset" onSubmit={(event) => void submit(event)} aria-labelledby="generation-heading">
    <h4 id="generation-heading">Dokument flüchtig erzeugen</h4>
    <p className="selection-notice"><strong>Rechtlich wirkungsloser Entwurf.</strong> Keine Freigabe, Signatur, Zustellung oder Archivierung. Cemaris berechnet weder Gebühren noch Rechtsgrundlagen oder Fälligkeiten.</p>
    <div className="compact-form-grid">
      <label>Beisetzung<select required value={burialId} onChange={event => setBurialId(event.target.value)}><option value="">Bitte wählen</option>{eligibleBurials.map(item => <option value={item.id} key={item.id}>{formatDate(item.burialDate!)} · {item.id}</option>)}</select></label>
      <label>Satzungsversion<select required value={legalBasisVersionId} onChange={event => setLegalBasisVersionId(event.target.value)}><option value="">Bitte wählen</option>{legalBases.map(item => <option value={item.id} key={item.id}>{item.name} · {formatDate(item.versionDate)}</option>)}</select></label>
      <label>Format<select value={format} onChange={event => setFormat(event.target.value as NoticeGenerationFormat)}><option value="Docx">DOCX</option><option value="Pdf">PDF</option></select></label>
    </div>
    {eligibleBurials.length === 0 && <p className="missing-value">Keine vollständig verknüpfte tatsächliche Beisetzung auswählbar.</p>}
    {legalBases.length === 0 && <p className="missing-value">Keine aktive Satzungsversion auswählbar.</p>}
    <button className="button button--primary" type="submit" disabled={working || eligibleBurials.length === 0 || legalBases.length === 0}>{working ? 'Entwurf wird erzeugt …' : 'Rechtlich wirkungslosen Entwurf herunterladen'}</button>
  </form>
}

function DraftCorrectionForm({ draft, payer, onChanged, onError }: {
  draft: Versioned<NoticeDraft>
  payer: Versioned<Party> | null | undefined
  onChanged: (value: Versioned<NoticeDraft>, success: string) => void
  onError: (error: unknown) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, { ...fieldMap, reason: 'reason' }, onError)
  const value = draft.value
  const payerChanged = Boolean(payer && payer.value.id !== value.payerPartyId)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    feedback.clear()
    try {
      onChanged(await correctNoticeDraft(value.id, draft.etag, {
        ...draftInput(data, payer?.value.id ?? value.payerPartyId),
        reason: data.get('reason'),
      }), 'Bescheidentwurf historisiert korrigiert.')
    } catch (error) {
      feedback.report(error)
    }
  }
  return <form ref={formRef} className="compact-form compact-form--inset right-action-form" onSubmit={(event) => void submit(event)}>
    <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
    {payer && <p className="selection-notice">Für die Korrektur ausgewählt: <strong>{displayParty(payer.value)}</strong>{payerChanged ? ' (abweichender Zahlungspflichtiger)' : ' (unverändert)'}</p>}
    <DraftFactFields feedback={feedback} defaults={value} />
    <label className="field--wide">Begründung<input name="reason" required {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label>
    {payerChanged && <><label className="confirmation-field"><input name="payerSelectionConfirmed" type="checkbox" required {...feedback.fieldProps('payerSelectionConfirmed')} /><span>Geänderte Zahlungspflichtigenauswahl aktiv bestätigen.</span></label>{feedback.fieldErrors('payerSelectionConfirmed')}</>}
    <button className="button button--primary" type="submit">Fakten historisiert korrigieren</button>
  </form>
}

function DraftDiscardForm({ draft, onChanged, onError }: {
  draft: Versioned<NoticeDraft>
  onChanged: (value: Versioned<NoticeDraft>, success: string) => void
  onError: (error: unknown) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, { reason: 'reason' }, onError)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    feedback.clear()
    try {
      onChanged(await discardNoticeDraft(draft.value.id, draft.etag, String(data.get('reason') ?? '')), 'Bescheidentwurf historisiert verworfen.')
    } catch (error) {
      feedback.report(error)
    }
  }
  return <form ref={formRef} className="compact-form compact-form--inset right-action-form" onSubmit={(event) => void submit(event)}>
    <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
    <p>Das Verwerfen ist historisiert und beendet jede weitere Änderung dieses Entwurfs.</p>
    <label>Begründung<input name="reason" required {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label>
    <button className="button" type="submit">Entwurf verwerfen</button>
  </form>
}

function DraftFactFields({ feedback, defaults }: { feedback: ReturnType<typeof useFormFeedback>; defaults?: NoticeDraft }) {
  return <div className="compact-form-grid">
    <label>Gesamtbetrag in EUR<input name="totalAmount" type="number" min="0.01" max="9999999999999999.99" step="0.01" defaultValue={defaults?.totalAmount} required {...feedback.fieldProps('totalAmount')} />{feedback.fieldErrors('totalAmount')}</label>
    <label>Bescheiddatum<input name="noticeDate" type="date" defaultValue={defaults?.noticeDate} required {...feedback.fieldProps('noticeDate')} />{feedback.fieldErrors('noticeDate')}</label>
    <label>Fälligkeit<input name="dueDate" type="date" defaultValue={defaults?.dueDate} required {...feedback.fieldProps('dueDate')} />{feedback.fieldErrors('dueDate')}</label>
    <label>Kontierung<input name="accountAssignment" maxLength={100} defaultValue={defaults?.accountAssignment} required {...feedback.fieldProps('accountAssignment')} />{feedback.fieldErrors('accountAssignment')}</label>
    <label className="field--wide">Gebührengrund oder Quelle<textarea name="feeReasonOrSource" maxLength={500} defaultValue={defaults?.feeReasonOrSource} required {...feedback.fieldProps('feeReasonOrSource')} />{feedback.fieldErrors('feeReasonOrSource')}</label>
  </div>
}

const fieldMap = {
  payerPartyId: null,
  payerSelectionConfirmed: 'payerSelectionConfirmed',
  totalAmount: 'totalAmount',
  noticeDate: 'noticeDate',
  dueDate: 'dueDate',
  accountAssignment: 'accountAssignment',
  feeReasonOrSource: 'feeReasonOrSource',
  reference: null,
}

function draftInput(data: FormData, payerPartyId: string) {
  return {
    payerPartyId,
    payerSelectionConfirmed: data.get('payerSelectionConfirmed') === 'on',
    totalAmount: Number(data.get('totalAmount')),
    noticeDate: data.get('noticeDate'),
    dueDate: data.get('dueDate'),
    accountAssignment: data.get('accountAssignment'),
    feeReasonOrSource: data.get('feeReasonOrSource'),
  }
}

function listItem(value: NoticeDraft): NoticeDraftListItem {
  return {
    id: value.id,
    caseId: value.caseId,
    payerPartyId: value.payerPartyId,
    payerDisplayNameSnapshot: value.payerDisplayNameSnapshot,
    noticeNumber: value.noticeNumber,
    totalAmount: value.totalAmount,
    currency: value.currency,
    noticeDate: value.noticeDate,
    dueDate: value.dueDate,
    accountAssignment: value.accountAssignment,
    feeReasonOrSource: value.feeReasonOrSource,
    status: value.status,
    version: value.version,
    createdAtUtc: value.createdAtUtc,
    updatedAtUtc: value.updatedAtUtc,
  }
}

function displayParty(party: Party) {
  return party.partyType === 'Organization'
    ? party.organizationName
    : [party.firstName, party.lastName].filter(Boolean).join(' ')
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE').format(new Date(`${value}T00:00:00`))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
