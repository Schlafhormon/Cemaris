// Execute frozen Sunrise contract/funeral-home modules on the original schema.
// SQLite is solely the source oracle. Target comparisons use disposable SQL Server.
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
const work = path.join(root, '.local/reference-contracts')
await fs.mkdir(work, { recursive: true })
const hashes = {}
async function source(name) {
  const raw = await fs.readFile(path.join(reference, name), 'utf8')
  hashes[name] = createHash('sha256').update(raw).digest('hex')
  return raw
}
const lock = JSON.parse(await source('package-lock.json'))
const packageName = '@cityssm/utils-datetime'
const info = lock.packages[`node_modules/${packageName}`]
const archive = path.join(work, 'datetime.tgz')
try { await fs.access(archive) } catch {
  const response = await fetch(info.resolved)
  assert.ok(response.ok)
  await fs.writeFile(archive, Buffer.from(await response.arrayBuffer()))
}
assert.equal(`sha512-${createHash('sha512').update(await fs.readFile(archive)).digest('base64')}`, info.integrity)
execFileSync('tar', ['-xzf', archive, '-C', work])
const datetime = await import(pathToFileURL(path.join(work, 'package/index.js')).href)
const today = 20261020
let contractNumberLength = 10
const realDate = Date
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [2026, 9, 20, 9, 5, 42])) }
  static now() { return new realDate(2026, 9, 20, 9, 5, 42).getTime() }
}
const schema = await source('database/initializeDatabase.js')
const statements = new Function(schema.slice(schema.indexOf('const recordColumns'), schema.indexOf('const initializingUser')) + '\nreturn sqlCreateStatements;')()
let database
const shared = { prepare: (...args) => database.prepare(...args), function: (...args) => database.function(...args), close: () => {} }
function fresh() {
  database?.close()
  database = new DatabaseSync(':memory:')
  for (const sql of statements) database.exec(sql)
}
const helpers = {
  ...Object.fromEntries(Object.entries(datetime).filter(([key]) => key !== 'default')), Date: Clock,
  getDatabaseConnection: () => shared,
  isAuditLoggingEnabled: false,
  startSyncDataToPortalTask: () => {},
  createAuditLogEntries: () => {}, getObjectDifference: () => [],
  getConfigProperty: name => ({ 'settings.contracts.contractNumberLength': contractNumberLength, 'settings.contracts.prints': ['synthetic-print'], 'integrations.dynamicsGP.integrationIsEnabled': false })[name],
  getCachedContractTypeById: () => ({ contractTypePrints: ['*'] }),
  getFindAGraveMemorialUrl: () => null,
  getFindAGraveMemorialSearchUrl: () => null,
  // Work-order formatting, audit differences and external links have separate scopes.
  // The deletion guards and work-order search filter below execute the original SQL.
  getWorkOrders: async () => ({ workOrders: [] }),
  Debug: () => () => {}, DEBUG_NAMESPACE: 'synthetic-reference',
  getAuditableContractRecord: id => database.prepare('SELECT * FROM Contracts WHERE contractId=?').get(id),
  getAuditableContractFieldRecords: id => database.prepare('SELECT * FROM ContractFields WHERE contractId=? AND recordDelete_timeMillis IS NULL').all(id),
}
function strip(raw) {
  return raw.replace(/^import .*;\r?$/gm, '').replace(/^export default ([A-Za-z_$][\w$]*);?\r?$/gm, '')
    .replaceAll('export default function', 'function').replaceAll('export default async function', 'async function')
    .replaceAll('export async function', 'async function').replaceAll('export function', 'function')
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
async function load(name, exports = [name]) {
  return await new AsyncFunction(...Object.keys(helpers), strip(await source(`database/${name}.js`)) + `\nreturn {${exports.join(',')}};`)(...Object.values(helpers))
}
const partial = strip(await source('helpers/partialDate.helpers.js'))
Object.assign(helpers, new Function(partial + '\nreturn {datePartsToInteger,partialDateIntegerToString,partialDateIntegerToYear,partialDateIntegerToMonth,partialDateIntegerToDay};')())
const filterSource = strip(await source('helpers/functions.sqlFilters.js'))
Object.assign(helpers, new Function('dateToInteger', 'Date', filterSource + '\nreturn {getBurialSiteNameWhereClause,getContractTimeWhereClause,getDeceasedNameWhereClause,getPurchaserNameWhereClause};')(datetime.dateToInteger, Clock))
const dbSource = await source('helpers/database.helpers.js')
Object.assign(helpers, new Function(dbSource.match(/const LIMIT_DEFAULT = \d+;/)[0] + '\n' + dbSource.slice(dbSource.indexOf('export function sanitizeLimit'), dbSource.indexOf('export async function getLastBackupDate')).replaceAll('export function', 'function') + '\nreturn {sanitizeLimit,sanitizeOffset};')())
for (const name of ['getFuneralHome', 'addFuneralHome', 'updateFuneralHome', 'deleteFuneralHome', 'restoreFuneralHome', 'getFuneralHomes', 'getFuneralDirectorNamesByFuneralHomeId', 'getPreviousFuneralHomeId', 'getNextContractId', 'getPreviousContractId', 'getNextContractNumber', 'addOrUpdateContractField', 'deleteContractField', 'addContractComment', 'updateContractComment', 'getContractComments', 'getContractFields', 'addRelatedContract', 'deleteRelatedContract', 'getContractInterments', 'addContractInterment', 'getContractFees', 'getContractServiceTypes', 'getContractTransactions', 'getContractAttachments', 'deleteContract', 'addContract', 'updateContract', 'getContracts', 'getContract', 'copyContract']) {
  Object.assign(helpers, await load(name, name === 'getFuneralHome' ? [name, 'getFuneralHomeByKey'] : [name]))
}
Object.assign(helpers, await load('getNextFuneralHome', ['getNextFuneralHomeId']))
const actor = { username: 'synthetic-contracts' }
function insert(table, values) {
  const data = { ...values, recordCreate_username: actor.username, recordCreate_timeMillis: 1, recordUpdate_username: actor.username, recordUpdate_timeMillis: 1 }
  return Number(database.prepare(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(() => '?').join(',')})`).run(...Object.values(data)).lastInsertRowid)
}
function raw(table, where = '1=1', params = []) {
  return database.prepare(`SELECT * FROM ${table} WHERE ${where}`).all(...params).map(row => Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith('record'))))
}
const homeForm = { funeralHomeName: 'Synthetic Funeral Home', funeralHomeAddress1: '1 Synthetic Street', funeralHomeAddress2: '', funeralHomeCity: 'Synthetic City', funeralHomeProvince: 'BB', funeralHomePostalCode: 'a1b 2c3', funeralHomePhoneNumber: '000-123' }
const baseForm = { contractTypeId: 1, burialSiteId: '', contractStartDateString: '2026-10-20', contractEndDateString: '', purchaserName: 'Synthetic Purchaser', purchaserAddress1: '2 Synthetic Way', purchaserAddress2: '', purchaserCity: 'Synthetic City', purchaserProvince: 'BB', purchaserPostalCode: 'a1b 2c3', purchaserPhoneNumber: '000-456', purchaserEmail: 'synthetic@example.invalid', purchaserRelationship: 'Synthetic relationship', funeralHomeId: '', funeralDirectorName: '' }
const seed = []
function seeded(table, values) { const id = insert(table, values); seed.push({ table, id, values }); return id }
function catalogSeed(record = false) {
  const add = record ? seeded : insert
  add('ContractTypes', { contractType: 'Synthetic current', isPreneed: 0, orderNumber: 0 })
  add('ContractTypes', { contractType: 'Synthetic preneed', isPreneed: 1, orderNumber: 1 })
  add('BurialSiteTypes', { burialSiteType: 'Synthetic grave', orderNumber: 0 })
  add('CommittalTypes', { committalType: 'Synthetic committal', orderNumber: 0 })
  add('ContractTypeFields', { contractTypeField: 'Synthetic common', fieldType: 'text', isRequired: 0, orderNumber: 0 })
  add('ContractTypeFields', { contractTypeField: 'Synthetic current field', contractTypeId: 1, fieldType: 'text', isRequired: 0, orderNumber: 1 })
  add('ContractTypeFields', { contractTypeField: 'Synthetic other type field', contractTypeId: 2, fieldType: 'text', isRequired: 0, orderNumber: 2 })
  add('ContractTypeFields', { contractTypeField: 'Synthetic deleted field', fieldType: 'text', isRequired: 0, orderNumber: 3, recordDelete_timeMillis: 1 })
  add('IntermentContainerTypes', { intermentContainerType: 'Synthetic container', isCremationType: 0, orderNumber: 0 })
  add('IntermentDepths', { intermentDepth: 'Synthetic depth', orderNumber: 0 })
  add('ServiceTypes', { serviceType: 'Synthetic service', orderNumber: 0 })
  add('ServiceTypes', { serviceType: 'Synthetic deleted service', orderNumber: 1, recordDelete_timeMillis: 1 })
  add('WorkOrderTypes', { workOrderType: 'Synthetic work', orderNumber: 0 })
  add('WorkOrderStatuses', { workOrderStatus: 'Synthetic open', orderNumber: 0 })
  add('FeeCategories', { feeCategory: 'Synthetic fees', orderNumber: 0 })
  add('Fees', { feeCategoryId: 1, feeName: 'Synthetic fee', feeAmount: 12.5, taxAmount: 2.5, orderNumber: 0 })
}
const defaults = []
for (const overrides of [ {}, { contractNumber: 'SYN-MANUAL', funeralHomeId: 'new', ...homeForm, funeralHomeKey: 'IGNORED-BY-CONTRACT', isAvailableOnPortal: '1', funeralDirectorName: 'Synthetic Director', funeralDateString: '2026-10-21', funeralTimeString: '09:05', directionOfArrival: 'SW', committalTypeId: 1, contractTypeFieldIds: '1,2', fieldValue_1: 'Synthetic text', fieldValue_2: '0' }, { contractStartDateString: '2020-02-31', contractEndDateString: '2020-12-31', deceasedName: 'Synthetic Person', birthYear: '1900', deathYear: '2000' }, { contractTypeFieldIds: '1', fieldValue_1: 0 } ]) {
  fresh(); catalogSeed()
  const form = { ...baseForm, ...overrides }
  const id = helpers.addContract(form, actor, shared)
  defaults.push({ form, expected: raw('Contracts', 'contractId=?', [id])[0], fields: raw('ContractFields'), interments: raw('ContractInterments'), homes: raw('FuneralHomes') })
}
fresh(); catalogSeed(true)
const main = seeded('Cemeteries', { cemeteryName: 'Synthetic Main', cemeteryKey: 'MAIN' })
const child = seeded('Cemeteries', { cemeteryName: 'Synthetic Child', cemeteryKey: 'CHILD', parentCemeteryId: main })
const grand = seeded('Cemeteries', { cemeteryName: 'Synthetic Grandchild', cemeteryKey: 'GRAND', parentCemeteryId: child })
const siteIds = [[main, 'A-01'], [child, 'B-02'], [grand, 'C-03'], [main, 'Deleted Plot']].map(([cemeteryId, name], i) => seeded('BurialSites', { cemeteryId, burialSiteTypeId: 1, burialSiteName: name, burialSiteNameSegment1: name, burialSiteNameSegment2: '', burialSiteNameSegment3: '', burialSiteNameSegment4: '', burialSiteNameSegment5: '', ...(i === 3 ? { recordDelete_timeMillis: 1 } : {}) }))
const homeIds = [ ['Alpha', false], ['Alpha', false], ['Beta', false], ['Deleted Home', true] ].map(([funeralHomeName, deleted], index) => seeded('FuneralHomes', { ...homeForm, funeralHomeName, funeralHomeKey: `SYN-${index}`, isAvailableOnPortal: index % 2, ...(deleted ? { recordDelete_timeMillis: 1 } : {}) }))
const definitions = [
  [siteIds[0], today - 1, null, '2026000002', 'Synthetic Alpha', today, 905, 1, homeIds[0], 'Ada'],
  [siteIds[0], today + 1, null, '2026000001', 'Synthetic Beta', today + 1, 900, 2, homeIds[0], 'Ada'],
  [siteIds[1], today - 1, today, '2026000004', 'Gamma Name', today - 1, null, 1, homeIds[1], 'Zed'],
  [siteIds[2], today - 3, today - 1, '2026000003', 'Delta Other', null, null, 1, homeIds[2], '  '],
  [null, today, null, 'SYN-WILD%_[]!', '🪦 Name %_[]!', today + 1, 1234, 2, homeIds[3], 'Unnamed'],
  [siteIds[3], today, null, 'SYN-DELETED-SITE', 'Synthetic Alpha', today, 0, 1, homeIds[0], 'Bob'],
  [siteIds[0], today - 1, null, '2026000999', 'Deleted Contract', today, 0, 1, homeIds[0], 'Ignored'],
  [siteIds[1], today + 2, today + 3, 'SYN-FUTURE-ENDED', 'Future End', today + 1, 900, 1, homeIds[2], 'Ada'],
  [null, today, null, 'SYN-DUPLICATE', 'Duplicate One', null, null, 1, null, ''],
  [null, today, null, 'SYN-DUPLICATE', 'Duplicate Two', null, null, 1, null, ''],
]
const contractIds = definitions.map(([burialSiteId, start, end, contractNumber, purchaserName, funeralDate, funeralTime, contractTypeId, funeralHomeId, funeralDirectorName], index) => seeded('Contracts', { contractTypeId, burialSiteId, contractNumber, purchaserName, purchaserAddress1: '2 Synthetic Way', purchaserAddress2: '', purchaserCity: 'Synthetic City', purchaserProvince: 'BB', purchaserPostalCode: 'A1B 2C3', purchaserPhoneNumber: '000-456', purchaserEmail: 'synthetic@example.invalid', purchaserRelationship: 'Synthetic relationship', contractStartDate: start, contractEndDate: end, funeralDate, funeralTime, funeralHomeId, funeralDirectorName, directionOfArrival: 'SW', committalTypeId: 1, ...(index === 6 ? { recordDelete_timeMillis: 1 } : {}) }))
for (const [i, deceasedName, deleted] of [[0, 'Synthetic Person Alpha', false], [1, 'Synthetic Person Beta', false], [2, 'Deleted Person', true], [4, '🪦 Name %_[]!', false]]) seeded('ContractInterments', { contractId: contractIds[i], intermentNumber: 1, deceasedName, deceasedAddress1: '', deceasedAddress2: '', deceasedCity: '', deceasedProvince: '', deceasedPostalCode: '', birthDate: 19000000, deathDate: 20000100, birthPlace: 'Synthetic birthplace', deathPlace: 'Synthetic place', deathAge: 100, deathAgePeriod: 'years', intermentContainerTypeId: 1, intermentDepthId: 1, findagraveMemorialId: '123', ...(deleted ? { recordDelete_timeMillis: 1 } : {}) })
for (const [field, value, deleted] of [[1, 'Shared text', false], [3, 'Other type retained', false], [4, 'Deleted definition retained', false], [2, 'Hidden stored value', true]]) seeded('ContractFields', { contractId: contractIds[0], contractTypeFieldId: field, fieldValue: value, ...(deleted ? { recordDelete_timeMillis: 1 } : {}) })
seeded('ContractServiceTypes', { contractId: contractIds[0], serviceTypeId: 1, contractServiceDetails: 'Synthetic details' })
seeded('ContractServiceTypes', { contractId: contractIds[1], serviceTypeId: 2, contractServiceDetails: 'Deleted service definition' })
seeded('ContractFees', { contractId: contractIds[0], feeId: 1, feeAmount: 12.5, taxAmount: 2.5, quantity: 2 })
seeded('ContractTransactions', { contractId: contractIds[0], transactionIndex: 1, transactionDate: today, transactionTime: 905, transactionAmount: 15, transactionNote: 'Synthetic payment' })
seeded('ContractAttachments', { contractId: contractIds[0], attachmentTitle: 'Synthetic attachment', attachmentDetails: 'Synthetic fixture only', fileName: 'synthetic.txt', filePath: 'synthetic-contracts/synthetic.txt' })
seeded('ContractComments', { contractId: contractIds[0], commentDate: today, commentTime: 905, comment: 'Synthetic source comment' })
seeded('ContractComments', { contractId: contractIds[0], commentDate: today, commentTime: 905, comment: 'Synthetic newer ID' })
seeded('ContractComments', { contractId: contractIds[0], commentDate: today - 1, commentTime: 2300, comment: 'Synthetic earlier day' })
seeded('ContractComments', { contractId: contractIds[0], commentDate: today + 1, commentTime: 0, comment: 'Synthetic deleted comment', recordDelete_timeMillis: 1 })
const workOrder = seeded('WorkOrders', { workOrderTypeId: 1, workOrderStatusId: 1, workOrderNumber: 'SYN-WO' })
seeded('WorkOrderContracts', { contractId: contractIds[0], workOrderId: workOrder })
database.prepare('INSERT INTO RelatedContracts(contractIdA,contractIdB) VALUES(?,?)').run(contractIds[0], contractIds[1])
seed.push({ table: 'RelatedContracts', values: { contractIdA: contractIds[0], contractIdB: contractIds[1] } })
function project(row) {
  return Object.fromEntries(['contractId', 'contractNumber', 'contractTypeId', 'burialSiteId', 'burialSiteIsActive', 'cemeteryId', 'purchaserName', 'funeralHomeId', 'funeralDirectorName', 'contractStartDate', 'contractEndDate', 'funeralDate', 'funeralTime', 'contractStartDateString', 'contractEndDateString', 'funeralDateString', 'funeralTimeString', 'funeralTimePeriodString', 'contractIsActive', 'contractIsFuture'].map(key => [key, row[key]]))
}
const filters = [{}, { contractTime: 'current' }, { contractTime: 'future' }, { contractTime: 'past' }, { contractEffectiveDateString: '2026-10-20' }, { contractStartDateString: '2026-10-20' }, { contractNumber: '  2026 ' }, { contractNumber: '%_' }, { purchaserName: 'Synthetic synthetic Alpha' }, { purchaserName: '%_[]!' }, { purchaserName: '🪦' }, { deceasedName: 'person synthetic alpha' }, { deceasedName: 'Deleted' }, { burialSiteId: siteIds[0] }, { burialSiteName: 'a 01' }, { burialSiteName: 'A-', burialSiteNameSearchType: 'startsWith' }, { burialSiteName: '02', burialSiteNameSearchType: 'endsWith' }, { contractTypeId: 2 }, { cemeteryId: main }, { cemeteryId: child }, { burialSiteTypeId: 1 }, { serviceTypeId: 1 }, { serviceTypeId: 2 }, { funeralHomeId: homeIds[0] }, { funeralTime: 'upcoming' }, { workOrderId: workOrder }, { notWorkOrderId: workOrder }, { notContractId: contractIds[0] }, { relatedContractId: contractIds[0] }, { relatedContractId: contractIds[1] }, { notRelatedContractId: contractIds[0], notContractId: contractIds[0] }, { contractTime: 'current', funeralTime: 'upcoming', cemeteryId: main }]
const searches = []
for (const filter of filters) for (const options of [{ limit: -1 }, { limit: 2, offset: 1 }, { limit: -1, orderBy: 'c.funeralDate, c.funeralTime, c.contractId' }]) {
  const result = await helpers.getContracts(filter, options, shared)
  searches.push({ filters: filter, options, expected: { count: result.count, contracts: result.contracts.map(project) } })
}
const navigation = []
for (const id of contractIds) navigation.push({ contractId: id, previous: helpers.getPreviousContractId(id, shared) ?? null, next: helpers.getNextContractId(id, shared) ?? null })
const detail = { contractId: contractIds[0], fields: helpers.getContractFields(contractIds[0], shared), comments: helpers.getContractComments(contractIds[0], shared) }
const homes = { rows: helpers.getFuneralHomes(true, shared), withoutCounts: helpers.getFuneralHomes(false, shared), directors: homeIds.map(funeralHomeId => ({ funeralHomeId, expected: helpers.getFuneralDirectorNamesByFuneralHomeId(funeralHomeId, shared) })), navigation: homeIds.map(funeralHomeId => ({ funeralHomeId, previous: helpers.getPreviousFuneralHomeId(funeralHomeId, shared) ?? null, next: helpers.getNextFuneralHomeId(funeralHomeId, shared) ?? null })) }
const nextNumber = helpers.getNextContractNumber(shared)
const copiedId = await helpers.copyContract(contractIds[0], actor, shared)
const copy = { sourceId: contractIds[0], expected: raw('Contracts', 'contractId=?', [copiedId])[0], fields: raw('ContractFields', 'contractId=?', [copiedId]), interments: raw('ContractInterments', 'contractId=?', [copiedId]), comments: raw('ContractComments', 'contractId=?', [copiedId]), related: database.prepare('SELECT * FROM RelatedContracts WHERE contractIdA=? OR contractIdB=?').all(copiedId, copiedId), omittedCounts: {} }
for (const table of ['ContractServiceTypes', 'ContractFees', 'ContractTransactions', 'ContractAttachments']) copy.omittedCounts[table] = database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE contractId=?`).get(copiedId).count
const fieldLifecycle = []
for (const action of ['add', 'delete', 'restore']) {
  if (action === 'delete') helpers.deleteContractField(contractIds[0], 2, actor, shared)
  else helpers.addOrUpdateContractField({ contractId: contractIds[0], contractTypeFieldId: 2, fieldValue: action === 'add' ? 'New value' : 'Restored value' }, actor, shared)
  fieldLifecycle.push({ action, expected: raw('ContractFields', 'contractId=? AND contractTypeFieldId=2', [contractIds[0]])[0], deleted: database.prepare('SELECT recordDelete_timeMillis IS NOT NULL AS deleted FROM ContractFields WHERE contractId=? AND contractTypeFieldId=2').get(contractIds[0]).deleted })
}
const commentDefaults = []
for (const form of [{ comment: 'Synthetic now' }, { comment: 'Synthetic date', commentDateString: '2020-02-31', commentTimeString: '09:05' }, { comment: 'Synthetic midnight fallback', commentDateString: '2026-10-20', commentTimeString: '' }]) {
  const id = helpers.addContractComment({ ...form, contractId: contractIds[0] }, actor, shared)
  commentDefaults.push({ form, expected: raw('ContractComments', 'contractCommentId=?', [id])[0] })
}
const updates = []
for (const extra of [{ contractNumber: 'IGNORED-UPDATE', purchaserName: 'Synthetic Updated', purchaserPostalCode: 'z9z 9z9', funeralDateString: '2020-02-31', funeralTimeString: '23:59' }, { contractTypeId: 2, contractTypeFieldIds: '2,3', fieldValue_2: '', fieldValue_3: 'New type value' }, { contractEndDateString: '2026-10-20', funeralHomeId: '', funeralDateString: '', funeralTimeString: '', directionOfArrival: '', committalTypeId: '' }]) {
  fresh(); catalogSeed()
  const before = { ...baseForm, contractTypeFieldIds: '1,2', fieldValue_1: 'Retained common', fieldValue_2: 'Delete current field' }
  const id = helpers.addContract(before, actor, shared)
  const form = { ...baseForm, contractId: id, ...extra }
  const success = helpers.updateContract(form, actor, shared)
  updates.push({ before, form, success, expected: raw('Contracts', 'contractId=?', [id])[0], fields: database.prepare('SELECT contractId,contractTypeFieldId,fieldValue,recordDelete_timeMillis IS NOT NULL AS deleted FROM ContractFields ORDER BY contractTypeFieldId').all() })
}
const deletions = []
for (const closeDate of [null, today, today + 1, today - 1]) for (const deleted of [false, true]) {
  fresh(); catalogSeed()
  const id = helpers.addContract(baseForm, actor, shared)
  const workOrderId = insert('WorkOrders', { workOrderNumber: 'SYN', workOrderTypeId: 1, workOrderStatusId: 1, workOrderCloseDate: closeDate, ...(deleted ? { recordDelete_timeMillis: 1 } : {}) })
  insert('WorkOrderContracts', { workOrderId, contractId: id })
  insert('ContractFields', { contractId: id, contractTypeFieldId: 1, fieldValue: 'Synthetic field' })
  insert('ContractComments', { contractId: id, commentDate: today, commentTime: 0, comment: 'Synthetic comment' })
  insert('ContractInterments', { contractId: id, intermentNumber: 1, deceasedName: 'Synthetic Person', deceasedAddress1: '', deceasedAddress2: '', deceasedCity: '', deceasedProvince: '', deceasedPostalCode: '' })
  insert('ContractServiceTypes', { contractId: id, serviceTypeId: 1 })
  const success = helpers.deleteContract(id, actor, shared)
  const states = {}
  for (const table of ['Contracts', 'ContractFields', 'ContractComments', 'ContractInterments', 'ContractServiceTypes', 'WorkOrderContracts']) states[table] = database.prepare(`SELECT recordDelete_timeMillis IS NOT NULL AS deleted FROM ${table} WHERE contractId=?`).get(id).deleted
  deletions.push({ closeDate, deleted, expected: { success, states } })
}
const funeralDeletions = []
for (const [end, funeral, deleted] of [[null, today, false], [today, today, false], [today - 1, today, false], [null, today - 1, false], [null, null, false], [null, today + 1, true], [today + 1, today + 1, false]]) {
  fresh(); catalogSeed()
  const id = helpers.addFuneralHome(homeForm, actor, shared)
  const contractId = helpers.addContract({ ...baseForm, funeralHomeId: id }, actor, shared)
  database.prepare('UPDATE Contracts SET contractEndDate=?,funeralDate=?,recordDelete_timeMillis=? WHERE contractId=?').run(end, funeral, deleted ? 1 : null, contractId)
  const success = helpers.deleteFuneralHome(id, actor, shared)
  const restoreSuccess = helpers.restoreFuneralHome(id, actor, shared)
  funeralDeletions.push({ end, funeral, deleted, expected: { success, restoreSuccess } })
}
fresh(); catalogSeed()
const relationIds = [1, 2, 3].map(index => helpers.addContract({ ...baseForm, contractNumber: `SYN-REL-${index}` }, actor, shared))
const relationships = []
for (const [a, b] of [[3, 1], [1, 3], [2, 2], ['2.9', '1.9']]) {
  try { relationships.push({ a, b, success: helpers.addRelatedContract({ contractId: a, relatedContractId: b }, shared) }) }
  catch (error) { relationships.push({ a, b, error: { name: error.name, message: error.message } }) }
}
const relationRows = database.prepare('SELECT * FROM RelatedContracts ORDER BY contractIdA,contractIdB').all()
helpers.deleteRelatedContract({ contractId: 3, relatedContractId: 1 }, shared)
const relationAfterDelete = database.prepare('SELECT * FROM RelatedContracts ORDER BY contractIdA,contractIdB').all()
fresh(); catalogSeed()
const textSeed = []
function textInsert(table, values) { const id = insert(table, values); textSeed.push({ table, id, values }); return id }
const textHomeIds = ['Alpha ', 'Alpha', '🪦', '\uE000'].map(funeralHomeName => textInsert('FuneralHomes', { ...homeForm, funeralHomeName }))
const textSites = ['A ', 'A', '🪦', '\uE000'].map((burialSiteName, index) => {
  const cemeteryId = textInsert('Cemeteries', { cemeteryName: `Synthetic text ${index}`, cemeteryKey: `TXT-${index}` })
  return textInsert('BurialSites', { cemeteryId, burialSiteTypeId: 1, burialSiteName, burialSiteNameSegment1: burialSiteName, burialSiteNameSegment2: '', burialSiteNameSegment3: '', burialSiteNameSegment4: '', burialSiteNameSegment5: '' })
})
const textContractIds = ['SYN ', 'SYN', '🪦', '\uE000', 'Z'].map((contractNumber, index) => {
  const form = { ...baseForm, contractNumber, funeralHomeId: textHomeIds[0], burialSiteId: textSites[index % 4], funeralDirectorName: ['Ada ', 'Ada', '\uE000', '🪦', 'Ada '][index] }
  const id = helpers.addContract(form, actor, shared)
  const values = Object.fromEntries(Object.entries(database.prepare('SELECT * FROM Contracts WHERE contractId=?').get(id)).filter(([key]) => key !== 'contractId' && !key.startsWith('record')))
  textSeed.push({ table: 'Contracts', id, values })
  return id
})
for (const contractTypeField of ['Extra ', 'Extra', '🪦', '\uE000']) textInsert('ContractTypeFields', { contractTypeField, fieldType: 'text', isRequired: 0, orderNumber: 1 })
for (const [index, deceasedName] of ['Name ', 'Name', '🪦', '\uE000'].entries()) textInsert('ContractInterments', { contractId: textContractIds[0], intermentNumber: index + 1, deceasedName, deceasedAddress1: '', deceasedAddress2: '', deceasedCity: '', deceasedProvince: '', deceasedPostalCode: '', intermentContainerTypeId: 1 })
const textPages = []
for (const options of [{ limit: 2, offset: 1 }, { limit: 2, offset: 3 }]) {
  const page = await helpers.getContracts({}, options, shared)
  textPages.push({ options, expected: { count: page.count, ids: page.contracts.map(row => row.contractId) } })
}
const textBoundaries = { seed: textSeed, funeralHomeOrder: helpers.getFuneralHomes(false, shared).map(row => row.funeralHomeId), directors: helpers.getFuneralDirectorNamesByFuneralHomeId(textHomeIds[0], shared), contractOrder: (await helpers.getContracts({}, { limit: -1 }, shared)).contracts.map(row => row.contractId), pages: textPages, fields: helpers.getContractFields(textContractIds[0], shared).map(row => ({ contractTypeFieldId: row.contractTypeFieldId, contractTypeField: row.contractTypeField })), interments: helpers.getContractInterments(textContractIds[0], shared).map(row => ({ intermentNumber: row.intermentNumber, deceasedName: row.deceasedName })), homeNavigation: textHomeIds.map(id => ({ id, previous: helpers.getPreviousFuneralHomeId(id, shared) ?? null, next: helpers.getNextFuneralHomeId(id, shared) ?? null })), contractNavigation: textContractIds.map(id => ({ id, previous: helpers.getPreviousContractId(id, shared) ?? null, next: helpers.getNextContractId(id, shared) ?? null })) }
const numberCases = []
const numberDefinitions = [
  ...[0, 1, 2, 3, 4, 5, 10, 17, 21, 22, 50].map(length => ({ length, numbers: [] })),
  { length: 4, numbers: ['2026'] },
  { length: 5, numbers: ['20269'] },
  { length: 10, numbers: ['2026000999', 'SYNTHETIC', '20260099999', '2027009999', '٢٠٢٦009999'] },
  { length: 17, numbers: ['20260000000000000'] },
  { length: 17, numbers: ['20260000000000002'] },
  { length: 19, numbers: ['2026000000000000001', '2026000000000000999'] },
  // SQLite CAST AS INTEGER saturates at 2^63-1; tied rows keep insertion order.
  { length: 20, numbers: ['20260000000000000001', '20269999999999999999'] },
  { length: 20, numbers: ['20269999999999999999', '20260000000000000001'] },
  { length: 22, numbers: ['2026000000000000000000', '2026999999999999999999'] },
  { length: 22, numbers: ['2026999999999999999999', '2026000000000000000000'] },
  { length: 50, numbers: ['2026' + '0'.repeat(46)] },
]
for (const definition of numberDefinitions) {
  fresh(); catalogSeed()
  contractNumberLength = definition.length
  const numbers = definition.numbers.map((contractNumber, index) => ({ contractNumber, deleted: index % 2 === 0 }))
  for (const item of numbers) {
    const id = helpers.addContract({ ...baseForm, contractNumber: item.contractNumber }, actor, shared)
    if (item.deleted) database.prepare('UPDATE Contracts SET recordDelete_timeMillis=1 WHERE contractId=?').run(id)
  }
  numberCases.push({ length: definition.length, numbers, expected: helpers.getNextContractNumber(shared) })
}
contractNumberLength = 10
database.close()
const result = JSON.parse(JSON.stringify({ reference_commit: commit, source_sha256: hashes, datetime_package: { name: packageName, version: info.version, integrity: info.integrity }, today, fixed_local_time: '09:05:42', oracle_boundaries: ['Audit logging disabled; object differences and audit writes are boundary stubs.', 'Portal sync callback is a boundary stub.', 'getContract work-order formatting and Find-a-Grave link helpers are boundary stubs; original deletion/search SQL is executed.', 'Import/export declarations removed; original function bodies execute unchanged with injected dependencies and deterministic clock.'], seed, defaults, updates, searches, navigation, detail, homes, nextNumber, numberCases, textBoundaries, copy, fieldLifecycle, commentDefaults, deletions, funeralDeletions, relationships: { attempts: relationships, rows: relationRows, afterDelete: relationAfterDelete } }))
const fixture = path.join(root, 'backend/tests/fixtures/contracts-reference.json')
if (process.argv.includes('--write-fixture')) await fs.writeFile(fixture, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await fs.readFile(fixture, 'utf8')), result)
await fs.writeFile(path.join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: original Sunrise ${defaults.length} contract defaults, ${updates.length} updates, ${searches.length} searches/sorts, ${navigation.length} navigation cases, ${numberCases.length} number boundaries, text grouping/order/navigation, field/comment/copy/relation lifecycles, ${deletions.length} contract guards and ${funeralDeletions.length} funeral-home guards`)
