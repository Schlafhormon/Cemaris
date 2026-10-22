import { appUrl } from './paths'
/* Database and audit administration ported from Sunrise CMS, MIT.
 * Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
 * Sources: views/admin/{database,auditLog}.ejs,
 * public/javascripts/{database,auditLog}.admin.ts and adminAuditLog-purge.html. */
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { displayLocale } from './format'
import { request } from './api'
import type { Language, Translate } from './i18n'
import { ErrorMessage, Link, Modal } from './ui'

export interface DatabaseMaintenance {
  lastBackupDateString: string
  lastBackupTimePeriodString: string
  backupTaskIsEnabled: boolean
  backupHour: number
  recordDeleteAgeDays: number
  auditLogEnabled: boolean
}

const databaseLabels = {
  en: {
    backup: 'Database Backup', scheduled: 'Scheduled', disabled: 'Disabled',
    backupAdvice: 'Before making significant changes to the records in the database, it is a good idea to back up first!',
    lastBackup: 'Last Backup Time:', noBackups: 'No backups have been made.', at: 'at', backupButton: 'Backup Database',
    cleanup: 'Database Cleanup', cleanupDescription: 'When records are deleted in this application, they are not removed entirely. This gives systems administrators the ability to recover deleted records. This also can leave a small amount of garbage behind in the database.',
    cleanupAge: 'This process permanently deletes records that have already been deleted over {{days}} days ago. Note that no active records will be affected by the cleanup process.',
    cleanupButton: 'Cleanup Database', backupConfirm: 'Are you sure you want to back up the database?', cleanupConfirm: 'Are you sure you want to clean up the database?',
    backupSuccess: 'Database Backed Up Successfully', backupFailed: 'Error Backing Up Database', backedUpTo: 'Backed up to', backupCopy: 'To request a copy of the backup, contact your application administrator.', now: 'Right now',
    cleanupSuccess: 'Database Cleaned Up Successfully', cleanupResult: '{{inactivated}} records inactivated, {{purged}} permanently deleted.', loading: 'Loading database maintenance…',
  },
  de: {
    backup: 'Datenbanksicherung', scheduled: 'Geplant', disabled: 'Deaktiviert',
    backupAdvice: 'Sichern Sie die Datenbank, bevor Sie umfangreiche Änderungen an den Datensätzen vornehmen.',
    lastBackup: 'Letzte Sicherung:', noBackups: 'Bisher wurde keine Sicherung erstellt.', at: 'um', backupButton: 'Datenbank sichern',
    cleanup: 'Datenbankbereinigung', cleanupDescription: 'Wenn Datensätze in dieser Anwendung gelöscht werden, werden sie nicht vollständig entfernt. Systemadministratoren können gelöschte Datensätze dadurch wiederherstellen. Dabei können auch ungenutzte Daten in der Datenbank verbleiben.',
    cleanupAge: 'Dieser Vorgang entfernt Datensätze endgültig, die vor mehr als {{days}} Tagen gelöscht wurden. Aktive Datensätze sind von der Bereinigung nicht betroffen.',
    cleanupButton: 'Datenbank bereinigen', backupConfirm: 'Möchten Sie die Datenbank sichern?', cleanupConfirm: 'Möchten Sie die Datenbank bereinigen?',
    backupSuccess: 'Datenbank erfolgreich gesichert', backupFailed: 'Fehler bei der Datenbanksicherung', backedUpTo: 'Gesichert unter', backupCopy: 'Wenden Sie sich an Ihren Anwendungsadministrator, um eine Kopie der Sicherung zu erhalten.', now: 'Gerade eben',
    cleanupSuccess: 'Datenbank erfolgreich bereinigt', cleanupResult: '{{inactivated}} Datensätze deaktiviert, {{purged}} endgültig gelöscht.', loading: 'Datenbankverwaltung wird geladen…',
  },
}

function AdminBreadcrumb({ t, title }: { t: Translate; title: string }) {
  return <nav className="breadcrumb" aria-label={t('cemaris:breadcrumb')}><Link href="/dashboard">{t('home')}</Link><span aria-hidden="true">/</span><span>{t('admin:adminTools')}</span><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
}

export function AdminDatabase({ t, language }: { t: Translate; language: Language }) {
  const text = databaseLabels[language]
  const [data, setData] = useState<DatabaseMaintenance | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [justBackedUp, setJustBackedUp] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'backup' | 'cleanup' | 'backupError'; fileName?: string; message?: string; inactivated?: number; purged?: number } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    request<DatabaseMaintenance>('/api/admin/database', undefined, controller.signal).then((value) => {
      if (!controller.signal.aborted) setData(value)
    }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [attempt])

  async function backup() {
    if (!window.confirm(text.backupConfirm)) return
    setBusy(true); setError(null); setNotice(null)
    try {
      const result = await request<{ success: boolean; fileName?: string; errorMessage?: string }>('/api/admin/doBackupDatabase', {}, undefined, 360000, { acceptBusinessFailure: true })
      if (result.success) { setNotice({ kind: 'backup', fileName: result.fileName }); setJustBackedUp(true) }
      else setNotice({ kind: 'backupError', message: result.errorMessage })
    } catch (reason) { setError(reason) } finally { setBusy(false) }
  }

  async function cleanup() {
    if (!window.confirm(text.cleanupConfirm)) return
    setBusy(true); setError(null); setNotice(null)
    try {
      const result = await request<{ inactivatedRecordCount: number; purgedRecordCount: number }>('/api/admin/doCleanupDatabase', {}, undefined, 120000)
      setNotice({ kind: 'cleanup', inactivated: result.inactivatedRecordCount, purged: result.purgedRecordCount })
    } catch (reason) { setError(reason) } finally { setBusy(false) }
  }

  return <div className="administration-content"><AdminBreadcrumb t={t} title={t('admin:databaseMaintenance')} /><div className="page-heading"><h1>{t('admin:databaseMaintenance')}</h1></div>{Boolean(error) && <><ErrorMessage error={error} t={t} />{!data && <button onClick={() => setAttempt((value) => value + 1)}>{t('cemaris:retry')}</button>}</>}{!data && !error && <p role="status">{text.loading}</p>}{notice && <div className={`notification ${notice.kind === 'backupError' ? 'danger' : 'success'}`} role={notice.kind === 'backupError' ? 'alert' : 'status'}><strong>{notice.kind === 'backup' ? text.backupSuccess : notice.kind === 'cleanup' ? text.cleanupSuccess : text.backupFailed}</strong>{notice.kind === 'backup' ? <><p>{text.backedUpTo} <strong>{notice.fileName}</strong></p><p>{text.backupCopy}</p></> : notice.kind === 'cleanup' ? <p>{text.cleanupResult.replace('{{inactivated}}', String(notice.inactivated)).replace('{{purged}}', String(notice.purged))}</p> : <p>{notice.message}</p>}</div>}{data && <div className="two-columns administration-panels"><section className="panel"><div className="panel-heading administration-panel-heading"><h2>{text.backup}</h2><span className={`tag ${data.backupTaskIsEnabled ? 'success' : 'danger'}`}>{data.backupTaskIsEnabled ? `${text.scheduled} (${data.backupHour}:00)` : text.disabled}</span></div><div className="panel-body"><p className="notification info">{text.backupAdvice}</p><p><strong>{text.lastBackup}</strong><br /><span id="database--lastBackup">{justBackedUp ? text.now : data.lastBackupDateString ? `${data.lastBackupDateString} ${text.at} ${data.lastBackupTimePeriodString}` : text.noBackups}</span></p><div className="actions"><button id="button--backupDatabase" data-cy="backup" className="success" disabled={busy} onClick={backup}>{text.backupButton}</button></div></div></section><section className="panel"><h2 className="panel-heading">{text.cleanup}</h2><div className="panel-body"><div className="notification warning"><p>{text.cleanupDescription}</p><p>{text.cleanupAge.replace('{{days}}', String(data.recordDeleteAgeDays))}</p></div><div className="actions"><button id="button--cleanupDatabase" data-cy="cleanup" className="warning" disabled={busy} onClick={cleanup}>{text.cleanupButton}</button></div></div></section></div>}</div>
}

interface AuditLogEntry {
  logMillis: number; logDate: number; logTime: number; mainRecordId: string; mainRecordType: string
  recordIndex: string | null; updateTable: string; updateField: string; updateType: string
  updateUsername: string; fromValue: string | null; toValue: string | null
}
interface AuditLogResponse { auditLogEntries: AuditLogEntry[]; count: number; offset: number }
interface AuditFilters { logDateFrom: string; logDateTo: string; mainRecordType: string; updateUsername: string }
const auditRecordTypes = [
  ['burialSite', 'cemeteries.burialSites'], ['burialSiteStatus', 'admin:burialSiteStatuses'], ['burialSiteType', 'cemeteries.burialSiteTypes'],
  ['cemetery', 'cemetery'], ['committalType', 'admin:committalTypes'], ['contract', 'contracts'], ['contractType', 'contracts.contractTypes'],
  ['fee', 'contracts.fees'], ['funeralHome', 'contracts.funeralHomes'], ['intermentContainerType', 'admin:intermentContainerTypes'],
  ['intermentDepth', 'admin:intermentDepths'], ['serviceType', 'admin:serviceTypes'], ['user', 'admin:users'], ['workOrder', 'workOrders'],
  ['workOrderMilestoneType', 'admin:workOrderMilestoneTypes'], ['workOrderType', 'admin:workOrderTypes'],
] as const
const purgeAges = [['thirtyDays', 'auditLogPurgeThirtyDays'], ['ninetyDays', 'auditLogPurgeNinetyDays'], ['oneYear', 'auditLogPurgeOneYear'], ['all', 'auditLogPurgeEverything']] as const
const pageLimit = 50

function auditRecordUrl(type: string, id: string): string | undefined {
  const prefix = ({ burialSite: 'burialSites', cemetery: 'cemeteries', contract: 'contracts', funeralHome: 'funeralHomes', workOrder: 'workOrders' } as Record<string, string>)[type]
  return prefix ? `/${prefix}/${encodeURIComponent(id)}` : undefined
}

function AuditValue({ value }: { value: string | null }) {
  if (value === null || value === 'null') return <em className="muted">null</em>
  return <code title={value.length > 100 ? value : undefined}>{value.length > 100 ? `${value.slice(0, 100)}…` : value}</code>
}

export function AdminAuditLog({ t, language }: { t: Translate; language: Language }) {
  const [filters, setFilters] = useState<AuditFilters>({ logDateFrom: '', logDateTo: '', mainRecordType: '', updateUsername: '' })
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<AuditLogResponse | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [purge, setPurge] = useState(false)
  const [purgeBusy, setPurgeBusy] = useState(false)
  const [age, setAge] = useState('thirtyDays')
  const [purgedCount, setPurgedCount] = useState<number | null>(null)
  const [purgeError, setPurgeError] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    request<{ enabled: boolean }>('/api/admin/auditLog', undefined, controller.signal).then((value) => {
      if (!controller.signal.aborted) { setEnabled(value.enabled); if (!value.enabled) setLoading(false) }
    }).catch((reason: unknown) => { if (!controller.signal.aborted) { setError(reason); setLoading(false) } })
    return () => controller.abort()
  }, [attempt])
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setLoading(true); setError(null)
    request<AuditLogResponse>('/api/admin/doGetAuditLog', { ...filters, limit: pageLimit, offset }, controller.signal).then((value) => {
      if (!controller.signal.aborted) { setData(value); setLoading(false) }
    }).catch((reason: unknown) => { if (!controller.signal.aborted) { setError(reason); setLoading(false) } })
    return () => controller.abort()
  }, [enabled, filters, offset, attempt])

  function filter(name: keyof AuditFilters, value: string) { setOffset(0); setFilters((current) => ({ ...current, [name]: value })) }
  function refilter(event: FormEvent) { event.preventDefault(); setOffset(0); setAttempt((value) => value + 1) }
  async function submitPurge(event: FormEvent) {
    event.preventDefault(); setPurge(false); setPurgeBusy(true); setPurgedCount(null); setPurgeError(null); setError(null)
    try {
      const value = await request<{ success: boolean; purgedCount: number; message?: string }>('/api/admin/doPurgeAuditLog', { age }, undefined, 120000, { acceptBusinessFailure: true })
      if (value.success) { setPurgedCount(value.purgedCount); setOffset(0); setAttempt((current) => current + 1) }
      else setPurgeError(value.message || t('error'))
    } catch (reason) { setError(reason) } finally { setPurgeBusy(false) }
  }
  const first = data ? data.offset + 1 : 0
  const last = data ? Math.min(data.offset + pageLimit, data.count) : 0
  return <div className="administration-content"><AdminBreadcrumb t={t} title={t('admin:auditLog')} /><div className="page-heading administration-heading"><h1>{t('admin:auditLog')}</h1>{enabled && <button id="button--purgeAuditLog" className="danger" disabled={purgeBusy} onClick={() => { setAge('thirtyDays'); setPurge(true) }}>{t('admin:auditLogPurge')}</button>}</div>{Boolean(error) && <><ErrorMessage error={error} t={t} /><button onClick={() => setAttempt((value) => value + 1)}>{t('cemaris:retry')}</button></>}{purgeError && <p className="notification danger" role="alert">{purgeError}</p>}{purgedCount !== null && <p className="notification success" role="status">{t('admin:auditLogPurgeSuccess', { count: purgedCount, age: t(`admin:${purgeAges.find(([value]) => value === age)?.[1]}`) })}</p>}{enabled === false && <p className="notification warning">{databaseLabels[language].disabled}</p>}{enabled && <><form id="form--auditLogFilters" className="panel panel-body stack" onSubmit={refilter}><div className="two-columns"><div><label htmlFor="filter--logDateFrom">{t('admin:logDateFrom')}</label><input id="filter--logDateFrom" type="date" autoComplete="off" value={filters.logDateFrom} onChange={(event) => filter('logDateFrom', event.target.value)} /></div><div><label htmlFor="filter--logDateTo">{t('admin:logDateTo')}</label><input id="filter--logDateTo" type="date" autoComplete="off" value={filters.logDateTo} onChange={(event) => filter('logDateTo', event.target.value)} /></div></div><div className="two-columns"><div><label htmlFor="filter--mainRecordType">{t('admin:mainRecordType')}</label><select id="filter--mainRecordType" value={filters.mainRecordType} onChange={(event) => filter('mainRecordType', event.target.value)}><option value="">({t('admin:allRecordTypes')})</option>{auditRecordTypes.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></div><div><label htmlFor="filter--updateUsername">{t('admin:username')}</label><input id="filter--updateUsername" type="search" autoComplete="off" value={filters.updateUsername} onChange={(event) => filter('updateUsername', event.target.value)} /></div></div></form><div id="container--auditLog" aria-busy={loading}>{loading && <p role="status">{t('loading')}</p>}{!loading && !error && data?.auditLogEntries.length === 0 && <p role="status">{t('admin:auditLogNoEntries')}</p>}{data && data.auditLogEntries.length > 0 && <><div className="table-scroll"><table className="audit-table"><thead><tr>{['time', 'admin:mainRecordType', 'admin:auditLogTable', 'admin:auditLogField', 'admin:auditLogFrom', 'admin:auditLogTo', 'admin:username'].map((label) => <th key={label}>{t(label)}</th>)}</tr></thead><tbody>{data.auditLogEntries.map((entry, index) => {
    const date = new Date(entry.logMillis)
    const href = auditRecordUrl(entry.mainRecordType, entry.mainRecordId)
    return <tr className={entry.updateType === 'created' ? 'audit-created' : entry.updateType === 'deleted' ? 'audit-deleted' : 'audit-updated'} key={`${entry.logMillis}:${index}`}><td>{date.toLocaleDateString(displayLocale())}<br /><small>{date.toLocaleTimeString(displayLocale())}</small></td><td>{entry.mainRecordType}<br />{href ? <a href={appUrl(href)} target="_blank" rel="noreferrer" title={t('admin:auditLogViewRecord')}>{entry.mainRecordId}</a> : <small>{entry.mainRecordId}</small>}</td><td>{entry.updateTable}{entry.recordIndex !== null && <><br /><small>{entry.recordIndex}</small></>}</td><td>{entry.updateField}</td><td><AuditValue value={entry.fromValue} /></td><td><AuditValue value={entry.toValue} /></td><td>{entry.updateUsername}</td></tr>
  })}</tbody></table></div><nav className="pager administration-pager" aria-label={t('search')}><span>{first}–{last} / {data.count}</span><div className="actions"><button type="button" data-page="previous" disabled={loading || data.offset === 0} onClick={() => setOffset(Math.max(0, data.offset - pageLimit))}>{t('previous')}</button><button type="button" data-page="next" disabled={loading || data.offset + pageLimit >= data.count} onClick={() => setOffset(data.offset + pageLimit)}>{t('next')}</button></div></nav></>}</div></>}{purge && <Modal title={t('admin:auditLogPurge')} onClose={() => setPurge(false)}><form id="form--purgeAuditLog" onSubmit={submitPurge}><label htmlFor="purge--age">{t('admin:auditLogPurgeOlderThan')}</label><select id="purge--age" name="age" value={age} onChange={(event) => setAge(event.target.value)}>{purgeAges.map(([value, label]) => <option key={value} value={value}>{t(`admin:${label}`)}</option>)}</select><div className="actions"><button className="danger" type="submit">{t('delete')}</button><button type="button" onClick={() => setPurge(false)}>{t('cancel')}</button></div></form></Modal>}</div>
}
