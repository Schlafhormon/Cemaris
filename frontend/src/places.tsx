import { formatDirection, formatDate, displayLocale, localDateInput } from './format'
import { appUrl } from './paths'
/* Functional page flows ported from Sunrise CMS cemetery/burial site views,
 * browser handlers and dialogs. Copyright (c) 2026 The Corporation of the
 * City of Sault Ste. Marie. MIT notice: /THIRD-PARTY-NOTICES.txt. */
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ApiError, request } from './api'
import type { User } from './api'
import type { Language, Translate } from './i18n'
import { ErrorMessage, Link, Modal, navigate } from './ui'
import { BurialGeography, CemeteryGeography, CemeterySvg, CoordinateSelector, GeoTools } from './geo'

type Row = Record<string, unknown>
type Labels = (key: string) => string
const str = (row: Row, key: string): string => row[key] === null || row[key] === undefined ? '' : String(row[key])
const rows = (row: Row, key: string): Row[] => Array.isArray(row[key]) ? row[key] as Row[] : []
const text = (value: unknown): string => value === null || value === undefined ? '' : String(value)
const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const pairs: Record<string, [string, string]> = {
  findBurialSite: ['Find a Burial Site', 'Grabstätte suchen'], burialSite: ['Burial Site', 'Grabstätte'], burialSiteName: ['Burial Site Name', 'Grabstättenname'],
  burialSiteType: ['Burial Site Type', 'Grabstättenart'], burialSiteStatus: ['Burial Site Status', 'Grabstättenstatus'],
  allTypes: ['(All Burial Site Types)', '(Alle Grabstättenarten)'], allCemeteries: ['(All Cemeteries)', '(Alle Friedhöfe)'], allStatuses: ['(All Statuses)', '(Alle Status)'],
  contains: ['contains', 'enthält'], startsWith: ['starts with', 'beginnt mit'], endsWith: ['ends with', 'endet mit'],
  results: ['Results per page', 'Ergebnisse pro Seite'], noBurialSites: ['There are no burial sites that meet the search criteria.', 'Es gibt keine Grabstätten, die den Suchkriterien entsprechen.'],
  currentContracts: ['Has Current Contracts', 'Hat laufende Verträge'], noTypes: ['There are currently no burial site types available.', 'Es sind derzeit keine Grabstättenarten verfügbar.'],
  selectType: ['(Select a Type)', '(Art auswählen)'], bodyCapacity: ['Body Capacity', 'Sargkapazität'], crematedCapacity: ['Cremated Capacity', 'Urnenkapazität'],
  capacity: ['Capacity', 'Kapazität'], bodies: ['bodies', 'Särge'], cremated: ['cremated remains', 'Urnen'],
  selectTypeFields: ['Select the burial site type to load the available fields.', 'Wählen Sie die Grabstättenart, um die verfügbaren Zusatzfelder zu laden.'],
  noFields: ['The current burial site type has no additional fields.', 'Die aktuelle Grabstättenart hat keine Zusatzfelder.'],
  notSet: ['(Not Set)', '(Nicht festgelegt)'], unlock: ['Unlock Field', 'Feld entsperren'],
  changeType: ['Are you sure you want to change the burial site type? This change affects the additional fields associated with this record.', 'Möchten Sie die Grabstättenart ändern? Diese Änderung betrifft die Zusatzfelder dieses Datensatzes.'],
  saved: ['Changes saved successfully.', 'Änderungen erfolgreich gespeichert.'], unsaved: ['You have unsaved changes. Leave this page?', 'Es gibt ungespeicherte Änderungen. Diese Seite verlassen?'],
  deleteCemetery: ['Are you sure you want to delete this cemetery and all related burial sites?', 'Möchten Sie diesen Friedhof und alle zugehörigen Grabstätten löschen?'],
  deleteBurialSite: ['Delete Burial Site', 'Grabstätte löschen'], deleteSiteConfirm: ['Are you sure you want to delete this burial site?', 'Möchten Sie diese Grabstätte löschen?'],
  restoreBurialSite: ['Restore Burial Site', 'Grabstätte wiederherstellen'], restoreConfirm: ['Are you sure you want to restore this burial site? It will be visible again.', 'Möchten Sie diese Grabstätte wiederherstellen? Sie wird wieder sichtbar.'],
  deleted: ['This burial site has been deleted. It is no longer available for use.', 'Diese Grabstätte wurde gelöscht. Sie steht nicht mehr zur Verfügung.'],
  restoreContact: ['To restore this burial site, please contact your system administrator.', 'Wenden Sie sich zum Wiederherstellen an die Systemadministration.'],
  previousBurialSite: ['Previous Burial Site', 'Vorherige Grabstätte'], nextBurialSite: ['Next Burial Site', 'Nächste Grabstätte'], previous: ['Previous', 'Zurück'],
  addComment: ['Add Comment', 'Kommentar hinzufügen'], editComment: ['Edit Comment', 'Kommentar bearbeiten'], updateComment: ['Update Comment', 'Kommentar speichern'],
  comment: ['Comment', 'Kommentar'], author: ['Author', 'Verfasser'], commentDate: ['Comment Date', 'Kommentardatum'], commentTime: ['Comment Time', 'Kommentarzeit'],
  noComments: ['There are no comments to display.', 'Es sind keine Kommentare vorhanden.'], deleteComment: ['Delete Comment', 'Kommentar löschen'], deleteCommentConfirm: ['Are you sure you want to remove this comment?', 'Möchten Sie diesen Kommentar löschen?'],
  noContracts: ['There are no contracts associated with this burial site.', 'Dieser Grabstätte sind keine Verträge zugeordnet.'], contractType: ['Contract Type', 'Vertragsart'],
  contractDate: ['Contract Date', 'Vertragsdatum'], endDate: ['End Date', 'Enddatum'], interments: ['Interments', 'Beisetzungen'],
  active: ['Active', 'Aktiv'], past: ['Past', 'Vergangen'], future: ['Future Contract', 'Zukünftiger Vertrag'],
  togglePast: ['Show/Hide Past Contracts', 'Vergangene Verträge anzeigen/ausblenden'], noWorkOrders: ['There are no work orders associated with this burial site.', 'Dieser Grabstätte sind keine Arbeitsaufträge zugeordnet.'],
  imageFile: ['Image File', 'Bilddatei'], cemeterySvgId: ['Cemetery SVG ID', 'Friedhofs-SVG-ID'],
  created: ['Created', 'Erstellt'], updated: ['Updated', 'Geändert'], deletedAt: ['Deleted', 'Gelöscht'],
  occupied: ['Has Current Contracts', 'Hat laufende Verträge'], unoccupied: ['No Current Contracts', 'Ohne laufende Verträge'], allContracts: ['(All Contracts)', '(Alle Verträge)'],
  contractStatus: ['Contract Status', 'Vertragsstatus'], noImage: ['There are no images associated with this burial site.', 'Dieser Grabstätte sind keine Bilder zugeordnet.'],
}

interface Props { t: Translate; language: Language; user: User; location: string }

export function Places({ t, language, user, location }: Props) {
  const l: Labels = (key) => pairs[key]?.[language === 'de' ? 1 : 0] ?? t(key)
  const parts = location.split('?')[0].split('/').filter(Boolean)
  const cemeteryPage = parts[0].toLowerCase() === 'cemeteries'
  const base = cemeteryPage ? '/cemeteries' : '/burialSites'
  const id = parts[1] && /^\d+$/.test(parts[1]) ? parts[1] : ''
  const isCreate = parts[1]?.toLowerCase() === 'new'
  const isEdit = Boolean(id) && parts[2]?.toLowerCase() === 'edit'
  const geoPage = !cemeteryPage && ['map', 'creator', 'gpscapture'].includes(parts[1]?.toLowerCase() || '') ? parts[1].toLowerCase() : ''
  const navigation = parts[2]?.toLowerCase()
  const [options, setOptions] = useState<Row | null>(null)
  const [detail, setDetail] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setOptions(null); setDetail(null); setError(null)
    if (navigation === 'next' || navigation === 'previous') {
      request<Row>(`/api${base}/${id}/${navigation}`, undefined, controller.signal).then((result) => {
        if (!controller.signal.aborted) {
          const nextId = result[cemeteryPage ? 'cemeteryId' : 'burialSiteId']
          const error = `no${navigation === 'next' ? 'Next' : 'Previous'}${cemeteryPage ? 'Cemetery' : 'BurialSite'}IdFound`
          navigate(nextId ? `${base}/${nextId}` : `${base}?error=${error}`, true)
        }
      }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    } else {
      const query = isCreate ? window.location.search : ''
      Promise.all([request<Row>(`/api${base}/options${query}`, undefined, controller.signal), id ? request<Row>(`/api${base}/${id}`, undefined, controller.signal) : Promise.resolve(null)])
        .then(([nextOptions, nextDetail]) => {
          if (controller.signal.aborted) return
          if (isEdit && !cemeteryPage && (nextDetail?.burialSite as Row)?.recordDelete_timeMillis != null) {
            navigate(`${base}?error=burialSiteIdNotFound`, true)
            return
          }
          setOptions(nextOptions); setDetail(nextDetail)
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return
          if (id && reason instanceof ApiError && reason.status === 404) navigate(`${base}?error=${cemeteryPage ? 'cemeteryIdNotFound' : 'burialSiteIdNotFound'}`, true)
          else setError(reason)
        })
    }
    return () => controller.abort()
  }, [base, id, isCreate, isEdit, navigation, location, attempt, cemeteryPage])
  useEffect(() => {
    if (geoPage) return
    const record = detail?.[cemeteryPage ? 'cemetery' : 'burialSite'] as Row | undefined
    const title = record ? str(record, cemeteryPage ? 'cemeteryName' : 'burialSiteName')
      : t(cemeteryPage ? isCreate ? 'cemeteries.createNewCemetery' : 'cemeteries.cemeterySearch' : isCreate ? 'cemeteries.createBurialSite' : 'cemeteries.burialSiteSearch')
    document.title = `${title}: Cemaris`
  }, [cemeteryPage, detail, isCreate, geoPage, t])
  const reload = () => setAttempt((current) => current + 1)
  const searchError = new URLSearchParams(location.split('?')[1] || '').get('error')
  // The source search handlers deliberately use these English diagnostic
  // messages in every language, with an unchanged fallback for unknown errors.
  const searchErrorMessages: Record<string, string> = {
    cemeteryIdNotFound: 'Cemetery ID not found.', noNextCemeteryIdFound: 'No next Cemetery ID found.', noPreviousCemeteryIdFound: 'No previous Cemetery ID found.',
    burialSiteIdNotFound: 'Burial Site ID not found.', noNextBurialSiteIdFound: 'No next Burial Site ID found.', noPreviousBurialSiteIdFound: 'No previous Burial Site ID found.',
  }
  const breadcrumb = <><nav className="breadcrumb"><Link href="/dashboard">{t('home')}</Link><span>›</span><Link href={base}>{t(cemeteryPage ? 'cemeteries' : 'cemeteries.burialSites')}</Link>{id && detail && <><span>›</span><Link href={`${base}/${id}`}>{str(detail[cemeteryPage ? 'cemetery' : 'burialSite'] as Row, cemeteryPage ? 'cemeteryName' : 'burialSiteName') || `(${t('cemeteries.noName')})`}</Link></>}{(isCreate || isEdit) && <><span>›</span><span>{t(isCreate ? 'create' : 'update')}</span></>}</nav>{searchError && <p className="notification danger" role="alert"><strong>{cemeteryPage ? t('cemeteries.cemeteryError') : 'Burial Site Error'}</strong><br />{searchErrorMessages[searchError] || searchError}</p>}</>
  if (error) return <>{breadcrumb}<ErrorMessage error={error} t={t} /><button onClick={reload}>{t('cemaris:retry')}</button></>
  if (!options || (id && !detail)) return <>{breadcrumb}<p role="status">{t('loading')}</p></>
  if (geoPage) return <GeoTools key={location} page={geoPage} options={options} user={user} t={t} />
  if (cemeteryPage) return <>{breadcrumb}{isCreate || isEdit ? <CemeteryEditor key={`${base}/${id}/${isCreate}/${attempt}`} options={options} data={detail || {}} isCreate={isCreate} user={user} t={t} l={l} /> : id ? <CemeteryView options={options} data={detail!} user={user} t={t} l={l} /> : <CemeterySearch options={options} user={user} t={t} l={l} />}</>
  return <>{breadcrumb}{isCreate || isEdit ? <BurialEditor key={`${base}/${id}/${isCreate}/${attempt}`} options={options} data={detail || {}} isCreate={isCreate} user={user} t={t} l={l} reload={reload} /> : id ? <BurialView options={options} data={detail!} user={user} t={t} l={l} reload={reload} /> : <BurialSearch key={location} options={options} user={user} t={t} l={l} />}</>
}

function Menu({ user, t }: { user: User; t: Translate }) {
  return <aside className="places-menu"><Link href="/cemeteries">{t('cemeteries.cemeterySearch')}</Link><Link href="/burialSites">{t('cemeteries.burialSiteSearch')}</Link><Link href="/burialSites/map">{t('cemeteries.burialSiteMap')}</Link>{user.userProperties.canUpdateCemeteries && <><Link href="/burialSites/creator">{t('cemeteries.burialSiteRangeCreator')}</Link><Link href="/burialSites/gpsCapture">{t('cemeteries.gpsCoordinateCapture')}</Link><hr /><Link href="/cemeteries/new">{t('cemeteries.newCemetery')}</Link><Link href="/burialSites/new">{t('cemeteries.newBurialSite')}</Link></>}</aside>
}

function Field({ label, name, children }: { label: string; name: string; children: ReactNode }) {
  return <div className="form-field"><label htmlFor={name}>{label}</label>{children}</div>
}

function Metadata({ record, l }: { record: Row; l: Labels }) {
  return <div className="record-metadata small-text muted">{['Create', 'Update', 'Delete'].map((operation) => record[`record${operation}_timeMillis`] ? <span key={operation}>{l(operation === 'Create' ? 'created' : operation === 'Update' ? 'updated' : 'deletedAt')}: {str(record, `record${operation}_username`)} · {new Date(Number(record[`record${operation}_timeMillis`])).toLocaleString(displayLocale())}</span> : null)}</div>
}

function useDirty(message: string) {
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  function update(value: boolean) { dirtyRef.current = value; setDirty(value) }
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirtyRef.current) { event.preventDefault(); event.returnValue = '' } }
    const click = (event: MouseEvent) => {
      if (!dirtyRef.current || event.defaultPrevented || event.button !== 0) return
      const link = (event.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null
      if (link && !link.target && link.getAttribute('href')?.startsWith('/') && !window.confirm(message)) { event.preventDefault(); event.stopPropagation() }
    }
    window.addEventListener('beforeunload', unload); document.addEventListener('click', click, true)
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', click, true) }
  }, [message])
  return [dirty, update] as const
}

function CemeterySearch({ options, user, t, l }: { options: Row; user: User; t: Translate; l: Labels }) {
  const [filter, setFilter] = useState('')
  const filtered = rows(options, 'cemeteries').filter((cemetery) => {
    const searchable = ['cemeteryName', 'cemeteryKey', 'cemeteryDescription', 'cemeteryAddress1', 'cemeteryAddress2'].map((key) => str(cemetery, key)).join(' ').toLowerCase()
    return filter.trim().toLowerCase().split(' ').every((piece) => searchable.includes(piece))
  })
  return <div className="places-layout"><Menu user={user} t={t} /><div className="stack"><h1>{t('cemeteries.findACemetery')}</h1><a className="button light" href={appUrl("/api/reports/cemeteries-formatted")} download>CSV</a><form className="box places-search" id="form--searchFilters" onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="searchFilter--cemetery">{t('search')}</label><input id="searchFilter--cemetery" placeholder={t('cemeteries.searchPlaceholder')} value={filter} onChange={(event) => setFilter(event.target.value)} /></form>{!filtered.length ? <p className="notification info">{t('cemeteries.noCemeteriesFound')}</p> : <div className="table-scroll"><table id="cemeteries-table"><thead><tr><th>{t('cemetery')}</th><th>{t('address')}</th><th>{t('phoneNumber')}</th><th>{t('cemeteries.features')}</th><th>{t('cemeteries.burialSites')}</th></tr></thead><tbody>{filtered.map((cemetery) => <tr key={str(cemetery, 'cemeteryId')}><td><Link href={`/cemeteries/${cemetery.cemeteryId}`}><strong>{str(cemetery, 'cemeteryName') || `(${t('cemeteries.noName')})`}</strong> {str(cemetery, 'cemeteryKey') && <span className="tag">{str(cemetery, 'cemeteryKey')}</span>}</Link><br /><small>{str(cemetery, 'cemeteryDescription')}</small></td><td><Address record={cemetery} /></td><td>{str(cemetery, 'cemeteryPhoneNumber')}</td><td>{typeof cemetery.cemeteryLatitude === 'number' && typeof cemetery.cemeteryLongitude === 'number' && <span title={t('cemeteries.geographicLocation')}>📍 </span>}{str(cemetery, 'cemeterySvg') && <span title={t('cemeteries.image')}>▧ </span>} {cemetery.parentCemeteryId != null && <Link href={`/cemeteries/${cemetery.parentCemeteryId}`} title={`${t('cemeteries.parentCemetery')}: ${str(cemetery, 'parentCemeteryName')}`}>↥ {str(cemetery, 'parentCemeteryName') || `(${t('cemeteries.noName')})`}</Link>}</td><td><Link href={`/burialSites?cemeteryId=${cemetery.cemeteryId}`}>{str(cemetery, 'burialSiteCount') || '0'}</Link></td></tr>)}</tbody></table></div>}<span className="sr-only">{l('results')}: {filtered.length}</span></div></div>
}

function Address({ record }: { record: Row }) {
  return <>{str(record, 'cemeteryAddress1') && <>{str(record, 'cemeteryAddress1')}<br /></>}{str(record, 'cemeteryAddress2') && <>{str(record, 'cemeteryAddress2')}<br /></>}{[str(record, 'cemeteryPostalCode'), str(record, 'cemeteryCity')].filter(Boolean).join(' ')}{str(record, 'cemeteryProvince') && <><br />{str(record, 'cemeteryProvince')}</>}</>
}

function CemeterySummary({ data, t, canCreate = false }: { data: Row; t: Translate; canCreate?: boolean }) {
  const cemetery = data.cemetery as Row
  const count = Number(cemetery.burialSiteCount || 0)
  const base = `/burialSites?cemeteryId=${cemetery.cemeteryId}`
  return <section className="panel"><div className="panel-heading places-panel-heading"><h2>{t('cemeteries.burialSiteSummaries')} <Link className="tag" href={base}>{count}</Link></h2><a className="button small" href={appUrl(`/api/reports/burialSites-byCemeteryId?cemeteryId=${cemetery.cemeteryId}`)} download>CSV</a>{canCreate && <Link className="button small success" href={`/burialSites/new?cemeteryId=${cemetery.cemeteryId}`}>{t('cemeteries.createBurialSite')}</Link>}</div><div className="panel-body">{count === 0 ? <p>{t('cemeteries.noBurialSites')}</p> : <div className="two-columns">{[['burialSiteTypeSummary', 'type', 'burialSiteType'], ['burialSiteStatusSummary', 'status', 'burialSiteStatus']].map(([key, heading, column]) => <div className="table-scroll" key={key}><table><thead><tr><th>{t(heading)}</th><th>{t('cemeteries.burialSites')}</th><th>{t('cemeteries.percentage')}</th></tr></thead><tbody>{rows(data, key).map((row) => <tr key={str(row, `${column}Id`) || 'null'}><td>{row[`${column}Id`] == null ? `(${t('cemeteries.noStatus')})` : <Link href={`${base}&${column}Id=${row[`${column}Id`]}`}>{str(row, column)}</Link>}</td><td>{str(row, 'burialSiteCount')}</td><td>{((Number(row.burialSiteCount) / count) * 100).toFixed(1)}%</td></tr>)}</tbody></table></div>)}</div>}</div></section>
}

function CemeteryView({ options, data, user, t, l }: { options: Row; data: Row; user: User; t: Translate; l: Labels }) {
  const cemetery = data.cemetery as Row
  const id = str(cemetery, 'cemeteryId')
  const arrival = cemetery.directionsOfArrival as Row || {}
  return <div className="stack"><div className="page-heading"><h1>{str(cemetery, 'cemeteryName') || `(${t('cemeteries.noName')})`} {str(cemetery, 'cemeteryKey') && <span className="tag">{str(cemetery, 'cemeteryKey')}</span>}</h1><div className="places-actions"><Link className="button" href={`/cemeteries/${id}/previous`} rel="prev" title={t('cemeteries.previousCemetery')}>←</Link><Link className="button" href={`/cemeteries/${id}/next`} rel="next">{t('next')} →</Link>{user.userProperties.canUpdateCemeteries && <Link className="button primary" href={`/cemeteries/${id}/edit`}>{t('edit')}</Link>}</div></div><div className="box"><div className="two-columns"><div>{str(cemetery, 'cemeteryDescription') && <p><strong>{t('description')}</strong><br /><span className="preserve-lines">{str(cemetery, 'cemeteryDescription')}</span></p>}<p><strong>{t('address')}</strong><br /><Address record={cemetery} /></p>{str(cemetery, 'cemeteryPhoneNumber') && <p><strong>{t('phoneNumber')}</strong><br />{str(cemetery, 'cemeteryPhoneNumber')}</p>}</div><div>{cemetery.parentCemeteryId != null ? <p><strong>{t('cemeteries.parentCemetery')}</strong><br /><Link href={`/cemeteries/${cemetery.parentCemeteryId}`}>{str(cemetery, 'parentCemeteryName') || `(${t('cemeteries.noName')})`}</Link></p> : rows(cemetery, 'childCemeteries').length > 0 && <><strong>{t('cemeteries.childCemeteries')}</strong><ul>{rows(cemetery, 'childCemeteries').map((child) => <li key={str(child, 'cemeteryId')}><Link href={`/cemeteries/${child.cemeteryId}`}>{str(child, 'cemeteryName') || `(${t('cemeteries.noName')})`}</Link></li>)}</ul></>}{directions.some((direction) => arrival[direction]) && <><strong>{t('cemeteries.directionsOfArrival')}</strong><dl>{directions.filter((direction) => arrival[direction]).map((direction) => <div key={direction}><dt>{direction}</dt><dd>{str(arrival, direction)}</dd></div>)}</dl></>}</div></div></div><CemeteryGeography cemetery={cemetery} t={t} /><CemeterySummary data={data} t={t} /><Metadata record={cemetery} l={l} /><RecordAudit options={options} record={cemetery} type="cemetery" user={user} t={t} l={l} /></div>
}

function CemeteryEditor({ options, data, isCreate, user, t, l }: { options: Row; data: Row; isCreate: boolean; user: User; t: Translate; l: Labels }) {
  const cemetery = (isCreate ? options.cemetery : data.cemetery) as Row || {}
  const [form, setForm] = useState<Row>({ ...cemetery })
  const initialArrival = cemetery.directionsOfArrival as Row || {}
  const [arrival, setArrival] = useState<Row>({ ...initialArrival })
  const [checked, setChecked] = useState(new Set(directions.filter((direction) => initialArrival[direction])))
  const [dirty, setDirty] = useDirty(l('unsaved'))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const change = (key: string, value: string) => { setForm((current) => ({ ...current, [key]: value })); setDirty(true); setSaved(false) }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null); setSaved(false)
    const keys = ['cemeteryName', 'cemeteryKey', 'cemeteryDescription', 'cemeterySvg', 'cemeteryLatitude', 'cemeteryLongitude', 'cemeteryAddress1', 'cemeteryAddress2', 'cemeteryCity', 'cemeteryProvince', 'cemeteryPostalCode', 'cemeteryPhoneNumber', 'parentCemeteryId']
    const payload: Row = { ...Object.fromEntries(keys.map((key) => [key, str(form, key)])), cemeteryId: isCreate ? '' : cemetery.cemeteryId }
    for (const direction of directions) if (checked.has(direction)) { payload[`directionOfArrival_${direction}`] = direction; payload[`directionOfArrivalDescription_${direction}`] = str(arrival, direction) }
    try {
      const result = await request<Row>(`/api/cemeteries/${isCreate ? 'doCreateCemetery' : 'doUpdateCemetery'}`, payload)
      setDirty(false)
      if (isCreate) navigate(`/cemeteries/${result.cemeteryId}/edit`)
      else setSaved(true)
    } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  async function remove() {
    if (!window.confirm(l('deleteCemetery'))) return
    setBusy(true); setError(null)
    try { await request('/api/cemeteries/doDeleteCemetery', { cemeteryId: cemetery.cemeteryId }); setDirty(false); navigate('/cemeteries') } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  const input = (key: string, label: string, props: Record<string, unknown> = {}) => <Field label={label} name={`cemetery--${key}`}><input id={`cemetery--${key}`} name={key} value={str(form, key)} onChange={(event) => change(key, event.target.value)} {...props} /></Field>
  return <div className="stack"><h1>{t(isCreate ? 'cemeteries.createNewCemetery' : 'cemeteries.updateCemetery')}</h1>{error ? <ErrorMessage error={error} t={t} /> : null}{saved && <p className="notification success" role="status">{l('saved')}</p>}<form id="form--cemetery" className="places-editor" onSubmit={save}><input type="hidden" name="cemeteryId" value={isCreate ? '' : str(cemetery, 'cemeteryId')} /><fieldset disabled={busy}><div className="two-columns"><section className="panel"><div className="panel-body">{input('cemeteryName', t('cemeteries.cemeteryName'), { required: true, maxLength: 200, autoFocus: isCreate, autoComplete: 'off' })}{input('cemeteryKey', t('cemeteries.cemeteryKey'), { required: Boolean(options.includeCemeteryKey), maxLength: 20, autoComplete: 'off' })}{Boolean(options.includeCemeteryKey) && <p className="help-text">{t('cemeteries.cemeteryKeyDescription')}</p>}<Field label={t('cemeteries.cemeteryDescription')} name="cemetery--cemeteryDescription"><textarea id="cemetery--cemeteryDescription" name="cemeteryDescription" rows={4} value={str(form, 'cemeteryDescription')} onChange={(event) => change('cemeteryDescription', event.target.value)} /></Field><Field label={t('cemeteries.parentCemetery')} name="cemetery--parentCemeteryId"><select id="cemetery--parentCemeteryId" name="parentCemeteryId" value={str(form, 'parentCemeteryId')} disabled={rows(cemetery, 'childCemeteries').length > 0} onChange={(event) => change('parentCemeteryId', event.target.value)}><option value="">({t('cemeteries.noParentCemetery')})</option>{rows(options, 'cemeteries').filter((row) => row.cemeteryId !== cemetery.cemeteryId && row.parentCemeteryId == null).map((row) => <option key={str(row, 'cemeteryId')} value={str(row, 'cemeteryId')}>{str(row, 'cemeteryName') || `(${t('cemeteries.noName')})`}</option>)}</select></Field></div></section><section className="panel"><h2 className="panel-heading">{t('address')}</h2><div className="panel-body">{input('cemeteryAddress1', t('addressLine1'), { maxLength: 50, autoComplete: 'off' })}{input('cemeteryAddress2', t('addressLine2'), { maxLength: 50, autoComplete: 'off' })}<div className="two-columns">{input('cemeteryCity', t('city'), { maxLength: 100 })}{input('cemeteryProvince', t('cemaris:state'), { maxLength: 100 })}</div><div className="two-columns">{input('cemeteryPostalCode', t('postalCode'), { minLength: 5, maxLength: 5, pattern: '[0-9]{5}', inputMode: 'numeric', autoComplete: 'postal-code' })}{input('cemeteryPhoneNumber', t('phoneNumber'), { maxLength: 30, autoComplete: 'off' })}</div></div></section></div><div className="two-columns"><section className="panel"><h2 className="panel-heading">{t('cemeteries.geographicLocation')}</h2><div className="panel-body two-columns">{input('cemeteryLatitude', t('cemeteries.latitude'), { type: 'number', min: options.latitudeMin ?? -90, max: options.latitudeMax ?? 90, step: '0.00000001' })}{input('cemeteryLongitude', t('cemeteries.longitude'), { type: 'number', min: options.longitudeMin ?? -180, max: options.longitudeMax ?? 180, step: '0.00000001' })}</div><div className="panel-body"><CoordinateSelector options={options} latitude={str(form, 'cemeteryLatitude')} longitude={str(form, 'cemeteryLongitude')} onSelect={(latitude, longitude) => { change('cemeteryLatitude', latitude); change('cemeteryLongitude', longitude) }} t={t} /></div>{(rows(options, 'cemeterySVGs').length > 0 || Array.isArray(options.cemeterySVGs) && options.cemeterySVGs.length > 0 || str(form, 'cemeterySvg')) && <div className="panel-body"><Field label={t('cemeteries.svgFile')} name="cemetery--cemeterySvg"><select id="cemetery--cemeterySvg" name="cemeterySvg" value={str(form, 'cemeterySvg')} onChange={(event) => change('cemeterySvg', event.target.value)}><option value="">({t('cemeteries.selectAFile')})</option>{Array.from(new Set([...(options.cemeterySVGs as string[] || []), ...(str(form, 'cemeterySvg') ? [str(form, 'cemeterySvg')] : [])])).map((file) => <option key={file}>{file}</option>)}</select></Field>{str(form, 'cemeterySvg') && <CemeterySvg filename={str(form, 'cemeterySvg')} t={t} />}</div>}</section><section className="panel"><h2 className="panel-heading">{t('cemeteries.directionsOfArrival')}</h2><div className="panel-body"><div className="table-scroll"><table><thead><tr><th>{t('cemeteries.direction')}</th><th>{t('description')}</th></tr></thead><tbody>{directions.map((direction) => <tr key={direction}><td><label className="checkbox"><input id={`cemetery--directionOfArrival_${direction}`} name={`directionOfArrival_${direction}`} type="checkbox" value={direction} checked={checked.has(direction)} onChange={(event) => { setChecked((current) => { const next = new Set(current); if (event.target.checked) next.add(direction); else next.delete(direction); return next }); setDirty(true); setSaved(false) }} />{formatDirection(direction)}</label></td><td><input id={`cemetery--directionOfArrivalDescription_${direction}`} name={`directionOfArrivalDescription_${direction}`} aria-label={`${t('description')} ${direction}`} disabled={!checked.has(direction)} maxLength={100} value={str(arrival, direction)} onChange={(event) => { setArrival((current) => ({ ...current, [direction]: event.target.value })); setDirty(true); setSaved(false) }} /></td></tr>)}</tbody></table></div></div></section></div><div className="actions places-form-actions"><Link className="button" href={isCreate ? '/cemeteries' : `/cemeteries/${cemetery.cemeteryId}`}>{t(isCreate ? 'cancel' : 'view')}</Link>{!isCreate && <button className="danger" type="button" id="button--deleteCemetery" onClick={remove}>{t('cemeteries.deleteCemetery')}</button>}<button className={dirty ? 'primary' : 'primary light'} type="submit">{t(isCreate ? 'create' : 'update')}</button></div></fieldset></form>{!isCreate && <><CemeterySummary data={data} t={t} canCreate /><Metadata record={cemetery} l={l} /><RecordAudit options={options} record={cemetery} type="cemetery" user={user} t={t} l={l} /></>}</div>
}

function BurialSearch({ options, user, t, l }: { options: Row; user: User; t: Translate; l: Labels }) {
  const query = new URLSearchParams(window.location.search)
  const [filters, setFilters] = useState<Row>(() => Object.fromEntries(['burialSiteName', 'burialSiteNameSearchType', 'burialSiteTypeId', 'burialSiteStatusId', 'cemeteryId', 'contractStatus', 'workOrderId', 'hasCoordinates'].map((key) => [key, query.get(key) || ''])))
  const [limit, setLimit] = useState(100)
  const [offset, setOffset] = useState(0)
  const [result, setResult] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError(null); setResult(null)
    request<Row>('/api/burialSites/doSearchBurialSites', { ...filters, limit, offset }, controller.signal).then((response) => { if (!controller.signal.aborted) setResult(response) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [filters, limit, offset, attempt])
  const update = (key: string, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setOffset(0) }
  const select = (key: string, label: string, source: string, column: string, all: string) => <Field name={`searchFilter--${key}`} label={label}><select id={`searchFilter--${key}`} name={key} value={str(filters, key)} onChange={(event) => update(key, event.target.value)}><option value="">{all}</option>{rows(options, source).map((row) => <option key={str(row, key)} value={str(row, key)}>{str(row, column) || `(${t('cemeteries.noName')})`}</option>)}</select></Field>
  return <div className="places-layout"><Menu user={user} t={t} /><div><div className="page-heading"><h1>{l('findBurialSite')}</h1><label className="places-results-limit" htmlFor="searchFilter--limit">{l('results')}<select id="searchFilter--limit" name="limit" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setOffset(0) }}>{[50, 100, 250, 500].map((value) => <option key={value}>{value}</option>)}</select></label></div><form id="form--searchFilters" className="box places-search places-editor" onSubmit={(event) => event.preventDefault()}><input id="searchFilter--offset" name="offset" type="hidden" value={offset} /><div className="two-columns"><Field name="searchFilter--burialSiteName" label={l('burialSiteName')}><div className="input-addons"><select id="selectFilter--burialSiteNameSearchType" name="burialSiteNameSearchType" aria-label={t('search')} value={str(filters, 'burialSiteNameSearchType')} onChange={(event) => update('burialSiteNameSearchType', event.target.value)}><option value="">{l('contains')}</option><option value="startsWith">{l('startsWith')}</option><option value="endsWith">{l('endsWith')}</option></select><input id="searchFilter--burialSiteName" name="burialSiteName" value={str(filters, 'burialSiteName')} onChange={(event) => update('burialSiteName', event.target.value)} /></div></Field>{select('burialSiteTypeId', l('burialSiteType'), 'burialSiteTypes', 'burialSiteType', l('allTypes'))}</div><div className="two-columns">{select('cemeteryId', t('cemetery'), 'cemeteries', 'cemeteryName', l('allCemeteries'))}{select('burialSiteStatusId', t('status'), 'burialSiteStatuses', 'burialSiteStatus', l('allStatuses'))}</div>{str(filters, 'contractStatus') && <Field name="searchFilter--contractStatus" label={l('contractStatus')}><select id="searchFilter--contractStatus" value={str(filters, 'contractStatus')} onChange={(event) => update('contractStatus', event.target.value)}><option value="">{l('allContracts')}</option><option value="occupied">{l('occupied')}</option><option value="unoccupied">{l('unoccupied')}</option></select></Field>}</form>{error ? <><ErrorMessage error={error} t={t} /><button onClick={() => setAttempt((current) => current + 1)}>{t('cemaris:retry')}</button></> : !result ? <p role="status">{t('loading')}</p> : !rows(result, 'burialSites').length ? <p className="notification info">{l('noBurialSites')}</p> : <><div className="table-scroll"><table id="burialSites-table"><thead><tr><th>{l('burialSite')}</th><th>{t('cemetery')}</th><th>{l('burialSiteType')}</th><th>{t('status')}</th></tr></thead><tbody>{rows(result, 'burialSites').map((burialSite) => <tr key={str(burialSite, 'burialSiteId')}><td><Link href={`/burialSites/${burialSite.burialSiteId}`}><strong>{str(burialSite, 'burialSiteName')}</strong></Link></td><td>{burialSite.cemeteryId == null ? <span className="muted">({t('cemeteries.noCemetery')})</span> : <Link href={`/cemeteries/${burialSite.cemeteryId}`}>{str(burialSite, 'cemeteryName') || `(${t('cemeteries.noName')})`}</Link>}</td><td>{str(burialSite, 'burialSiteType')}</td><td>{burialSite.burialSiteStatusId == null ? <span className="muted">({t('cemeteries.noStatus')})</span> : str(burialSite, 'burialSiteStatus')}{Number(burialSite.contractCount || 0) > 0 && <><br /><small>{l('currentContracts')}</small></>}</td></tr>)}</tbody></table></div><Pager count={Number(result.count)} offset={Number(result.offset)} limit={limit} onPage={setOffset} t={t} l={l} /></>}</div></div>
}

function Pager({ count, offset, limit, onPage, t, l }: { count: number; offset: number; limit: number; onPage: (offset: number) => void; t: Translate; l: Labels }) {
  return <nav className="places-pager" aria-label={l('results')}><button type="button" data-page="previous" disabled={offset === 0} onClick={() => onPage(Math.max(offset - limit, 0))}>← {l('previous')}</button><span>{count === 0 ? 0 : offset + 1}–{Math.min(offset + limit, count)} / {count}</span><button type="button" data-page="next" disabled={offset + limit >= count} onClick={() => onPage(offset + limit)}>{t('next')} →</button></nav>
}

function Contracts({ burialSite, options, t, l }: { burialSite: Row; options: Row; t: Translate; l: Labels }) {
  const [showPast, setShowPast] = useState(false)
  const contracts = rows(burialSite, 'contracts')
  const today = Number(localDateInput().replaceAll('-', ''))
  const active = contracts.filter((contract) => !contract.contractEndDate || Number(contract.contractEndDate) >= today).length
  const past = contracts.length - active
  const endDateAvailable = options.contractEndDateIsAvailable !== false
  return <section className="panel"><div className="panel-heading places-panel-heading"><h2>{t('contracts')} {active > 0 && <span className="tag success">{active} {l('active')}</span>} {past > 0 && <span className="tag">{past} {l('past')}</span>}</h2>{past > 0 && <button className="small" type="button" id="burialSite--contractsToggle" onClick={() => setShowPast(!showPast)}>{l('togglePast')}</button>}</div><div className="panel-body">{contracts.length === 0 ? <p>{l('noContracts')}</p> : <div className="table-scroll"><table><thead><tr><th>{l('contractType')}</th><th>{l('contractDate')}</th>{endDateAvailable && <th>{l('endDate')}</th>}<th>{l('interments')}</th></tr></thead><tbody id="burialSite--contractsTbody">{contracts.filter((contract) => showPast || contract.contractIsActive !== false).map((contract) => <tr key={str(contract, 'contractId')} data-is-active={text(contract.contractIsActive)}><td><Link href={`/contracts/${contract.contractId}`}><strong>{str(contract, 'contractType')}</strong></Link><br /><small>#{str(contract, 'contractNumber')}</small>{contract.contractIsFuture === true && <span className="tag">{l('future')}</span>}</td><td>{formatDate(str(contract, 'contractStartDateString'))}</td>{endDateAvailable && <td>{str(contract, 'contractEndDateString') || `(${t('noEndDate')})`}</td>}<td>{rows(contract, 'contractInterments').length === 0 ? <span className="muted">({t('contracts.noInterments')})</span> : rows(contract, 'contractInterments').map((interment, index) => <div key={str(interment, 'contractIntermentId') || index}>{str(interment, 'deceasedName')} {str(interment, 'intermentContainerType') && <span className="tag">{str(interment, 'intermentContainerType')}</span>} {str(interment, 'intermentDepth') && <span className="tag">{str(interment, 'intermentDepth')}</span>}</div>)}</td></tr>)}</tbody></table></div>}</div></section>
}

function WorkOrders({ burialSite, t }: { burialSite: Row; t: Translate }) {
  const workOrders = rows(burialSite, 'workOrders')
  if (workOrders.length === 0) return null
  return <section className="panel"><h2 className="panel-heading">{t('workOrders')}</h2><div className="panel-body table-scroll"><table><thead><tr><th>{t('workOrders.workOrderNumber')}</th><th>{t('description')}</th><th>{t('status')}</th></tr></thead><tbody>{workOrders.map((workOrder) => <tr key={str(workOrder, 'workOrderId')}><td><Link href={`/workOrders/${workOrder.workOrderId}`}>{str(workOrder, 'workOrderNumber')}</Link></td><td>{str(workOrder, 'workOrderDescription')}</td><td>{str(workOrder, 'workOrderStatus')}</td></tr>)}</tbody></table></div></section>
}

function BurialView({ options, data, user, t, l, reload }: { options: Row; data: Row; user: User; t: Translate; l: Labels; reload: () => void }) {
  const burialSite = data.burialSite as Row
  const id = str(burialSite, 'burialSiteId')
  const deleted = burialSite.recordDelete_timeMillis != null
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  async function restore() {
    if (!window.confirm(l('restoreConfirm'))) return
    setBusy(true); setError(null)
    try { await request('/api/burialSites/doRestoreBurialSite', { burialSiteId: id }); reload() } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <div className="stack"><div className="page-heading"><h1>{str(burialSite, 'burialSiteName')}</h1><div className="places-actions">{deleted ? user.userProperties.isAdmin && <button type="button" className="danger is-restore-burial-site-button" disabled={busy} onClick={restore}>{l('restoreBurialSite')}</button> : <><Link className="button" href={`/burialSites/${id}/previous`} rel="prev" title={l('previousBurialSite')}>←</Link><Link className="button" href={`/burialSites/${id}/next`} rel="next" title={l('nextBurialSite')}>{t('next')} →</Link>{user.userProperties.canUpdateCemeteries && <Link className="button primary" href={`/burialSites/${id}/edit`}>{t('edit')}</Link>}</>}</div></div>{error ? <ErrorMessage error={error} t={t} /> : null}{deleted && <div className="notification danger"><h2>{t('cemeteries.burialSiteDeleted')}</h2><p>{l('deleted')}</p>{!user.userProperties.isAdmin && <p>{l('restoreContact')}</p>}</div>}<section className="panel"><div className="panel-body places-details"><div><p><strong>{t('cemetery')}</strong><br />{burialSite.cemeteryId == null ? `(${t('cemeteries.noCemetery')})` : <Link href={`/cemeteries/${burialSite.cemeteryId}`}>{str(burialSite, 'cemeteryName') || `(${t('cemeteries.noName')})`}</Link>}</p><p><strong>{l('burialSiteType')}</strong><br />{str(burialSite, 'burialSiteType')}</p></div><div><p><strong>{l('capacity')}</strong><br />{text(burialSite.effectiveBodyCapacity ?? burialSite.bodyCapacity ?? burialSite.bodyCapacityMax ?? options.bodyCapacityMaxDefault)} {l('bodies')}, {text(burialSite.effectiveCrematedCapacity ?? burialSite.crematedCapacity ?? burialSite.crematedCapacityMax ?? options.crematedCapacityMaxDefault)} {l('cremated')}</p><p><strong>{t('status')}</strong><br />{str(burialSite, 'burialSiteStatus') || `(${t('cemeteries.noStatus')})`}</p></div>{rows(burialSite, 'burialSiteFields').length > 0 && <div>{rows(burialSite, 'burialSiteFields').map((field) => <p key={str(field, 'burialSiteTypeFieldId')}><strong>{str(field, 'burialSiteTypeField')}</strong><br />{str(field, 'fieldValue') || `(${t('noValue')})`}</p>)}</div>}</div></section><BurialGeography site={burialSite} t={t} />{rows(burialSite, 'burialSiteComments').length > 0 && <Comments burialSite={burialSite} editable={false} t={t} l={l} />}<Contracts burialSite={burialSite} options={options} t={t} l={l} /><WorkOrders burialSite={burialSite} t={t} /><Metadata record={burialSite} l={l} /><RecordAudit options={options} record={burialSite} type="burialSite" user={user} t={t} l={l} /></div>
}

function BurialFields({ fields, form, setValue, isCreate, t, l }: { fields: Row[]; form: Row; setValue: (key: string, value: string) => void; isCreate: boolean; t: Translate; l: Labels }) {
  return <div id="container--burialSiteFields">{fields.length === 0 ? <p className="notification info">{l('noFields')}</p> : fields.map((field) => {
    const key = `fieldValue_${str(field, 'burialSiteTypeFieldId')}`
    const id = `burialSite--${key}`
    const values = str(field, 'fieldValues').split('\n')
    const selected = str(form, key)
    return <Field key={key} name={id} label={str(field, 'burialSiteTypeField')}>{str(field, 'fieldValues') || !isCreate && field.fieldType === 'select' ? <select id={id} name={key} required={isCreate && Boolean(field.isRequired)} value={selected} onChange={(event) => setValue(key, event.target.value)}>{(isCreate || !field.isRequired || selected === '') && <option value="">{l('notSet')}</option>}{values.map((value, index) => <option key={`${index}/${value}`} value={value}>{value}</option>)}{selected && !values.includes(selected) && <option value={selected}>{selected}</option>}</select> : <input id={id} name={key} type={isCreate ? 'text' : str(field, 'fieldType') || 'text'} value={selected} required={Boolean(field.isRequired)} minLength={field.minLength == null ? undefined : Number(field.minLength)} maxLength={field.maxLength == null ? undefined : Number(field.maxLength)} pattern={str(field, 'pattern') || undefined} onChange={(event) => setValue(key, event.target.value)} />}</Field>
  })}<input id="burialSite--burialSiteTypeFieldIds" name="burialSiteTypeFieldIds" type="hidden" value={fields.map((field) => str(field, 'burialSiteTypeFieldId')).join(',')} /><span className="sr-only">{t('cemaris:value')}</span></div>
}

function BurialEditor({ options, data, isCreate, user, t, l, reload }: { options: Row; data: Row; isCreate: boolean; user: User; t: Translate; l: Labels; reload: () => void }) {
  const burialSite = (isCreate ? options.burialSite : data.burialSite) as Row || {}
  const [form, setForm] = useState<Row>(() => ({ ...burialSite, ...Object.fromEntries(rows(burialSite, 'burialSiteFields').map((field) => [`fieldValue_${str(field, 'burialSiteTypeFieldId')}`, str(field, 'fieldValue')])) }))
  const [fields, setFields] = useState<Row[]>(rows(burialSite, 'burialSiteFields'))
  const [unlocked, setUnlocked] = useState(new Set<string>())
  const [dirty, setDirty] = useDirty(l('unsaved'))
  const [busy, setBusy] = useState(false)
  const [fieldsBusy, setFieldsBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [fieldError, setFieldError] = useState<unknown>(null)
  const selectedType = rows(options, 'burialSiteTypes').find((type) => str(type, 'burialSiteTypeId') === str(form, 'burialSiteTypeId')) || burialSite
  const segments = options.burialSiteNameSegments as Row || {}
  const segmentDefinitions = segments.segments as Record<string, Row> || { '1': { isAvailable: true, isRequired: true, label: 'Plot Number', minLength: 1, maxLength: 20 } }
  const cemetery = rows(options, 'cemeteries').find((row) => str(row, 'cemeteryId') === str(form, 'cemeteryId'))
  const setValue = (key: string, value: string) => { setForm((current) => ({ ...current, [key]: value })); setDirty(true); setSaved(false) }
  useEffect(() => {
    if (!isCreate) return
    const controller = new AbortController()
    setFields([]); setFieldError(null)
    if (!str(form, 'burialSiteTypeId')) { setFieldsBusy(false); return () => controller.abort() }
    setFieldsBusy(true)
    request<Row>('/api/burialSites/doGetBurialSiteTypeFields', { burialSiteTypeId: form.burialSiteTypeId }, controller.signal).then((result) => {
      if (!controller.signal.aborted) { const nextFields = rows(result, 'burialSiteTypeFields'); setFields(nextFields); setForm((current) => ({ ...current, ...Object.fromEntries(nextFields.map((field) => [`fieldValue_${str(field, 'burialSiteTypeFieldId')}`, ''])) })); setFieldsBusy(false) }
    }).catch((reason: unknown) => { if (!controller.signal.aborted) { setFieldError(reason); setFieldsBusy(false) } })
    return () => controller.abort()
  }, [form.burialSiteTypeId, isCreate])
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null); setSaved(false)
    // Serialize the actual successful form controls, as the source browser does:
    // hidden segments are absent, and a retired date/select value normalizes in
    // the browser before submission.
    const payload = { ...Object.fromEntries(new FormData(event.currentTarget)), burialSiteId: isCreate ? '' : str(burialSite, 'burialSiteId') }
    try {
      const result = await request<Row>(`/api/burialSites/${isCreate ? 'doCreateBurialSite' : 'doUpdateBurialSite'}`, payload)
      setDirty(false)
      if (isCreate) navigate(`/burialSites/${result.burialSiteId}/edit`)
      else if (str(form, 'burialSiteTypeId') !== str(burialSite, 'burialSiteTypeId')) reload()
      else setSaved(true)
    } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  async function remove() {
    if (!window.confirm(l('deleteSiteConfirm'))) return
    setBusy(true); setError(null)
    try { await request('/api/burialSites/doDeleteBurialSite', { burialSiteId: burialSite.burialSiteId }); setDirty(false); navigate('/burialSites') } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  function unlock(key: string) { setUnlocked((current) => new Set([...current, key])) }
  const input = (key: string, label: string, props: Record<string, unknown> = {}) => <Field label={label} name={`burialSite--${key}`}><input id={`burialSite--${key}`} name={key} value={str(form, key)} onChange={(event) => setValue(key, event.target.value)} {...props} /></Field>
  const typeOptions = rows(options, 'burialSiteTypes')
  const cemeteryOptions = rows(options, 'cemeteries')
  const statusOptions = rows(options, 'burialSiteStatuses')
  return <div className="stack"><h1>{isCreate ? t('cemeteries.createNewBurialSite') : str(burialSite, 'burialSiteName')}</h1>{isCreate && !typeOptions.length && <div className="notification warning"><p>{l('noTypes')}</p>{user.userProperties.isAdmin && <Link className="button warning" href="/admin/burialSiteTypes">{t('admin:burialSiteTypeManagement')}</Link>}</div>}{error ? <ErrorMessage error={error} t={t} /> : null}{saved && <p className="notification success" role="status">{l('saved')}</p>}<form id="form--burialSite" className="places-editor" onSubmit={save}><input id="burialSite--burialSiteId" name="burialSiteId" type="hidden" value={isCreate ? '' : str(burialSite, 'burialSiteId')} /><fieldset disabled={busy}><section className="panel"><div className="panel-body two-columns"><div><div className="two-columns"><Field name="burialSite--cemeteryId" label={t('cemetery')}><div className="input-addons"><select id="burialSite--cemeteryId" name="cemeteryId" value={str(form, 'cemeteryId')} autoFocus={isCreate} onChange={(event) => setValue('cemeteryId', event.target.value)}><option value="" disabled={!isCreate && !unlocked.has('cemeteryId') && Boolean(burialSite.cemeteryId)}>({t('cemeteries.noCemeterySelected')})</option>{cemeteryOptions.map((row) => <option key={str(row, 'cemeteryId')} value={str(row, 'cemeteryId')} disabled={!isCreate && !unlocked.has('cemeteryId') && row.cemeteryId !== burialSite.cemeteryId}>{str(row, 'cemeteryName') || `(${t('cemeteries.noName')})`}</option>)}{burialSite.cemeteryId != null && !cemeteryOptions.some((row) => row.cemeteryId === burialSite.cemeteryId) && <option value={str(burialSite, 'cemeteryId')}>{str(burialSite, 'cemeteryName')}</option>}</select>{!isCreate && !unlocked.has('cemeteryId') && <button type="button" title={l('unlock')} aria-label={`${l('unlock')}: ${t('cemetery')}`} onClick={() => unlock('cemeteryId')}>🔓</button>}</div></Field><Field name="burialSite--burialSiteTypeId" label={l('burialSiteType')}><div className="input-addons"><select id="burialSite--burialSiteTypeId" name="burialSiteTypeId" required value={str(form, 'burialSiteTypeId')} onChange={(event) => { if (!isCreate && event.target.value !== str(burialSite, 'burialSiteTypeId') && !window.confirm(l('changeType'))) return; setValue('burialSiteTypeId', event.target.value) }}>{isCreate && <option value="">{l('selectType')}</option>}{typeOptions.map((row) => <option key={str(row, 'burialSiteTypeId')} value={str(row, 'burialSiteTypeId')} disabled={!isCreate && !unlocked.has('burialSiteTypeId') && row.burialSiteTypeId !== burialSite.burialSiteTypeId}>{str(row, 'burialSiteType')}</option>)}{burialSite.burialSiteTypeId != null && !typeOptions.some((row) => row.burialSiteTypeId === burialSite.burialSiteTypeId) && <option value={str(burialSite, 'burialSiteTypeId')}>{str(burialSite, 'burialSiteType')}</option>}</select>{!isCreate && !unlocked.has('burialSiteTypeId') && <button type="button" title={l('unlock')} aria-label={`${l('unlock')}: ${l('burialSiteType')}`} onClick={() => unlock('burialSiteTypeId')}>🔓</button>}</div></Field></div><fieldset className="form-field"><legend>{l('burialSiteName')}</legend><div className="places-name-segments">{Boolean(segments.includeCemeteryKey) && <span className="domain" id="burialSite--cemeteryKey">{str(form, 'cemeteryId') ? cemetery ? str(cemetery, 'cemeteryKey') : str(burialSite, 'cemeteryKey') : ''}{str(segments, 'separator')}</span>}{[1, 2, 3, 4, 5].filter((index) => segmentDefinitions[String(index)]?.isAvailable).map((index) => {
    const segment = segmentDefinitions[String(index)]
    const key = `burialSiteNameSegment${index}`
    return <div className="places-name-segment" key={index}>{index !== 1 && str(segments, 'separator') && <span>{str(segments, 'separator')}</span>}{str(segment, 'prefix') && <span>{str(segment, 'prefix')}</span>}<input id={`burialSite--${key}`} name={key} aria-label={str(segment, 'label')} placeholder={str(segment, 'label')} required={Boolean(segment.isRequired)} minLength={Math.max(Math.min(Number(segment.minLength ?? 1), 20), 1)} maxLength={Math.max(Math.min(Number(segment.maxLength ?? 20), 20), 1)} value={str(form, key)} onChange={(event) => setValue(key, event.target.value)} />{str(segment, 'suffix') && <span>{str(segment, 'suffix')}</span>}</div>
  })}</div></fieldset><div className="two-columns">{input('bodyCapacity', l('bodyCapacity'), { type: 'number', min: 0, max: selectedType.bodyCapacityMax ?? options.bodyCapacityMaxDefault, step: 1, placeholder: text(selectedType.bodyCapacityMax ?? options.bodyCapacityMaxDefault) })}{input('crematedCapacity', l('crematedCapacity'), { type: 'number', min: 0, max: selectedType.crematedCapacityMax ?? options.crematedCapacityMaxDefault, step: 1, placeholder: text(selectedType.crematedCapacityMax ?? options.crematedCapacityMaxDefault) })}</div><Field name="burialSite--burialSiteStatusId" label={l('burialSiteStatus')}><select id="burialSite--burialSiteStatusId" name="burialSiteStatusId" value={str(form, 'burialSiteStatusId')} onChange={(event) => setValue('burialSiteStatusId', event.target.value)}><option value="">({t('cemeteries.noStatus')})</option>{statusOptions.map((row) => <option key={str(row, 'burialSiteStatusId')} value={str(row, 'burialSiteStatusId')}>{str(row, 'burialSiteStatus')}</option>)}{burialSite.burialSiteStatusId != null && !statusOptions.some((row) => row.burialSiteStatusId === burialSite.burialSiteStatusId) && <option value={str(burialSite, 'burialSiteStatusId')}>{str(burialSite, 'burialSiteStatus')}</option>}</select></Field></div><div>{fieldError ? <ErrorMessage error={fieldError} t={t} /> : fieldsBusy ? <p role="status">{t('loading')}</p> : isCreate && !str(form, 'burialSiteTypeId') ? <p className="notification info">{l('selectTypeFields')}</p> : <BurialFields fields={fields} form={form} setValue={setValue} isCreate={isCreate} t={t} l={l} />}</div></div></section><div className="two-columns"><section className="panel"><h2 className="panel-heading">{t('cemeteries.geographicLocation')}</h2><div className="panel-body two-columns">{input('burialSiteLatitude', t('cemeteries.latitude'), { type: 'number', min: options.latitudeMin ?? -90, max: options.latitudeMax ?? 90, step: '0.00000001' })}{input('burialSiteLongitude', t('cemeteries.longitude'), { type: 'number', min: options.longitudeMin ?? -180, max: options.longitudeMax ?? 180, step: '0.00000001' })}</div><div className="panel-body"><CoordinateSelector options={options} latitude={str(form, 'burialSiteLatitude')} longitude={str(form, 'burialSiteLongitude')} onSelect={(latitude, longitude) => { setValue('burialSiteLatitude', latitude); setValue('burialSiteLongitude', longitude) }} t={t} /></div></section><section className="panel"><h2 className="panel-heading">{t('cemeteries.image')}</h2><div className="panel-body">{input('cemeterySvgId', l('cemeterySvgId'), { maxLength: 100, pattern: '^[\\d\\w\\-]*$', autoComplete: 'off' })}<Field name="burialSite--burialSiteImage" label={l('imageFile')}><select id="burialSite--burialSiteImage" name="burialSiteImage" value={str(form, 'burialSiteImage')} onChange={(event) => setValue('burialSiteImage', event.target.value)}><option value="">({t('cemeteries.selectAFile')})</option>{(options.burialSiteImages as string[] || []).map((image) => <option key={image}>{image}</option>)}</select></Field>{cemetery && str(cemetery, 'cemeterySvg') && <CemeterySvg filename={str(cemetery, 'cemeterySvg')} svgId={str(form, 'cemeterySvgId')} t={t} />}</div></section></div><div className="actions places-form-actions"><Link className="button" href={isCreate ? '/burialSites' : `/burialSites/${burialSite.burialSiteId}`}>{t(isCreate ? 'cancel' : 'view')}</Link>{!isCreate && <button type="button" className="danger" id="button--deleteBurialSite" onClick={remove}>{l('deleteBurialSite')}</button>}<button type="submit" className={dirty ? 'primary' : 'primary light'} disabled={fieldsBusy || Boolean(fieldError)}>{t(isCreate ? 'cemeteries.createBurialSite' : 'cemeteries.updateBurialSite')}</button></div></fieldset></form>{!isCreate && <><Comments burialSite={burialSite} editable t={t} l={l} /><Contracts burialSite={burialSite} options={options} t={t} l={l} /><WorkOrders burialSite={burialSite} t={t} /><Metadata record={burialSite} l={l} /><RecordAudit options={options} record={burialSite} type="burialSite" user={user} t={t} l={l} /></>}</div>
}

function Comments({ burialSite, editable, t, l }: { burialSite: Row; editable: boolean; t: Translate; l: Labels }) {
  const [comments, setComments] = useState<Row[]>(rows(burialSite, 'burialSiteComments'))
  const [editor, setEditor] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  async function remove(comment: Row) {
    if (!window.confirm(l('deleteCommentConfirm'))) return
    setBusy(true); setError(null)
    try { const result = await request<Row>('/api/burialSites/doDeleteBurialSiteComment', { burialSiteId: burialSite.burialSiteId, burialSiteCommentId: comment.burialSiteCommentId }); setComments(rows(result, 'burialSiteComments')) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <section className="panel"><div className="panel-heading places-panel-heading"><h2>{t('comments')}</h2>{editable && <button id="burialSiteComments--add" className="small success" type="button" disabled={busy} onClick={() => setEditor({})}>{l('addComment')}</button>}</div><div className="panel-body" id="container--burialSiteComments">{error ? <ErrorMessage error={error} t={t} /> : null}{comments.length === 0 ? <p>{l('noComments')}</p> : <div className="table-scroll"><table><thead><tr><th>{l('author')}</th><th>{l('commentDate')}</th><th>{l('comment')}</th>{editable && <th><span className="sr-only">{t('moreOptions')}</span></th>}</tr></thead><tbody>{comments.map((comment) => <tr key={str(comment, 'burialSiteCommentId')} data-burial-site-comment-id={str(comment, 'burialSiteCommentId')}><td>{str(comment, 'recordCreate_username')}</td><td>{formatDate(str(comment, 'commentDateString'))} {comment.commentTime === 0 ? '' : str(comment, 'commentTimePeriodString')}</td><td className="preserve-lines">{str(comment, 'comment')}</td>{editable && <td><div className="places-actions"><button className="small light button--edit" type="button" disabled={busy} onClick={() => setEditor(comment)}>{t('edit')}</button><button className="small danger button--delete" type="button" disabled={busy} title={l('deleteComment')} onClick={() => remove(comment)}>{t('delete')}</button></div></td>}</tr>)}</tbody></table></div>}</div>{editor && <CommentEditor comment={editor} burialSiteId={str(burialSite, 'burialSiteId')} t={t} l={l} onClose={() => setEditor(null)} onSaved={(next) => { setComments(next); setEditor(null) }} />}</section>
}

function CommentEditor({ comment, burialSiteId, t, l, onClose, onSaved }: { comment: Row; burialSiteId: string; t: Translate; l: Labels; onClose: () => void; onSaved: (comments: Row[]) => void }) {
  const isEdit = comment.burialSiteCommentId != null
  const [form, setForm] = useState<Row>(comment)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const prefix = isEdit ? 'burialSiteCommentEdit' : 'burialSiteCommentAdd'
  const today = localDateInput()
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null)
    try { const result = await request<Row>(`/api/burialSites/${isEdit ? 'doUpdateBurialSiteComment' : 'doAddBurialSiteComment'}`, { ...Object.fromEntries(new FormData(event.currentTarget)), burialSiteId }); onSaved(rows(result, 'burialSiteComments')) } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <Modal title={l(isEdit ? 'editComment' : 'addComment')} onClose={onClose}><form id={isEdit ? 'form--burialSiteCommentEdit' : 'form--burialSiteCommentAdd'} className="places-editor" onSubmit={save}><fieldset disabled={busy}><input id={`${prefix}--burialSiteId`} name="burialSiteId" type="hidden" value={burialSiteId} />{isEdit && <input id={`${prefix}--burialSiteCommentId`} name="burialSiteCommentId" type="hidden" value={str(comment, 'burialSiteCommentId')} />}<Field name={`${prefix}--comment`} label={l('comment')}><textarea id={`${prefix}--comment`} name="comment" rows={5} value={str(form, 'comment')} required autoFocus onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} /></Field>{isEdit && <div className="two-columns"><Field name={`${prefix}--commentDateString`} label={l('commentDate')}><input id={`${prefix}--commentDateString`} name="commentDateString" type="date" required value={str(form, 'commentDateString')} max={str(comment, 'commentDateString') > today ? str(comment, 'commentDateString') : today} onChange={(event) => setForm((current) => ({ ...current, commentDateString: event.target.value }))} /></Field><Field name={`${prefix}--commentTimeString`} label={l('commentTime')}><input id={`${prefix}--commentTimeString`} name="commentTimeString" type="time" required value={str(form, 'commentTimeString')} onChange={(event) => setForm((current) => ({ ...current, commentTimeString: event.target.value }))} /></Field></div>}{error ? <ErrorMessage error={error} t={t} /> : null}<div className="actions"><button type="button" onClick={onClose}>{t('cancel')}</button><button type="submit" className="primary">{l(isEdit ? 'updateComment' : 'addComment')}</button></div></fieldset></form></Modal>
}

function RecordAudit({ options, record, type, user, t, l }: { options: Row; record: Row; type: 'cemetery' | 'burialSite'; user: User; t: Translate; l: Labels }) {
  const [open, setOpen] = useState(false)
  if (!options.auditLogEnabled || !user.userProperties.canUpdateCemeteries) return null
  return <><div className="actions"><button className="is-view-audit-log-button" type="button" onClick={() => setOpen(true)}>{t('auditLog')}</button></div>{open && <AuditModal record={record} type={type} t={t} l={l} onClose={() => setOpen(false)} />}</>
}

function AuditModal({ record, type, t, l, onClose }: { record: Row; type: 'cemetery' | 'burialSite'; t: Translate; l: Labels; onClose: () => void }) {
  const [offset, setOffset] = useState(0)
  const [result, setResult] = useState<Row | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError(null); setResult(null)
    request<Row>(`/api/${type === 'cemetery' ? 'cemeteries' : 'burialSites'}/doGetRecordAuditLog`, { mainRecordType: type, mainRecordId: record[`${type}Id`], offset, limit: 50 }, controller.signal).then((response) => { if (!controller.signal.aborted) setResult(response) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [record, type, offset, attempt])
  return <Modal title={t('auditLog')} onClose={onClose}><Metadata record={record} l={l} />{error ? <><ErrorMessage error={error} t={t} /><button onClick={() => setAttempt((current) => current + 1)}>{t('cemaris:retry')}</button></> : !result ? <p role="status">{t('loading')}</p> : <><div className="table-scroll"><table><thead><tr><th>{l('commentDate')}</th><th>{l('author')}</th><th>{t('type')}</th><th>{t('description')}</th><th>{t('cemaris:value')}</th></tr></thead><tbody>{rows(result, 'auditLogEntries').map((entry, index) => <tr key={index}><td>{formatDate(str(entry, 'logDateString'))} {str(entry, 'logTimePeriodString') || str(entry, 'logTimeString')}</td><td>{str(entry, 'updateUsername')}</td><td>{str(entry, 'updateType')}</td><td>{str(entry, 'updateTable')} · {str(entry, 'updateField')}</td><td className="preserve-lines">{str(entry, 'fromValue')} → {str(entry, 'toValue')}</td></tr>)}</tbody></table></div><Pager count={Number(result.count)} offset={offset} limit={50} onPage={setOffset} t={t} l={l} /></>}</Modal>
}
