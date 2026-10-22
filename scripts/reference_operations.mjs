// Execute frozen Sunrise administration/cleanup/task bodies with synthetic data.
// SQLite is ONLY the immutable source oracle; Cemaris persistence evidence uses SQL Server.
// Source copyright and MIT notice: licenses/Sunrise-LICENSE.md.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { oracle, clean, errorShape, strip } from './reference_step14_helpers.mjs'

const o = await oracle('operations')
const NOW = 1700000000123, DAY = 86400000
let now = NOW
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])) } static now() { return now } }
const Debug = () => () => {}
Debug.enable = () => {}
const common = { Date: Clock, Debug, DEBUG_NAMESPACE: 'synthetic', DEBUG_ENABLE_NAMESPACES: '',
  daysToMillis: value => value * DAY, hoursToMillis: value => value * 3600000,
  secondsToMillis: value => value * 1000, millisecondsInOneDay: DAY, path,
  process: { env: {}, pid: 42 }, camelcase: value => value.replaceAll(' ', '') }
const schema = await o.source('database/initializeDatabase.js')
const createStatements = new Function(schema.slice(schema.indexOf('const recordColumns'), schema.indexOf('const initializingUser')) + '\nreturn sqlCreateStatements')()
const defaultSqlite = new DatabaseSync(':memory:')
const defaultForeignKeys = defaultSqlite.prepare('PRAGMA foreign_keys').get().foreign_keys
defaultSqlite.close()
function fresh(foreignKeys = false) {
  const db = new DatabaseSync(':memory:')
  db.exec(`PRAGMA foreign_keys=${foreignKeys ? 'ON' : 'OFF'}`)
  for (const sql of createStatements) db.exec(sql)
  return db
}
function insert(db, table, supplied) {
  const values = { ...supplied }
  const descriptors = db.prepare(`PRAGMA table_info(${table})`).all()
  const primaryKeyCount = descriptors.filter(column => column.pk).length
  for (const column of descriptors) {
    const autoPrimaryKey = column.pk && primaryKeyCount === 1 && column.type === 'INTEGER'
    if (column.name in values || !column.notnull || column.dflt_value !== null || autoPrimaryKey) continue
    values[column.name] = /INT|BIT|NUMERIC/i.test(column.type) ? 1 : 'Synthetic'
  }
  const columns = Object.keys(values)
  db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...Object.values(values))
}
function dbBoundary(db, events) {
  return { prepare(sql) { return {
    run(...args) { const result = db.prepare(sql).run(...args); events.push(['run', sql.replace(/\s+/g, ' ').trim(), args, Number(result.changes)]); return result },
    all(...args) { const result = db.prepare(sql).all(...args); events.push(['all', sql.replace(/\s+/g, ' ').trim(), args, result.length]); return result },
    get(...args) { return db.prepare(sql).get(...args) }
  } }, exec(sql) { events.push(['exec', sql]); db.exec(sql) }, close() { events.push(['close']) } }
}
const old = NOW - 61 * DAY
const cleanupCases = [
  { name: 'empty', seeds: [] },
  { name: 'work-order-children-new-tombstones-get-fresh-grace', seeds: [
    ['WorkOrders', { workOrderId: 1, recordDelete_timeMillis: old }],
    ...['WorkOrderComments', 'WorkOrderContracts', 'WorkOrderBurialSites', 'WorkOrderMilestones'].map(table => [table, { workOrderId: 1 }])], runs: [NOW, NOW + 60 * DAY + 1] },
  { name: 'inclusive-old-cutoff-recent-and-active-rows', seeds: [
    ['WorkOrders', { workOrderId: 1, recordDelete_timeMillis: NOW - 60 * DAY }],
    ['WorkOrders', { workOrderId: 2, recordDelete_timeMillis: NOW - 60 * DAY + 1 }],
    ['WorkOrders', { workOrderId: 3 }]] },
  { name: 'active-financial-rows-retain-deleted-contract', seeds: [
    ['Contracts', { contractId: 1, recordDelete_timeMillis: old }], ['ContractFees', { contractId: 1, feeId: 1 }],
    ['ContractTransactions', { contractId: 1, transactionIndex: 1 }]] },
  { name: 'independently-deleted-financial-rows-purged', seeds: [
    ['Contracts', { contractId: 1, recordDelete_timeMillis: old }], ['ContractFees', { contractId: 1, feeId: 1, recordDelete_timeMillis: old }],
    ['ContractTransactions', { contractId: 1, transactionIndex: 1, recordDelete_timeMillis: old }]] },
  { name: 'interment-never-inactivated-or-purged', seeds: [
    ['Contracts', { contractId: 1, recordDelete_timeMillis: old }],
    ['ContractInterments', { contractId: 1, intermentNumber: 1, recordDelete_timeMillis: old }]] },
  { name: 'service-relation-missing-from-contract-protection', seeds: [
    ['Contracts', { contractId: 1, recordDelete_timeMillis: old }], ['ContractServiceTypes', { contractId: 1, serviceTypeId: 1 }]] },
  { name: 'existing-attachment-file-and-row-removed', seeds: [
    ['Contracts', { contractId: 1, recordDelete_timeMillis: old }],
    ['ContractAttachments', { contractAttachmentId: 1, contractId: 1, fileName: 'synthetic.pdf', filePath: 'data/attachments', recordDelete_timeMillis: old }]], files: { 'data/attachments/synthetic.pdf': 'exists' } },
  { name: 'missing-attachment-file-retains-row-and-contract', seeds: [
    ['Contracts', { contractId: 1, recordDelete_timeMillis: old }],
    ['ContractAttachments', { contractAttachmentId: 1, contractId: 1, fileName: 'missing.pdf', filePath: 'data/attachments', recordDelete_timeMillis: old }]] },
  { name: 'unlink-failure-retains-row-and-contract', seeds: [
    ['Contracts', { contractId: 1, recordDelete_timeMillis: old }],
    ['ContractAttachments', { contractAttachmentId: 1, contractId: 1, fileName: 'locked.pdf', filePath: 'data/attachments', recordDelete_timeMillis: old }]], files: { 'data/attachments/locked.pdf': 'locked' } },
  { name: 'related-link-purged-even-when-finance-retains-contract', seeds: [
    ['Contracts', { contractId: 1, recordDelete_timeMillis: old }], ['Contracts', { contractId: 2 }],
    ['ContractFees', { contractId: 1, feeId: 1 }], ['RelatedContracts', { contractIdA: 1, contractIdB: 2 }]] },
  { name: 'deleted-fee-category-inactivates-active-fees', seeds: [
    ['FeeCategories', { feeCategoryId: 1, recordDelete_timeMillis: old }], ['Fees', { feeId: 1, feeCategoryId: 1 }]] },
  { name: 'null-fee-type-poisons-unrelated-contract-type-purge', seeds: [
    ['ContractTypes', { contractTypeId: 1, recordDelete_timeMillis: old }],
    ['Fees', { feeId: 1, feeCategoryId: 1, contractTypeId: null }]] },
  { name: 'null-contract-site-poisons-unrelated-site-purge', seeds: [
    ['BurialSites', { burialSiteId: 1, burialSiteTypeId: 1, burialSiteName: 'Synthetic site', recordDelete_timeMillis: old }],
    ['Contracts', { contractId: 1, burialSiteId: null }]] },
  { name: 'cemetery-cascade-order-requires-repeated-cleanups', seeds: [
    ['Cemeteries', { cemeteryId: 1, cemeteryKey: 'SYN', recordDelete_timeMillis: old }],
    ['BurialSites', { burialSiteId: 1, cemeteryId: 1, burialSiteTypeId: 1, burialSiteName: 'Synthetic site' }],
    ['BurialSiteComments', { burialSiteId: 1 }]], runs: [NOW, NOW + 61 * DAY, NOW + 122 * DAY] },
  { name: 'active-child-cemetery-not-protected-by-source-delete', seeds: [
    ['Cemeteries', { cemeteryId: 1, cemeteryKey: 'PARENT', recordDelete_timeMillis: old }],
    ['Cemeteries', { cemeteryId: 2, cemeteryKey: 'CHILD', parentCemeteryId: 1 }]] },
  { name: 'fee-reference-missing-from-site-type-protection', seeds: [
    ['BurialSiteTypes', { burialSiteTypeId: 1, recordDelete_timeMillis: old }],
    ['Fees', { feeId: 1, feeCategoryId: 1, burialSiteTypeId: 1 }]] },
  { name: 'omitted-tables-remain-deleted-but-unpurged', seeds: [
    ...['FuneralHomes', 'WorkOrderStatuses', 'CommittalTypes', 'ServiceTypes', 'IntermentContainerTypes', 'IntermentDepths', 'Users', 'OrderForms'].map(table =>
      [table, { recordDelete_timeMillis: old }])] },
  { name: 'zero-age-also-purges-newly-inactivated-children', ageDays: 0, seeds: [
    ['WorkOrders', { workOrderId: 1, recordDelete_timeMillis: old }], ['WorkOrderComments', { workOrderId: 1 }]] }
]
const cleanup = [], cleanupQueries = []
for (const specification of cleanupCases) {
  const db = fresh(), events = []
  for (const [table, values] of specification.seeds) insert(db, table, values)
  const tables = [...new Set(specification.seeds.map(([table]) => table))]
  const boundary = dbBoundary(db, events)
  const { cleanupDatabase } = await o.load('database/cleanupDatabase.js', ['cleanupDatabase'], { ...common,
    getConfigProperty: () => specification.ageDays ?? 60, getDatabaseConnection: () => boundary,
    fs: { async access(file) { events.push(['access', file.replaceAll('\\', '/')]); if (!(file.replaceAll('\\', '/') in (specification.files ?? {}))) throw new Error('Synthetic missing file') },
      async unlink(file) { events.push(['unlink', file.replaceAll('\\', '/')]); if (specification.files[file.replaceAll('\\', '/')] === 'locked') throw new Error('Synthetic locked file') } } })
  const runs = []
  for (now of specification.runs ?? [NOW]) {
    events.length = 0
    const result = await cleanupDatabase({ username: 'synthetic-admin' })
    const rows = Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT * FROM ${table}`).all().map(row =>
      Object.fromEntries(Object.entries(row).filter(([key]) => key.endsWith('Id') || key.endsWith('Index') || key.endsWith('Number') || key.startsWith('recordDelete_'))))]))
    const compactEvents = events.map(event => {
      if (!['run', 'all'].includes(event[0])) return event
      let index = cleanupQueries.indexOf(event[1])
      if (index < 0) { index = cleanupQueries.length; cleanupQueries.push(event[1]) }
      return [event[0], index, ...event.slice(2)]
    })
    runs.push(clean({ now, result, rows, events: compactEvents }))
  }
  cleanup.push({ ...specification, expected: runs })
  db.close()
}
now = NOW
function insertWithParents(db, table, values) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all()
  const normalized = { ...values }
  for (const foreign of db.prepare(`PRAGMA foreign_key_list(${table})`).all()) {
    const descriptor = columns.find(column => column.name === foreign.from)
    const value = normalized[foreign.from] ?? (descriptor.notnull ? 1 : null)
    if (value === null) continue
    normalized[foreign.from] = value
    if (!db.prepare(`SELECT 1 FROM ${foreign.table} WHERE ${foreign.to} = ?`).get(value)) {
      insertWithParents(db, foreign.table, { [foreign.to]: value })
    }
  }
  insert(db, table, normalized)
}
const constraintFailures = []
for (const caseName of ['service-relation-missing-from-contract-protection', 'active-child-cemetery-not-protected-by-source-delete', 'fee-reference-missing-from-site-type-protection']) {
  const specification = cleanupCases.find(item => item.name === caseName), db = fresh(true), events = []
  for (const [table, values] of specification.seeds) insertWithParents(db, table, values)
  const { cleanupDatabase } = await o.load('database/cleanupDatabase.js', ['cleanupDatabase'], { ...common,
    getConfigProperty: () => 60, getDatabaseConnection: () => dbBoundary(db, events), fs: {} })
  let error
  try { await cleanupDatabase({ username: 'synthetic-admin' }) } catch (caught) { error = errorShape(caught) }
  assert.equal(error?.message, 'FOREIGN KEY constraint failed')
  constraintFailures.push({ name: caseName, error, closed: events.some(event => event[0] === 'close') })
  db.close()
}

// Record original SQL execution order/parameters independently of row fixtures.
const trace = [], changesBoundary = { prepare(sql) { return {
  run(...args) { trace.push(['run', sql.replace(/\s+/g, ' ').trim(), args]); return { changes: 1 } },
  all(...args) { trace.push(['all', sql.replace(/\s+/g, ' ').trim(), args]); return [] }
} }, exec(sql) { trace.push(['exec', sql]) }, close() { trace.push(['close']) } }
const { cleanupDatabase } = await o.load('database/cleanupDatabase.js', ['cleanupDatabase'], { ...common,
  getConfigProperty: () => 60, getDatabaseConnection: () => changesBoundary, fs: {} })
const cleanupTrace = { result: await cleanupDatabase({ username: 'synthetic-admin' }), events: trace }

const purge = []
const purgeSeeds = [NOW - 365 * DAY - 1, NOW - 365 * DAY, NOW - 90 * DAY - 1, NOW - 90 * DAY,
  NOW - 30 * DAY - 1, NOW - 30 * DAY, NOW, NOW + 1]
for (const age of ['thirtyDays', 'ninetyDays', 'oneYear', 'all']) {
  const db = fresh(), events = []
  for (const logMillis of purgeSeeds) insert(db, 'AuditLog', { logMillis, logDate: 20231114, logTime: 2213,
    mainRecordType: 'contract', mainRecordId: '1', updateTable: 'Contracts', updateField: 'purchaserName', updateType: 'updated', updateUsername: 'synthetic-admin' })
  const { purgeAuditLog } = await o.load('database/purgeAuditLog.js', ['purgeAuditLog'], { ...common, getDatabaseConnection: () => dbBoundary(db, events) })
  purge.push({ age, expected: purgeAuditLog(age), remaining: db.prepare('SELECT logMillis FROM AuditLog ORDER BY logMillis').all().map(row => row.logMillis), events })
  db.close()
}

const auditDb = fresh()
const auditSeeds = [
  { logMillis: 1, logDate: 20261019, mainRecordType: 'contract', mainRecordId: '1', updateUsername: 'Synthetic-admin' },
  { logMillis: 2, logDate: 20261020, mainRecordType: 'cemetery', mainRecordId: '2', updateUsername: 'synthetic-reader' },
  { logMillis: 3, logDate: 20261021, mainRecordType: 'contract', mainRecordId: '3', updateUsername: 'synthetic_%[]' },
  { logMillis: 4, logDate: 20261021, mainRecordType: 'contract', mainRecordId: '4', updateUsername: 'other' }
]
for (const seed of auditSeeds) insert(auditDb, 'AuditLog', { ...seed, logTime: 1234, updateTable: 'Synthetic', updateField: 'Synthetic', updateType: 'updated' })
const { getAuditLog } = await o.load('database/getAuditLog.js', ['getAuditLog'], {
  getDatabaseConnection: () => ({ ...dbBoundary(auditDb, []), close() {} }), dateStringToInteger: value => Number(value.replaceAll('-', '')) })
const audit = []
for (const filters of [{}, { logDateFrom: '2026-10-20' }, { logDateTo: '2026-10-20' },
  { logDateFrom: '2026-10-20', logDateTo: '2026-10-21', mainRecordType: 'contract' },
  { mainRecordType: 'contract' }, { mainRecordType: ' ' }, { mainRecordId: ' 3 ' }, { updateUsername: ' ADMIN ' },
  { updateUsername: '%' }, { updateUsername: '_' }, { updateUsername: '[]' }, { updateUsername: '   ' }]) {
  for (const options of [{ limit: 50, offset: 0 }, { limit: 1, offset: 1 }, { limit: -1, offset: -1 }, { limit: 0, offset: 0 }]) {
    const result = getAuditLog(filters, options)
    audit.push({ filters, options, expected: { ids: result.auditLogEntries.map(row => row.mainRecordId), count: result.count } })
  }
}
auditDb.close()
const unicodeDb = fresh(), auditUnicode = [], auditUnicodeNames = ['Synthetic[ 🪦', 'synthetic', 'Ä']
for (const [index, username] of auditUnicodeNames.entries()) insert(unicodeDb, 'AuditLog', {
  logMillis: index + 1, logDate: 20261021, logTime: 1234, mainRecordType: 'user', mainRecordId: String(index + 1),
  updateTable: 'Users', updateField: 'Synthetic', updateType: 'updated', updateUsername: username })
const { getAuditLog: getUnicodeAudit } = await o.load('database/getAuditLog.js', ['getAuditLog'], {
  getDatabaseConnection: () => ({ ...dbBoundary(unicodeDb, []), close() {} }), dateStringToInteger: value => Number(value.replaceAll('-', '')) })
for (const pattern of [' SYNTHETIC ', '%', '_', '[', '🪦', 'ä', '']) {
  const result = getUnicodeAudit({ updateUsername: pattern }, { limit: 50 })
  auditUnicode.push({ pattern, expected: { ids: result.auditLogEntries.map(row => row.mainRecordId), count: result.count } })
}
unicodeDb.close()
const handlers = []
for (const body of [{}, { limit: '2.9', offset: '1.9' }, { limit: 2.9, offset: -1.9 },
  { limit: '', offset: '' }, { limit: '-1', offset: '-3' }, { limit: 'invalid' },
  { mainRecordId: 'not-forwarded', mainRecordType: 'contract', updateUsername: '  user  ', logDateFrom: '2026-10-20' }]) {
  let arguments_, expected
  const { handler } = await o.load('handlers/adminPost/doGetAuditLog.js', ['handler'], {
    defaultAuditLogLimit: 50, getAuditLog(...args) { arguments_ = args; return { auditLogEntries: [], count: 0 } } })
  handler({ body }, { json(value) { expected = value } })
  handlers.push(clean({ operation: 'audit', body, arguments: arguments_, expected }))
}
for (const age of [undefined, '', 'bogus', 'all', 'thirtyDays', 'ninetyDays', 'oneYear']) {
  const response = { status: 200 }
  const { handler } = await o.load('handlers/adminPost/doPurgeAuditLog.js', ['handler'], { purgeAuditLog(value) { response.purgeArgument = value; return 7 } })
  handler({ body: { age } }, { status(value) { response.status = value; return this }, json(value) { response.body = value } })
  handlers.push(clean({ operation: 'purge', body: { age }, expected: response }))
}

const backups = []
for (const [name, pages, supplied, failure] of [['success-own', 8, false, false], ['success-borrowed', 8, true, false],
  ['zero-is-failure', 0, false, false], ['negative-is-failure', -1, false, false], ['exception', 0, false, true]]) {
  const events = [], boundary = { close() { events.push(['close']) } }
  const { backupDatabase } = await o.load('database/backupDatabase.js', ['backupDatabase'], { ...common,
    backupFolder: 'data/backups', sunriseDB: 'data/sunrise.db', getDatabaseConnection() { events.push(['connect']); return boundary },
    async backup(database, file) { assert.equal(database, boundary); events.push(['backup', file]); if (failure) throw new Error('Synthetic failure'); return pages } })
  backups.push({ name, pages, supplied, failure, expected: await backupDatabase(supplied ? boundary : undefined), events })
}
const lastBackups = []
const helperRaw = await o.source('helpers/database.helpers.js')
for (const [name, entries, times, failed] of [['none', [], {}, ''],
  ['latest-mtime', ['readme', 'old.db.1', 'other.db.2'], { 'old.db.1': 100, 'other.db.2': 200 }, ''],
  ['non-backup-ignored', ['readme'], {}, ''], ['one-stat-failure-discards-all', ['ok.db.1', 'bad.db.2'], { 'ok.db.1': 100 }, 'bad.db.2']]) {
  const events = [], { getLastBackupDate } = await o.load('helpers/database.helpers.js', ['getLastBackupDate'], { ...common,
    PROCESS_ID_MAX_DIGITS: 6, getConfigProperty: () => false, DatabaseSync,
    fs: { async readdir(folder) { events.push(['readdir', folder]); return entries }, async stat(file) { const name = path.basename(file); events.push(['stat', file.replaceAll('\\', '/')]); if (name === failed) throw new Error('Synthetic failure'); return { mtime: new Date(times[name]) } } } }, raw => raw.replace('export default {', 'const defaultExport = {'))
  lastBackups.push({ name, entries, times, failed, expected: (await getLastBackupDate())?.getTime() ?? null, events })
}

const backupTasks = []
for (const [name, lastRun, deleteAgeDays, success] of [['no-backup', null, 0, true], ['exactly-one-day-no-catchup', NOW - DAY, 0, true],
  ['older-than-day-catchup', NOW - DAY - 1, 30, true], ['recent-no-catchup', NOW - 3600000, 30, true],
  ['failed-no-retention', null, 30, false]]) {
  const events = [], fakeFiles = ['readme', 'old.db.1', 'boundary.db.2', 'new.db.3', 'locked.db.4'], cutoff = NOW - 30 * DAY
  class ScheduledTask { constructor(taskName, callback, options) { events.push(['schedule', taskName, options]); this.callback = callback }
    async runTask() { events.push(['runTask']); await this.callback() } }
  await o.load('tasks/backupDatabase.task.js', ['runDatabaseBackup', 'cleanupOldBackups'], { ...common, ScheduledTask,
    getConfigProperty: key => key.endsWith('backupHour') ? 2 : deleteAgeDays, backupFolder: 'data/backups',
    getLastBackupDate: async () => lastRun === null ? undefined : new Date(lastRun),
    backupDatabase: async () => { events.push(['backup']); return success ? 'data/backups/sunrise.db.1700000000123' : false },
    fs: { async readdir(folder) { events.push(['readdir', folder]); return fakeFiles },
      async stat(file) { const name = path.basename(file); events.push(['stat', file.replaceAll('\\', '/')]); return { mtime: new Date(name.startsWith('boundary') ? cutoff : name.startsWith('new') ? cutoff + 1 : cutoff - 1) } },
      async unlink(file) { events.push(['unlink', file.replaceAll('\\', '/')]); if (file.includes('locked')) throw new Error('Synthetic locked file') } } })
  backupTasks.push(clean({ name, lastRun, deleteAgeDays, success, events }))
}

// Execute the actual locked scheduler class. Only timer/semaphore boundaries
// are injected; minimum interval, catchErrors and completion timestamps are original.
const scheduledDirectory = await o.install('@cityssm/scheduled-task', '', false)
const schedulerRaw = await o.packageSource(scheduledDirectory, 'index.js')
const schedulerBody = strip(schedulerRaw).replace(/^export \* as .*;\r?$/gm, '')
const scheduledTaskCases = []
for (const [name, elapsed, throws, catchErrors] of [['below-six-hour-floor', 21600000 - 1, false, true],
  ['exact-six-hour-floor', 21600000, false, true], ['failure-caught', 21600000, true, true],
  ['failure-rethrown', 21600000, true, false], ['new-task-can-run', NOW, false, true]]) {
  now = NOW
  const events = []
  class Sema { async acquire() { events.push(['acquire']) } release() { events.push(['release']) } nrWaiting() { return 0 } }
  const injected = { ...common, Sema, camelCase: value => value.replaceAll(' ', ''), alreadyStartedError: new Error('Already started'),
    nodeSchedule: { scheduleJob(taskName, schedule) { events.push(['schedule', taskName, schedule]); return { nextInvocation: () => new Date(NOW + DAY), cancel() { events.push(['cancel']) } } } },
    exitHook() { events.push(['exitHook']) } }
  const { ScheduledTask } = new Function(...Object.keys(injected), schedulerBody + '\nreturn {ScheduledTask}')( ...Object.values(injected))
  const task = new ScheduledTask('Synthetic Backup', async () => {
    events.push(['attempt', now]); now += 2500; if (throws) throw new Error('Synthetic backup failure')
  }, { minimumIntervalMillis: 21600000, lastRunMillis: NOW - elapsed, catchErrors, startTask: true, schedule: { hour: 2, minute: 0, second: 0 } })
  const canRunBefore = task.canRunTask()
  let error
  try { await task.runTask() } catch (caught) { error = errorShape(caught) }
  const lastRunMillis = task.getLastRunMillis(), canRunAfter = task.canRunTask()
  task.stopTask()
  scheduledTaskCases.push(clean({ name, elapsed, throws, catchErrors, canRunBefore, canRunAfter, lastRunMillis, error, events }))
}
now = NOW

// Actual locked configuration package: flat dotted keys and nested values.
const configDirectory = await o.install('@cityssm/configurator', '', false)
const configModule = await import(o.pathToFileURL(path.join(configDirectory, 'index.js')).href)
await o.packageSource(configDirectory, 'index.js')
const configDefaults = new Function('hoursToMillis', strip(await o.source('helpers/config.defaults.js')) + '\nreturn configDefaultValues')(value => value * 3600000)
const configurations = []
for (const overrides of [{}, { settings: { databaseBackup: { backupHour: 5 }, auditLog: { enabled: true } } },
  { 'settings.databaseBackup.backupHour': 9 }, { settings: { databaseBackup: { backupHour: null } } }]) {
  const configurator = new configModule.Configurator(configDefaults, overrides)
  configurations.push({ overrides, expected: Object.fromEntries(['settings.databaseBackup.backupHour', 'settings.databaseBackup.taskIsEnabled', 'settings.adminCleanup.recordDeleteAgeDays', 'settings.auditLog.enabled'].map(key => [key, configurator.getConfigProperty(key)])) })
}
const configHelpers = []
for (const [enabled, disable, keepAlive, maxAge] of [[true, '', true, 3600000], [true, 'true', false, 3600000],
  [true, 'TRUE', true, 1000], [false, '', true, 5000]]) {
  const { isAuditLoggingEnabled, keepAliveMillis } = await o.load('helpers/config.helpers.js', ['isAuditLoggingEnabled', 'keepAliveMillis'], {
    Configurator: configModule.Configurator, configDefaultValues: configDefaults,
    config: { settings: { auditLog: { enabled } }, session: { doKeepAlive: keepAlive, maxAgeMillis: maxAge } },
    process: { env: { DISABLE_AUDIT_LOG: disable } }, secondsToMillis: value => value * 1000 }, raw => raw.replace('export default {', 'const defaultExport = {'))
  configHelpers.push({ enabled, disable, keepAlive, maxAge, expected: { isAuditLoggingEnabled, keepAliveMillis } })
}
for (const file of ['index.js', 'app/app.js', 'app/appProcess.js', 'routes/admin.js', 'views/admin/database.ejs',
  'views/admin/auditLog.ejs', 'public/javascripts/database.admin.js', 'public/javascripts/auditLog.admin.js',
  'public/html/adminAuditLog-purge.html', 'cypress/e2e/01admin/database.cy.js', 'cypress/e2e/01admin/z.auditLog.cy.js', 'docs/databaseManagement.md']) await o.source(file)
await o.finish('operations-reference.json', { now: NOW, dayMillis: DAY, sourceOracleForeignKeys: false, defaultForeignKeys, cleanupQueries, cleanup, constraintFailures, cleanupTrace, purgeSeeds, purge,
  auditSeeds, audit, auditUnicodeNames, auditUnicode, handlers, backups, lastBackups, backupTasks, scheduledTaskCases, configDefaults, undefinedDefaults: Object.keys(configDefaults).filter(key => configDefaults[key] === undefined), configurations, configHelpers })
console.log(`PASS: original Sunrise ${cleanup.length} cleanup scenarios + ${constraintFailures.length} FK failures, ${purge.length} purge boundaries, ${audit.length} audit filters/pages + ${auditUnicode.length} Unicode cases, ${handlers.length} handlers, ${backups.length} backups, ${backupTasks.length} task schedules, ${scheduledTaskCases.length} locked scheduler cases and locked configuration`)
