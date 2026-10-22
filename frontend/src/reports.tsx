import { appUrl } from './paths'
/* Report library ported from Sunrise CMS views/report-search.ejs (MIT).
 * Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie. */
import { useEffect, useState } from 'react'
import { request } from './api'
import type { Language, Translate } from './i18n'
import { ErrorMessage, Link, navigate } from './ui'

type Row = Record<string, string | number | null>
interface ReportsData {
  reportNames: string[]
  simpleReports: { reportName: string; tableName: string; formatted: boolean }[]
  todayDateString: string
  cemeteries: Row[]
  burialSiteTypes: Row[]
  burialSiteStatuses: Row[]
}
const tabs = ['contracts', 'workOrders', 'cemeteries', 'dataTableExports', 'configTableExports'] as const
const configTables = new Set(['burialSiteStatuses', 'burialSiteTypeFields', 'burialSiteTypes', 'committalTypes', 'contractTypeFields', 'contractTypePrints', 'contractTypes', 'feeCategories', 'fees', 'intermentContainerTypes', 'intermentDepths', 'serviceTypes', 'workOrderMilestoneTypes', 'workOrderTypes'])
const titles: Record<string, [string, string]> = {
  contracts: ['Contract Reports', 'Vertragsberichte'], workOrders: ['Work Order Reports', 'Arbeitsauftragsberichte'], cemeteries: ['Cemetery and Burial Site Reports', 'Friedhofs- und Grabstättenberichte'],
  dataTableExports: ['Data Table Exports', 'Datentabellen exportieren'], configTableExports: ['Config Table Exports', 'Konfigurationstabellen exportieren'],
  'contracts-current-byCemeteryId': ['Current Contracts by Cemetery', 'Laufende Verträge nach Friedhof'],
  'contractTransactions-byTransactionDateString': ['Transactions by Date', 'Transaktionen nach Datum'],
  'contractInterments-directory': ['Interment Directory', 'Beisetzungsverzeichnis'], 'workOrders-open': ['Open Work Orders', 'Offene Arbeitsaufträge'],
  'cemeteries-formatted': ['Full Cemetery List', 'Vollständige Friedhofsliste'],
  'burialSites-byCemeteryId': ['Burial Sites by Cemetery', 'Grabstätten nach Friedhof'], 'burialSites-byBurialSiteTypeId': ['Burial Sites by Type', 'Grabstätten nach Art'], 'burialSites-byBurialSiteStatusId': ['Burial Sites by Status', 'Grabstätten nach Status'],
}
const germanTableTitles: Record<string, string> = {
  burialSiteComments: 'Grabstättenkommentare',
  burialSiteFields: 'Grabstättenzusatzfelder',
  burialSites: 'Grabstätten',
  burialSiteStatuses: 'Grabstättenstatus',
  burialSiteTypeFields: 'Zusatzfelder der Grabstättenarten',
  burialSiteTypes: 'Grabstättenarten',
  cemeteries: 'Friedhöfe',
  committalTypes: 'Beisetzungsarten',
  contractAttachments: 'Vertragsanhänge',
  contractComments: 'Vertragskommentare',
  contractFees: 'Vertragsgebühren',
  contractFields: 'Vertragszusatzfelder',
  contractInterments: 'Beisetzungen',
  contractMetadata: 'Vertragsmetadaten',
  contracts: 'Verträge',
  contractServiceTypes: 'Vertragsdienstleistungen',
  contractTransactions: 'Vertragszahlungen',
  contractTypeFields: 'Zusatzfelder der Vertragsarten',
  contractTypePrints: 'Druckzuordnungen der Vertragsarten',
  contractTypes: 'Vertragsarten',
  feeCategories: 'Gebührenkategorien',
  fees: 'Gebühren',
  funeralHomes: 'Bestattungsunternehmen',
  intermentContainerTypes: 'Behälterarten',
  intermentDepths: 'Beisetzungstiefen',
  serviceTypes: 'Dienstleistungsarten',
  workOrderBurialSites: 'Grabstätten der Arbeitsaufträge',
  workOrderComments: 'Arbeitsauftragskommentare',
  workOrderMilestones: 'Meilensteine der Arbeitsaufträge',
  workOrderMilestoneTypes: 'Meilensteinarten',
  workOrders: 'Arbeitsaufträge',
  workOrderTypes: 'Arbeitsauftragsarten',
}
export function Reports({ t, language, location }: { t: Translate; language: Language; location: string }) {
  const [data, setData] = useState<ReportsData | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  const query = new URLSearchParams(location.split('?')[1] || '')
  const requested = query.has('tab') ? (query.getAll('tab').length === 1 ? query.get('tab') : '') : 'contracts'
  const tab = tabs.find(value => value === requested)
  const de = language === 'de'
  const label = (name: string) => titles[name]?.[de ? 1 : 0] || (de ? germanTableTitles[name.replace(/-all$/, '')] : undefined) || name.replace(/-all$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())
  useEffect(() => {
    const controller = new AbortController()
    request<ReportsData>('/api/reports', undefined, controller.signal).then(setData).catch(reason => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [attempt])
  function download(name: string) {
    return <a className="button light report-download" href={appUrl(`/api/reports/${name}`)} download data-report={name}><span className="tag">CSV</span> {label(name)}</a>
  }
  function filter(name: string, field: string, title: string, values?: Row[]) {
    return <form key={name} className="panel report-filter" action={appUrl(`/api/reports/${name}`)} method="get" data-report={name}><div className="panel-body"><h2>{label(name)}</h2><label htmlFor={`${name}--${field}`}>{title}</label><div className="input-addons">{values ? <select id={`${name}--${field}`} name={field}>{values.map(row => <option key={String(row[field])} value={String(row[field])}>{String(row[field.replace(/Id$/, 'Name')] || row[field.replace(/Id$/, '')] || `(${t('cemeteries.noName')})`)}</option>)}</select> : <input id={`${name}--${field}`} name={field} type="date" defaultValue={data?.todayDateString} required />}<button className="primary" type="submit">{de ? 'Exportieren' : 'Export'}</button></div></div></form>
  }
  return <><nav className="breadcrumb"><Link href="/dashboard">{t('home')}</Link><span>/</span><span>{t('dashboard.reports')}</span></nav><h1>{t('dashboard.reportLibrary')}</h1><div className="report-tabs" role="tablist" aria-label={t('dashboard.reports')}>{tabs.map(value => <button key={value} id={`report-tab--${value}`} role="tab" aria-selected={tab === value} aria-controls="report-panel" className={tab === value ? 'primary' : 'light'} onClick={() => navigate(`/reports?tab=${value}${de ? '&lng=de' : '&lng=en'}`)}>{label(value)}</button>)}</div>{Boolean(error) && <><ErrorMessage error={error} t={t} /><button onClick={() => { setError(null); setAttempt(value => value + 1) }}>{t('cemaris:retry')}</button></>}{!data && !error && <p role="status">{t('loading')}</p>}{data && <section id="report-panel" role="tabpanel" aria-labelledby={tab ? `report-tab--${tab}` : undefined}>{tab && <h2>{label(tab)}</h2>}{tab === 'contracts' && <div className="stack">{filter('contracts-current-byCemeteryId', 'cemeteryId', t('cemetery'), data.cemeteries)}{filter('contractTransactions-byTransactionDateString', 'transactionDateString', t('date'))}{download('contractInterments-directory')}</div>}{tab === 'workOrders' && <div className="stack">{download('workOrders-open')}<Link className="button light" href="/workOrders/ical">{de ? 'Meilensteinkalender (ICS)' : 'Work Order Milestone Calendar (ICS)'}</Link></div>}{tab === 'cemeteries' && <div className="stack">{download('cemeteries-formatted')}{filter('burialSites-byCemeteryId', 'cemeteryId', t('cemetery'), data.cemeteries)}{filter('burialSites-byBurialSiteTypeId', 'burialSiteTypeId', (de ? 'Grabstättenart' : 'Burial Site Type'), data.burialSiteTypes)}{filter('burialSites-byBurialSiteStatusId', 'burialSiteStatusId', (de ? 'Grabstättenstatus' : 'Burial Site Status'), data.burialSiteStatuses)}</div>}{(tab === 'dataTableExports' || tab === 'configTableExports') && <><p className="notification info">{de ? 'Tabellenexporte enthalten alle ungefilterten, unformatierten Datensätze, einschließlich noch nicht endgültig entfernter gelöschter Datensätze.' : 'Table exports contain all unfiltered, unformatted records, including deleted records that have not been fully purged.'}</p><div className="report-export-list">{data.simpleReports.filter(report => !report.formatted && configTables.has(report.reportName.replace(/-all$/, '')) === (tab === 'configTableExports')).map(report => <div key={report.reportName}>{download(report.reportName)}</div>)}</div></>}</section>}</>
}
