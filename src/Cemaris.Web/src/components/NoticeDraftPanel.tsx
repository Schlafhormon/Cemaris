import { NoticeDraftLineItemsEditor, NoticeDraftLineItemsView } from './NoticeDraftLineItems'
import { emptyLine, exactAmount, formatExactAmount, lineTotal, type LineInput } from './noticeDraftMoney'
import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import {
  ApiError,
  createNoticeDraftLineItems,
  saveNoticeDraftLineItems,
  correctNoticeDraft,
  createNoticeDraft,
  discardNoticeDraft,
  generateNoticeDraft,
  getLegalBasisVersions,
  getBurialProcessMasterData,
  getParty,
  getNoticeDraft,
  getNoticeDrafts,
  getUsageRightByGraveSite,
} from '../api/cemarisApi'
import type { NoticeDraft, NoticeDraftListItem } from '../types/noticeDrafts'
import type { LegalBasisVersion, NoticeGenerationFormat } from '../types/noticeDrafts'
import type { BurialDetails, DeceasedDetails } from '../types/cases'
import type { GraveSite } from '../types/cemeteries'
import type { Party, Versioned } from '../types/personUsageRights'
import { FormErrorSummary } from './FormErrorSummary'
import { PartySearchAndDetails } from './PartyManagement'
import { useFormFeedback } from './useFormFeedback'

interface NoticeDraftPanelProps {
  caseId: string
  graveSiteId?: string
  burials?: BurialDetails[]
  deceasedPersons?: DeceasedDetails[]
  noticeDraftLineItemsEnabled?: boolean
  noticeGenerationEnabled?: boolean
}

export function NoticeDraftPanel({ caseId, graveSiteId, burials = [], deceasedPersons = [], noticeGenerationEnabled = false, noticeDraftLineItemsEnabled = false }: NoticeDraftPanelProps) {
  const [drafts, setDrafts] = useState<NoticeDraftListItem[]>()
  const [selected, setSelected] = useState<Versioned<NoticeDraft> | null>(null)
  const [payer, setPayer] = useState<Versioned<Party> | null>()
  const [suggestedPayer, setSuggestedPayer] = useState<Versioned<Party> | null>()
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'success' | 'error'>('success')
  const [conflict, setConflict] = useState(false)
  const [formEpoch, setFormEpoch] = useState(0)
  const selectedId = useRef<string | null>(null)
  const selectionRequest = useRef<AbortController | null>(null)
  useEffect(() => () => { selectionRequest.current?.abort(); selectedId.current = null }, [])
  const [rightRefresh, setRightRefresh] = useState(0)
  useEffect(() => {
    const refresh = () => setRightRefresh((value) => value + 1)
    window.addEventListener('cemaris-usage-right-changed', refresh)
    return () => window.removeEventListener('cemaris-usage-right-changed', refresh)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getNoticeDrafts(caseId, controller.signal)
      .then(value => { if (!controller.signal.aborted) setDrafts(value) })
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
      .then((right) => right && (right.value.status ?? 'Open') === 'Open' ? right.value.holderPeriods.find((holder) => holder.validUntilExclusive === null) ?? null : null)
      .then((holder) => holder ? getParty(holder.partyId, controller.signal) : null)
      .then((party) => { if (!controller.signal.aborted) setSuggestedPayer(party) })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) showError(error)
      })
    return () => controller.abort()
  }, [graveSiteId, rightRefresh])

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
    if (selectedId.current !== value.value.id) return
    setSelected(value)
    setFormEpoch(x => x + 1)
    setDrafts((current) => current?.map((item) => item.id === value.value.id ? listItem(value.value) : item))
    showSuccess(success)
  }

  async function selectDraft(id: string, reload = false) {
    selectionRequest.current?.abort()
    const controller = new AbortController()
    selectionRequest.current = controller
    selectedId.current = id
    if (!reload) setSelected(null)
    try {
      const value = await getNoticeDraft(id, controller.signal)
      if (controller.signal.aborted) return
      setSelected(value)
      setFormEpoch(x => x + 1)
      setConflict(false)
      if (reload) showSuccess('Aktueller Entwurfsstand geladen. Nicht gespeicherte Eingaben wurden bewusst ersetzt.')
    } catch (error) {
      if (!controller.signal.aborted) showError(error)
    }
  }

  async function reloadConflict() {
    if (!selected) return
    await selectDraft(selected.value.id, true)
  }

  function created(value: Versioned<NoticeDraft>) {
    selectionRequest.current?.abort()
    selectedId.current = value.value.id
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
          <p>Manuelle Arbeitsstände mit geschützter Fachhistorie. Eine aktivierte Dokumentausgabe erzeugt ausschließlich einen flüchtigen, rechtlich wirkungslosen Entwurf. Es erfolgen keine Festsetzung oder Bekanntgabe. Manuelle Positionen werden ausschließlich addiert; Tarife werden nicht berechnet.</p>
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
                : <div className="notice-draft-list">{drafts.map((draft) => <article className={`notice-draft-card${selected?.value.id === draft.id ? ' notice-draft-card--selected' : ''}`} key={draft.id}><div><strong>{draft.noticeNumber}</strong><span>{draft.payerDisplayNameSnapshot} · {formatAmount(draft.totalAmount, draft.currency, draft.totalAmountExact)}</span><small>{formatDate(draft.noticeDate)} · Version {draft.version}</small></div><div><span className={`status-chip${draft.status === 'Draft' ? ' status-chip--active' : ''}`}>{draft.status === 'Draft' ? 'Entwurf' : 'Verworfen'}</span><button className="button" type="button" onClick={() => void selectDraft(draft.id)}>Öffnen</button></div></article>)}</div>}
          </section>

          {selected && <DraftDetails key={`${selected.value.id}-${formEpoch}`} lineItemsEnabled={noticeDraftLineItemsEnabled} draft={selected} payer={payer} burials={burials} deceasedPersons={deceasedPersons} noticeGenerationEnabled={noticeGenerationEnabled} onChanged={updateDraft} onError={showError} onSuccess={showSuccess} />}
        </div>

        <aside className="usage-right-sidebar notice-draft-sidebar" aria-labelledby="payer-selection-heading">
          <div className="sidebar-heading"><p className="section-kicker">Zahlungspflichtiger</p><h3 id="payer-selection-heading">Kanonischen Beteiligten wählen</h3><p>Die Auswahl gilt nur für die nächste Anlage oder Korrektur und muss aktiv bestätigt werden.</p></div>
          {suggestedPayer && <div className="selection-notice notice-draft-suggestion"><p>Aktueller Nutzungsberechtigter als unverbindlicher Vorschlag: <strong>{displayParty(suggestedPayer.value)}</strong></p><button className="button" type="button" onClick={() => setPayer(suggestedPayer)}>Vorschlag auswählen</button><small>Keine automatische Übernahme; die konkrete Zahlungspflichtigenauswahl muss danach aktiv bestätigt werden.</small></div>}
          <PartySearchAndDetails party={payer} onPartyChanged={setPayer} onError={showError} onSuccess={showSuccess} />
          {payer
            ? <DraftCreateForm key={payer.value.id} lineItemsEnabled={noticeDraftLineItemsEnabled} caseId={caseId} payer={payer} onCreated={created} onError={showError} />
            : <p className="workspace-empty">Für die Entwurfsanlage zuerst einen Beteiligten auswählen.</p>}
        </aside>
      </div>
    </section>
  )
}

function DraftCreateForm({ caseId, payer, onCreated, onError, lineItemsEnabled }: {
  lineItemsEnabled: boolean
  caseId: string
  payer: Versioned<Party>
  onCreated: (value: Versioned<NoticeDraft>) => void
  onError: (error: unknown) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [lines, setLines] = useState<LineInput[]>([emptyLine()])
  const [working, setWorking] = useState(false)
  const alive = useAlive()
  const feedback = useFormFeedback(formRef, fieldMap, onError)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (working) return
    feedback.clear()
    setWorking(true)
    try {
      const input = draftInput(data, payer.value.id, !lineItemsEnabled)
      const result = lineItemsEnabled
        ? await createNoticeDraftLineItems(caseId, { ...input, lineItems: lineInput(lines) })
        : await createNoticeDraft(caseId, input)
      if (!alive.current) return
      onCreated(result)
      form.reset()
      setLines([emptyLine()])
    } catch (error) {
      if (alive.current) feedback.report(error)
    } finally { if (alive.current) setWorking(false) }
  }
  return <form ref={formRef} className="compact-form compact-form--inset notice-draft-create" onSubmit={(event) => void submit(event)}>
    <h4>Entwurf anlegen</h4>
    <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
    <DraftFactFields feedback={feedback} hideAmount={lineItemsEnabled} />
    {lineItemsEnabled && <NoticeDraftLineItemsEditor lines={lines} feedback={feedback} onChange={value => { setLines(value); feedback.clear() }} disabled={working} />}
    <label className="confirmation-field"><input name="payerSelectionConfirmed" type="checkbox" required {...feedback.fieldProps('payerSelectionConfirmed')} /><span>Ich bestätige <strong>{displayParty(payer.value)}</strong> als konkreten Zahlungspflichtigen dieses Entwurfs.</span></label>
    {feedback.fieldErrors('payerSelectionConfirmed')}
    <button className="button button--primary button--full" type="submit" disabled={working || (lineItemsEnabled && lineTotal(lines) === null)}>Rechtlich wirkungslosen Entwurf anlegen</button>
  </form>
}

function DraftDetails({ draft, payer, lineItemsEnabled, burials, deceasedPersons, noticeGenerationEnabled, onChanged, onError, onSuccess }: {
  draft: Versioned<NoticeDraft>
  payer: Versioned<Party> | null | undefined
  lineItemsEnabled: boolean
  burials: BurialDetails[]
  deceasedPersons: DeceasedDetails[]
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
      <div><dt>Betrag</dt><dd><strong>{formatAmount(value.totalAmount, value.currency, value.totalAmountExact)}</strong><span>{value.accountAssignment}</span></dd></div>
      <div><dt>Datum und Fälligkeit</dt><dd><strong>{formatDate(value.noticeDate)}</strong><span>Fällig {formatDate(value.dueDate)}</span></dd></div>
      <div><dt>Nummernsnapshot</dt><dd><strong>{value.financialProductSnapshot} · {value.assignmentYear} · #{value.runningNumber}</strong><span>Konfiguration v{value.noticeNumberConfigurationVersion}, Breite {value.runningNumberWidthSnapshot}</span></dd></div>
      <div className="field--wide"><dt>Gebührengrund oder Quelle</dt><dd>{value.feeReasonOrSource}</dd></div>
    </dl>
    <p><strong>{value.amountMode === 'LineItems' ? 'Positionsmodus · verbindliche Summe' : 'Bestandsmodus · manueller Gesamtbetrag'}</strong></p>
    <NoticeDraftLineItemsView lines={value.lineItems} />
    {value.status === 'Draft' && <div className="right-actions" aria-label="Bescheidentwurf bearbeiten">
      {(value.amountMode !== 'LineItems' || lineItemsEnabled) && <details className="action-disclosure"><summary>Fakten korrigieren <span aria-hidden="true">＋</span></summary><DraftCorrectionForm draft={draft} payer={payer} onChanged={onChanged} onError={onError} /></details>}
      {value.amountMode !== 'LineItems' && lineItemsEnabled && <details className="action-disclosure"><summary>Auf Positionen umstellen</summary><DraftCorrectionForm convert draft={draft} payer={payer} onChanged={onChanged} onError={onError} /></details>}
      <details className="action-disclosure"><summary>Entwurf verwerfen <span aria-hidden="true">＋</span></summary><DraftDiscardForm draft={draft} onChanged={onChanged} onError={onError} /></details>
    </div>}
    {value.status === 'Draft' && noticeGenerationEnabled && <NoticeGenerationForm key={value.id} draft={draft} burials={burials} deceasedPersons={deceasedPersons} onError={onError} onSuccess={onSuccess} />}
    <details className="history-disclosure"><summary>Vollständige Fachrevisionen <span>{value.revisions.length}</span></summary><ol className="revision-list">{value.revisions.map((revision) => <li key={revision.id}><strong>Version {revision.resultingVersion} · {revision.mutationType}</strong><span>{revision.reason ?? 'Anlage'} · {revision.actorDisplayName} · {formatDateTime(revision.occurredAtUtc)}</span><small>{revision.payerDisplayNameSnapshot} · {formatAmount(revision.totalAmount, revision.currency, revision.totalAmountExact)} · {revision.status === 'Draft' ? 'Entwurf' : 'Verworfen'}</small><dl className="right-facts"><div><dt>Modus</dt><dd>{revision.amountMode === 'LineItems' ? 'Positionsmodus' : 'Bestandsmodus'}</dd></div><div><dt>Datum / Fälligkeit</dt><dd>{formatDate(revision.noticeDate)} / {formatDate(revision.dueDate)}</dd></div><div><dt>Kontierung / Gebührenquelle</dt><dd>{revision.accountAssignment} · {revision.feeReasonOrSource}</dd></div><div><dt>Nummernsnapshot</dt><dd>{revision.noticeNumber} · {revision.financialProductSnapshot} · {revision.assignmentYear} · #{revision.runningNumber} · Breite {revision.runningNumberWidthSnapshot} · Konfiguration {revision.noticeNumberConfigurationId}, Version {revision.noticeNumberConfigurationVersion}</dd></div><div><dt>Bezüge und Zeitpunkte</dt><dd>Fall {revision.caseId} · Beteiligter {revision.payerPartyId} · Akteur {revision.actorId} · Angelegt {formatDateTime(revision.createdAtUtc)} · Geändert {formatDateTime(revision.updatedAtUtc)}</dd></div></dl><NoticeDraftLineItemsView lines={revision.lineItems} /></li>)}</ol></details>
  </section>
}

function NoticeGenerationForm({ draft, burials, deceasedPersons, onError, onSuccess }: { draft: Versioned<NoticeDraft>; burials: BurialDetails[]; deceasedPersons: DeceasedDetails[]; onError: (error: unknown) => void; onSuccess: (message: string) => void }) {
  const alive = useAlive()
  const generationRequest = useRef<AbortController | null>(null)
  useEffect(() => () => generationRequest.current?.abort(), [])
  const [legalBases, setLegalBases] = useState<LegalBasisVersion[]>([])
  const [graveSites, setGraveSites] = useState<GraveSite[]>([])
  const [graveLoading, setGraveLoading] = useState(true)
  const [graveError, setGraveError] = useState(false)
  const [burialId, setBurialId] = useState('')
  const [legalBasisVersionId, setLegalBasisVersionId] = useState('')
  const [format, setFormat] = useState<NoticeGenerationFormat>('Docx')
  const [working, setWorking] = useState(false)
  const reportError = useEffectEvent(onError)
  const eligibleBurials = burials.filter(item => item.burialDate && item.deceasedPersonId && item.graveSiteId)

  const burialOptions = describeBurials(eligibleBurials, deceasedPersons, graveSites)

  useEffect(() => {
    const controller = new AbortController()
    getBurialProcessMasterData(controller.signal)
      .then(data => { if (!controller.signal.aborted) setGraveSites(data.graveSites) })
      .catch(() => { if (!controller.signal.aborted) setGraveError(true) })
      .finally(() => { if (!controller.signal.aborted) setGraveLoading(false) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getLegalBasisVersions(true, controller.signal).then(value => { if (!controller.signal.aborted) setLegalBases(value) })
      .catch((error: unknown) => { if (!controller.signal.aborted) reportError(error) })
    return () => controller.abort()
  }, [draft.value.id])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (working) return; setWorking(true)
    try {
      const controller = new AbortController()
      generationRequest.current = controller
      const artifact = await generateNoticeDraft(draft.value.id, draft.etag, burialId, legalBasisVersionId, format, controller.signal)
      if (!alive.current) return
      const url = URL.createObjectURL(artifact.blob)
      try {
        const link = document.createElement('a'); link.href = url; link.download = artifact.fileName
        document.body.appendChild(link); link.click(); link.remove()
      } finally { URL.revokeObjectURL(url) }
      onSuccess(format === 'Pdf'
        ? 'PDF-Entwurf heruntergeladen. Zum Drucken öffnen Sie die lokale Datei bewusst in einem PDF-Programm.'
        : 'DOCX-Entwurf heruntergeladen.')
    } catch (error) { if (alive.current) onError(error) } finally { if (alive.current) setWorking(false) }
  }

  return <form className="compact-form compact-form--inset" onSubmit={(event) => void submit(event)} aria-labelledby="generation-heading">
    <h4 id="generation-heading">Dokument flüchtig erzeugen</h4>
    <p className="selection-notice"><strong>Rechtlich wirkungsloser Entwurf.</strong> Keine Freigabe, Signatur, Zustellung oder Archivierung. Cemaris addiert gespeicherte manuelle Positionen; es berechnet keine Tarife, Rechtsgrundlagen oder Fälligkeiten.</p>
    <div className="compact-form-grid">
      <label className="field--wide">Beisetzung<select required value={burialId} onChange={event => setBurialId(event.target.value)}><option value="">Bitte wählen</option>{burialOptions.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
      <label>Satzungsversion<select required value={legalBasisVersionId} onChange={event => setLegalBasisVersionId(event.target.value)}><option value="">Bitte wählen</option>{legalBases.map(item => <option value={item.id} key={item.id}>{item.name} · {formatDate(item.versionDate)}</option>)}</select></label>
      <label>Format<select value={format} onChange={event => setFormat(event.target.value as NoticeGenerationFormat)}><option value="Docx">DOCX</option><option value="Pdf">PDF</option></select></label>
    </div>
    {graveLoading && <p role="status">Grabbezeichnungen werden geladen … Die Beisetzung kann bereits ausgewählt werden.</p>}
    {graveError && <p className="missing-value" role="alert">Die Grabbezeichnungen konnten nicht geladen werden. Die Beisetzungen bleiben mit ihren Grabstellen-IDs auswählbar; eine bestehende Auswahl bleibt erhalten.</p>}
    {burialId && <p className="selection-notice">Ausgewählte Beisetzung: {burialOptions.find(item => item.id === burialId)?.label}</p>}
    {eligibleBurials.length === 0 && <p className="missing-value">Keine vollständig verknüpfte tatsächliche Beisetzung auswählbar.</p>}
    {legalBases.length === 0 && <p className="missing-value">Keine aktive Satzungsversion auswählbar.</p>}
    <button className="button button--primary" type="submit" disabled={working || eligibleBurials.length === 0 || legalBases.length === 0}>{working ? 'Entwurf wird erzeugt …' : 'Rechtlich wirkungslosen Entwurf herunterladen'}</button>
  </form>
}

// Anzeige ausschließlich aus den Referenzen der jeweiligen Beisetzung; keine Fallgrabableitung.
function describeBurials(burials: BurialDetails[], persons: DeceasedDetails[], sites: GraveSite[]) {
  const personsById = new Map(persons.map(person => [person.id, person]))
  const sitesById = new Map(sites.map(site => [site.id, site]))
  const options = burials.map(burial => {
    const person = personsById.get(burial.deceasedPersonId!)
    const site = sitesById.get(burial.graveSiteId!)
    const name = person
      ? [person.firstName?.trim(), person.lastName?.trim()].filter(Boolean).join(' ') || 'Name nicht angegeben'
      : `Person nicht aufgelöst (${burial.deceasedPersonId})`
    const grave = site
      ? [site.cemeteryName?.trim() || 'Friedhof nicht angegeben', site.areaName?.trim(), site.fieldName?.trim(), site.rowName?.trim(), site.graveNumber?.trim() || 'Grabnummer nicht angegeben'].filter(Boolean).join(' / ')
      : `Grabstelle nicht aufgelöst (${burial.graveSiteId})`
    return { id: burial.id, label: `${formatDate(burial.burialDate!)} · ${name} · ${grave}` }
  })
  const counts = new Map<string, number>()
  for (const option of options) counts.set(option.label, (counts.get(option.label) ?? 0) + 1)
  return options.map(option => ({ ...option, label: counts.get(option.label)! > 1 ? `${option.label} · Beisetzungs-ID: ${option.id}` : option.label }))
}

function DraftCorrectionForm({ draft, payer, onChanged, onError, convert = false }: {
  convert?: boolean
  draft: Versioned<NoticeDraft>
  payer: Versioned<Party> | null | undefined
  onChanged: (value: Versioned<NoticeDraft>, success: string) => void
  onError: (error: unknown) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, { ...fieldMap, reason: 'reason' }, onError)
  const positions = convert || draft.value.amountMode === 'LineItems'
  const [lines, setLines] = useState<LineInput[]>(() => draft.value.amountMode === 'LineItems'
    ? (draft.value.lineItems ?? []).map(line => ({ key: line.id, id: line.id, description: line.description, amount: line.amountExact }))
    : [{ ...emptyLine(), description: draft.value.feeReasonOrSource, amount: draft.value.totalAmountExact ?? String(draft.value.totalAmount) }])
  const [working, setWorking] = useState(false)
  const alive = useAlive()
  const value = draft.value
  const payerChanged = Boolean(payer && payer.value.id !== value.payerPartyId)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    feedback.clear()
    try {
      if (working) return
      setWorking(true)
      const input = { ...draftInput(data, payer?.value.id ?? value.payerPartyId, !positions), reason: data.get('reason') }
      const result = positions
        ? await saveNoticeDraftLineItems(value.id, draft.etag, { ...input, lineItems: lineInput(lines), conversionConfirmed: data.get('conversionConfirmed') === 'on' }, convert)
        : await correctNoticeDraft(value.id, draft.etag, input)
      if (alive.current) onChanged(result, convert ? 'Bescheidentwurf begründet auf Positionen umgestellt.' : 'Bescheidentwurf historisiert korrigiert.')
    } catch (error) {
      if (alive.current) feedback.report(error)
    } finally { if (alive.current) setWorking(false) }
  }
  return <form ref={formRef} className="compact-form compact-form--inset right-action-form" onSubmit={(event) => void submit(event)}>
    <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
    {payer && <p className="selection-notice">Für die Korrektur ausgewählt: <strong>{displayParty(payer.value)}</strong>{payerChanged ? ' (abweichender Zahlungspflichtiger)' : ' (unverändert)'}</p>}
    <DraftFactFields feedback={feedback} defaults={value} hideAmount={positions} />
    {positions && <NoticeDraftLineItemsEditor lines={lines} feedback={feedback} onChange={value => { setLines(value); feedback.clear() }} disabled={working} />}
    {convert && <label className="confirmation-field"><input type="checkbox" name="conversionConfirmed" required /><span>Ich bestätige die begründete Umstellung auf Positionen. Der bisherige Stand bleibt in der Historie erhalten.</span></label>}
    <label className="field--wide">Begründung<input name="reason" required {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label>
    {payerChanged && <><label className="confirmation-field"><input key={payer?.value.id} name="payerSelectionConfirmed" type="checkbox" required {...feedback.fieldProps('payerSelectionConfirmed')} /><span>Geänderte Zahlungspflichtigenauswahl aktiv bestätigen.</span></label>{feedback.fieldErrors('payerSelectionConfirmed')}</>}
    <button className="button button--primary" type="submit" disabled={working || (positions && lineTotal(lines) === null)}>Fakten historisiert korrigieren</button>
  </form>
}

function DraftDiscardForm({ draft, onChanged, onError }: {
  draft: Versioned<NoticeDraft>
  onChanged: (value: Versioned<NoticeDraft>, success: string) => void
  onError: (error: unknown) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, { reason: 'reason' }, onError)
  const alive = useAlive()
  const [working, setWorking] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (working) return
    setWorking(true)
    const data = new FormData(event.currentTarget)
    feedback.clear()
    try {
      const result = await discardNoticeDraft(draft.value.id, draft.etag, String(data.get('reason') ?? ''))
      if (alive.current) onChanged(result, 'Bescheidentwurf historisiert verworfen.')
    } catch (error) {
      if (alive.current) feedback.report(error)
    } finally { if (alive.current) setWorking(false) }
  }
  return <form ref={formRef} className="compact-form compact-form--inset right-action-form" onSubmit={(event) => void submit(event)}>
    <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
    <p>Das Verwerfen ist historisiert und beendet jede weitere Änderung dieses Entwurfs.</p>
    <label>Begründung<input name="reason" required {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label>
    <button className="button" type="submit" disabled={working}>Entwurf verwerfen</button>
  </form>
}

function DraftFactFields({ feedback, defaults, hideAmount = false }: { feedback: ReturnType<typeof useFormFeedback>; defaults?: NoticeDraft; hideAmount?: boolean }) {
  return <div className="compact-form-grid">
    {!hideAmount && <label>Gesamtbetrag in EUR<input name="totalAmount" type="number" min="0.01" max="9999999999999999.99" step="0.01" defaultValue={defaults?.totalAmountExact ?? defaults?.totalAmount} required {...feedback.fieldProps('totalAmount')} />{feedback.fieldErrors('totalAmount')}</label>}
    <label>Bescheiddatum<input name="noticeDate" type="date" defaultValue={defaults?.noticeDate} required {...feedback.fieldProps('noticeDate')} />{feedback.fieldErrors('noticeDate')}</label>
    <label>Fälligkeit<input name="dueDate" type="date" defaultValue={defaults?.dueDate} required {...feedback.fieldProps('dueDate')} />{feedback.fieldErrors('dueDate')}</label>
    <label>Kontierung<input name="accountAssignment" maxLength={100} defaultValue={defaults?.accountAssignment} required {...feedback.fieldProps('accountAssignment')} />{feedback.fieldErrors('accountAssignment')}</label>
    <label className="field--wide">Gebührengrund oder Quelle<textarea name="feeReasonOrSource" maxLength={500} defaultValue={defaults?.feeReasonOrSource} required {...feedback.fieldProps('feeReasonOrSource')} />{feedback.fieldErrors('feeReasonOrSource')}</label>
  </div>
}

const fieldMap = {
  ...Object.fromEntries(Array.from({ length: 100 }, (_, index) => ['description', 'amount'].map(field => [`lineItems[${index}].${field}`, `lineItems[${index}].${field}`])).flat()),
  payerPartyId: null,
  payerSelectionConfirmed: 'payerSelectionConfirmed',
  totalAmount: 'totalAmount',
  noticeDate: 'noticeDate',
  dueDate: 'dueDate',
  accountAssignment: 'accountAssignment',
  feeReasonOrSource: 'feeReasonOrSource',
  reference: null,
}

function draftInput(data: FormData, payerPartyId: string, withAmount = true) {
  return {
    payerPartyId,
    payerSelectionConfirmed: data.get('payerSelectionConfirmed') === 'on',
    ...(withAmount ? { totalAmount: exactAmount(String(data.get('totalAmount') ?? '')) } : {}),
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
    totalAmountExact: value.totalAmountExact,
    amountMode: value.amountMode,
    lineItems: value.lineItems,
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

function formatAmount(amount: number, currency: string, exact?: string) {
  if (exact) return formatExactAmount(exact)
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE').format(new Date(`${value}T00:00:00`))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function lineInput(lines: LineInput[]) {
  if (lineTotal(lines) === null) throw new Error('Bitte alle Positionen prüfen; die Gesamtsumme ist ungültig.')
  return lines.map(line => ({ id: line.id, description: line.description, amount: exactAmount(line.amount) }))
}

function useAlive() {
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  return alive
}
