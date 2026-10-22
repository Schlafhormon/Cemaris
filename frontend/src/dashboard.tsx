import { appUrl } from './paths'
/* Dashboard and update-log port of Sunrise CMS, MIT.
 * Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
 * Sources: views/dashboard, public/javascripts/updateLog.ts. */
import { useEffect, useState } from 'react'
import { formatTimestamp } from './format'
import { request } from './api'
import type { User } from './api'
import type { Language, Translate } from './i18n'
import { ErrorMessage, Link } from './ui'

interface DashboardData { configCounts: Record<string, number>; auditLogEnabled: boolean }

export function Dashboard({ t, user, error }: { t: Translate; user: User; error?: string }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  useEffect(() => {
    const controller = new AbortController()
    request<DashboardData>('/api/dashboard', undefined, controller.signal).then(setData).catch((reason: unknown) => { if (!controller.signal.aborted) setLoadError(reason) })
    return () => controller.abort()
  }, [])
  const properties = user.userProperties
  const cards = [
    { href: '/contracts', title: 'contracts', description: 'contracts.contractsDescription', links: [[properties.canUpdateContracts, '/contracts/new', 'contracts.newContract'], [true, '/funeralHomes', 'contracts.funeralHomes']] },
    { href: '/workOrders', title: 'workOrders', description: 'workOrders.workOrdersDescription', links: [[properties.canUpdateWorkOrders, '/workOrders/new', 'workOrders.newWorkOrder'], [true, '/workOrders/workday', 'workOrders.workdayReport']] },
    { href: '/burialSites', title: 'cemeteries.burialSites', description: 'cemeteries.burialSitesDescription', links: [[properties.canUpdateCemeteries, '/burialSites/new', 'cemeteries.newBurialSite'], [properties.canUpdateCemeteries, '/burialSites/map', 'cemeteries.burialSiteMap']] },
    { href: '/cemeteries', title: 'cemeteries', description: 'cemeteries.cemeteriesDescription', links: [[properties.canUpdateCemeteries, '/cemeteries/new', 'cemeteries.newCemetery']] },
    { href: '/reports', title: 'dashboard.reportLibrary', description: 'dashboard.reportLibraryDescription', links: [[true, '/dashboard/updateLog', 'dashboard.updateLog']] },
  ]
  const adminCards = [
    ['/admin/fees', 'feeManagement', ''], ['/admin/contractTypes', 'contractTypeManagement', 'contractTypes'],
    ['/admin/burialSiteTypes', 'burialSiteTypeManagement', 'burialSiteTypes'], ['/admin/tables', 'configTableManagement', 'configTables'],
    ['/admin/users', 'userManagement', ''], ['/admin/settings', 'settingsManagement', ''],
    ['/admin/database', 'databaseMaintenance', ''], ...(data?.auditLogEnabled ? [['/admin/auditLog', 'auditLog', '']] : []),
  ]
  return <><h1>Cemaris</h1>{error !== undefined && <div className="notification danger" role="alert"><strong>{t('dashboard.error')}</strong><p>{error === 'accessDenied' ? t('errors:accessDenied') : error === 'printConfigNotFound' ? t('cemaris:printConfigNotFound') : t('errors:badRequestMessage')}</p></div>}{Boolean(loadError) && <ErrorMessage error={loadError} t={t} />}<div className="dashboard-layout"><div className="dashboard-cards">{cards.map((card) => <section className="panel" key={card.href}><Link className="card-title" href={card.href}><h2>{t(card.title)}</h2><p>{t(card.description)}</p></Link>{card.links.some(([visible]) => visible) && <div className="panel-body stack">{card.links.filter(([visible]) => visible).map(([, href, label]) => <Link className="button light" key={String(href)} href={String(href)}>{t(String(label))}</Link>)}</div>}</section>)}</div><div className="stack"><section className="panel"><h2 className="panel-heading">{t('dashboard.userSettings')}</h2><div className="panel-body"><Link href="/dashboard/userSettings">{t('dashboard.userSettings')}</Link></div></section></div></div>{properties.isAdmin && <><h2>{t('admin:adminTools')}</h2><div className="dashboard-cards">{adminCards.map(([href, key, count]) => <section className="panel" key={href}><Link className="card-title" href={href}><h3>{t(`admin:${key}`)} {count && data?.configCounts[count] === 0 && <span className="tag danger">0</span>}</h3><p>{t(`admin:${key}Description`)}</p></Link></section>)}</div></>}</>
}

interface UpdateEntry {
  recordType: string; updateType: 'create' | 'update'; displayRecordId: string | null; recordId: number;
  recordDescription: string | null; recordCreate_timeMillis: number; recordCreate_username: string;
  recordUpdate_timeMillis: number; recordUpdate_username: string;
}
const labels = {
  en: { recordType: 'Record Type', all: '(All Record Types)', core: 'Core Records', work: 'Work Orders', finance: 'Transactions & Fees', comments: 'Comments', limit: 'Limit', type: 'Type', record: 'Record', description: 'Description', updated: 'Updated', created: 'Created', more: 'Load More', loading: 'Loading Update Log...', empty: 'No recent updates found.', open: 'Open Record', contract: 'Contract', contractTransactions: 'Contract Transaction', contractFee: 'Contract Fee', contractComment: 'Contract Comment', workOrder: 'Work Order', workOrderMilestone: 'Work Order Milestone', workOrderComment: 'Work Order Comment', burialSite: 'Burial Site', burialSiteComment: 'Burial Site Comment', allComments: 'All Comments' },
  de: { recordType: 'Datensatzart', all: '(Alle Datensatzarten)', core: 'Stammdatensätze', work: 'Arbeitsaufträge', finance: 'Transaktionen und Gebühren', comments: 'Kommentare', limit: 'Anzahl', type: 'Art', record: 'Datensatz', description: 'Beschreibung', updated: 'Geändert', created: 'Erstellt', more: 'Weitere laden', loading: 'Änderungsübersicht wird geladen…', empty: 'Keine aktuellen Änderungen gefunden.', open: 'Datensatz öffnen', contract: 'Vertrag', contractTransactions: 'Vertragstransaktion', contractFee: 'Vertragsgebühr', contractComment: 'Vertragskommentar', workOrder: 'Arbeitsauftrag', workOrderMilestone: 'Arbeitsauftragsmeilenstein', workOrderComment: 'Arbeitsauftragskommentar', burialSite: 'Grabstätte', burialSiteComment: 'Grabstättenkommentar', allComments: 'Alle Kommentare' },
}

export function updateRecordUrl(entry: Pick<UpdateEntry, 'recordType' | 'recordId'>) {
  const prefix = entry.recordType.startsWith('contract') ? 'contracts' : entry.recordType.startsWith('workOrder') ? 'workOrders' : entry.recordType.startsWith('burialSite') ? 'burialSites' : ''
  return prefix ? `/${prefix}/${entry.recordId}` : '#'
}

export const localTimestamp = formatTimestamp

export function UpdateLog({ t, user, language = 'de' }: { t: Translate; user: User; language?: Language }) {
  const text = labels[language]
  const [recordType, setRecordType] = useState('')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [sortBy, setSortBy] = useState('recordUpdate_timeMillis')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [entries, setEntries] = useState<UpdateEntry[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(null); setHasMore(false)
    request<{ updateLog: UpdateEntry[] }>('/api/dashboard/doGetRecordUpdateLog', { recordType, limit, offset, sortBy, sortDirection }, controller.signal).then((data) => {
      if (controller.signal.aborted) return
      setEntries((current) => offset === 0 ? data.updateLog : [...current, ...data.updateLog]); setHasMore(data.updateLog.length >= limit); setLoading(false)
    }).catch((reason: unknown) => { if (!controller.signal.aborted) { setError(reason); setLoading(false) } })
    return () => controller.abort()
  }, [recordType, limit, offset, sortBy, sortDirection, attempt])
  const clear = () => { setEntries([]); setOffset(0) }
  const sort = (column: string) => { clear(); setSortBy(column); setSortDirection(column === sortBy && sortDirection === 'desc' ? 'asc' : 'desc') }
  const typeLabel = (kind: string) => text[kind as keyof typeof text] || kind
  return <><nav className="breadcrumb" aria-label={t('cemaris:breadcrumb')}><Link href="/dashboard">{t('home')}</Link><span aria-hidden="true">/</span><span aria-current="page">{t('dashboard.updateLog')}</span></nav><div className="page-heading"><h1>{t('dashboard.updateLog')}</h1>{user.userProperties.isAdmin && <Link className="button small light" href="/admin/auditLog">{t('admin:auditLog')}</Link>}</div><div className="panel panel-body two-columns"><div><label htmlFor="filter--recordType">{text.recordType}</label><select id="filter--recordType" value={recordType} onChange={(event) => { clear(); setRecordType(event.target.value) }}><option value="">{text.all}</option><optgroup label={text.core}>{['workOrder', 'contract', 'burialSite'].map((kind) => <option key={kind} value={kind}>{typeLabel(kind)}</option>)}</optgroup><optgroup label={text.work}><option value="workOrderMilestone">{text.workOrderMilestone}</option></optgroup><optgroup label={text.finance}>{['contractFee', 'contractTransactions'].map((kind) => <option key={kind} value={kind}>{typeLabel(kind)}</option>)}</optgroup><optgroup label={text.comments}><option value="comments">{text.allComments}</option>{['workOrderComment', 'contractComment', 'burialSiteComment'].map((kind) => <option key={kind} value={kind}>{typeLabel(kind)}</option>)}</optgroup></select></div><div><label htmlFor="filter--limit">{text.limit}</label><select id="filter--limit" value={limit} onChange={(event) => { clear(); setLimit(Number(event.target.value)) }}>{[10, 50, 100].map((value) => <option key={value}>{value}</option>)}</select></div></div>{Boolean(error) && <><ErrorMessage error={error} t={t} /><button onClick={() => setAttempt((value) => value + 1)}>{t('cemaris:retry')}</button></>}<div className="table-scroll"><table id="table--updateLog"><thead><tr><th>{text.type}</th><th>{text.record}</th><th>{text.description}</th>{[['recordUpdate_timeMillis', text.updated, 'header--updated'], ['recordCreate_timeMillis', text.created, 'header--created']].map(([column, label, id]) => <th key={column} id={id} aria-sort={sortBy === column ? (sortDirection === 'desc' ? 'descending' : 'ascending') : 'none'}><button className="light" onClick={() => sort(column)}>{label}{sortBy === column ? sortDirection === 'desc' ? ' ↓' : ' ↑' : ' ↕'}</button></th>)}</tr></thead><tbody>{entries.map((entry, index) => <tr key={`${entry.recordType}:${entry.recordId}:${entry.recordUpdate_timeMillis}:${index}`}><td>{typeLabel(entry.recordType)}</td><td><a href={appUrl(updateRecordUrl(entry))} target="_blank" rel="noreferrer" title={text.open}>{entry.displayRecordId}</a></td><td>{entry.recordDescription}</td><td><span className="nowrap">{localTimestamp(entry.recordUpdate_timeMillis)}</span><br /><small>{entry.updateType === 'create' ? '★' : '✎'} {entry.recordUpdate_username}</small></td><td><span className="nowrap">{localTimestamp(entry.recordCreate_timeMillis)}</span><br /><small>★ {entry.recordCreate_username}</small></td></tr>)}</tbody></table></div>{loading && <p id="loading--updateLog" role="status">{text.loading}</p>}{!loading && !error && entries.length === 0 && <p role="status">{text.empty}</p>}{hasMore && !loading && <button className="fullwidth" id="button--updateLogLoadMore" onClick={() => setOffset((value) => value + limit)}>{text.more}</button>}</>
}
