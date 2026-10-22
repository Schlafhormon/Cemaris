import { formatDirection, formatDate, displayLocale, localDateInput } from './format'
import { appUrl } from './paths'
/* Contract/funeral home views, browser handlers and dialogs ported from Sunrise CMS.
 * Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
 * MIT notice: /THIRD-PARTY-NOTICES.txt. */
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react'
import { ApiError, request } from './api'
import type { User } from './api'
import type { Language, Translate } from './i18n'
import { ErrorMessage, Link, Modal, navigate } from './ui'
import { ContractFinance, financeLabels } from './contract-finance'
import { ContractWorkOrders } from './work-orders'
import { ContractAttachments, PrintMenu, documentLabels } from './documents'

type Row = Record<string, unknown>
type Labels = (key: string) => string
const str = (row: Row, key: string): string => row[key] == null ? '' : String(row[key])
const rows = (row: Row, key: string): Row[] => Array.isArray(row[key]) ? row[key] as Row[] : []
const asRow = (value: unknown): Row => value && typeof value === 'object' ? value as Row : {}
const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const labels: Record<string, [string, string]> = {
  ...financeLabels,
  ...documentLabels,
  number: ['Contract Number', 'Vertragsnummer'], type: ['Contract Type', 'Vertragsart'], date: ['Contract Date', 'Vertragsdatum'], end: ['End Date', 'Enddatum'],
  current: ['Current', 'Laufend'], past: ['Past', 'Vergangen'], future: ['Future', 'Zukünftig'], allTimes: ['(All Times)', '(Alle Zeiträume)'], time: ['Contract Time', 'Vertragszeitraum'],
  allTypes: ['(All Contract Types)', '(Alle Vertragsarten)'], allCemeteries: ['(All Cemeteries)', '(Alle Friedhöfe)'], allFuneralHomes: ['(All Funeral Homes)', '(Alle Bestatter)'],
  allSiteTypes: ['(All Burial Site Types)', '(Alle Grabstättenarten)'], allServices: ['(All Service Types)', '(Alle Dienstleistungen)'],
  site: ['Burial Site', 'Grabstätte'], siteType: ['Burial Site Type', 'Grabstättenart'], deceasedName: ['Recipient / Deceased Name', 'Name der begünstigten / verstorbenen Person'],
  purchaser: ['Purchaser', 'Erwerber'], purchaserName: ['Purchaser Name', 'Name des Erwerbers'], purchaserRelationship: ['Relationship to Recipient', 'Beziehung zur begünstigten Person'],
  recipient: ['Recipient', 'Begünstigte Person'], recipientName: ['Recipient Name', 'Name der begünstigten Person'], copyPurchaser: ['Copy from Purchaser', 'Vom Erwerber übernehmen'],
  services: ['Services', 'Bestattungsdienst'], serviceType: ['Service Type', 'Dienstleistungsart'], serviceTypes: ['Service Types', 'Dienstleistungsarten'],
  director: ["Funeral Director's Name", 'Ansprechperson beim Bestattungsinstitut'], serviceTime: ['Service Time (15 minute intervals)', 'Uhrzeit (15-Minuten-Intervalle)'],
  direction: ['Direction of Arrival', 'Anfahrtsrichtung'], committalType: ['Committal Type', 'Beisetzungsart'], newFuneralHome: ['(Add New Funeral Home)', '(Neuen Bestatter hinzufügen)'],
  selectType: ['(Select a Type)', '(Art auswählen)'], selectFields: ['Select the contract type to load the available fields.', 'Wählen Sie die Vertragsart, um die verfügbaren Zusatzfelder zu laden.'],
  noFields: ['The current contract type has no additional fields.', 'Die aktuelle Vertragsart hat keine Zusatzfelder.'], unlock: ['Unlock Field', 'Feld entsperren'],
  changeType: ['Are you sure you want to change the contract type? This affects additional fields and available fees.', 'Möchten Sie die Vertragsart ändern? Dies betrifft Zusatzfelder und verfügbare Gebühren.'],
  copy: ['Copy Contract Record as New', 'Vertrag als neuen Datensatz kopieren'], copyConfirm: ['Are you sure you want to copy this record to a new record?', 'Möchten Sie diesen Datensatz als neuen Vertrag kopieren?'],
  saveFirst: ['Please save all unsaved changes before continuing.', 'Bitte speichern Sie zuerst alle ungespeicherten Änderungen.'],
  deleteContract: ['Delete Contract', 'Vertrag löschen'], deleteConfirm: ['Are you sure you want to delete this record?', 'Möchten Sie diesen Datensatz löschen?'],
  restoreConfirm: ['Are you sure you want to restore this funeral home?', 'Möchten Sie diesen Bestatter wiederherstellen?'],
  saved: ['Changes saved successfully.', 'Änderungen erfolgreich gespeichert.'], unsaved: ['You have unsaved changes. Leave this page?', 'Es gibt ungespeicherte Änderungen. Diese Seite verlassen?'],
  results: ['Results per page', 'Ergebnisse pro Seite'], contains: ['contains', 'enthält'], startsWith: ['starts with', 'beginnt mit'], endsWith: ['ends with', 'endet mit'],
  funeralHomeIdNotFound: ['Funeral home not found.', 'Bestattungsunternehmen nicht gefunden.'], contractIdNotFound: ['Contract not found.', 'Vertrag nicht gefunden.'],
  noNextFuneralHomeIdFound: ['No next funeral home found.', 'Kein nächstes Bestattungsunternehmen gefunden.'], noPreviousFuneralHomeIdFound: ['No previous funeral home found.', 'Kein vorheriges Bestattungsunternehmen gefunden.'],
  noNextContractIdFound: ['No next contract found.', 'Kein nächster Vertrag gefunden.'], noPreviousContractIdFound: ['No previous contract found.', 'Kein vorheriger Vertrag gefunden.'],
  previous: ['Previous', 'Zurück'], selectSite: ['Select a Burial Site', 'Grabstätte auswählen'], choose: ['Select', 'Auswählen'], clear: ['Clear', 'Leeren'],
  unoccupied: ['Currently Unoccupied', 'Derzeit unbelegt'], occupied: ['Currently Occupied', 'Derzeit belegt'], allStatuses: ['(All Statuses)', '(Alle Status)'],
  newSite: ['Create New Burial Site', 'Neue Grabstätte anlegen'], noCemetery: ['(No Cemetery Selected)', '(Kein Friedhof ausgewählt)'],
  noStatus: ['(No Status)', '(Kein Status)'], removeRelated: ['Remove Related Contract', 'Vertragsverknüpfung entfernen'], removeRelatedConfirm: ['Are you sure you want to remove this related contract?', 'Möchten Sie diese Vertragsverknüpfung entfernen?'],
  noRelated: ['There are no related contracts.', 'Es gibt keine verknüpften Verträge.'], addComment: ['Add Comment', 'Kommentar hinzufügen'], editComment: ['Edit Comment', 'Kommentar bearbeiten'],
  comment: ['Comment', 'Kommentar'], commentDate: ['Comment Date', 'Kommentardatum'], commentTime: ['Comment Time', 'Kommentarzeit'], author: ['Author', 'Verfasser'],
  noComments: ['There are no comments to display.', 'Es sind keine Kommentare vorhanden.'], deleteComment: ['Are you sure you want to remove this comment?', 'Möchten Sie diesen Kommentar löschen?'],
  birth: ['Date of Birth', 'Geburtsdatum'], death: ['Date of Death', 'Sterbedatum'], birthPlace: ['Place of Birth', 'Geburtsort'], deathPlace: ['Place of Death', 'Sterbeort'],
  yearHint: ['YYYY', 'JJJJ'], monthHint: ['MM', 'MM'], dayHint: ['DD', 'TT'],
  Years: ['Years', 'Jahre'], Months: ['Months', 'Monate'], Days: ['Days', 'Tage'], Stillborn: ['Stillborn', 'Totgeburt'],
  age: ['Death Age', 'Sterbealter'], agePeriod: ['Death Age Period', 'Zeiteinheit des Sterbealters'], calculateAge: ['Calculate Age', 'Alter berechnen'],
  container: ['Container', 'Behältnis'], depth: ['Depth', 'Tiefe'],
  detailsAfterCreate: ['Related data can be added after the contract is created.', 'Weitere zugehörige Daten können nach dem Anlegen des Vertrags ergänzt werden.'],
  created: ['Created', 'Erstellt'], updated: ['Updated', 'Geändert'], deleted: ['Deleted', 'Gelöscht'],
  fees: ['Fees', 'Gebühren'], transactions: ['Transactions', 'Transaktionen'], amount: ['Amount', 'Betrag'], quantity: ['Quantity', 'Menge'],
  year: ['Year', 'Jahr'], month: ['Month', 'Monat'], day: ['Day', 'Tag'], finalized: ['Finalized', 'Abgeschlossen'],
  tax: ['Tax', 'Steuer'], total: ['Total', 'Gesamt'], subtotal: ['Subtotal', 'Zwischensumme'], grandTotal: ['Grand Total', 'Gesamtsumme'],
  receipt: ['Receipt Number', 'Belegnummer'], invoiced: ['Invoiced', 'In Rechnung gestellt'], uploaded: ['Uploaded', 'Hochgeladen'],
  locationFilters: ['Location Filters', 'Ortsfilter'], contactFilters: ['Contact Filters', 'Kontaktfilter'], preneedTypes: ['Preneed Contract Types', 'Vorsorgevertragsarten'], atNeedTypes: ['At Need Contract Types', 'Vertragsarten im Bedarfsfall'],
  openSite: ['Open Burial Site', 'Grabstätte öffnen'], noSiteSelected: ['No burial site selected.', 'Keine Grabstätte ausgewählt.'], unlockClear: ['You need to unlock the field before clearing it.', 'Entsperren Sie das Feld, bevor Sie es leeren.'],
  title: ['Title', 'Titel'],
  addRecipient: ['Add Additional Recipient', 'Weitere begünstigte Person hinzufügen'], updateRecipient: ['Update Recipient', 'Begünstigte Person bearbeiten'],
  removeInterment: ['Remove Interment', 'Beisetzung entfernen'], removeIntermentConfirm: ['Are you sure you want to remove this interment from the contract?', 'Möchten Sie diese Beisetzung aus dem Vertrag entfernen?'],
  nonCremated: ['Non-Cremated', 'Nicht eingeäschert'], cremated: ['Cremated', 'Eingeäschert'],
  addServiceType: ['Add Service Type', 'Dienstleistungsart hinzufügen'], editServiceType: ['Edit Service Type Details', 'Dienstleistungsdetails bearbeiten'],
  removeServiceType: ['Remove Service Type', 'Dienstleistungsart entfernen'], removeServiceTypeConfirm: ['Are you sure you want to remove this service type from the contract?', 'Möchten Sie diese Dienstleistungsart aus dem Vertrag entfernen?'],
  noServiceTypes: ['There are no service types associated with this contract.', 'Diesem Vertrag sind keine Dienstleistungsarten zugeordnet.'],
  allServicesAdded: ['All available service types have already been added to this contract.', 'Alle verfügbaren Dienstleistungsarten wurden diesem Vertrag bereits hinzugefügt.'],
  serviceAdded: ['Service Type Added Successfully', 'Dienstleistungsart erfolgreich hinzugefügt'], serviceUpdated: ['Service Type Updated Successfully', 'Dienstleistungsart erfolgreich geändert'],
  serviceRemoved: ['Service Type Removed Successfully', 'Dienstleistungsart erfolgreich entfernt'], details: ['Details', 'Details'],
}


interface Props { t: Translate; language: Language; user: User; location: string }
export function ContractPages({ t, language, user, location }: Props) {
  const l: Labels = (key) => labels[key]?.[language === 'de' ? 1 : 0] ?? t(key)
  const parts = location.split('?')[0].split('/').filter(Boolean)
  const funeral = parts[0].toLowerCase() === 'funeralhomes'
  const base = funeral ? '/funeralHomes' : '/contracts'
  const api = funeral ? '/api/funeral-homes' : '/api/contracts'
  const id = /^\d+$/.test(parts[1] || '') ? parts[1] : ''
  const create = parts[1]?.toLowerCase() === 'new'
  const edit = Boolean(id) && parts[2]?.toLowerCase() === 'edit'
  const operation = parts[2]?.toLowerCase()
  const [data, setData] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setData(null); setError(null)
    async function load() {
      if (operation === 'next' || operation === 'previous') {
        const result = await request<Row>(`${api}/${id}/${operation}`, undefined, controller.signal)
        if (!controller.signal.aborted) navigate(result[funeral ? 'funeralHomeId' : 'contractId'] ? `${base}/${result[funeral ? 'funeralHomeId' : 'contractId']}` : `${base}?error=no${operation === 'next' ? 'Next' : 'Previous'}${funeral ? 'FuneralHome' : 'Contract'}IdFound`, true)
        return
      }
      const value = await request<Row>(`${api}${create ? `/new${window.location.search}` : id ? `/${id}${funeral && edit ? '/edit' : ''}` : funeral ? '/options' : '/meta'}`, undefined, controller.signal)
      if (funeral && id) value.options = await request<Row>(`${api}/options`, undefined, controller.signal)
      if (!controller.signal.aborted) setData(value)
    }
    load().catch((reason: unknown) => {
      if (controller.signal.aborted) return
      if (id && reason instanceof ApiError && reason.status === 404) navigate(`${base}?error=${funeral ? 'funeralHome' : 'contract'}IdNotFound`, true)
      else setError(reason)
    })
    return () => controller.abort()
  }, [location, api, base, create, id, edit, funeral, operation, attempt])
  const record = asRow(data?.[funeral ? 'funeralHome' : 'contract'])
  const title = id ? funeral ? str(record, 'funeralHomeName') || `(${t('contracts.noName')})` : `${t('contracts.contractTitle', { id: str(record, 'contractNumber') })}${str(record, 'burialSiteName') ? `: ${str(record, 'burialSiteName')}` : ''}` : t(funeral ? create ? 'contracts.createNewFuneralHome' : 'contracts.funeralHomeSearch' : create ? 'contracts.createNewContract' : 'contracts.contractSearch')
  useEffect(() => { document.title = `${title}: Cemaris` }, [title])
  const crumb = <nav className="breadcrumb"><Link href="/dashboard">{t('home')}</Link><span>›</span><Link href={base}>{t(funeral ? 'contracts.funeralHomes' : 'contracts')}</Link>{id && <><span>›</span><Link href={`${base}/${id}`}>{title}</Link></>}{(create || edit) && <><span>›</span><span>{t(create ? 'create' : 'update')}</span></>}</nav>
  const reload = () => setAttempt((value) => value + 1)
  if (error) return <>{crumb}<ErrorMessage error={error} t={t} /><button onClick={reload}>{t('cemaris:retry')}</button></>
  if (!data) return <>{crumb}<p role="status">{t('loading')}</p></>
  const options = asRow(data.options || data)
  const pageError = new URLSearchParams(location.split('?')[1]).get('error')
  return <>{crumb}{pageError && <p className="notification danger" role="alert">{l(pageError)}</p>}<div className="places-layout"><aside className="places-menu"><Link href="/contracts">{t('contracts.contractSearch')}</Link><Link href="/funeralHomes">{t('contracts.funeralHomeSearch')}</Link><Link href="/reports?tab=contracts">{t('dashboard.reports')}</Link>{user.userProperties.canUpdateContracts && <><hr /><Link href="/contracts/new">{t('contracts.newContract')}</Link><Link href="/funeralHomes/new">{t('contracts.createNewFuneralHome')}</Link></>}</aside><div className="places-content contract-content"><h1>{create || edit ? t(funeral ? create ? 'contracts.createNewFuneralHome' : 'contracts.updateFuneralHome' : create ? 'contracts.createNewContract' : 'contracts.contractUpdate') : title}</h1>{funeral ? create || edit ? <FuneralEditor key={location + attempt} record={record} options={options} contracts={rows(data, 'contracts')} create={create} user={user} t={t} l={l} /> : id ? <FuneralView record={record} data={data} options={options} user={user} t={t} l={l} reload={reload} /> : <FuneralSearch user={user} t={t} l={l} /> : create || edit ? <ContractEditor key={location + attempt} data={data} options={options} create={create} user={user} t={t} l={l} /> : id ? <ContractView data={data} options={options} user={user} t={t} l={l} /> : <ContractSearch key={location} options={options} t={t} l={l} />}</div></div></>
}

function Field({ name, label, children }: { name: string; label: string; children: ReactNode }) { return <div className="form-field"><label htmlFor={name}>{label}</label>{children}</div> }
function Panel({ title, action, children, id }: { title: string; action?: ReactNode; children: ReactNode; id?: string }) { return <section className="panel" id={id}><div className="panel-heading places-panel-heading"><h2>{title}</h2>{action}</div><div className="panel-body">{children}</div></section> }
function Address({ record, prefix }: { record: Row; prefix: string }) { return <address className="contract-address">{str(record, `${prefix}Address1`)}{str(record, `${prefix}Address2`) && <><br />{str(record, `${prefix}Address2`)}</>}<br />{[str(record, `${prefix}PostalCode`), str(record, `${prefix}City`)].filter(Boolean).join(' ')}{str(record, `${prefix}Province`) && <><br />{str(record, `${prefix}Province`)}</>}</address> }
function Metadata({ record, l }: { record: Row; l: Labels }) { return <div className="record-metadata small-text muted">{['Create', 'Update', 'Delete'].map((op) => record[`record${op}_timeMillis`] ? <span key={op}>{l(op === 'Create' ? 'created' : op === 'Update' ? 'updated' : 'deleted')}: {str(record, `record${op}_username`)} · {new Date(Number(record[`record${op}_timeMillis`])).toLocaleString(displayLocale())}</span> : null)}</div> }
function useDirty(message: string) {
  const [dirty, setDirty] = useState(false)
  const current = useRef(false)
  function update(value: boolean) { current.current = value; setDirty(value) }
  useEffect(() => {
    function unload(event: BeforeUnloadEvent) { if (current.current) { event.preventDefault(); event.returnValue = '' } }
    function click(event: MouseEvent) { const link = (event.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null; if (current.current && !event.defaultPrevented && event.button === 0 && link && !link.target && link.getAttribute('href')?.startsWith('/') && !window.confirm(message)) { event.preventDefault(); event.stopPropagation() } }
    window.addEventListener('beforeunload', unload); document.addEventListener('click', click, true)
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', click, true) }
  }, [message])
  return [dirty, update] as const
}
function Pager({ result, offset, limit, onPage, t, l }: { result: Row; offset: number; limit: number; onPage: (n: number) => void; t: Translate; l: Labels }) { return <nav className="pagination" aria-label={t('pagination')}><span>{Number(result.count) ? `${offset + 1}–${Math.min(offset + limit, Number(result.count))} / ${result.count}` : '0'}</span><button disabled={offset === 0} onClick={() => onPage(Math.max(0, offset - limit))}>{l('previous')}</button><button disabled={offset + limit >= Number(result.count)} onClick={() => onPage(offset + limit)}>{t('next')}</button></nav> }
function ContractTable({ contracts, endAvailable, t, l, onSelect, onRemove }: { contracts: Row[]; endAvailable?: boolean; t: Translate; l: Labels; onSelect?: (row: Row) => void; onRemove?: (row: Row) => void }) {
  if (!contracts.length) return <p className="notification info">{t('noResults')}</p>
  return <div className="table-scroll"><table><thead><tr><th>{l('type')}</th><th>{l('serviceTypes')}</th><th>{l('site')}</th><th>{l('date')}</th>{endAvailable !== false && <th>{l('end')}</th>}<th>{t('contracts.recipients')}</th>{(onSelect || onRemove) && <th>{t('actions')}</th>}</tr></thead><tbody>{contracts.map((row) => <tr key={str(row, 'contractId')} data-contract-id={str(row, 'contractId')}><td><Link href={`/contracts/${row.contractId}`}>{str(row, 'contractType')}</Link><br /><small>#{str(row, 'contractNumber')} · {l(row.contractIsFuture ? 'future' : row.contractIsActive ? 'current' : 'past')}</small></td><td>{rows(row, 'contractServiceTypes').map((service, index) => <span className="tag" key={index}>{str(service, 'serviceType')}</span>)}</td><td>{row.burialSiteId ? <Link className={row.burialSiteIsActive === 0 ? 'danger-text' : ''} href={`/burialSites/${row.burialSiteId}`}>{str(row, 'burialSiteName')}</Link> : `(${t('contracts.noBurialSite')})`}<br /><small>{str(row, 'cemeteryName')}</small></td><td>{formatDate(str(row, 'contractStartDateString'))}</td>{endAvailable !== false && <td>{formatDate(str(row, 'contractEndDateString')) || `(${t('contracts.noEndDate')})`}</td>}<td>{rows(row, 'contractInterments').map((person, index) => <div key={index}>{str(person, 'deceasedName')}</div>)}{str(row, 'purchaserName') && <small>{l('purchaser')}: {str(row, 'purchaserName')}</small>}{str(row, 'funeralHomeName') && <div><small>{str(row, 'funeralHomeName')}</small></div>}</td>{onSelect && <td><button className="small success" type="button" onClick={() => onSelect(row)}>{l('choose')}</button></td>}{onRemove && <td><button className="small danger" type="button" title={l('removeRelated')} onClick={() => onRemove(row)}>{t('delete')}</button></td>}</tr>)}</tbody></table></div>
}

function ContractSearch({ options, t, l }: { options: Row; t: Translate; l: Labels }) {
  const params = new URLSearchParams(window.location.search)
  const initial: Row = { cemeteryId: params.get('cemeteryId') || '', contractNumber: params.get('contractNumber') || '', deceasedName: params.get('deceasedName') || '' }
  const [filter, setFilter] = useState<Row>({ limit: '50', offset: '0', contractTime: options.contractEndDateIsAvailable === false ? '' : 'current', ...initial })
  const [locationFilters, setLocationFilters] = useState(Boolean(initial.cemeteryId))
  const [contactFilters, setContactFilters] = useState(false)
  const [query, setQuery] = useState<Row>(filter)
  const [result, setResult] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  useEffect(() => { const controller = new AbortController(); setResult(null); setError(null); request<Row>('/api/contracts/search', query, controller.signal).then((next) => { if (!controller.signal.aborted) setResult(next) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) }); return () => controller.abort() }, [query])
  function setValue(key: string, value: string) { const next = { ...filter, [key]: value, offset: '0' }; setFilter(next); setQuery(next) }
  const input = (key: string, label: string) => <Field name={`searchFilter--${key}`} label={label}><input id={`searchFilter--${key}`} name={key} value={str(filter, key)} onChange={(e) => setValue(key, e.target.value)} /></Field>
  const select = (key: string, label: string, source: string, value: string, caption: string, all: string) => <Field name={`searchFilter--${key}`} label={label}><select id={`searchFilter--${key}`} name={key} value={str(filter, key)} onChange={(e) => setValue(key, e.target.value)}><option value="">{all}</option>{source === 'contractTypes' ? [true, false].map((preneed) => rows(options, source).some((row) => Boolean(row.isPreneed) === preneed) && <optgroup key={String(preneed)} label={l(preneed ? 'preneedTypes' : 'atNeedTypes')}>{rows(options, source).filter((row) => Boolean(row.isPreneed) === preneed).map((row) => <option key={str(row, value)} value={str(row, value)}>{str(row, caption)}</option>)}</optgroup>) : rows(options, source).map((row) => <option key={str(row, value)} value={str(row, value)}>{str(row, caption)}</option>)}</select></Field>
  return <><form id="form--searchFilters" className="panel" onSubmit={(e) => { e.preventDefault(); setQuery({ ...filter, offset: '0' }) }}><input id="searchFilter--offset" name="offset" type="hidden" value={str(filter, 'offset')} /><div className="panel-body"><div className="three-columns">
    {select('contractTypeId', l('type'), 'contractTypes', 'contractTypeId', 'contractType', l('allTypes'))}{input('contractNumber', l('number'))}
    {options.contractEndDateIsAvailable !== false && <Field name="searchFilter--contractTime" label={l('time')}><select id="searchFilter--contractTime" name="contractTime" value={str(filter, 'contractTime')} onChange={(e) => setValue('contractTime', e.target.value)}>{[['', 'allTimes'], ['current', 'current'], ['past', 'past'], ['future', 'future']].map(([value, key]) => <option value={value} key={value}>{l(key)}</option>)}</select></Field>}
    {select('serviceTypeId', l('serviceType'), 'serviceTypes', 'serviceTypeId', 'serviceType', l('allServices'))}{input('deceasedName', l('deceasedName'))}
    <Field name="searchFilter--limit" label={l('results')}><select id="searchFilter--limit" name="limit" value={str(filter, 'limit')} onChange={(e) => setValue('limit', e.target.value)}>{[50, 100, 250, 500].map((n) => <option key={n}>{n}</option>)}</select></Field></div></div>
    <button className="contract-filter-toggle" type="button" data-cy="location-filters-toggle" aria-expanded={locationFilters} aria-controls="contract-location-filters" onClick={() => setLocationFilters(!locationFilters)}>{locationFilters ? '▾' : '▸'} {l('locationFilters')}</button>
    <div className="panel-body" id="contract-location-filters" hidden={!locationFilters}><div className="three-columns">{select('cemeteryId', t('cemetery'), 'cemeteries', 'cemeteryId', 'cemeteryName', l('allCemeteries'))}
      <Field name="searchFilter--burialSiteName" label={l('site')}><div className="input-addons"><select id="selectFilter--burialSiteNameSearchType" name="burialSiteNameSearchType" aria-label={l('site')} value={str(filter, 'burialSiteNameSearchType')} onChange={(e) => setValue('burialSiteNameSearchType', e.target.value)}>{[['', 'contains'], ['startsWith', 'startsWith'], ['endsWith', 'endsWith']].map(([value, key]) => <option key={value} value={value}>{l(key)}</option>)}</select><input id="searchFilter--burialSiteName" name="burialSiteName" value={str(filter, 'burialSiteName')} onChange={(e) => setValue('burialSiteName', e.target.value)} /></div></Field>
      {select('burialSiteTypeId', l('siteType'), 'burialSiteTypes', 'burialSiteTypeId', 'burialSiteType', l('allSiteTypes'))}</div></div>
    <button className="contract-filter-toggle" type="button" data-cy="contact-filters-toggle" aria-expanded={contactFilters} aria-controls="contract-contact-filters" onClick={() => setContactFilters(!contactFilters)}>{contactFilters ? '▾' : '▸'} {l('contactFilters')}</button>
    <div className="panel-body" id="contract-contact-filters" hidden={!contactFilters}><div className="two-columns">{input('purchaserName', l('purchaserName'))}{select('funeralHomeId', t('contracts.funeralHome'), 'funeralHomes', 'funeralHomeId', 'funeralHomeName', l('allFuneralHomes'))}</div></div>
    <div className="panel-body actions"><button type="submit">{t('search')}</button></div></form>
    <div id="container--searchResults" aria-live="polite">{error ? <ErrorMessage error={error} t={t} /> : !result ? <p role="status">{t('loading')}</p> : <><ContractTable contracts={rows(result, 'contracts')} endAvailable={options.contractEndDateIsAvailable !== false} t={t} l={l} /><Pager result={result} offset={Number(query.offset)} limit={Number(query.limit)} onPage={(offset) => { setFilter((value) => ({ ...value, offset })); setQuery((value) => ({ ...value, offset })) }} t={t} l={l} /></>}</div></>
}
function FuneralSearch({ user, t, l }: { user: User; t: Translate; l: Labels }) {
  const [data, setData] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [filter, setFilter] = useState('')
  const [upcoming, setUpcoming] = useState(false)
  useEffect(() => { const controller = new AbortController(); request<Row>('/api/funeral-homes', undefined, controller.signal).then((value) => { if (!controller.signal.aborted) setData(value) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) }); return () => controller.abort() }, [])
  const found = rows(data || {}, 'funeralHomes').filter((row) => (!upcoming || Number(row.upcomingFuneralCount) > 0) && filter.trim().toLowerCase().split(' ').every((piece) => `${str(row, 'funeralHomeName')} ${str(row, 'funeralHomeAddress1')} ${str(row, 'funeralHomeAddress2')}`.toLowerCase().includes(piece)))
  return <><a className="button light" href={appUrl("/api/reports/funeralHomes-formatted")} download>CSV</a><form className="panel panel-body" id="form--searchFilters" onSubmit={(e) => e.preventDefault()}><Field name="searchFilter--funeralHomeName" label={t('contracts.findAFuneralHome')}><input id="searchFilter--funeralHomeName" placeholder={t('contracts.searchPlaceholder')} autoFocus value={filter} onChange={(e) => setFilter(e.target.value)} /></Field><label className="checkbox-label"><input id="searchFilter--hasUpcomingFunerals" type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} />{t('contracts.filterUpcomingServices')}</label></form>{error ? <ErrorMessage error={error} t={t} /> : !data ? <p role="status">{t('loading')}</p> : !found.length ? <p className="notification info">{t('noResults')}</p> : <div className="table-scroll" id="container--searchResults"><table><thead><tr><th>{t('contracts.funeralHome')}</th><th>{t('address')}</th><th>{t('phoneNumber')}</th><th>{t('contracts.upcomingServices')}</th></tr></thead><tbody>{found.map((row) => <tr key={str(row, 'funeralHomeId')}><td><Link href={`/funeralHomes/${row.funeralHomeId}`}>{str(row, 'funeralHomeName') || `(${t('contracts.noName')})`}</Link></td><td><Address record={row} prefix="funeralHome" /></td><td>{str(row, 'funeralHomePhoneNumber')}</td><td>{Number(row.upcomingFuneralCount || 0)}</td></tr>)}</tbody></table></div>}{user.userProperties.canUpdateContracts && <div className="actions"><Link className="button primary" href="/funeralHomes/new">{t('contracts.createNewFuneralHome')}</Link></div>}<span className="sr-only">{l('results')}: {found.length}</span></>
}

function FuneralView({ record, data, options, user, t, l, reload }: { record: Row; data: Row; options: Row; user: User; t: Translate; l: Labels; reload: () => void }) {
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const deleted = record.recordDelete_timeMillis != null
  async function restore() { if (!window.confirm(l('restoreConfirm'))) return; setBusy(true); try { await request(`/api/funeral-homes/${record.funeralHomeId}/restore`, {}); reload() } catch (reason) { setError(reason) } finally { setBusy(false) } }
  return <>{deleted && <div className="notification danger"><strong>{t('contracts.funeralHomeDeleted')}</strong><p>{t('contracts.funeralHomeDeletedMessage')}</p>{!user.userProperties.isAdmin && <p>{t('contracts.contactAdminToRestore')}</p>}</div>}{error ? <ErrorMessage error={error} t={t} /> : null}<div className="actions">{!deleted && <><Link className="button" rel="prev" href={`/funeralHomes/${record.funeralHomeId}/previous`}>{t('contracts.previousFuneralHome')}</Link><Link className="button" rel="next" href={`/funeralHomes/${record.funeralHomeId}/next`}>{t('next')}</Link>{user.userProperties.canUpdateContracts && <Link className="button primary" href={`/funeralHomes/${record.funeralHomeId}/edit`}>{t('edit')}</Link>}</>}{deleted && user.userProperties.isAdmin && <button className="danger is-restore-funeral-home-button" id="button--restoreFuneralHome" disabled={busy} onClick={restore}>{t('contracts.restoreFuneralHome')}</button>}</div><Panel title={t('contracts.funeralHome')}><div className="two-columns"><div><strong>{t('address')}</strong><Address record={record} prefix="funeralHome" /></div><div><strong>{t('phoneNumber')}</strong><p>{str(record, 'funeralHomePhoneNumber')}</p></div></div></Panel><FuneralUpcoming contracts={rows(data, 'contracts')} t={t} l={l} /><Metadata record={record} l={l} /><RecordAudit record={record} type="funeralHome" enabled={Boolean(options.auditLogEnabled) && user.userProperties.canUpdateContracts} t={t} l={l} /></>
}

function FuneralUpcoming({ contracts, t, l }: { contracts: Row[]; t: Translate; l: Labels }) { return <Panel title={t('contracts.contractsWithUpcomingServices')}>{!contracts.length ? <p>{t('contracts.noContractsWithUpcomingServices')}</p> : <div className="table-scroll"><table><thead><tr><th>{t('contracts.serviceDate')}</th><th>{l('type')}</th><th>{t('contracts.interments')}</th><th>{t('contracts.funeralDirector')}</th></tr></thead><tbody>{contracts.map((row) => <tr key={str(row, 'contractId')}><td>{formatDate(str(row, 'funeralDateString'))} {row.funeralTime ? str(row, 'funeralTimeString') : ''}</td><td><Link href={`/contracts/${row.contractId}`}>{str(row, 'contractType')}</Link><br /><small>#{str(row, 'contractId')}</small></td><td>{rows(row, 'contractInterments').map((person, index) => <div key={index}>{str(person, 'deceasedName')}</div>)}</td><td>{str(row, 'funeralDirectorName')}</td></tr>)}</tbody></table></div>}</Panel> }

function FuneralEditor({ record, options, contracts, create, user, t, l }: { record: Row; options: Row; contracts: Row[]; create: boolean; user: User; t: Translate; l: Labels }) {
  const [form, setForm] = useState<Row>(create ? { ...asRow(options.funeralHome), ...record } : record)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useDirty(l('unsaved'))
  function setValue(key: string, value: string) { setForm((current) => ({ ...current, [key]: value })); setDirty(true); setSaved(false) }
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(null); try { const result = await request<Row>(`/api/funeral-homes${create ? '' : `/${record.funeralHomeId}/update`}`, Object.fromEntries(new FormData(event.currentTarget))); setDirty(false); if (create) navigate(`/funeralHomes/${result.funeralHomeId}/edit`, true); else setSaved(true) } catch (reason) { setError(reason) } finally { setBusy(false) } }
  async function remove() { if (!window.confirm(l('deleteConfirm'))) return; setBusy(true); setError(null); try { await request(`/api/funeral-homes/${record.funeralHomeId}/delete`, {}); setDirty(false); navigate('/funeralHomes', true) } catch (reason) { setError(reason) } finally { setBusy(false) } }
  return <><form id="form--funeralHome" onSubmit={save}><fieldset disabled={busy}><input name="funeralHomeId" type="hidden" value={str(record, 'funeralHomeId')} /><Panel title={t('contracts.funeralHome')}><AddressEditor prefix="funeralHome" form={form} setValue={setValue} options={options} t={t} nameLabel={t('contracts.funeralHomeName')} idPrefix="funeralHome" requiredName maxName={200} phone /></Panel>{error ? <ErrorMessage error={error} t={t} /> : null}{saved && <p role="status" className="notification success">{l('saved')}</p>}<div className="actions places-form-actions"><Link className="button" href={create ? '/funeralHomes' : `/funeralHomes/${record.funeralHomeId}`}>{t(create ? 'cancel' : 'view')}</Link>{!create && <button type="button" className="danger" id="button--deleteFuneralHome" onClick={remove}>{t('contracts.deleteFuneralHome')}</button>}<button className={dirty ? 'primary' : 'primary light'} type="submit">{t(create ? 'contracts.createNewFuneralHome' : 'contracts.updateFuneralHome')}</button></div></fieldset></form>{!create && <><FuneralUpcoming contracts={contracts} t={t} l={l} /><Metadata record={record} l={l} /><RecordAudit record={record} type="funeralHome" enabled={Boolean(options.auditLogEnabled) && user.userProperties.canUpdateContracts} t={t} l={l} /></>}</>
}

function AddressEditor({ prefix, idPrefix = 'contract', form, setValue, t, nameLabel, requiredName = false, maxName = 100, phone = false, email = false, autoFocusName = false }: { prefix: string; idPrefix?: string; form: Row; setValue: (key: string, value: string) => void; options: Row; t: Translate; nameLabel: string; requiredName?: boolean; maxName?: number; phone?: boolean; email?: boolean; autoFocusName?: boolean }) {
  const input = (suffix: string, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => <Field name={`${idPrefix}--${prefix}${suffix}`} label={label}><input id={`${idPrefix}--${prefix}${suffix}`} name={`${prefix}${suffix}`} value={str(form, `${prefix}${suffix}`)} onChange={(e) => setValue(`${prefix}${suffix}`, e.target.value)} autoComplete="off" {...props} /></Field>
  return <>{input('Name', nameLabel, { maxLength: maxName, required: requiredName, autoFocus: autoFocusName })}{input('Address1', t('addressLine1'), { maxLength: 50 })}{input('Address2', t('addressLine2'), { maxLength: 50 })}<div className="two-columns">{input('City', t('city'), { maxLength: 100, list: 'datalist--cityDefault' })}{input('Province', t('cemaris:state'), { maxLength: 100 })}{input('PostalCode', t('postalCode'), { minLength: 3, maxLength: 7, pattern: '[A-Za-z0-9 -]+', placeholder: '12345', autoComplete: 'postal-code' })}{phone && input('PhoneNumber', t('phoneNumber'), { maxLength: 30 })}{email && input('Email', t('emailAddress'), { maxLength: 100, type: 'email' })}</div></>
}

function ContractEditor({ data, options, create, user, t, l }: { data: Row; options: Row; create: boolean; user: User; t: Translate; l: Labels }) {
  const original = asRow(data.contract)
  const [form, setForm] = useState<Row>(() => ({ ...original, ...Object.fromEntries(rows(original, 'contractFields').map((field) => [`fieldValue_${field.contractTypeFieldId}`, field.fieldValue])) }))
  const [fields, setFields] = useState<Row[]>(rows(original, 'contractFields'))
  const [fieldBusy, setFieldBusy] = useState(false)
  const [fieldError, setFieldError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useDirty(l('unsaved'))
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [sitePicker, setSitePicker] = useState(false)
  const [arrivals, setArrivals] = useState<Row>(asRow(data.burialSiteDirectionsOfArrival))
  const [directors, setDirectors] = useState<string[]>((data.funeralDirectorNames || []) as string[])
  const servicesCollapsible = !create && !['funeralHomeId', 'funeralDirectorName', 'funeralDateString', 'directionOfArrival', 'committalTypeId'].some((key) => original[key] != null && original[key] !== '')
  const [servicesOpen, setServicesOpen] = useState(!servicesCollapsible)
  function setValue(key: string, value: string) { setForm((current) => ({ ...current, [key]: value })); setDirty(true); setSaved(false) }
  useEffect(() => {
    if (!create || !str(form, 'contractTypeId')) return
    const controller = new AbortController(); setFieldBusy(true); setFieldError(null)
    request<Row>('/api/contracts/doGetContractTypeFields', { contractTypeId: form.contractTypeId }, controller.signal).then((result) => { if (!controller.signal.aborted) setFields(rows(result, 'contractTypeFields')) }).catch((reason: unknown) => { if (!controller.signal.aborted) setFieldError(reason) }).finally(() => { if (!controller.signal.aborted) setFieldBusy(false) })
    return () => controller.abort()
  }, [create, form.contractTypeId])
  useEffect(() => {
    if (!str(form, 'funeralHomeId') || str(form, 'funeralHomeId') === 'new') { setDirectors([]); return }
    const controller = new AbortController()
    request<Row>('/api/contracts/doGetFuneralDirectors', { funeralHomeId: str(form, 'funeralHomeId') }, controller.signal).then((result) => { if (!controller.signal.aborted) setDirectors((result.funeralDirectorNames || []) as string[]) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [form.funeralHomeId])
  function selectSite(site: Row) {
    setForm((current) => ({ ...current, burialSiteId: site.burialSiteId || '', burialSiteName: site.burialSiteName || '' })); setDirty(true); setSitePicker(false)
    request<Row>('/api/contracts/doGetBurialSiteDirectionsOfArrival', { burialSiteId: site.burialSiteId || '' }).then((result) => { const next = asRow(result.burialSiteDirectionsOfArrival || result.directionsOfArrival); setArrivals(next); setForm((current) => next[str(current, 'directionOfArrival')] === undefined ? { ...current, directionOfArrival: '' } : current) }).catch(setError)
  }
  const input = (key: string, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => <Field name={`contract--${key}`} label={label}><input id={`contract--${key}`} name={key} value={str(form, key)} onChange={(e) => setValue(key, e.target.value)} {...props} /></Field>
  const select = (key: string, label: string, source: string, caption: string, none: string, required = false, locked = false, extra?: ReactNode) => <Field name={`contract--${key}`} label={label}><div className="input-addons"><select id={`contract--${key}`} name={key} required={required} value={str(form, key)} onChange={(e) => { if (key === 'contractTypeId' && !create && e.target.value !== str(original, key) && !window.confirm(l('changeType'))) return; setValue(key, e.target.value) }}><option value="">{none}</option>{rows(options, source).map((row) => <option key={str(row, key)} value={str(row, key)} disabled={locked && !unlocked.has(key) && str(row, key) !== str(original, key)}>{str(row, caption)}</option>)}{str(form, key) && !rows(options, source).some((row) => str(row, key) === str(form, key)) && str(form, key) !== 'new' && <option value={str(form, key)}>{str(original, caption)}</option>}{extra}</select>{locked && !unlocked.has(key) && <button type="button" aria-label={`${l('unlock')}: ${label}`} onClick={() => setUnlocked((value) => new Set([...value, key]))}>🔓</button>}</div></Field>
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null)
    if (options.burialSiteIdIsRequired && !form.burialSiteId) { setError(new ApiError('invalid', undefined, undefined, 400, l('selectSite'))); setBusy(false); return }
    try { const result = await request<Row>(`/api/contracts${create ? '' : `/${original.contractId}/update`}`, { ...Object.fromEntries(new FormData(event.currentTarget)), contractId: original.contractId || '' }); setDirty(false); if (create || form.contractTypeId !== original.contractTypeId) navigate(`/contracts/${result.contractId || original.contractId}/edit`, true); else setSaved(true) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  async function operation(op: 'delete' | 'copy') {
    if (op === 'copy' && dirty) { window.alert(l('saveFirst')); return }
    if (!window.confirm(l(op === 'copy' ? 'copyConfirm' : 'deleteConfirm'))) return
    setBusy(true); setError(null)
    try { const result = await request<Row>(`/api/contracts/${original.contractId}/${op}`, {}); setDirty(false); navigate(op === 'copy' ? `/contracts/${result.contractId}/edit` : '/contracts', true) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  if (create && !rows(options, 'contractTypes').length) return <p className="notification warning">{t('admin:contractTypeManagement')}: {t('noResults')} {user.userProperties.isAdmin && <Link href="/admin/contractTypes">{t('admin:contractTypeManagement')}</Link>}</p>
  return <><form id="form--contract" onSubmit={save}><fieldset disabled={busy}><input name="contractId" type="hidden" value={str(original, 'contractId')} /><Panel title={l('type')}><div className="two-columns"><div>{select('contractTypeId', l('type'), 'contractTypes', 'contractType', l('selectType'), true, !create)}<Field name="contract--burialSiteName" label={l('site')}><div className="input-addons"><input id="contract--burialSiteId" name="burialSiteId" type="hidden" value={str(form, 'burialSiteId')} /><input id="contract--burialSiteName" value={str(form, 'burialSiteName')} placeholder={`(${t('contracts.noBurialSite')})`} readOnly onClick={() => { if (create || unlocked.has('burialSiteId')) setSitePicker(true) }} /><button type="button" aria-label={`${l('unlock')}: ${l('site')}`} onClick={() => { if (!create && !unlocked.has('burialSiteId')) setUnlocked((value) => new Set([...value, 'burialSiteId'])); else setSitePicker(true) }}>{!create && !unlocked.has('burialSiteId') ? '🔓' : l('choose')}</button><button className="is-clear-burial-site-button" type="button" title={l('clear')} aria-label={l('clear')} onClick={() => { if (!create && !unlocked.has('burialSiteId')) window.alert(l('unlockClear')); else selectSite({ burialSiteId: '', burialSiteName: '' }) }}>⌫</button><button className="is-burial-site-view-button" type="button" title={l('openSite')} aria-label={l('openSite')} onClick={() => { if (form.burialSiteId) window.open(appUrl(`/burialSites/${form.burialSiteId}`), '_blank', 'noopener,noreferrer'); else window.alert(l('noSiteSelected')) }}>↗</button></div></Field>{input('contractStartDateString', l('date'), { type: 'date', required: true })}{options.contractEndDateIsAvailable !== false && input('contractEndDateString', l('end'), { type: 'date', min: str(form, 'contractStartDateString'), required: Boolean(options.contractEndDateIsRequired) })}</div><div id="container--contractFields">{fieldError ? <ErrorMessage error={fieldError} t={t} /> : fieldBusy ? <p role="status">{t('loading')}</p> : create && !form.contractTypeId ? <p className="notification info">{l('selectFields')}</p> : !fields.length ? <p className="notification info">{l('noFields')}</p> : <AdditionalFields fields={fields} form={form} create={create} setValue={setValue} t={t} />}</div></div></Panel><Panel title={l('services')} action={servicesCollapsible && <button id="panelToggle--services" type="button" className="small" aria-expanded={servicesOpen} aria-controls="container--services" onClick={() => setServicesOpen((value) => !value)}>{servicesOpen ? '▴' : '▾'} {l('services')}</button>}><div id="container--services" hidden={!servicesOpen}><div className="two-columns"><div>{select('funeralHomeId', t('contracts.funeralHome'), 'funeralHomes', 'funeralHomeName', `(${t('contracts.noFuneralHome')})`, false, false, create && <option value="new">{l('newFuneralHome')}</option>)}{create && str(form, 'funeralHomeId') === 'new' && <div id="container--newFuneralHome"><AddressEditor prefix="funeralHome" form={form} setValue={setValue} options={options} t={t} nameLabel={t('contracts.funeralHomeName')} maxName={200} phone /></div>}{input('funeralDirectorName', l('director'), { maxLength: 100, list: 'datalist--funeralDirectors' })}<datalist id="datalist--funeralDirectors">{directors.map((name) => <option key={name} value={name} />)}</datalist></div><div><div className="two-columns">{input('funeralDateString', t('contracts.serviceDate'), { type: 'date' })}{input('funeralTimeString', l('serviceTime'), { type: 'time', step: 900 })}</div><Field name="contract--directionOfArrival" label={l('direction')}><select id="contract--directionOfArrival" name="directionOfArrival" value={str(form, 'directionOfArrival')} onChange={(e) => setValue('directionOfArrival', e.target.value)}><option value="">({t('contracts.noDirection')})</option>{directions.filter((direction) => arrivals[direction] !== undefined).map((direction) => <option key={direction} value={direction}>{formatDirection(direction)}{arrivals[direction] ? ` - ${arrivals[direction]}` : ''}</option>)}</select></Field>{select('committalTypeId', l('committalType'), 'committalTypes', 'committalType', `(${t('contracts.noCommittalType')})`)}</div></div></div></Panel><div className="two-columns"><Panel title={l('purchaser')}><AddressEditor prefix="purchaser" form={form} setValue={setValue} options={options} t={t} nameLabel={l('purchaserName')} requiredName phone email />{input('purchaserRelationship', l('purchaserRelationship'), { maxLength: 100, list: 'datalist--purchaserRelationships' })}</Panel>{create && <RecipientEditor form={form} setValue={setValue} options={options} t={t} l={l} input={input} />}</div>{error ? <ErrorMessage error={error} t={t} /> : null}{saved && <p className="notification success" role="status">{l('saved')}</p>}<div className="actions places-form-actions"><Link className="button" href={create ? '/contracts' : `/contracts/${original.contractId}`}>{t(create ? 'cancel' : 'view')}</Link>{!create && <PrintMenu kind="contract" id={original.contractId} t={t} />}{!create && <><button id="button--copyContract" type="button" onClick={() => operation('copy')}>{l('copy')}</button><button id="button--deleteContract" type="button" className="danger" onClick={() => operation('delete')}>{l('deleteContract')}</button></>}<button type="submit" className={dirty ? 'primary' : 'primary light'} disabled={fieldBusy || Boolean(fieldError)}>{t(create ? 'contracts.createNewContract' : 'update')}</button></div></fieldset></form>{sitePicker && <BurialSitePicker selected={form} options={options} user={user} t={t} l={l} onClose={() => setSitePicker(false)} onSelect={selectSite} />}{create ? <p className="notification info">{l('detailsAfterCreate')}</p> : <><PreservedChildren canUpdateWorkOrders={user.userProperties.canUpdateWorkOrders} contract={original} options={options} editable dirty={dirty} t={t} l={l} /><RelatedContracts contract={original} editable t={t} l={l} /><ContractComments contract={original} editable t={t} l={l} /><Metadata record={original} l={l} /><RecordAudit record={original} type="contract" enabled={Boolean(options.auditLogEnabled)} t={t} l={l} /></>}<datalist id="datalist--cityDefault"><option value={str(options, 'defaultCity') || str(original, 'purchaserCity')} /></datalist><datalist id="datalist--purchaserRelationships">{((options.purchaserRelationships || []) as string[]).map((relationship) => <option key={relationship} value={relationship} />)}</datalist></>
}

function AdditionalFields({ fields, form, create, setValue, t }: { fields: Row[]; form: Row; create: boolean; setValue: (key: string, value: string) => void; t: Translate }) {
  return <><input name="contractTypeFieldIds" type="hidden" value={fields.map((field) => field.contractTypeFieldId).join(',')} />{fields.map((field) => {
    const key = `${create ? 'contractFieldValue' : 'fieldValue'}_${field.contractTypeFieldId}`
    const value = str(form, key)
    const values = str(field, 'fieldValues').split('\n')
    return <Field key={key} name={`contract--${key}`} label={str(field, 'contractTypeField')}>{field.fieldType === 'select' || str(field, 'fieldValues') ? <select id={`contract--${key}`} name={key} required={Boolean(field.isRequired)} value={value} onChange={(e) => setValue(key, e.target.value)}><option value="">({t('contracts.notSet')})</option>{values.map((option, index) => <option key={index} value={option}>{option}</option>)}{value && !values.includes(value) && <option value={value}>{value}</option>}</select> : <input id={`contract--${key}`} name={key} type={str(field, 'fieldType') || 'text'} required={Boolean(field.isRequired)} value={value} minLength={field.minLength == null ? undefined : Number(field.minLength)} maxLength={field.maxLength == null ? undefined : Number(field.maxLength)} pattern={str(field, 'pattern') || undefined} onChange={(e) => setValue(key, e.target.value)} />}</Field>
  })}</>
}

function normalizeRecipientDates(form: Row, changedKey?: string, enforceFutureYear = false): Row {
  const now = new Date()
  const next: Row = { ...form }
  for (const prefix of ['birth', 'death']) {
    if (changedKey && changedKey !== `${prefix}Year` && changedKey !== `${prefix}Month`) continue
    const yearKey = `${prefix}Year`, monthKey = `${prefix}Month`, dayKey = `${prefix}Day`
    if (prefix === 'death' && (changedKey === yearKey || enforceFutureYear) && Number(next[yearKey]) > now.getFullYear()) next[yearKey] = String(now.getFullYear())
    const year = Math.trunc(Number(next[yearKey])), month = Math.trunc(Number(next[monthKey]))
    if (!changedKey || changedKey === yearKey) {
      const maxMonth = prefix === 'death' && year === now.getFullYear() ? now.getMonth() + 1 : 12
      if (str(next, monthKey) && month > maxMonth) next[monthKey] = String(maxMonth)
    }
    if (Number(next[monthKey])) {
      const maxDay = Math.min(Number(next[monthKey]) ? new Date(year || now.getFullYear(), Number(next[monthKey]), 0).getDate() : 31,
        prefix === 'death' && year === now.getFullYear() && Number(next[monthKey]) === now.getMonth() + 1 ? now.getDate() : 31)
      if (str(next, dayKey) && Number(next[dayKey]) > maxDay) next[dayKey] = String(maxDay)
    }
  }
  const birthYear = Math.trunc(Number(next.birthYear)), birthMonth = Math.trunc(Number(next.birthMonth)), birthDay = Math.trunc(Number(next.birthDay))
  if (birthYear && str(next, 'deathYear') && Number(next.deathYear) < birthYear) next.deathYear = String(birthYear)
  if (birthYear && birthMonth && Number(next.deathYear) === birthYear && str(next, 'deathMonth') && Number(next.deathMonth) < birthMonth) next.deathMonth = String(birthMonth)
  if (birthYear && birthMonth && birthDay && Number(next.deathYear) === birthYear && Number(next.deathMonth) === birthMonth && str(next, 'deathDay') && Math.trunc(Number(next.deathDay)) < birthDay) next.deathDay = String(birthDay)
  return next
}

function RecipientEditor({ form, setValue, options, t, l, input, idPrefix = 'contract', standalone = false }: { form: Row; setValue: (key: string, value: string) => void; options: Row; t: Translate; l: Labels; input: (key: string, label: string, props?: InputHTMLAttributes<HTMLInputElement>) => ReactNode; idPrefix?: string; standalone?: boolean }) {
  const now = new Date()
  function normalizeDates(changedKey?: string) {
    const next = normalizeRecipientDates(form, changedKey, !standalone)
    for (const key of ['birthYear', 'birthMonth', 'birthDay', 'deathYear', 'deathMonth', 'deathDay']) if (str(next, key) !== str(form, key)) setValue(key, str(next, key))
  }
  function dateParts(prefix: 'birth' | 'death') {
    const year = Number(form[`${prefix}Year`]); const month = Number(form[`${prefix}Month`])
    const maxMonth = prefix === 'death' && year === now.getFullYear() ? now.getMonth() + 1 : 12
    const maxDay = Math.min(month ? new Date(year || now.getFullYear(), month, 0).getDate() : 31, prefix === 'death' && year === now.getFullYear() && month === now.getMonth() + 1 ? now.getDate() : 31)
    const minYear = prefix === 'death' ? Number(form.birthYear) || 1 : 1800
    const minMonth = prefix === 'death' && year === Number(form.birthYear) ? Number(form.birthMonth) || 1 : 1
    const minDay = prefix === 'death' && year === Number(form.birthYear) && month === Number(form.birthMonth) ? Number(form.birthDay) || 1 : 1
    return <fieldset className="form-field"><legend>{l(prefix)}</legend><div className="contract-date-parts">{(['Year', 'Month', 'Day'] as const).map((part) => input(`${prefix}${part}`, l(part.toLowerCase()), { type: 'number', min: part === 'Year' ? minYear : part === 'Month' ? minMonth : minDay, max: part === 'Year' ? standalone && prefix === 'birth' ? 9999 : now.getFullYear() : part === 'Month' ? maxMonth : maxDay, placeholder: l(part === 'Year' ? 'yearHint' : part === 'Month' ? 'monthHint' : 'dayHint'), onBlur: () => normalizeDates(standalone ? `${prefix}${part}` : undefined) }))}</div></fieldset>
  }
  function copyPurchaser() { for (const suffix of ['Name', 'Address1', 'Address2', 'City', 'Province', 'PostalCode']) setValue(`deceased${suffix}`, str(form, `purchaser${suffix}`)) }
  const completeDates = standalone ? str(form, 'birthYear') !== '' && str(form, 'deathYear') !== '' : Number(form.birthYear) > 0 && Number(form.deathYear) > 0
  function calculateAge() {
    let years = Math.trunc(Number(form.deathYear)) - Math.trunc(Number(form.birthYear))
    if (['birthMonth', 'birthDay', 'deathMonth', 'deathDay'].every((key) => str(form, key) !== '')) {
      const born = new Date(Number(form.birthYear), Number(form.birthMonth) - 1, Number(form.birthDay))
      const died = new Date(Number(form.deathYear), Number(form.deathMonth) - 1, Number(form.deathDay))
      const days = Math.floor((died.getTime() - born.getTime()) / 86400000)
      years = Math.floor(days / 365.25)
      if (days > 0 && years === 0) { setValue('deathAge', String(days)); setValue('deathAgePeriod', 'Days'); return }
    }
    setValue('deathAge', String(Math.max(0, years))); setValue('deathAgePeriod', years > 0 ? 'Years' : 'Stillborn')
  }
  const periods = (options.deathAgePeriods || ['Years', 'Months', 'Days', 'Stillborn']) as string[]
  const agePeriod = standalone ? str(form, 'deathAgePeriod') : str(form, 'deathAgePeriod') || periods[0]
  const fields = <><AddressEditor prefix="deceased" idPrefix={idPrefix} form={form} setValue={setValue} options={options} t={t} nameLabel={standalone ? t('name') : l('recipientName')} requiredName maxName={200} autoFocusName={standalone} />{dateParts('birth')}{input('birthPlace', l('birthPlace'), { maxLength: 100, list: 'datalist--cityDefault' })}{dateParts('death')}{input('deathPlace', l('deathPlace'), { maxLength: 100, list: 'datalist--cityDefault' })}<div className="two-columns">{input('deathAge', l('age'), { type: 'number', min: 0, max: 150 })}<Field name={`${idPrefix}--deathAgePeriod`} label={l('agePeriod')}><select id={`${idPrefix}--deathAgePeriod`} name="deathAgePeriod" value={agePeriod} onChange={(e) => setValue('deathAgePeriod', e.target.value)}>{periods.map((period) => <option key={period} value={period}>{l(period)}</option>)}{!periods.includes(agePeriod) && <option value={agePeriod}>{l(agePeriod) || `(${t('contracts.notSet')})`}</option>}</select></Field></div><button type="button" id="button--calculateDeathAge" disabled={!completeDates} onClick={calculateAge}>{l('calculateAge')}</button>{(['intermentContainerType', 'intermentDepth'] as const).map((kind) => {
    const catalog = rows(options, `${kind}s`)
    const option = (row: Row) => <option key={str(row, `${kind}Id`)} value={str(row, `${kind}Id`)}>{str(row, kind)}</option>
    return <Field key={kind} name={`${idPrefix}--${kind}Id`} label={l(kind === 'intermentDepth' ? 'depth' : 'container')}><select id={`${idPrefix}--${kind}Id`} name={`${kind}Id`} value={str(form, `${kind}Id`)} onChange={(e) => setValue(`${kind}Id`, e.target.value)}><option value="">({t(kind === 'intermentDepth' ? 'contracts.noDepth' : 'contracts.noContainer')})</option>{kind === 'intermentContainerType' ? [false, true].map((cremated) => <optgroup key={String(cremated)} label={l(cremated ? 'cremated' : 'nonCremated')}>{catalog.filter((row) => Boolean(row.isCremationType) === cremated).map(option)}</optgroup>) : catalog.map(option)}{kind === 'intermentContainerType' && str(form, `${kind}Id`) && !catalog.some((row) => str(row, `${kind}Id`) === str(form, `${kind}Id`)) && <option value={str(form, `${kind}Id`)}>{str(form, kind)}</option>}</select></Field>
  })}</>
  return standalone ? fields : <Panel title={l('recipient')} action={<button type="button" id="button--copyFromPurchaser" className="small" onClick={copyPurchaser}>{l('copyPurchaser')}</button>}>{fields}</Panel>
}

function BurialSitePicker({ selected, options, user, t, l, onClose, onSelect }: { selected: Row; options: Row; user: User; t: Translate; l: Labels; onClose: () => void; onSelect: (row: Row) => void }) {
  const [tab, setTab] = useState('search')
  const [filter, setFilter] = useState<Row>({ burialSiteName: str(selected, 'burialSiteName'), contractStatus: selected.burialSiteId ? '' : 'unoccupied', limit: 100, offset: 0 })
  const [result, setResult] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [siteOptions, setSiteOptions] = useState<Row>(options)
  const [form, setForm] = useState<Row>({})
  useEffect(() => { const controller = new AbortController(); request<Row>('/api/burialSites/doSearchBurialSites', filter, controller.signal).then((value) => { if (!controller.signal.aborted) setResult(value) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) }); return () => controller.abort() }, [filter])
  useEffect(() => { if (tab !== 'new') return; const controller = new AbortController(); request<Row>('/api/burialSites/options', undefined, controller.signal).then((value) => { if (!controller.signal.aborted) setSiteOptions(value) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) }); return () => controller.abort() }, [tab])
  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(null); try { const result = await request<Row>('/api/burialSites/doCreateBurialSite', Object.fromEntries(new FormData(event.currentTarget))); onSelect(result) } catch (reason) { setError(reason) } finally { setBusy(false) } }
  const segments = asRow(asRow(siteOptions.burialSiteNameSegments).segments)
  return <Modal title={l('selectSite')} onClose={onClose}><div className="actions"><button type="button" className={tab === 'search' ? 'primary' : ''} onClick={() => setTab('search')}>{t('search')}</button>{user.userProperties.canUpdateCemeteries && <button type="button" className={tab === 'new' ? 'primary' : ''} onClick={() => setTab('new')}>{l('newSite')}</button>}<button type="button" onClick={() => onSelect({ burialSiteId: '', burialSiteName: '' })}>{l('clear')}</button></div>{error ? <ErrorMessage error={error} t={t} /> : null}{tab === 'search' ? <><form id="form--burialSiteSelect" onSubmit={(e) => e.preventDefault()}><Field name="burialSiteSelect--burialSiteName" label={l('site')}><input autoFocus id="burialSiteSelect--burialSiteName" value={str(filter, 'burialSiteName')} onChange={(e) => setFilter((value) => ({ ...value, burialSiteName: e.target.value }))} /></Field><Field name="burialSiteSelect--contractStatus" label={l('time')}><select id="burialSiteSelect--contractStatus" value={str(filter, 'contractStatus')} onChange={(e) => setFilter((value) => ({ ...value, contractStatus: e.target.value }))}>{[['', 'allStatuses'], ['unoccupied', 'unoccupied'], ['occupied', 'occupied']].map(([value, key]) => <option key={value} value={value}>{l(key)}</option>)}</select></Field></form><div id="resultsContainer--burialSiteSelect">{!result ? <p role="status">{t('loading')}</p> : !rows(result, 'burialSites').length ? <p>{t('noResults')}</p> : rows(result, 'burialSites').map((row) => <button className="contract-picker-row" type="button" key={str(row, 'burialSiteId')} onClick={() => onSelect(row)}><strong>{str(row, 'burialSiteName')}</strong><span>{str(row, 'cemeteryName')} · {str(row, 'burialSiteStatus')}</span>{Number(row.contractCount) > 0 && <small>{l('occupied')}</small>}</button>)}</div></> : <form id="form--burialSiteCreate" onSubmit={create}><fieldset disabled={busy}>{[['cemeteryId', 'cemeteries', 'cemeteryName', t('cemetery'), l('noCemetery')], ['burialSiteTypeId', 'burialSiteTypes', 'burialSiteType', l('siteType'), l('selectType')], ['burialSiteStatusId', 'burialSiteStatuses', 'burialSiteStatus', t('status'), l('noStatus')]].map(([key, source, caption, label, none]) => <Field key={key} name={`burialSiteCreate--${key}`} label={label}><select id={`burialSiteCreate--${key}`} name={key} required={key === 'burialSiteTypeId'} value={str(form, key)} onChange={(e) => setForm((value) => ({ ...value, [key]: e.target.value }))}><option value="">{none}</option>{rows(siteOptions, source).map((row) => <option key={str(row, key)} value={str(row, key)}>{str(row, caption)}</option>)}</select></Field>)}{[1, 2, 3, 4, 5].filter((index) => asRow(segments[String(index)]).isAvailable).map((index) => { const segment = asRow(segments[String(index)]); const key = `burialSiteNameSegment${index}`; return <Field key={key} name={`burialSiteCreate--${key}`} label={str(segment, 'label')}><input id={`burialSiteCreate--${key}`} name={key} required={Boolean(segment.isRequired)} minLength={Math.max(Math.min(Number(segment.minLength ?? 1), 20), 1)} maxLength={Math.max(Math.min(Number(segment.maxLength ?? 20), 20), 1)} value={str(form, key)} onChange={(e) => setForm((value) => ({ ...value, [key]: e.target.value }))} /></Field> })}<div className="actions"><button type="submit" className="primary">{l('newSite')}</button></div></fieldset></form>}</Modal>
}

function ContractView({ data, options, user, t, l }: { data: Row; options: Row; user: User; t: Translate; l: Labels }) {
  const contract = asRow(data.contract)
  return <div id="contract-detail"><div className="actions"><PrintMenu kind="contract" id={contract.contractId} t={t} /><Link className="button" href={`/contracts/${contract.contractId}/previous`} rel="prev">{l('previous')}</Link><Link className="button" href={`/contracts/${contract.contractId}/next`} rel="next">{t('next')}</Link>{user.userProperties.canUpdateContracts && <Link className="button primary" href={`/contracts/${contract.contractId}/edit`}>{t('edit')}</Link>}</div>{contract.contractEndDate ? <p className="notification warning">{l('finalized')}: {formatDate(str(contract, 'contractEndDateString'))}</p> : contract.contractIsFuture ? <p className="notification info">{l('future')}</p> : null}<Panel title={l('type')}><dl className="detail-grid"><dt>{l('type')}</dt><dd>{str(contract, 'contractType')}</dd><dt>{l('site')}</dt><dd>{contract.burialSiteId ? <Link href={`/burialSites/${contract.burialSiteId}`}>{str(contract, 'burialSiteName')}</Link> : `(${t('contracts.noBurialSite')})`}</dd>{Boolean(contract.burialSiteId) && <><dt>{t('cemetery')}</dt><dd>{contract.cemeteryId ? <Link href={`/cemeteries/${contract.cemeteryId}`}>{str(contract, 'cemeteryName')}</Link> : `(${t('contracts.noCemetery')})`}</dd></>}<dt>{l('date')}</dt><dd>{formatDate(str(contract, 'contractStartDateString'))}</dd>{options.contractEndDateIsAvailable !== false && <><dt>{l('end')}</dt><dd>{formatDate(str(contract, 'contractEndDateString')) || `(${t('contracts.noEndDate')})`}</dd></>}{rows(contract, 'contractFields').map((field) => <div className="detail-pair" key={str(field, 'contractTypeFieldId')}><dt>{str(field, 'contractTypeField')}</dt><dd>{str(field, 'fieldValue') || `(${t('contracts.noValue')})`}</dd></div>)}</dl></Panel><div className="two-columns"><Panel title={l('services')}><dl className="detail-grid"><dt>{t('contracts.funeralHome')}</dt><dd>{contract.funeralHomeId ? <><Link href={`/funeralHomes/${contract.funeralHomeId}`}>{str(contract, 'funeralHomeName')}</Link><Address record={contract} prefix="funeralHome" />{str(contract, 'funeralHomePhoneNumber')}</> : `(${t('contracts.noFuneralHome')})`}</dd><dt>{l('director')}</dt><dd>{str(contract, 'funeralDirectorName') || `(${t('contracts.noFuneralDirectorName')})`}</dd><dt>{t('contracts.serviceDate')}</dt><dd>{formatDate(str(contract, 'funeralDateString'))} {contract.funeralTime ? str(contract, 'funeralTimeString') : ''}</dd><dt>{l('direction')}</dt><dd>{formatDirection(str(contract, 'directionOfArrival'))} {str(contract, 'directionOfArrivalDescription')}</dd><dt>{l('committalType')}</dt><dd>{str(contract, 'committalType') || `(${t('contracts.noCommittalType')})`}</dd></dl></Panel><Panel title={l('purchaser')}><strong>{str(contract, 'purchaserName') || `(${t('contracts.noPurchaser')})`}</strong><Address record={contract} prefix="purchaser" /><p>{str(contract, 'purchaserPhoneNumber')}<br />{str(contract, 'purchaserEmail')}</p><p>{l('purchaserRelationship')}: {str(contract, 'purchaserRelationship')}</p></Panel></div><PreservedChildren canUpdateWorkOrders={user.userProperties.canUpdateWorkOrders} contract={contract} options={options} t={t} l={l} /><RelatedContracts contract={contract} editable={false} t={t} l={l} /><ContractComments contract={contract} editable={false} t={t} l={l} /><Metadata record={contract} l={l} /><RecordAudit record={contract} type="contract" enabled={Boolean(options.auditLogEnabled) && user.userProperties.canUpdateContracts} t={t} l={l} /></div>
}

function ContractInterments({ contract, options, editable, t, l }: { contract: Row; options: Row; editable: boolean; t: Translate; l: Labels }) {
  const [items, setItems] = useState<Row[]>(rows(contract, 'contractInterments'))
  const [editor, setEditor] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  async function remove(person: Row) {
    if (!window.confirm(l('removeIntermentConfirm'))) return
    setBusy(true); setError(null)
    try { const result = await request<Row>(`/api/contracts/${contract.contractId}/interments/${person.intermentNumber}/delete`, {}); setItems(rows(result, 'contractInterments')) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <Panel id="container--contractInterments" title={t('contracts.recipients')} action={<div className="places-actions"><a className="button small" href={appUrl(`/api/reports/contractInterments-byContractId?contractId=${contract.contractId}`)} download>CSV</a>{editable && <button id="button--addInterment" type="button" className="small success" disabled={busy} onClick={() => setEditor({})}>{l('addRecipient')}</button>}</div>}>{error ? <ErrorMessage error={error} t={t} /> : null}{!items.length ? <p>({t('contracts.noInterments')})</p> : items.map((person) => <article className="contract-recipient" data-interment-number={str(person, 'intermentNumber')} key={str(person, 'intermentNumber')}><div className="places-panel-heading"><h3>{str(person, 'deceasedName')}</h3>{editable && <div className="places-actions"><button className="small button--edit" type="button" disabled={busy} onClick={() => setEditor(person)}>{t('edit')}</button><button className="small danger button--delete" type="button" title={l('removeInterment')} disabled={busy} onClick={() => remove(person)}>{t('delete')}</button></div>}</div><Address record={person} prefix="deceased" /><dl className="detail-grid"><dt>{l('birth')}</dt><dd>{formatDate(str(person, 'birthDateString'))} {str(person, 'birthPlace')}</dd><dt>{l('death')}</dt><dd>{formatDate(str(person, 'deathDateString'))} {str(person, 'deathPlace')}</dd><dt>{l('age')}</dt><dd>{str(person, 'deathAge')} {l(str(person, 'deathAgePeriod'))}</dd><dt>{l('container')}</dt><dd>{str(person, 'intermentContainerType') || `(${t('contracts.noContainerType')})`}</dd><dt>{l('depth')}</dt><dd>{str(person, 'intermentDepth') || `(${t('contracts.noDepth')})`}</dd></dl></article>)}{editor && <ContractIntermentEditor contractId={contract.contractId} person={editor} options={options} t={t} l={l} onClose={() => setEditor(null)} onSaved={(next) => { setItems(next); setEditor(null) }} />}</Panel>
}

function ContractIntermentEditor({ contractId, person, options, t, l, onClose, onSaved }: { contractId: unknown; person: Row; options: Row; t: Translate; l: Labels; onClose: () => void; onSaved: (next: Row[]) => void }) {
  const edit = person.intermentNumber != null
  const idPrefix = `contractInterment${edit ? 'Edit' : 'Add'}`
  const [form, setForm] = useState<Row>(() => {
    const next: Row = { ...person, deathAgePeriod: edit ? str(person, 'deathAgePeriod') : (options.deathAgePeriods as string[] | undefined)?.[0] || 'Years' }
    for (const prefix of ['birth', 'death']) {
      const date = Number(person[`${prefix}Date`])
      next[`${prefix}Year`] = date ? String(Math.floor(date / 10000)) : ''
      next[`${prefix}Month`] = date && Math.floor(date % 10000 / 100) > 0 ? String(Math.floor(date % 10000 / 100)) : ''
      next[`${prefix}Day`] = date && date % 100 > 0 ? String(date % 100) : ''
    }
    // The original editor keeps a deleted container option, but a deleted depth
    // falls back to the blank option. Preserve this observable asymmetry.
    if (!rows(options, 'intermentDepths').some((depth) => str(depth, 'intermentDepthId') === str(next, 'intermentDepthId'))) next.intermentDepthId = ''
    return normalizeRecipientDates(next)
  })
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const setValue = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const input = (key: string, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => <Field name={`${idPrefix}--${key}`} label={label}><input id={`${idPrefix}--${key}`} name={key} value={str(form, key)} onChange={(e) => setValue(key, e.target.value)} {...props} /></Field>
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null)
    try { const result = await request<Row>(`/api/contracts/${contractId}/interments${edit ? `/${person.intermentNumber}` : ''}`, Object.fromEntries(new FormData(event.currentTarget))); onSaved(rows(result, 'contractInterments')) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <Modal title={l(edit ? 'updateRecipient' : 'addRecipient')} onClose={() => { if (!busy) onClose() }}><form id={`form--${idPrefix}`} onSubmit={save}><fieldset disabled={busy}><input id={`${idPrefix}--contractId`} name="contractId" type="hidden" value={String(contractId)} />{edit && <input id={`${idPrefix}--intermentNumber`} name="intermentNumber" type="hidden" value={str(person, 'intermentNumber')} />}<RecipientEditor form={form} setValue={setValue} options={options} t={t} l={l} input={input} idPrefix={idPrefix} standalone />{error ? <ErrorMessage error={error} t={t} /> : null}<div className="actions"><button type="button" onClick={onClose}>{t('cancel')}</button><button className="primary" type="submit">{l(edit ? 'updateRecipient' : 'addRecipient')}</button></div></fieldset></form></Modal>
}

function ContractServices({ contract, options, editable, t, l }: { contract: Row; options: Row; editable: boolean; t: Translate; l: Labels }) {
  const [items, setItems] = useState<Row[]>(rows(contract, 'contractServiceTypes'))
  const [editor, setEditor] = useState<Row | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const available = rows(options, 'serviceTypes').filter((service) => !items.some((current) => str(current, 'serviceTypeId') === str(service, 'serviceTypeId')))
  function add() {
    if (!available.length) { window.alert(l('allServicesAdded')); return }
    setEditorKey((value) => value + 1); setEditor({})
  }
  async function remove(service: Row) {
    if (!window.confirm(`${l('removeServiceTypeConfirm')}\n${str(service, 'serviceType')}`)) return
    setBusy(true); setError(null); setNotice('')
    try { const result = await request<Row>(`/api/contracts/${contract.contractId}/services/${service.serviceTypeId}/delete`, {}); setItems(rows(result, 'contractServiceTypes')); setNotice(l('serviceRemoved')) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  function saved(next: Row[], added: boolean) {
    setItems(next); setEditor(null); setNotice(l(added ? 'serviceAdded' : 'serviceUpdated'))
    if (added) {
      window.alert(l('serviceAdded'))
      const remaining = rows(options, 'serviceTypes').some((service) => !next.some((current) => str(current, 'serviceTypeId') === str(service, 'serviceTypeId')))
      if (remaining) { setEditorKey((value) => value + 1); setEditor({}) }
      else window.alert(l('allServicesAdded'))
    }
  }
  if (!editable && !items.length) return null
  return <Panel id="container--contractServiceTypes" title={l('serviceTypes')} action={editable && <button id="button--addServiceType" type="button" className="small success" disabled={busy} onClick={add}>{l('addServiceType')}</button>}>{error ? <ErrorMessage error={error} t={t} /> : null}{notice && <p className="notification success" role="status">{notice}</p>}{!items.length ? <p className="notification info">{l('noServiceTypes')}</p> : <div className="table-scroll"><table><thead><tr><th>{l('serviceType')}</th><th>{l('details')}</th>{editable && <th>{t('actions')}</th>}</tr></thead><tbody>{items.map((service) => <tr data-service-type-id={str(service, 'serviceTypeId')} key={str(service, 'serviceTypeId')}><td>{str(service, 'serviceType')}</td><td className="preserve-lines service-details">{str(service, 'contractServiceDetails')}</td>{editable && <td><div className="places-actions"><button className="small button--editServiceType" type="button" disabled={busy} onClick={() => { setEditorKey((value) => value + 1); setEditor(service) }}>{t('edit')}</button><button className="small danger button--deleteServiceType" type="button" title={l('removeServiceType')} disabled={busy} onClick={() => remove(service)}>{t('delete')}</button></div></td>}</tr>)}</tbody></table></div>}{editor && <ContractServiceEditor key={editorKey} contractId={contract.contractId} service={editor} available={available} t={t} l={l} onClose={() => setEditor(null)} onSaved={saved} />}</Panel>
}

function ContractServiceEditor({ contractId, service, available, t, l, onClose, onSaved }: { contractId: unknown; service: Row; available: Row[]; t: Translate; l: Labels; onClose: () => void; onSaved: (next: Row[], added: boolean) => void }) {
  const edit = service.serviceTypeId != null
  const idPrefix = `contractServiceType${edit ? 'Edit' : 'Add'}`
  const [form, setForm] = useState<Row>(edit ? service : { serviceTypeId: available[0]?.serviceTypeId || '', contractServiceDetails: '' })
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null)
    try { const result = await request<Row>(`/api/contracts/${contractId}/services${edit ? `/${service.serviceTypeId}` : ''}`, Object.fromEntries(new FormData(event.currentTarget))); onSaved(rows(result, 'contractServiceTypes'), !edit) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <Modal title={l(edit ? 'editServiceType' : 'addServiceType')} onClose={() => { if (!busy) onClose() }}><form id={`form--${idPrefix}`} onSubmit={save}><fieldset disabled={busy}><input id={`${idPrefix}--contractId`} name="contractId" type="hidden" value={String(contractId)} />{edit ? <><input id={`${idPrefix}--serviceTypeId`} name="serviceTypeId" type="hidden" value={str(service, 'serviceTypeId')} /><h3 id={`${idPrefix}--serviceTypeName`}>{str(service, 'serviceType')}</h3></> : <Field name={`${idPrefix}--serviceTypeId`} label={l('serviceType')}><select autoFocus id={`${idPrefix}--serviceTypeId`} name="serviceTypeId" required value={str(form, 'serviceTypeId')} onChange={(e) => setForm((current) => ({ ...current, serviceTypeId: e.target.value }))}>{available.map((row) => <option key={str(row, 'serviceTypeId')} value={str(row, 'serviceTypeId')}>{str(row, 'serviceType')}</option>)}</select></Field>}<Field name={`${idPrefix}--contractServiceDetails`} label={l('details')}><textarea autoFocus={edit} id={`${idPrefix}--contractServiceDetails`} name="contractServiceDetails" maxLength={500} rows={3} value={str(form, 'contractServiceDetails')} onChange={(e) => setForm((current) => ({ ...current, contractServiceDetails: e.target.value }))} /></Field>{error ? <ErrorMessage error={error} t={t} /> : null}<div className="actions"><button type="button" onClick={onClose}>{t('cancel')}</button><button className="primary" type="submit">{edit ? t('update') : l('addServiceType')}</button></div></fieldset></form></Modal>
}

function PreservedChildren({ contract, options, editable = false, dirty = false, canUpdateWorkOrders = false, t, l }: { contract: Row; options: Row; editable?: boolean; dirty?: boolean; canUpdateWorkOrders?: boolean; t: Translate; l: Labels }) {
  return <><ContractServices contract={contract} options={options} editable={editable} t={t} l={l} /><ContractInterments contract={contract} options={options} editable={editable} t={t} l={l} />
    <ContractFinance contract={contract} options={options} editable={editable} dirty={dirty} t={t} l={l} />
    <ContractWorkOrders dateAliases={asRow(options.workOrderAliases)} contract={contract} canUpdate={canUpdateWorkOrders && editable} dirty={dirty} t={t} language={document.documentElement.lang === 'de' ? 'de' : 'en'} />
    <ContractAttachments contract={contract} editable={editable} t={t} l={l} /></>

}
function RelatedContracts({ contract, editable, t, l }: { contract: Row; editable: boolean; t: Translate; l: Labels }) {
  const [items, setItems] = useState<Row[]>(rows(contract, 'relatedContracts'))
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<unknown>(null)
  async function remove(row: Row) { if (!window.confirm(l('removeRelatedConfirm'))) return; try { const result = await request<Row>('/api/contracts/doDeleteRelatedContract', { contractId: contract.contractId, relatedContractId: row.contractId }); setItems(rows(result, 'relatedContracts')) } catch (reason) { setError(reason) } }
  if (!editable && !items.length) return null
  return <Panel id="container--relatedContracts" title={t('contracts.relatedContracts')} action={editable && <button className="small success" id="button--addRelatedContract" type="button" onClick={() => setOpen(true)}>{t('contracts.addRelatedContract')}</button>}>{error ? <ErrorMessage error={error} t={t} /> : null}{items.length ? <ContractTable contracts={items} t={t} l={l} onRemove={editable ? remove : undefined} /> : <p>{l('noRelated')}</p>}{open && <RelatedPicker contract={contract} t={t} l={l} onClose={() => setOpen(false)} onSaved={(next) => { setItems(next); setOpen(false) }} />}</Panel>
}
function RelatedPicker({ contract, t, l, onClose, onSaved }: { contract: Row; t: Translate; l: Labels; onClose: () => void; onSaved: (next: Row[]) => void }) {
  const [filter, setFilter] = useState<Row>({ notContractId: contract.contractId, notRelatedContractId: contract.contractId, burialSiteName: str(contract, 'burialSiteName'), burialSiteNameSearchType: '', offset: 0, limit: 100 })
  const [result, setResult] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { const controller = new AbortController(); setResult(null); request<Row>('/api/contracts/doGetPossibleRelatedContracts', filter, controller.signal).then((value) => { if (!controller.signal.aborted) setResult(value) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) }); return () => controller.abort() }, [filter])
  async function choose(row: Row) { setBusy(true); try { const result = await request<Row>('/api/contracts/doAddRelatedContract', { contractId: contract.contractId, relatedContractId: row.contractId }); onSaved(rows(result, 'relatedContracts')) } catch (reason) { setError(reason) } finally { setBusy(false) } }
  return <Modal title={t('contracts.addRelatedContract')} onClose={onClose}><fieldset disabled={busy}><form onSubmit={(e) => e.preventDefault()}><Field name="relatedContractSelect--burialSiteName" label={l('site')}><div className="input-addons"><select aria-label={l('site')} value={str(filter, 'burialSiteNameSearchType')} onChange={(e) => setFilter((current) => ({ ...current, burialSiteNameSearchType: e.target.value }))}>{[['', 'contains'], ['startsWith', 'startsWith'], ['endsWith', 'endsWith']].map(([value, key]) => <option key={value} value={value}>{l(key)}</option>)}</select><input autoFocus id="relatedContractSelect--burialSiteName" value={str(filter, 'burialSiteName')} onChange={(e) => setFilter((current) => ({ ...current, burialSiteName: e.target.value }))} /></div></Field></form>{error ? <ErrorMessage error={error} t={t} /> : !result ? <p role="status">{t('loading')}</p> : <ContractTable contracts={rows(result, 'contracts')} t={t} l={l} onSelect={choose} />}</fieldset></Modal>
}

function ContractComments({ contract, editable, t, l }: { contract: Row; editable: boolean; t: Translate; l: Labels }) {
  const [items, setItems] = useState<Row[]>(rows(contract, 'contractComments'))
  const [editor, setEditor] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  async function remove(row: Row) { if (!window.confirm(l('deleteComment'))) return; try { const result = await request<Row>('/api/contracts/doDeleteContractComment', { contractId: contract.contractId, contractCommentId: row.contractCommentId }); setItems(rows(result, 'contractComments')) } catch (reason) { setError(reason) } }
  if (!editable && !items.length) return null
  return <Panel id="container--contractComments" title={t('comments')} action={editable && <button className="small success" type="button" id="button--addComment" onClick={() => setEditor({})}>{l('addComment')}</button>}>{error ? <ErrorMessage error={error} t={t} /> : null}{!items.length ? <p>{l('noComments')}</p> : <div className="table-scroll"><table><thead><tr><th>{l('author')}</th><th>{l('commentDate')}</th><th>{l('comment')}</th>{editable && <th>{t('actions')}</th>}</tr></thead><tbody>{items.map((row) => <tr key={str(row, 'contractCommentId')}><td>{str(row, 'recordCreate_username')}</td><td>{formatDate(str(row, 'commentDateString'))} {row.commentTime ? str(row, 'commentTimePeriodString') : ''}</td><td className="preserve-lines">{str(row, 'comment')}</td>{editable && <td><div className="places-actions"><button className="small" type="button" onClick={() => setEditor(row)}>{t('edit')}</button><button className="small danger" type="button" onClick={() => remove(row)}>{t('delete')}</button></div></td>}</tr>)}</tbody></table></div>}{editor && <ContractCommentEditor contractId={contract.contractId} comment={editor} t={t} l={l} onClose={() => setEditor(null)} onSaved={(next) => { setItems(next); setEditor(null) }} />}</Panel>
}
function ContractCommentEditor({ contractId, comment, t, l, onClose, onSaved }: { contractId: unknown; comment: Row; t: Translate; l: Labels; onClose: () => void; onSaved: (next: Row[]) => void }) {
  const edit = comment.contractCommentId != null
  const [form, setForm] = useState<Row>(comment)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const today = localDateInput()
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); try { const result = await request<Row>(`/api/contracts/${edit ? 'doUpdateContractComment' : 'doAddContractComment'}`, { ...Object.fromEntries(new FormData(event.currentTarget)), contractId, contractCommentId: comment.contractCommentId }); onSaved(rows(result, 'contractComments')) } catch (reason) { setError(reason) } finally { setBusy(false) } }
  return <Modal title={l(edit ? 'editComment' : 'addComment')} onClose={onClose}><form onSubmit={save}><fieldset disabled={busy}><Field name="contractComment--comment" label={l('comment')}><textarea autoFocus id="contractComment--comment" name="comment" required rows={5} value={str(form, 'comment')} onChange={(e) => setForm((value) => ({ ...value, comment: e.target.value }))} /></Field>{edit && <div className="two-columns"><Field name="contractComment--commentDateString" label={l('commentDate')}><input id="contractComment--commentDateString" type="date" name="commentDateString" required value={str(form, 'commentDateString')} max={str(comment, 'commentDateString') > today ? str(comment, 'commentDateString') : today} onChange={(e) => setForm((value) => ({ ...value, commentDateString: e.target.value }))} /></Field><Field name="contractComment--commentTimeString" label={l('commentTime')}><input id="contractComment--commentTimeString" type="time" name="commentTimeString" required value={str(form, 'commentTimeString')} onChange={(e) => setForm((value) => ({ ...value, commentTimeString: e.target.value }))} /></Field></div>}{error ? <ErrorMessage error={error} t={t} /> : null}<div className="actions"><button type="button" onClick={onClose}>{t('cancel')}</button><button className="primary" type="submit">{t(edit ? 'update' : 'add')}</button></div></fieldset></form></Modal>
}

function RecordAudit({ record, type, enabled, t, l }: { record: Row; type: 'contract' | 'funeralHome'; enabled: boolean; t: Translate; l: Labels }) {
  const [open, setOpen] = useState(false)
  if (!enabled) return null
  return <><div className="actions"><button className="is-view-audit-log-button" type="button" onClick={() => setOpen(true)}>{t('auditLog')}</button></div>{open && <AuditModal record={record} type={type} t={t} l={l} onClose={() => setOpen(false)} />}</>
}
function AuditModal({ record, type, t, l, onClose }: { record: Row; type: 'contract' | 'funeralHome'; t: Translate; l: Labels; onClose: () => void }) {
  const [offset, setOffset] = useState(0)
  const [result, setResult] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  useEffect(() => { const controller = new AbortController(); setResult(null); request<Row>(`/api/${type === 'contract' ? 'contracts' : 'funeralHomes'}/doGetRecordAuditLog`, { mainRecordType: type, mainRecordId: record[`${type}Id`], offset, limit: 50 }, controller.signal).then((value) => { if (!controller.signal.aborted) setResult(value) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) }); return () => controller.abort() }, [record, type, offset])
  return <Modal title={t('auditLog')} onClose={onClose}><Metadata record={record} l={l} />{error ? <ErrorMessage error={error} t={t} /> : !result ? <p role="status">{t('loading')}</p> : <><div className="table-scroll"><table><thead><tr><th>{l('date')}</th><th>{l('author')}</th><th>{t('type')}</th><th>{t('description')}</th><th>{t('cemaris:value')}</th></tr></thead><tbody>{rows(result, 'auditLogEntries').map((row, index) => <tr key={index}><td>{formatDate(str(row, 'logDateString'))} {str(row, 'logTimePeriodString') || str(row, 'logTimeString')}</td><td>{str(row, 'updateUsername')}</td><td>{str(row, 'updateType')}</td><td>{str(row, 'updateTable')} · {str(row, 'updateField')}</td><td className="preserve-lines">{str(row, 'fromValue')} → {str(row, 'toValue')}</td></tr>)}</tbody></table></div><Pager result={result} offset={offset} limit={50} onPage={setOffset} t={t} l={l} /></>}</Modal>
}
