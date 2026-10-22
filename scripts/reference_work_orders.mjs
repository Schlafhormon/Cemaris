// Execute immutable Sunrise work-order SQL, handlers and iCalendar exporter.
// SQLite is exclusively the SOURCE oracle. Target evidence uses SQL Server.
// Sunrise copyright/MIT notice: licenses/Sunrise-LICENSE.md.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = path.resolve(root, '../Sunrise-Referenz')
const commit = '451ce034863b16502484367044f3e9b65370111a'
assert.equal(execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit)
assert.equal(execFileSync('git', ['-C', reference, 'status', '--porcelain'], { encoding: 'utf8' }).trim(), '')
const work = path.join(root, '.local/reference-work-orders')
await fs.mkdir(work, { recursive: true })
const hashes = {}
async function source(name) {
  const raw = await fs.readFile(path.join(reference, name), 'utf8')
  hashes[name] = createHash('sha256').update(raw).digest('hex')
  return raw
}
const lock = JSON.parse(await source('package-lock.json'))
const packages = []
for (const name of ['@cityssm/utils-datetime', '@cityssm/object-difference', 'ical-generator']) {
  const info = lock.packages[`node_modules/${name}`]
  const archive = path.join(work, `${name.replaceAll('/', '_').replaceAll('@', '')}-${info.version}.tgz`)
  try { await fs.access(archive) } catch {
    const response = await fetch(info.resolved)
    assert.ok(response.ok, info.resolved)
    await fs.writeFile(archive, Buffer.from(await response.arrayBuffer()))
  }
  assert.equal(`sha512-${createHash('sha512').update(await fs.readFile(archive)).digest('base64')}`, info.integrity)
  const directory = path.join(work, 'node_modules', name)
  await fs.mkdir(directory, { recursive: true })
  execFileSync('tar', ['-xzf', archive, '-C', directory, '--strip-components=1'])
  packages.push({ name, version: info.version, integrity: info.integrity })
}
async function dependency(name, file = 'index.js') { return import(pathToFileURL(path.join(work, 'node_modules', name, file)).href) }
const datetime = await dependency('@cityssm/utils-datetime')
const { default: getObjectDifference } = await dependency('@cityssm/object-difference')
const icalPackage = JSON.parse(await fs.readFile(path.join(work, 'node_modules/ical-generator/package.json'), 'utf8'))
const { default: ical, ICalEventStatus } = await dependency('ical-generator', icalPackage.exports.import.default)
process.env.TZ = 'Europe/Berlin'
const RealDate = Date
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [2026, 9, 20, 9, 5, 42])) }
  static now() { return new RealDate(2026, 9, 20, 9, 5, 42).getTime() }
}
const schema = await source('database/initializeDatabase.js')
const statements = new Function(schema.slice(schema.indexOf('const recordColumns'), schema.indexOf('const initializingUser')) + '\nreturn sqlCreateStatements;')()
let database
let connectionCloses = 0
const shared = { prepare: (...args) => database.prepare(...args), function: (...args) => database.function(...args), close: () => { connectionCloses++ } }
const config = {
  'settings.workOrders.workOrderNumberLength': 5,
  'application.applicationName': 'Sunrise CMS',
  'settings.workOrders.calendarEmailAddress': 'synthetic-calendar@example.invalid',
  'settings.workOrders.prints': ['syntheticWorkOrder', 'missingPrint'],
  'reverseProxy.urlPrefix': '',
}
const helpers = {
  ...Object.fromEntries(Object.entries(datetime).filter(([key]) => key !== 'default')),
  getObjectDifference, Date: Clock, getDatabaseConnection: () => shared,
  isAuditLoggingEnabled: true, Debug: () => () => {}, DEBUG_NAMESPACE: 'synthetic-work-orders',
  getConfigProperty: key => config[key] ?? false,
  getCachedSettingValue: key => key.endsWith('recentBeforeDays') ? '7' : '30',
  getCachedWorkOrderMilestoneTypes: () => database.prepare('SELECT * FROM WorkOrderMilestoneTypes WHERE recordDelete_timeMillis IS NULL ORDER BY orderNumber').all(),
  getCachedContractTypeById: id => database.prepare('SELECT * FROM ContractTypes WHERE contractTypeId=?').get(id),
  getContractFees: () => [], getContractTransactions: () => [],
  // This prior-step child boundary supplies only the names consumed by work orders.
  getContractInterments: id => database.prepare('SELECT deceasedName FROM ContractInterments WHERE contractId=? AND recordDelete_timeMillis IS NULL ORDER BY intermentNumber').all(id),
  cacheTableNames: [], clearCacheByTableName() {}, startSyncDataToPortalTask() {},
  getAppUrl: () => 'https://cemaris.example.invalid',
  getPrintConfig: name => name === 'syntheticWorkOrder' ? { title: 'Synthetic Print <&>' } : undefined,
  ical, ICalEventStatus,
}
function strip(raw) {
  return raw.replace(/^import .*;\r?$/gm, '').replace(/^export default ([A-Za-z_$][\w$]*);?\r?$/gm, '')
    .replaceAll('export default async function', 'async function').replaceAll('export default function', 'function')
    .replaceAll('export async function', 'async function').replaceAll('export function', 'function')
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
async function load(file, names) {
  await source(file.replace(/\.js$/, '.ts'))
  return new AsyncFunction(...Object.keys(helpers), strip(await source(file)) + `\nreturn {${names.join(',')}};`)(...Object.values(helpers))
}
const databaseHelpers = await source('helpers/database.helpers.js')
await source('helpers/database.helpers.ts')
Object.assign(helpers, new Function(databaseHelpers.slice(databaseHelpers.indexOf('const LIMIT_DEFAULT'), databaseHelpers.indexOf('export async function getLastBackupDate'))
  .replace(/export function getDatabaseConnection[\s\S]*?\n}/, '').replaceAll('export function', 'function') + '\nreturn {sanitizeLimit,sanitizeOffset};')())
Object.assign(helpers, await load('helpers/functions.sqlFilters.js', ['getBurialSiteNameWhereClause', 'getDeceasedNameWhereClause', 'getContractTimeWhereClause', 'getPurchaserNameWhereClause']))
for (const name of ['createAuditLogEntries', 'getBurialSites', 'getContracts', 'getNextWorkOrderNumber', 'addWorkOrderContract', 'addWorkOrderBurialSite', 'addWorkOrderMilestone', 'addWorkOrderComment', 'getWorkOrderComments', 'updateWorkOrderComment', 'updateWorkOrderMilestone', 'updateWorkOrderMilestoneTime', 'completeWorkOrderMilestone', 'reopenWorkOrderMilestone', 'getWorkOrderMilestones', 'addWorkOrder', 'updateWorkOrder', 'closeWorkOrder', 'reopenWorkOrder', 'deleteWorkOrderBurialSite', 'deleteWorkOrderContract', 'deleteRecord', 'getWorkOrders']) {
  Object.assign(helpers, await load(`database/${name}.js`, [name]))
}
Object.assign(helpers, await load('database/getWorkOrder.js', ['getWorkOrder', 'getWorkOrderByWorkOrderNumber']))
Object.assign(helpers, await load('database/updateBurialSite.js', ['updateBurialSiteStatus']))
const handlers = {}
for (const file of (await fs.readdir(path.join(reference, 'handlers/workOrdersPost'))).filter(name => name.endsWith('.js'))) {
  handlers[file.slice(0, -3)] = (await load(`handlers/workOrdersPost/${file}`, ['handler'])).handler
}
const ics = await load('handlers/apiGet/milestoneICS.js', ['handler', 'buildEventSummary', 'buildEventDescriptionHTML', 'buildEventCategoryList', 'buildEventLocation'])
const actor = { username: 'synthetic-work-orders' }
const editor = { username: 'synthetic-work-orders-editor' }
function insert(table, values) {
  const data = { recordCreate_username: actor.username, recordCreate_timeMillis: 1, recordUpdate_username: actor.username, recordUpdate_timeMillis: 1, ...values }
  return Number(database.prepare(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(() => '?').join(',')})`).run(...Object.values(data)).lastInsertRowid)
}
const seed = []
function setup(record = false) {
  database?.close()
  database = new DatabaseSync(':memory:')
  for (const sql of statements) database.exec(sql)
  connectionCloses = 0
  const add = (table, values) => { const id = insert(table, values); if (record) seed.push({ table, id, values }); return id }
  add('WorkOrderTypes', { workOrderType: 'Synthetic Interment', orderNumber: 0 })
  add('WorkOrderTypes', { workOrderType: 'Synthetic Maintenance', orderNumber: 1 })
  add('WorkOrderStatuses', { workOrderStatus: 'Synthetic pending', orderNumber: 0 })
  add('WorkOrderMilestoneTypes', { workOrderMilestoneType: 'Synthetic opening', orderNumber: 1 })
  add('WorkOrderMilestoneTypes', { workOrderMilestoneType: 'Synthetic service', orderNumber: 0 })
  add('ContractTypes', { contractType: 'Synthetic contract', orderNumber: 0 })
  add('BurialSiteTypes', { burialSiteType: 'Synthetic grave', orderNumber: 0 })
  add('BurialSiteStatuses', { burialSiteStatus: 'Synthetic available', orderNumber: 0 })
  add('BurialSiteStatuses', { burialSiteStatus: 'Synthetic occupied', orderNumber: 1 })
  add('Cemeteries', { cemeteryName: 'Synthetic parent', cemeteryKey: 'SYN-P' })
  add('Cemeteries', { cemeteryName: 'Synthetic child', cemeteryKey: 'SYN-C', parentCemeteryId: 1 })
  add('Cemeteries', { cemeteryName: 'Synthetic grandchild', cemeteryKey: 'SYN-G', parentCemeteryId: 2 })
  for (let id = 1; id <= 3; id++) add('BurialSites', { burialSiteTypeId: 1, burialSiteStatusId: 1, cemeteryId: id,
    burialSiteName: `SYN-WO-0${id}`, burialSiteNameSegment1: `SYN-WO-0${id}`, burialSiteNameSegment2: '', burialSiteNameSegment3: '', burialSiteNameSegment4: '', burialSiteNameSegment5: '' })
  add('FuneralHomes', { funeralHomeName: 'Synthetic funeral home' })
  add('Contracts', { contractTypeId: 1, burialSiteId: 2, funeralHomeId: 1, contractNumber: 'SYN-WO-C1', purchaserName: 'Synthetic purchaser', contractStartDate: 20261001 })
  const address = { deceasedAddress1: '', deceasedAddress2: '', deceasedCity: '', deceasedProvince: '', deceasedPostalCode: '' }
  add('ContractInterments', { contractId: 1, intermentNumber: 0, deceasedName: 'Synthetic Jane <&>', ...address })
  add('ContractInterments', { contractId: 1, intermentNumber: 1, deceasedName: 'Synthetic John', ...address })
  add('Contracts', { contractTypeId: 1, burialSiteId: 3, contractNumber: 'SYN-WO-C2', purchaserName: 'Synthetic other', contractStartDate: 20261001 })
}
setup(true)
function clean(value) {
  if (Array.isArray(value)) return value.map(clean)
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith('record')).map(([key, item]) => [key, clean(item)]))
  return value
}
function raw(table) {
  const columns = { WorkOrderContracts: 'workOrderId,contractId', WorkOrderBurialSites: 'workOrderId,burialSiteId' }[table] ?? 'rowid'
  return database.prepare(`SELECT * FROM ${table} ORDER BY ${columns}`).all().map(row => ({ ...clean(row), deleted: row.recordDelete_timeMillis !== null }))
}
function audit() {
  return database.prepare('SELECT * FROM AuditLog ORDER BY rowid').all().map(row => ({ ...Object.fromEntries(['mainRecordType', 'mainRecordId', 'updateTable', 'recordIndex', 'updateField', 'updateType', 'updateUsername'].map(key => [key, row[key]])),
    fromValue: row.fromValue === null ? null : clean(JSON.parse(row.fromValue)), toValue: row.toValue === null ? null : clean(JSON.parse(row.toValue)) }))
}
const fullOrder = { workOrderTypeId: 1, workOrderStatusId: 1, workOrderNumber: '', workOrderDescription: 'Synthetic work <&>\nSecond line', workOrderOpenDateString: '', workOrderCloseDateString: '' }
const fullMilestone = { workOrderId: 1, workOrderMilestoneTypeId: 1, workOrderMilestoneDateString: '2026-10-20', workOrderMilestoneTimeString: '10:30', workOrderMilestoneDescription: 'Synthetic milestone <&>' }
const defaults = []
for (const overrides of [{}, { workOrderNumber: 'Manual duplicate', workOrderOpenDateString: '2026-02-31', workOrderCloseDateString: '2026-01-01' },
  { contractId: 1, workOrderMilestoneId_1: '1', workOrderMilestoneDateString_1: '', workOrderMilestoneTimeString_1: '', workOrderMilestoneDescription_1: 'Initial milestone', workOrderMilestoneId_2: '2', workOrderMilestoneDateString_2: '2026-10-21' }]) {
  setup()
  const form = { ...fullOrder, ...overrides }
  const result = helpers.addWorkOrder(form, actor, shared)
  defaults.push({ form, result, rows: raw('WorkOrders'), milestones: raw('WorkOrderMilestones'), contracts: raw('WorkOrderContracts'), audit: audit() })
}
const numbering = []
for (const numbers of [[], ['2026-9', '2026-010', '2026-x', '2025-999'], ['2026-99999', '2026-00001'], ['2026-4', '2026-4a', '2026--10', 'x2026-99'],
  ['2026-9\n', '2026-10\r\n', '2026-11 ', '2026-12\t', '2026-4'],
  ['2026-9007199254740992'], ['2026-9223372036854775807', '2026-9223372036854775808'],
  ['2026-999999999999999999999999999999999999999999999', '2026-888888888888888888888888888888888888888888888']]) {
  setup()
  for (const workOrderNumber of numbers) insert('WorkOrders', { workOrderTypeId: 1, workOrderStatusId: 1, workOrderNumber, workOrderOpenDate: 20261020, recordDelete_timeMillis: 1 })
  numbering.push({ numbers, expected: helpers.getNextWorkOrderNumber(shared) })
}
setup()
helpers.addWorkOrder(fullOrder, actor, shared)
const orderActions = [
  ['update', { ...fullOrder, workOrderId: 1, workOrderNumber: 'SYN-UPDATED', workOrderOpenDateString: '2026-10-19' }],
  ['close', { workOrderId: 1, workOrderCloseDateString: '2026-10-19' }], ['close', { workOrderId: 1 }],
  ['reopen', { workOrderId: 1 }], ['reopen', { workOrderId: 1 }],
  ['delete', { workOrderId: 1 }], ['update', { ...fullOrder, workOrderId: 1, workOrderNumber: 'Deleted update', workOrderOpenDateString: '2026-10-20' }],
  ['close', { workOrderId: 1 }], ['reopen', { workOrderId: 1 }], ['delete', { workOrderId: 999 }],
]
const orderLifecycle = []
for (const [action, form] of orderActions) {
  const result = action === 'update' ? helpers.updateWorkOrder(form, editor, shared) : action === 'close' ? helpers.closeWorkOrder(form, editor, shared)
    : action === 'reopen' ? helpers.reopenWorkOrder(form.workOrderId, editor, shared) : helpers.deleteRecord('WorkOrders', form.workOrderId, editor, shared)
  orderLifecycle.push({ action, form, result, rows: raw('WorkOrders'), audit: audit() })
}
const milestoneDefaults = []
for (const overrides of [{}, { workOrderMilestoneTypeId: '', workOrderMilestoneDateString: '', workOrderMilestoneTimeString: '' },
  { workOrderMilestoneCompletionDateString: '2026-10-19', workOrderMilestoneCompletionTimeString: '23:59' },
  { workOrderMilestoneDateString: '2026-02-31', workOrderMilestoneTimeString: '23:59' }]) {
  setup(); helpers.addWorkOrder(fullOrder, actor, shared)
  const form = { ...fullMilestone, ...overrides }
  const result = helpers.addWorkOrderMilestone(form, actor, shared)
  milestoneDefaults.push({ form, result, rows: raw('WorkOrderMilestones'), retrieved: clean(await helpers.getWorkOrderMilestones({ workOrderId: 1 }, { orderBy: 'date' }, shared)), audit: audit() })
}
setup(); helpers.addWorkOrder(fullOrder, actor, shared); helpers.addWorkOrderMilestone(fullMilestone, actor, shared)
const milestoneLifecycle = []
for (const [action, form] of [
  ['update', { ...fullMilestone, workOrderMilestoneId: 1, workOrderMilestoneTypeId: '', workOrderMilestoneDateString: '', workOrderMilestoneTimeString: '' }],
  ['time', { workOrderMilestoneId: 1, workOrderMilestoneDateString: '', workOrderMilestoneTimeString: '00:00' }],
  ['complete', { workOrderMilestoneId: 1, workOrderMilestoneCompletionDateString: '2026-10-19', workOrderMilestoneCompletionTimeString: '14:35' }],
  ['complete', { workOrderMilestoneId: 1 }],
  ['complete', { workOrderMilestoneId: 1, workOrderMilestoneCompletionDateString: '2001-01-01', workOrderMilestoneCompletionTimeString: '99:99' }],
  ['reopen', { workOrderMilestoneId: 1 }], ['reopen', { workOrderMilestoneId: 1 }],
  ['delete', { workOrderMilestoneId: 1 }], ['delete', { workOrderMilestoneId: 1 }],
  ['update', { ...fullMilestone, workOrderMilestoneId: 1 }], ['complete', { workOrderMilestoneId: 1 }],
  ['reopen', { workOrderMilestoneId: 1 }], ['time', { workOrderMilestoneId: 999, workOrderMilestoneDateString: '', workOrderMilestoneTimeString: '' }],
]) {
  const result = action === 'update' ? helpers.updateWorkOrderMilestone(form, editor, shared)
    : action === 'time' ? helpers.updateWorkOrderMilestoneTime(form, editor, shared)
      : action === 'complete' ? helpers.completeWorkOrderMilestone(form, editor, shared)
        : action === 'reopen' ? helpers.reopenWorkOrderMilestone(form.workOrderMilestoneId, editor, shared)
          : helpers.deleteRecord('WorkOrderMilestones', form.workOrderMilestoneId, editor, shared)
  milestoneLifecycle.push({ action, form, result, rows: raw('WorkOrderMilestones'), audit: audit() })
}
setup(); helpers.addWorkOrder(fullOrder, actor, shared)
const relationLifecycle = []
for (const [action, kind, id] of [['add', 'BurialSite', 1], ['add', 'BurialSite', 1], ['delete', 'BurialSite', 1], ['delete', 'BurialSite', 1], ['add', 'BurialSite', 1], ['delete', 'BurialSite', 999], ['add', 'Contract', 1], ['add', 'Contract', 1], ['delete', 'Contract', 1], ['delete', 'Contract', 1], ['add', 'Contract', 1], ['delete', 'Contract', 999]]) {
  const key = kind === 'BurialSite' ? 'burialSiteId' : 'contractId'
  const form = { workOrderId: 1, [key]: id }
  const result = action === 'add' ? helpers[`addWorkOrder${kind}`](form, editor, shared) : helpers[`deleteWorkOrder${kind}`](1, id, editor, shared)
  relationLifecycle.push({ action, kind, form, result, rows: raw(`WorkOrder${kind}s`), audit: audit() })
}
setup(); helpers.addWorkOrder(fullOrder, actor, shared)
const commentLifecycle = []
for (const [action, form] of [
  ['add', { workOrderId: 1, comment: 'Synthetic comment <&>\nSecond line' }],
  ['update', { workOrderCommentId: 1, comment: 'Changed', commentDateString: '2026-10-20', commentTimeString: '00:00' }],
  ['update', { workOrderCommentId: 1, comment: 'Changed again', commentDateString: '2026-10-19', commentTimeString: '23:59' }],
  ['delete', { workOrderCommentId: 1 }], ['delete', { workOrderCommentId: 1 }],
  ['update', { workOrderCommentId: 1, comment: 'Deleted change', commentDateString: '2026-10-19', commentTimeString: '23:59' }],
]) {
  const result = action === 'add' ? helpers.addWorkOrderComment(form, actor, shared) : action === 'update' ? helpers.updateWorkOrderComment(form, editor, shared) : helpers.deleteRecord('WorkOrderComments', form.workOrderCommentId, editor, shared)
  commentLifecycle.push({ action, form, result, rows: raw('WorkOrderComments'), retrieved: clean(helpers.getWorkOrderComments(1, shared)), audit: audit() })
}
const sourceErrorBoundaries = []
for (const [operation, form] of [
  ['addWorkOrder', { ...fullOrder, workOrderStatusId: undefined }],
  ['updateWorkOrder', { ...fullOrder, workOrderId: 1 }],
  ['addWorkOrderMilestone', { ...fullMilestone, workOrderMilestoneTimeString: '99:99' }],
  ['addWorkOrderMilestone', { ...fullMilestone, workOrderMilestoneCompletionTimeString: '99:99' }],
  ['updateWorkOrderMilestone', { ...fullMilestone, workOrderMilestoneId: 1, workOrderMilestoneTimeString: '99:99' }],
  ['updateWorkOrderComment', { workOrderCommentId: 1, comment: 'Blank', commentDateString: '', commentTimeString: '' }],
]) {
  setup(); helpers.addWorkOrder(fullOrder, actor, shared); helpers.addWorkOrderComment({ workOrderId: 1, comment: 'Before' }, actor, shared)
  try { helpers[operation](form, editor, shared); throw new Error('Expected source binding failure') }
  catch (error) { assert.equal(error.code, 'ERR_INVALID_ARG_TYPE'); sourceErrorBoundaries.push({ operation, form, errorCode: error.code, message: error.message }) }
}
setup(); helpers.addWorkOrder({ ...fullOrder, contractId: 1 }, actor, shared)
helpers.addWorkOrderBurialSite({ workOrderId: 1, burialSiteId: 1 }, actor, shared)
helpers.addWorkOrderMilestone(fullMilestone, actor, shared)
helpers.addWorkOrderComment({ workOrderId: 1, comment: 'Cascade' }, actor, shared)
helpers.deleteRecord('WorkOrders', 1, editor, shared)
const cascade = Object.fromEntries(['WorkOrders', 'WorkOrderMilestones', 'WorkOrderBurialSites', 'WorkOrderContracts', 'WorkOrderComments'].map(table => [table, raw(table)]))
function seedSearch() {
  setup()
  for (const values of [
    { workOrderNumber: '2026-10', workOrderOpenDate: 20261020 },
    { workOrderNumber: '2026-9', workOrderOpenDate: 20261020, workOrderTypeId: 2, workOrderCloseDate: 20261020 },
    { workOrderNumber: '2026-11', workOrderOpenDate: 20261019 },
    { workOrderNumber: '2026-12', workOrderOpenDate: 20261020 },
    { workOrderNumber: '2026-13', workOrderOpenDate: 20261020, recordDelete_timeMillis: 1 },
  ]) insert('WorkOrders', { workOrderTypeId: 1, workOrderStatusId: 1, workOrderDescription: 'Synthetic search', ...values })
  for (const [workOrderId, burialSiteId] of [[1, 1], [2, 3]]) insert('WorkOrderBurialSites', { workOrderId, burialSiteId })
  for (const [workOrderId, contractId] of [[1, 1], [3, 2]]) insert('WorkOrderContracts', { workOrderId, contractId })
  for (const [workOrderId, workOrderMilestoneDate, workOrderMilestoneTime, workOrderMilestoneTypeId, workOrderMilestoneCompletionDate] of [
    [1, 20261019, null, 1, null], [1, 20261020, 930, 2, null], [1, 0, null, null, null],
    [2, 20261020, 0, 2, 20261020], [3, 20260901, 1200, 1, 20260901], [3, 20261119, 1200, 1, null],
  ]) insert('WorkOrderMilestones', { workOrderId, workOrderMilestoneDate, workOrderMilestoneTime, workOrderMilestoneTypeId, workOrderMilestoneCompletionDate, workOrderMilestoneDescription: 'Synthetic milestone' })
}
seedSearch()
const searchSeed = Object.fromEntries(['WorkOrders', 'WorkOrderBurialSites', 'WorkOrderContracts', 'WorkOrderMilestones'].map(table => [table, raw(table)]))
const searches = []
for (const filters of [{}, { workOrderTypeId: 1 }, { workOrderOpenStatus: 'open' }, { workOrderOpenStatus: 'closed' }, { workOrderOpenDateString: '2026-10-20' },
  { workOrderMilestoneDateString: '2026-10-20' }, { burialSiteName: 'WO-01' }, { burialSiteName: 'wo-02 wo' }, { burialSiteName: '%' },
  { cemeteryId: 1 }, { cemeteryId: 2 }, { cemeteryId: 3 }, { contractId: 1 }, { funeralHomeId: 1 }, { deceasedName: 'jane jane' },
  { deceasedName: 'SYNTHETIC John' }, { workOrderOpenStatus: 'unknown' }]) {
  searches.push({ filters, options: { limit: -1, offset: 0 }, expected: clean(await helpers.getWorkOrders(filters, { limit: -1, offset: 0 }, shared)) })
}
for (const options of [{ limit: 1, offset: 0 }, { limit: 2, offset: 1 }, { limit: 0, offset: 0 }, { limit: 'bad', offset: '-1' }]) searches.push({ filters: {}, options, expected: clean(await helpers.getWorkOrders({}, options, shared)) })
const milestoneSearches = []
for (const filters of [{}, { workOrderId: 1 }, ...['blank', 'notBlank', 'recent', 'upcomingMissed'].map(workOrderMilestoneDateFilter => ({ workOrderMilestoneDateFilter })),
  { workOrderMilestoneDateFilter: 'yearMonth', workOrderMilestoneYear: '2026', workOrderMilestoneMonth: '10' }, { workOrderMilestoneDateString: '2026-10-20' },
  { workOrderMilestoneDateFilter: 'yearMonth', workOrderMilestoneYear: 2026, workOrderMilestoneMonth: 10.5 },
  { workOrderMilestoneDateFilter: 'yearMonth', workOrderMilestoneYear: '2026', workOrderMilestoneMonth: '10.5' },
  { workOrderMilestoneDateFilter: 'yearMonth', workOrderMilestoneYear: null, workOrderMilestoneMonth: null },
  { workOrderTypeIds: '1,9223372036854775808' }, { workOrderMilestoneTypeIds: '9223372036854775808' },
  { workOrderTypeIds: '1,2', workOrderMilestoneTypeIds: '2' }, { workOrderTypeIds: '2' }, { workOrderTypeIds: '1 OR 1=1' }, { workOrderMilestoneTypeIds: ' 1' }]) {
  for (const orderBy of ['date', 'completion']) milestoneSearches.push({ filters, options: { orderBy }, expected: clean(await helpers.getWorkOrderMilestones(filters, { orderBy }, shared)) })
}
const retrieved = { byId: clean(await helpers.getWorkOrder(1, { includeBurialSites: true, includeComments: true, includeMilestones: true }, shared)),
  byNumber: clean(await helpers.getWorkOrderByWorkOrderNumber('2026-10', shared)), missing: (await helpers.getWorkOrder(999, {}, shared)) === undefined }
const handlerCases = []
for (const [name, body] of [
  ['doCreateWorkOrder', fullOrder], ['doSearchWorkOrders', { limit: '10', offset: '0' }], ['doGetWorkdayReport', { workdayDateString: '2026-10-20' }],
  ['doGetWorkOrderMilestones', { workOrderMilestoneDateFilter: 'yearMonth', workOrderMilestoneYear: '2026', workOrderMilestoneMonth: '10' }],
  ['doUpdateWorkOrder', { ...fullOrder, workOrderId: '1', workOrderNumber: 'Changed', workOrderOpenDateString: '2026-10-20' }],
  ['doUpdateWorkOrder', { ...fullOrder, workOrderId: 999, workOrderOpenDateString: '2026-10-20' }], ['doCloseWorkOrder', { workOrderId: '1' }], ['doCloseWorkOrder', { workOrderId: 999 }],
  ['doReopenWorkOrder', { workOrderId: '2' }], ['doReopenWorkOrder', { workOrderId: 1 }],
  ['doAddWorkOrderMilestone', fullMilestone], ['doUpdateWorkOrderMilestone', { ...fullMilestone, workOrderMilestoneId: 1 }],
  ['doCompleteWorkOrderMilestone', { workOrderId: 1, workOrderMilestoneId: 1, workOrderMilestoneCompletionDateString: '2000-01-01' }],
  ['doCompleteWorkOrderMilestone', { workOrderId: 1, workOrderMilestoneId: 999 }], ['doReopenWorkOrderMilestone', { workOrderId: 2, workOrderMilestoneId: 4 }],
  ['doReopenWorkOrderMilestone', { workOrderId: 1, workOrderMilestoneId: 1 }], ['doDeleteWorkOrderMilestone', { workOrderId: 1, workOrderMilestoneId: 1 }],
  ['doAddWorkOrderComment', { workOrderId: 1, comment: 'Synthetic handler comment' }], ['doUpdateWorkOrderComment', { workOrderId: 1, workOrderCommentId: 999, commentDateString: '2026-10-20', commentTimeString: '10:00', comment: 'Missing' }],
  ['doDeleteWorkOrderComment', { workOrderId: 1, workOrderCommentId: 999 }], ['doAddWorkOrderBurialSite', { workOrderId: 1, burialSiteId: 1 }],
  ['doDeleteWorkOrderBurialSite', { workOrderId: 1, burialSiteId: 1 }], ['doDeleteWorkOrderBurialSite', { workOrderId: 1, burialSiteId: 999 }],
  ['doAddWorkOrderContract', { workOrderId: 1, contractId: 1 }], ['doDeleteWorkOrderContract', { workOrderId: 1, contractId: 1 }], ['doDeleteWorkOrderContract', { workOrderId: 1, contractId: 999 }],
  ['doCompleteWorkdayWorkOrderMilestone', { workdayDateString: '2026-10-20', workOrderMilestoneId: 1 }],
  ['doReopenWorkdayWorkOrderMilestone', { workdayDateString: '2026-10-20', workOrderMilestoneId: 4 }],
  ['doUpdateWorkdayWorkOrderMilestoneTime', { workdayDateString: '2026-10-20', workOrderMilestoneId: 1, workOrderMilestoneDateString: '', workOrderMilestoneTimeString: '13:45' }],
  ['doCloseWorkdayWorkOrder', { workdayDateString: '2026-10-20', workOrderId: 1 }], ['doDeleteWorkOrder', { workOrderId: 1 }],
  ['doUpdateBurialSiteStatus', { workOrderId: 1, burialSiteId: 1, burialSiteStatusId: 2 }],
  ['doUpdateBurialSiteStatus', { workOrderId: 1, burialSiteId: 999, burialSiteStatusId: 2 }],
]) {
  seedSearch()
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } }
  await handlers[name]({ body, session: { user: editor } }, response)
  handlerCases.push({ handler: name, body, expected: { status: response.statusCode, body: clean(response.body) }, connectionCloses })
}
seedSearch()
const calendarCases = []
for (const query of [{}, { workOrderId: '1' }, { workOrderTypeIds: '2' }, { workOrderMilestoneTypeIds: '1' }, { workOrderId: '999' }]) {
  const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; return this }, send(body) { this.body = body; return this } }
  await ics.handler({ query }, response)
  // UUIDs are generated afresh by locked ical-generator; preserve all other bytes.
  let uid = 0
  const normalized = response.body.replace(/^UID:.*$/gm, () => `UID:generated-${++uid}`)
  const filters = { workOrderMilestoneTypeIds: query.workOrderMilestoneTypeIds, workOrderTypeIds: query.workOrderTypeIds,
    workOrderMilestoneDateFilter: query.workOrderId ? 'notBlank' : 'recent', ...(query.workOrderId ? { workOrderId: query.workOrderId } : {}) }
  calendarCases.push({ query, milestones: await helpers.getWorkOrderMilestones(filters, { includeWorkOrders: true, orderBy: 'date' }, shared), headers: response.headers, expected: normalized })
}
const calendarHelpers = []
const baseCalendarMilestone = { workOrderId: 1, workOrderMilestoneTypeId: 1, workOrderMilestoneType: 'Synthetic type ', workOrderType: 'Synthetic work', workOrderNumber: 'SYN-1', workOrderDescription: '<&>\nWork', workOrderMilestoneDescription: '  <Synthetic & custom>  ', workOrderMilestoneCompletionDate: null }
for (const overrides of [{}, { workOrderMilestoneTypeId: null }, { workOrderMilestoneTypeId: -1, workOrderMilestoneCompletionDate: 20261020 },
  { workOrderMilestoneTypeId: 0, workOrderContracts: [] },
  { workOrderContracts: [{ contractId: 1, contractType: 'Synthetic <&>', contractStartDateString: '2026-10-01', contractEndDate: null, contractInterments: [{ deceasedName: 'Name, One' }, { deceasedName: 'Name; Two' }] }], workOrderBurialSites: [{ burialSiteId: 1, burialSiteName: 'Grave <&>', cemeteryName: 'Synthetic 🪦', burialSiteType: 'Type', burialSiteStatus: 'Status' }] }]) {
  const milestone = { ...baseCalendarMilestone, ...overrides }
  calendarHelpers.push({ milestone, expected: { summary: ics.buildEventSummary(milestone), categories: ics.buildEventCategoryList(milestone), location: ics.buildEventLocation(milestone), html: ics.buildEventDescriptionHTML({}, milestone) } })
}
let customMilestones = []
const originalGetMilestones = helpers.getWorkOrderMilestones
helpers.getWorkOrderMilestones = async () => customMilestones
const customICS = (await load('handlers/apiGet/milestoneICS.js', ['handler'])).handler
helpers.getWorkOrderMilestones = originalGetMilestones
const calendarEventCases = []
for (const overrides of [
  { workOrderMilestoneTime: null, workOrderMilestoneTimeString: '00:00' },
  { workOrderMilestoneTime: 0, workOrderMilestoneTimeString: '00:00' },
  { workOrderMilestoneDateString: '2026-03-29', workOrderMilestoneTime: 130, workOrderMilestoneTimeString: '01:30' },
  { workOrderMilestoneDateString: '2026-03-29', workOrderMilestoneTime: 230, workOrderMilestoneTimeString: '02:30' },
  { workOrderMilestoneDateString: '2026-10-25', workOrderMilestoneTime: 230, workOrderMilestoneTimeString: '02:30' },
  { workOrderMilestoneTypeId: -1, workOrderMilestoneCompletionDate: 20261020, workOrderMilestoneDescription: '  Custom \\;comma,\nnew line <&>  ' },
  { workOrderMilestoneTypeId: null, workOrderMilestoneType: null, workOrderContracts: [{ contractId: 1, contractType: 'No interments', contractStartDateString: '2026-10-01', contractEndDate: null, contractInterments: [] }] },
  { workOrderMilestoneType: 'Ä🪦漢字'.repeat(25) + ';comma,back\\slash\nquote"caret^', workOrderType: 'Type;with,comma', workOrderDescription: 'Unicode 🪦 & <b> literal', workOrderBurialSites: [{ burialSiteId: 1, burialSiteName: '🪦grave;with,comma', cemeteryName: 'Cemetery' }],
    workOrderContracts: [{ contractId: 1, contractType: 'Type', contractStartDateString: '2026-10-01', contractEndDate: null, contractInterments: [{ deceasedName: 'Name "one";comma,' }, { deceasedName: 'Name^two\nline' }] }] },
]) {
  const milestone = { ...baseCalendarMilestone, workOrderMilestoneDateString: '2026-10-20', workOrderMilestoneTime: 930, workOrderMilestoneTimeString: '09:30',
    recordCreate_username: actor.username, recordCreate_timeMillis: Clock.now(), recordUpdate_timeMillis: Clock.now(), workOrderRecordUpdate_timeMillis: Clock.now() + 3600000, ...overrides }
  customMilestones = [milestone]
  const response = { setHeader() { return this }, send(body) { this.body = body; return this } }
  await customICS({ query: { workOrderId: '1' } }, response)
  calendarEventCases.push({ milestone, expected: response.body.replace(/^UID:.*$/gm, 'UID:generated-1') })
}
const browserUrlSource = await source('public/javascripts/workOrder.ical.js')
const browserUrlBody = browserUrlSource.slice(browserUrlSource.indexOf('function updateCalendarUrl()'), browserUrlSource.indexOf('    document'))
const browserUrlCases = []
for (const [orderIds, milestoneIds, allOrders, allMilestones] of [[[], [], true, true], [['1', '2'], [], false, true], [[], ['3'], true, false], [['2'], ['1', '2'], false, false], [['2'], ['1'], true, true], [[], [], false, false]]) {
  const link = { dataset: { appUrl: 'https://cemaris.example.invalid' }, value: '' }
  new Function('calendarLinkElement', 'workOrderTypeIdsElement', 'workOrderMilestoneTypeIdsElement', 'sunrise', browserUrlBody + '\nupdateCalendarUrl();')(
    link, { disabled: allOrders, selectedOptions: orderIds.map(value => ({ value })) }, { disabled: allMilestones, selectedOptions: milestoneIds.map(value => ({ value })) }, { apiKey: 'synthetic-api-key' })
  browserUrlCases.push({ orderIds, milestoneIds, allOrders, allMilestones, expected: link.value })
}
const calendarBrowserSource = await source('public/javascripts/workOrder.milestoneCalendar.js')
const gridSource = calendarBrowserSource.slice(calendarBrowserSource.indexOf('function renderBlankCalendar('), calendarBrowserSource.indexOf('function buildWorkOrderElement('))
class GridElement {
  constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.style = {}; this.innerHTML = '' }
  append(child) { this.children.push(child) }
  querySelector(selector) {
    if (selector === 'tbody') return this.body ??= new GridElement('tbody')
    if (selector === 'tr:last-child') return this.children.at(-1) ?? null
    throw new Error(`Unexpected grid query ${selector}`)
  }
}
const browserGridCases = []
for (const dateString of ['2026-01-15', '2024-02-20', '2026-02-20', '2026-03-20', '2026-10-20', '2026-12-20']) {
  const container = new GridElement('div')
  new Function('document', 'cityssm', 'sunrise', 'milestoneCalendarContainerElement', gridSource + '\nrenderBlankCalendar(arguments[4]);')(
    { createElement: tag => new GridElement(tag) }, { dateStringToDate: datetime.dateStringToDate, dateToString: datetime.dateToString, escapeHTML: value => String(value) }, { urlPrefix: '' }, container, dateString)
  const rows = container.children[0].body.children.map(row => row.children.map(cell => ({ date: cell.dataset.dateString ?? null, link: cell.innerHTML.match(/href="([^"]+)"/)?.[1] ?? null })))
  browserGridCases.push({ dateString, expected: rows })
}
// Hash the original test/route/UI contracts covered by this probe and target QA.
for (const name of ['routes/workOrders.ts', 'routes/workOrders.js', 'test/database.workOrders.test.ts', 'cypress/e2e/02update/5.workOrders.cy.ts', 'cypress/e2e/02update/workOrderWorkday.cy.ts', 'cypress/e2e/03readOnly/workOrders.cy.ts', 'cypress/e2e/03readOnly/workOrderMilestoneCalendar.cy.ts', 'cypress/e2e/03readOnly/workOrderIcal.cy.ts', 'public/javascripts/workOrder.ical.ts', 'public/javascripts/workOrder.milestoneCalendar.ts', 'public/javascripts/workOrder.workday.ts', 'public/javascripts/contract.editWorkOrders.ts', 'public/javascripts/contract.editWorkOrders.js', 'public/html/contract-createWorkOrder.html']) await source(name)
database.close()
const result = JSON.parse(JSON.stringify({ reference_commit: commit, source_sha256: hashes, packages, today: 20261020, fixed_local_time: '09:05:42',
  oracle_boundaries: ['Original schema, work-order CRUD, milestone/comment/relation functions, search SQL, audit writer/differences, handlers and iCalendar exporter execute unchanged; import/export declarations alone are removed.', 'Original getBurialSites/getContracts inclusion SQL runs. Existing interment child boundary supplies only deceasedName from source fixture SQL, which is the sole field consumed by work-order and calendar code. Fees/transactions disabled by original options.', 'Connection access/close uses shared in-memory SOURCE schema; close calls counted. Config/cache/print settings are explicit synthetic boundaries. Application name remains Sunrise CMS in the SOURCE calendar PRODID; target branding is Cemaris.', 'Locked ical-generator 11.1.2 executes real serialization. Generated UUID UID lines alone are normalized. Clock values are fixed. All-day/date/duration, UTC conversion, line folding, escaping, HTML, status, attendees and headers remain source results.', 'Actual browser subscription URL builder and month-grid function bodies run unchanged on minimal input/DOM objects. Date helper package is source locked; string escaping boundary receives only numeric date/link values.', 'Audit values omit record* properties in snapshots; scalar recordUpdate_username differences remain. Audit clock fields are omitted.'],
  seed, fullOrder, fullMilestone, defaults, numbering, orderLifecycle, milestoneDefaults, milestoneLifecycle, relationLifecycle, commentLifecycle,
  searchSeed, searches, milestoneSearches, retrieved, handlers: handlerCases, sourceErrorBoundaries, cascade, calendarCases, calendarHelpers, calendarEventCases, browserUrlCases, browserGridCases }))
const fixture = path.join(root, 'backend/tests/fixtures/work-orders-reference.json')
if (process.argv.includes('--write-fixture')) await fs.writeFile(fixture, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await fs.readFile(fixture, 'utf8')), result)
await fs.writeFile(path.join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: original Sunrise ${defaults.length} order defaults, ${numbering.length} numbering cases, ${orderLifecycle.length} order stages, ${milestoneDefaults.length} milestone defaults, ${milestoneLifecycle.length} milestone stages, ${relationLifecycle.length} relation stages, ${commentLifecycle.length} comment stages, ${searches.length} searches, ${milestoneSearches.length} milestone filters/orders, ${handlerCases.length} handlers, ${sourceErrorBoundaries.length} binding failures, ${calendarCases.length} locked-package iCalendars, ${calendarHelpers.length} calendar content cases, ${calendarEventCases.length} UTC/DST/Unicode events, ${browserUrlCases.length} actual browser URLs and ${browserGridCases.length} actual browser month grids`)
