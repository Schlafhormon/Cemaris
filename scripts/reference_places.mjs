// Execute frozen Sunrise place modules in their source SQLite schema.
// SQLite is used only as the source oracle. Cemaris evidence uses SQL Server.
// Sunrise copyright and MIT notice: licenses/Sunrise-LICENSE.md.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = path.resolve(root, '../Sunrise-Referenz')
const commit = '451ce034863b16502484367044f3e9b65370111a'
assert.equal(execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit)
const hashes = {}
async function source(name) {
  const raw = await readFile(path.join(reference, name), 'utf8')
  hashes[name] = createHash('sha256').update(raw).digest('hex')
  return raw
}
const schema = await source('database/initializeDatabase.js')
const statements = new Function(schema.slice(schema.indexOf('const recordColumns'), schema.indexOf('const initializingUser')) + '\nreturn sqlCreateStatements;')()
let database
function fresh() {
  database?.close()
  database = new DatabaseSync(':memory:')
  for (const sql of statements) database.exec(sql)
}
const today = 20261020
const helpers = {
  getDatabaseConnection: () => database,
  clearCacheByTableName: () => {}, startSyncDataToPortalTask: () => {},
  isAuditLoggingEnabled: false, dateToInteger: () => today,
  getFindAGraveCemeteryUrl: () => null,
  directionsOfArrival: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
}
async function load(name, exports = [name]) {
  const raw = await source(`database/${name}.js`)
  const code = raw.replace(/^import .*;\r?$/gm, '')
    .replace(/^export default ([A-Za-z_$][\w$]*);?\r?$/gm, '')
    .replaceAll('export default function', 'function').replaceAll('export function', 'function')
  return new Function(...Object.keys(helpers), code + `\nreturn {${exports.join(',')}};`)(...Object.values(helpers))
}
const dbHelper = await source('helpers/database.helpers.js')
Object.assign(helpers, new Function(dbHelper.match(/const LIMIT_DEFAULT = \d+;/)[0] + '\n' + dbHelper.slice(dbHelper.indexOf('export function sanitizeLimit'), dbHelper.indexOf('export async function getLastBackupDate')).replaceAll('export function', 'function') + '\nreturn {sanitizeLimit,sanitizeOffset};')())
const filterSource = await source('helpers/functions.sqlFilters.js')
helpers.getBurialSiteNameWhereClause = new Function(filterSource.slice(filterSource.indexOf('export function getBurialSiteNameWhereClause'), filterSource.indexOf('export function getContractTimeWhereClause')).replace('export function', 'function') + '\nreturn getBurialSiteNameWhereClause;')()
const nameSource = await source('helpers/burialSites.helpers.js')
const nameFactory = new Function('segmentConfig', nameSource.slice(nameSource.indexOf('export function buildBurialSiteName'), nameSource.indexOf("process.on('message'")).replace('export function', 'function') + '\nreturn buildBurialSiteName;')
const defaultSegments = { includeCemeteryKey: false, separator: '-', segments: { 1: { isAvailable: true, isRequired: true, label: 'Plot Number', minLength: 1, maxLength: 20 } } }
helpers.buildBurialSiteName = nameFactory(defaultSegments)
for (const name of ['getCemeteries', 'getCemeteryDirectionsOfArrival', 'getCemetery', 'updateCemeteryDirectionsOfArrival', 'purgeBurialSite']) Object.assign(helpers, await load(name))
const { addCemetery } = await load('addCemetery')
helpers.addOrUpdateBurialSiteFields = (await load('addOrUpdateBurialSiteFields')).addOrUpdateBurialSiteFields
// The insertion defaults below intentionally use no additional field IDs.
const { addBurialSite } = await load('addBurialSite')
const { getBurialSites } = await load('getBurialSites')
const { getBurialSiteTypeSummary } = await load('getBurialSiteTypeSummary')
const { deleteBurialSite } = await load('deleteBurialSite')
const { restoreBurialSite } = await load('restoreBurialSite')
const { deleteCemetery } = await load('deleteCemetery')
const navigation = {}
for (const name of ['getNextBurialSiteId', 'getPreviousBurialSiteId', 'getNextCemeteryId', 'getPreviousCemeteryId']) Object.assign(navigation, await load(name))
const actor = { username: 'synthetic-places' }
const baseCemetery = { cemeteryName: 'Synthetic Main', cemeteryKey: 'SYN', cemeteryDescription: '', cemeterySvg: '', cemeteryLatitude: '', cemeteryLongitude: '', cemeteryAddress1: '', cemeteryAddress2: '', cemeteryCity: '', cemeteryProvince: '', cemeteryPostalCode: 'a1b 2c3', cemeteryPhoneNumber: '', parentCemeteryId: '', findagraveCemeteryId: '' }
const baseSite = { cemeteryId: '', burialSiteTypeId: 1, burialSiteStatusId: '', burialSiteNameSegment1: 'A-01', burialSiteTypeFieldIds: '' }
function insert(table, values) {
  const data = { ...values, recordCreate_username: actor.username, recordCreate_timeMillis: 1, recordUpdate_username: actor.username, recordUpdate_timeMillis: 1 }
  return database.prepare(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(() => '?').join(',')})`).run(...Object.values(data)).lastInsertRowid
}
function setup() {
  fresh()
  insert('BurialSiteTypes', { burialSiteType: 'Synthetic Type', orderNumber: 0 })
  insert('BurialSiteStatuses', { burialSiteStatus: 'Synthetic Status', orderNumber: 0 })
  insert('ContractTypes', { contractType: 'Synthetic Contract', orderNumber: 0 })
  insert('WorkOrderTypes', { workOrderType: 'Synthetic Work', orderNumber: 0 })
  insert('WorkOrderStatuses', { workOrderStatus: 'Synthetic Open', orderNumber: 0 })
}
const defaults = []
for (const overrides of [{}, { cemeteryLatitude: '51.125', cemeteryLongitude: '13.5', isAvailableOnPortal: '1', directionOfArrivalDescription_N: 'North gate', directionOfArrivalDescription_SW: '' }]) {
  setup()
  const form = { ...baseCemetery, ...overrides }
  const id = addCemetery(form, actor, database)
  const raw = database.prepare('SELECT * FROM Cemeteries WHERE cemeteryId=?').get(id)
  defaults.push({ resource: 'cemetery', form, expected: Object.fromEntries(Object.entries(raw).filter(([key]) => key !== 'cemeteryId' && !key.startsWith('record'))), directions: helpers.getCemeteryDirectionsOfArrival(id, database) })
}
for (const overrides of [{}, { bodyCapacity: '2', crematedCapacity: '8', burialSiteLatitude: '0', burialSiteLongitude: '13.75', cemeterySvgId: '', burialSiteImage: 'synthetic.png', burialSiteStatusId: 1 }]) {
  setup()
  const form = { ...baseSite, ...overrides }
  const { burialSiteId } = addBurialSite(form, actor, database)
  const raw = database.prepare('SELECT * FROM BurialSites WHERE burialSiteId=?').get(burialSiteId)
  defaults.push({ resource: 'burialSite', form, expected: Object.fromEntries(Object.entries(raw).filter(([key]) => key !== 'burialSiteId' && !key.startsWith('record'))) })
}
const names = []
for (const config of [defaultSegments, { includeCemeteryKey: true, separator: '/', segments: { 1: { isAvailable: true, isRequired: true, prefix: '[', suffix: ']' }, 2: { isAvailable: true, isRequired: false }, 3: { isAvailable: false }, 4: { isAvailable: true, isRequired: true, prefix: 'R' } } }]) {
  for (const cemeteryKey of [null, '', 'SYN']) for (const segments of [{ burialSiteNameSegment1: 'A', burialSiteNameSegment2: '02', burialSiteNameSegment3: 'ignored' }, { burialSiteNameSegment1: '', burialSiteNameSegment2: '' }]) {
    names.push({ config, cemeteryKey, segments, expected: nameFactory(config)(cemeteryKey === null ? undefined : cemeteryKey, segments) })
  }
}
setup()
const main = addCemetery(baseCemetery, actor, database)
const child = addCemetery({ ...baseCemetery, cemeteryName: 'Synthetic Child', cemeteryKey: 'CHILD', parentCemeteryId: main }, actor, database)
const grandchild = addCemetery({ ...baseCemetery, cemeteryName: 'Synthetic Grandchild', cemeteryKey: 'GRAND', parentCemeteryId: child }, actor, database)
const siteNames = ['A-01', 'A-02', 'B-03', 'Deleted', '🪦 Unicode', 'Plot %_[]! End']
const siteIds = siteNames.map((name, index) => addBurialSite({ ...baseSite, burialSiteNameSegment1: name, cemeteryId: [main, child, grandchild, main, '', main][index], burialSiteStatusId: index % 2 ? 1 : '', burialSiteLatitude: index % 2 ? '51' : '', burialSiteLongitude: index % 2 ? '13' : '' }, actor, database).burialSiteId)
database.prepare('UPDATE BurialSites SET recordDelete_timeMillis=1 WHERE burialSiteId=?').run(siteIds[3])
for (const [index, start, end] of [[0, today, null], [1, today + 1, null], [2, today - 10, today - 1]]) insert('Contracts', { contractTypeId: 1, purchaserName: 'Synthetic purchaser', burialSiteId: siteIds[index], contractStartDate: start, contractEndDate: end })
insert('WorkOrders', { workOrderNumber: 'SYN-WO', workOrderTypeId: 1, workOrderStatusId: 1 })
insert('WorkOrderBurialSites', { workOrderId: 1, burialSiteId: siteIds[1] })
const filterCases = [{}, { cemeteryId: main }, { cemeteryId: child }, { burialSiteTypeId: 1 }, { burialSiteStatusId: 1 }, { contractStatus: 'occupied' }, { contractStatus: 'unoccupied' }, { hasCoordinates: 'yes' }, { hasCoordinates: 'no' }, { workOrderId: 1 }, { burialSiteName: 'a A 01' }, { burialSiteName: 'A-', burialSiteNameSearchType: 'startsWith' }, { burialSiteName: 'End', burialSiteNameSearchType: 'endsWith' }, { burialSiteName: '%_[]!' }, { burialSiteName: '🪦' }]
const searches = []
for (const filters of filterCases) for (const options of [{ limit: -1 }, { limit: 2, offset: 1 }]) {
  const result = getBurialSites(filters, options, database)
  searches.push({ filters, options, expected: { ids: result.burialSites.map(row => row.burialSiteId), count: result.count, contractCounts: result.burialSites.map(row => row.contractCount) } })
}
const hierarchy = { all: helpers.getCemeteries({}, database).map(row => ({ id: row.cemeteryId, parent: row.parentCemeteryId, count: row.burialSiteCount })), children: helpers.getCemetery(main, database).childCemeteries.map(row => row.cemeteryId), grandchildrenHidden: helpers.getCemetery(child, database).childCemeteries.length, summary: getBurialSiteTypeSummary({ cemeteryId: main }, database), nextSite: navigation.getNextBurialSiteId(siteIds[0], database), previousSite: navigation.getPreviousBurialSiteId(siteIds[1], database), nextCemetery: navigation.getNextCemeteryId(child, database) }
const deletions = []
for (const [start, end, deleted, expected] of [[today, null, false, false], [today + 1, null, false, false], [today - 1, today, false, false], [today - 2, today - 1, false, true], [today, null, true, true]]) {
  setup()
  const cemeteryId = addCemetery(baseCemetery, actor, database)
  const { burialSiteId } = addBurialSite({ ...baseSite, cemeteryId }, actor, database)
  const contractId = insert('Contracts', { contractTypeId: 1, purchaserName: 'Synthetic purchaser', burialSiteId, contractStartDate: start, contractEndDate: end })
  if (deleted) database.prepare('UPDATE Contracts SET recordDelete_timeMillis=1 WHERE contractId=?').run(contractId)
  const siteSuccess = deleteBurialSite(burialSiteId, actor, database)
  const restoreSuccess = restoreBurialSite(burialSiteId, actor, database)
  const cemeterySuccess = deleteCemetery(cemeteryId, actor, database)
  assert.equal(siteSuccess, expected)
  assert.equal(cemeterySuccess, expected)
  deletions.push({ start, end, deleted, expected, restoreSuccess })
}
database.close()
const result = JSON.parse(JSON.stringify({ reference_commit: commit, source_sha256: hashes, today, defaults, names, searches, hierarchy, deletions }))
const target = path.join(root, 'backend/tests/fixtures/places-reference.json')
if (process.argv.includes('--write-fixture')) await writeFile(target, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), result)
await mkdir(path.join(root, '.local/reference-places'), { recursive: true })
await writeFile(path.join(root, '.local/reference-places/result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: original Sunrise ${defaults.length} place defaults, ${names.length} name configurations, ${searches.length} searches, hierarchy/summary/navigation and ${deletions.length} delete/restore boundaries`)
