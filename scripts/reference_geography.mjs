// Execute immutable Sunrise geography modules and exact locked dependencies.
// SQLite is solely the source oracle; target persistence is tested on SQL Server.
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
const work = path.join(root, '.local/reference-geography')
await fs.mkdir(work, { recursive: true })
const hashes = {}
async function source(name) {
  const raw = await fs.readFile(path.join(reference, name), 'utf8')
  hashes[name] = createHash('sha256').update(raw).digest('hex')
  return raw
}
const lock = JSON.parse(await source('package-lock.json'))
const packages = []
// Runtime graph only: @types/parse-full-name has no executable package code.
for (const name of ['@cityssm/cemetery-utils', 'parse-full-name', '@cityssm/fill-block-range', 'fill-range', 'to-regex-range', 'is-number', 'just-cartesian-product']) {
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
const cemeteryUtils = await import(pathToFileURL(path.join(work, 'node_modules/@cityssm/cemetery-utils/index.js')).href)
const { default: fillBlockRange, calculateCartesianProductLength } = await import(pathToFileURL(path.join(work, 'node_modules/@cityssm/fill-block-range/index.js')).href)
const { default: cartesianProduct } = await import(pathToFileURL(path.join(work, 'node_modules/just-cartesian-product/index.mjs')).href)

const schema = await source('database/initializeDatabase.js')
const statements = new Function(schema.slice(schema.indexOf('const recordColumns'), schema.indexOf('const initializingUser')) + '\nreturn sqlCreateStatements;')()
const database = new DatabaseSync(':memory:')
for (const sql of statements) database.exec(sql)
const today = 20261020
const sharedConnection = { prepare: (...args) => database.prepare(...args), close: () => {} }
const helpers = {
  getDatabaseConnection: () => sharedConnection,
  dateToInteger: () => today,
  fillBlockRange, calculateCartesianProductLength, cartesianProduct,
  getCemetery: id => database.prepare('SELECT * FROM Cemeteries WHERE cemeteryId=? AND recordDelete_timeMillis IS NULL').get(id),
}
function strip(raw) {
  return raw.replace(/^import .*;\r?$/gm, '').replace(/^export default ([A-Za-z_$][\w$]*);?\r?$/gm, '')
    .replaceAll('export default function', 'function').replaceAll('export async function', 'async function').replaceAll('export function', 'function').replaceAll('export const', 'const')
}
async function load(name, exports = [name]) {
  return new Function(...Object.keys(helpers), strip(await source(`database/${name}.js`)) + `\nreturn {${exports.join(',')}};`)(...Object.values(helpers))
}
function insert(table, values) {
  const data = { ...values, recordCreate_username: 'synthetic-geography', recordCreate_timeMillis: 1, recordUpdate_username: 'synthetic-geography', recordUpdate_timeMillis: 1 }
  return Number(database.prepare(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(() => '?').join(',')})`).run(...Object.values(data)).lastInsertRowid)
}
const seed = { cemeteries: [], sites: [], contractTypes: [], contracts: [], interments: [] }
function seeded(key, table, values) { const id = insert(table, values); seed[key].push({ id, ...values }); return id }
const cemeteryId = seeded('cemeteries', 'Cemeteries', { cemeteryName: 'Synthetic Geography', cemeteryKey: 'GEO', cemeteryLatitude: 0, cemeteryLongitude: 13.5 })
const childId = seeded('cemeteries', 'Cemeteries', { cemeteryName: 'Synthetic Child', cemeteryKey: 'CHILD', parentCemeteryId: cemeteryId })
const otherId = seeded('cemeteries', 'Cemeteries', { cemeteryName: 'Synthetic Other', cemeteryKey: 'OTHER' })
const typeId = insert('BurialSiteTypes', { burialSiteType: 'Synthetic type', orderNumber: 0 })
const siteDefinitions = [
  { burialSiteName: 'A01', cemeteryId, burialSiteLatitude: 0, burialSiteLongitude: 0 },
  { burialSiteName: 'A02', cemeteryId, burialSiteLatitude: 51, burialSiteLongitude: 13, recordDelete_timeMillis: 1 },
  { burialSiteName: 'A03', cemeteryId, burialSiteLatitude: 51, burialSiteLongitude: null },
  { burialSiteName: 'A04', cemeteryId: otherId, burialSiteLatitude: 51, burialSiteLongitude: 13 },
  { burialSiteName: 'B01', cemeteryId, burialSiteLatitude: 51.1, burialSiteLongitude: 13.1 },
  { burialSiteName: 'Child01', cemeteryId: childId, burialSiteLatitude: 52, burialSiteLongitude: 14 },
]
const siteIds = siteDefinitions.map(values => seeded('sites', 'BurialSites', { burialSiteTypeId: typeId, burialSiteNameSegment1: values.burialSiteName, burialSiteNameSegment2: '', burialSiteNameSegment3: '', burialSiteNameSegment4: '', burialSiteNameSegment5: '', ...values }))
const contractTypeId = seeded('contractTypes', 'ContractTypes', { contractType: 'Synthetic occupied', isPreneed: 0, orderNumber: 0 })
const futureTypeId = seeded('contractTypes', 'ContractTypes', { contractType: 'Synthetic preneed', isPreneed: 1, orderNumber: 1 })
for (const [index, start, end, deleted, names] of [
  [0, today - 10, null, false, [['Synthetic Current', false], ['Deleted Name', true], ['Comma, Name', false]]],
  [0, today + 10, null, false, [['Synthetic Future', false]]],
  [0, today - 10, today, false, [['Synthetic Ends Today', false]]],
  [0, today - 10, today - 1, false, [['Synthetic Expired', false]]],
  [0, today - 10, null, true, [['Deleted Contract', false]]],
  [4, today, null, false, []],
  [5, today, null, false, [['Synthetic Child', false]]],
]) {
  const id = seeded('contracts', 'Contracts', { burialSiteId: siteIds[index], contractTypeId: start > today ? futureTypeId : contractTypeId, contractNumber: `SYN-${seed.contracts.length + 1}`, purchaserName: 'Synthetic purchaser', contractStartDate: start, contractEndDate: end, ...(deleted ? { recordDelete_timeMillis: 1 } : {}) })
  for (const [index, [deceasedName, isDeleted]] of names.entries()) {
    const values = { contractId: id, intermentNumber: index + 1, deceasedName, deceasedAddress1: '', deceasedAddress2: '', deceasedCity: '', deceasedProvince: '', deceasedPostalCode: '', ...(isDeleted ? { recordDelete_timeMillis: 1 } : {}) }
    insert('ContractInterments', values)
    seed.interments.push(values)
  }
}

const nameSource = await source('helpers/burialSites.helpers.js')
const nameFactory = new Function('segmentConfig', nameSource.slice(nameSource.indexOf('export function buildBurialSiteName'), nameSource.indexOf("process.on('message'")).replace('export function', 'function') + '\nreturn buildBurialSiteName;')
const configs = {
  single: { includeCemeteryKey: false, separator: '-', segments: { 1: { isAvailable: true, isRequired: true } } },
  multi: { includeCemeteryKey: true, separator: '/', segments: { 1: { isAvailable: true, isRequired: true, prefix: '[', suffix: ']' }, 2: { isAvailable: true, isRequired: false }, 3: { isAvailable: false }, 4: { isAvailable: true, isRequired: false }, 5: { isAvailable: true, isRequired: false } } },
}
function summary(rows) { return rows.length <= 20 ? { count: rows.length, rows } : { count: rows.length, first: rows.slice(0, 2), last: rows.slice(-2) } }
const rangeForms = [
  {}, { cemeteryId: '' },
  { burialSiteNameSegment1_from: 'A01', burialSiteNameSegment1_to: 'A04' },
  { burialSiteNameSegment1_from: 'A04', burialSiteNameSegment1_to: 'A01' },
  { burialSiteNameSegment1_from: '01', burialSiteNameSegment1_to: '03' },
  { burialSiteNameSegment1_from: 'Z', burialSiteNameSegment1_to: 'AB' },
  { burialSiteNameSegment1_from: 'A1', burialSiteNameSegment1_to: 'B2' },
  { burialSiteNameSegment1_from: 'A-01', burialSiteNameSegment1_to: 'A-03' },
  { burialSiteNameSegment1_from: 'A01', burialSiteNameSegment1_to: '' },
  { burialSiteNameSegment1_from: 'A01' },
  { burialSiteNameSegment1_from: '', burialSiteNameSegment1_to: '' },
  { burialSiteNameSegment1_from: '-2', burialSiteNameSegment1_to: '2' },
  { burialSiteNameSegment1_from: '1.1', burialSiteNameSegment1_to: '1.3' },
  { burialSiteNameSegment1_from: '1', burialSiteNameSegment1_to: '1000' },
  { burialSiteNameSegment1_from: '1', burialSiteNameSegment1_to: '1001' },
  { burialSiteNameSegment1_from: '1', burialSiteNameSegment1_to: '25', burialSiteNameSegment2_from: '1', burialSiteNameSegment2_to: '40' },
  { burialSiteNameSegment1_from: '1', burialSiteNameSegment1_to: '25', burialSiteNameSegment2_from: '1', burialSiteNameSegment2_to: '41' },
  { burialSiteNameSegment1_from: 'A', burialSiteNameSegment1_to: 'B', burialSiteNameSegment2_from: '01', burialSiteNameSegment2_to: '02', burialSiteNameSegment3_from: 'X', burialSiteNameSegment3_to: 'Y', burialSiteNameSegment5_from: 'Q', burialSiteNameSegment5_to: 'Q' },
]
const ranges = []
for (const [configName, config] of Object.entries(configs)) {
  helpers.buildBurialSiteName = nameFactory(config)
  const { getBurialSiteNamesByRange } = await load('getBurialSiteNamesByRange')
  for (const extra of rangeForms) {
    const form = { cemeteryId, ...extra }
    try { ranges.push({ configName, form, expected: summary(getBurialSiteNamesByRange(form, sharedConnection)) }) }
    catch (error) { ranges.push({ configName, form, error: { name: error.name, message: error.message } }) }
  }
}
const rangeBlocks = []
for (const [from, to] of [['A01', 'A04'], ['A04', 'A01'], ['1', '1000'], ['1', '1001'], ['Z', 'AB'], ['A1', 'B2'], ['A-01', 'A-03'], ['', ''], ['-2', '2'], ['1.1', '1.3'], ['B1C01', 'B2C02'], ['a', 'C'], ['🪦1', '🪦3']]) {
  try { rangeBlocks.push({ from, to, expected: summary(fillBlockRange(from, to, { limit: 1000 })) }) }
  catch (error) { rangeBlocks.push({ from, to, error: { name: error.name, message: error.message } }) }
}

const { getBurialSitesForMap } = await load('getBurialSitesForMap')
const maps = [cemeteryId, childId, otherId, 999].map(cemeteryId => ({ cemeteryId, expected: getBurialSitesForMap(cemeteryId, sharedConnection) }))
const dbHelper = await source('helpers/database.helpers.js')
Object.assign(helpers, new Function(dbHelper.match(/const LIMIT_DEFAULT = \d+;/)[0] + '\n' + dbHelper.slice(dbHelper.indexOf('export function sanitizeLimit'), dbHelper.indexOf('export async function getLastBackupDate')).replaceAll('export function', 'function') + '\nreturn {sanitizeLimit,sanitizeOffset};')())
const filters = await source('helpers/functions.sqlFilters.js')
helpers.getBurialSiteNameWhereClause = new Function(filters.slice(filters.indexOf('export function getBurialSiteNameWhereClause'), filters.indexOf('export function getContractTimeWhereClause')).replace('export function', 'function') + '\nreturn getBurialSiteNameWhereClause;')()
Object.assign(helpers, await load('getBurialSites'), await load('getBurialSiteDeceasedNames'))
const gpsHandler = new Function(...Object.keys(helpers), strip(await source('handlers/burialSitesPost/doSearchBurialSitesForGps.js')) + '\nreturn handler;')(...Object.values(helpers))
const gps = []
for (const form of [{}, { cemeteryId: '' }, { cemeteryId }, { cemeteryId, hasCoordinates: 'yes' }, { cemeteryId, hasCoordinates: 'no' }, { cemeteryId, burialSiteName: 'A01' }, { cemeteryId, contractStatus: 'occupied' }, { cemeteryId: childId }, { cemeteryId: 999 }]) {
  let expected
  try {
    gpsHandler({ body: form }, { json: value => { expected = value } })
    gps.push({ form, expected })
  } catch (error) { gps.push({ form, error: { name: error.name, message: error.message } }) }
}

const partialDates = await source('helpers/partialDate.helpers.js')
const partialDateIntegerToYear = new Function(strip(partialDates) + '\nreturn partialDateIntegerToYear;')()
const fagHelpers = new Function('_getFindAGraveCemeteryUrl', '_getFindAGraveMemorialUrl', '_getFindAGraveMemorialSearchUrl', 'parseFullName', 'partialDateIntegerToYear', strip(await source('helpers/findagrave.helpers.js')) + '\nreturn {getFindAGraveCemeteryUrl,getFindAGraveMemorialUrl,getFindAGraveMemorialSearchUrl};')(cemeteryUtils.getFindAGraveCemeteryUrl, cemeteryUtils.getFindAGraveMemorialUrl, cemeteryUtils.getFindAGraveMemorialSearchUrl, cemeteryUtils.parseFullName, partialDateIntegerToYear)
const urls = [null, 0, 12345, '00123', -1, 'abc'].map(id => ({ id, cemetery: fagHelpers.getFindAGraveCemeteryUrl(id) ?? null, memorial: fagHelpers.getFindAGraveMemorialUrl(id) ?? null }))
const nameInputs = [
  '', ' ', 'Jane Doe', 'Doe, Jane', 'Dr. Jane Mary Doe Jr.', 'Anne-Marie O’Neil', 'Hans von der Heide', 'Mary "Molly" Smith', 'UNKNOWN', 'Jean-Luc Picard', '李 明', 'Jane & John Doe', 'Mr. John Doe', 'JOHN SMITH', 'Smith, John Michael', 'Mrs. John Smith', 'Smith John',
  'Dr. Prof. Jane Doe Jr. Ph.D.', 'JOHN MCDONALD', 'john van der doe', 'JOHN A B C DOE', 'Doe, John, Esquire', 'Doe, John, Custom',
  "John 'Jack' Doe", 'John (Jack) Doe', 'John [Jack] Doe', 'John “Jack” Doe', 'John ‘Jack’ Doe', 'John "Jack", Doe', 'John "Jack" "Johnny" Doe',
  '"Only Nick"', 'J. R. R. Tolkien', 'A B', 'John  Doe', 'John\tDoe', 'John\nDoe', 'Dr.', 'Jr.', 'Doe,', 'Doe,John',
  'John, Jane, Doe, Smith', 'John esq doe', 'John ~Doe', 'John *Doe', 'John !Doe', 'John (Unknown) Doe', 'D’Angelo Maria',
]
const names = nameInputs.map(name => ({ name, expected: cemeteryUtils.parseFullName(name, { doFirstNameCheck: true }) }))
const findagraveSearches = []
for (const [cemeteryId, deceasedName, birthDate, deathDate] of [
  [null, 'Jane Doe', null, null], [12345, '', null, null], [12345, ' ', null, null],
  ...nameInputs.filter(name => name.trim()).map(name => [12345, name, null, null]),
  [12345, 'Jane Doe', 19010000, 19810500], [12345, 'Jane Doe', 0, -1], [12345, 'Jane Doe', 12310000, 20261020],
]) findagraveSearches.push({ cemeteryId, deceasedName, birthDate, deathDate, expected: fagHelpers.getFindAGraveMemorialSearchUrl(cemeteryId, deceasedName, birthDate, deathDate) ?? null })

// Execute original discovery/cache bodies on synthetic customization folders.
const assetRoot = path.join(work, 'customizations')
const siteDirectory = path.join(assetRoot, 'public-internal/images/burialSites')
const cemeteryDirectory = path.join(assetRoot, 'public-internal/images/cemeteries')
await fs.mkdir(siteDirectory, { recursive: true }); await fs.mkdir(cemeteryDirectory, { recursive: true })
const assetFiles = ['A.JPG', 'b.jpeg', 'c.png', 'no.gif', 'no.svg', 'no.jpg.txt', '.hidden.PNG']
const svgFiles = ['Alpha.svg', 'Beta.SVG', 'no.png', 'no.svg.txt']
for (const name of assetFiles) await fs.writeFile(path.join(siteDirectory, name), '')
for (const name of svgFiles) await fs.writeFile(path.join(cemeteryDirectory, name), '')
await fs.mkdir(path.join(siteDirectory, 'directory.jpg'), { recursive: true })
const imagesSource = await source('helpers/images.helpers.js')
function imageModule(customizationsPath, refresh = false) {
  const watcherCallbacks = {}
  const result = new Function('fs', 'path', 'chokidar', 'Debug', 'DEBUG_NAMESPACE', 'getConfigProperty', strip(imagesSource) + '\nreturn {getBurialSiteImages,getCemeterySVGs};')(
    fs, path, { watch: folder => ({ on: (event, callback) => { watcherCallbacks[`${folder}:${event}`] = callback } }) }, () => () => {}, 'synthetic',
    key => key === 'settings.customizationsPath' ? customizationsPath : refresh)
  return { ...result, watcherCallbacks }
}
const assetModule = imageModule(assetRoot, true)
const initialImages = await assetModule.getBurialSiteImages()
await fs.writeFile(path.join(siteDirectory, 'new.jpg'), '')
const cachedImages = await assetModule.getBurialSiteImages()
assetModule.watcherCallbacks[`${siteDirectory}:add`]()
const refreshedImages = await assetModule.getBurialSiteImages()
await fs.unlink(path.join(siteDirectory, 'new.jpg'))
const svgDiscovery = await assetModule.getCemeterySVGs()
const missingModule = imageModule(path.join(work, 'synthetic-missing'))
const assets = { inputImages: assetFiles, inputImageDirectories: ['directory.jpg'], inputSVGs: svgFiles, initialImages, cachedImages, refreshedImages, svgDiscovery, missingImages: await missingModule.getBurialSiteImages(), missingSVGs: await missingModule.getCemeterySVGs(), watcherEvents: Object.keys(assetModule.watcherCallbacks).map(key => key.split(':').at(-1)).sort() }
database.close()
const result = JSON.parse(JSON.stringify({ reference_commit: commit, source_sha256: hashes, packages, today, seed, configs, ranges, rangeBlocks, maps, gps, findagrave: { urls, names, searches: findagraveSearches }, assets }))
const target = path.join(root, 'backend/tests/fixtures/geography-reference.json')
if (process.argv.includes('--write-fixture')) await fs.writeFile(target, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await fs.readFile(target, 'utf8')), result)
await fs.writeFile(path.join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: frozen Sunrise ${ranges.length} range cases, ${rangeBlocks.length} locked block ranges, ${maps.length} map queries, ${gps.length} GPS queries, ${urls.length} URLs, ${names.length} name parses, ${findagraveSearches.length} memorial searches and image/cache discovery; ${packages.length} SHA512-verified packages`)
