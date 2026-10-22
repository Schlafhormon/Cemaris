// Execute immutable Sunrise interment/service bodies and handlers on its schema.
// SQLite is exclusively the SOURCE oracle; Cemaris comparisons use SQL Server.
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
const work = path.join(root, '.local/reference-contract-items')
await fs.mkdir(work, { recursive: true })
const hashes = {}
async function source(name) {
  const raw = await fs.readFile(path.join(reference, name), 'utf8')
  hashes[name] = createHash('sha256').update(raw).digest('hex')
  return raw
}
const lock = JSON.parse(await source('package-lock.json'))
const packages = []
for (const name of ['@cityssm/utils-datetime', '@cityssm/object-difference', '@cityssm/cemetery-utils', 'parse-full-name', '@cityssm/fill-block-range', 'fill-range', 'to-regex-range', 'is-number', 'just-cartesian-product']) {
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
async function dependency(name) { return import(pathToFileURL(path.join(work, 'node_modules', name, 'index.js')).href) }
const datetime = await dependency('@cityssm/utils-datetime')
const { default: getObjectDifference } = await dependency('@cityssm/object-difference')
const cemeteryUtils = await dependency('@cityssm/cemetery-utils')
const dataLists = new Function('purchaserRelationships', (await source('helpers/dataLists.js'))
  .replace(/^import .*;\r?$/gm, '').replaceAll('export const', 'const').replace('export default', 'return'))(cemeteryUtils.relationships)
// Exercise the original browser calculator through minimal input/event objects.
// The calculation body is extracted unchanged, never translated into this probe.
process.env.TZ = 'Europe/Berlin'
const intermentBrowser = await source('public/javascripts/contract.editInterments.js')
const calculatorSource = intermentBrowser.slice(intermentBrowser.indexOf('function initializeDeathAgeCalculator('), intermentBrowser.indexOf('function openEditContractInterment('))
const ages = []
for (const parts of [
  ['', '', '', '2000', '', ''], ['1900', '', '', '2000', '', ''], ['2000', '', '', '2000', '', ''],
  ['2000', '1', '1', '2000', '1', '1'], ['2000', '1', '1', '2000', '1', '31'],
  ['2000', '1', '1', '2001', '1', '1'], ['2000', '2', '29', '2001', '2', '28'],
  ['1900', '5', '1', '2000', '4', '30'], ['2000', '2', '31', '2000', '3', '4'],
  ['2000.9', '', '', '2026.9', '', ''], ['2026', '3', '28', '2026', '3', '30'],
]) {
  const elements = Object.fromEntries(['birthYear', 'birthMonth', 'birthDay', 'deathYear', 'deathMonth', 'deathDay'].map((key, index) => [key, { value: parts[index], addEventListener() {} }]))
  elements.deathAge = { value: 'existing' }; elements.deathAgePeriod = { value: 'Months' }
  const button = { disabled: false, toggleAttribute(name, enabled) { this[name] = enabled }, addEventListener(event, callback) { this[event] = callback } }
  const document = { querySelector(selector) { return selector === '#button--calculateDeathAge' ? button : elements[selector.split('--')[1]] } }
  new Function('document', calculatorSource + '\ninitializeDeathAgeCalculator("synthetic");')(document)
  button.click()
  ages.push({ parts, expected: { deathAge: elements.deathAge.value, deathAgePeriod: elements.deathAgePeriod.value, disabled: button.disabled } })
}
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
const helpers = {
  ...Object.fromEntries(Object.entries(datetime).filter(([key]) => key !== 'default')),
  getObjectDifference, Date: Clock, getDatabaseConnection: () => shared,
  isAuditLoggingEnabled: true, Debug: () => () => {}, DEBUG_NAMESPACE: 'synthetic-items',
}
function strip(raw) {
  return raw.replace(/^import .*;\r?$/gm, '').replace(/^export default ([A-Za-z_$][\w$]*);?\r?$/gm, '')
    .replaceAll('export default function', 'function').replaceAll('export function', 'function')
}
async function load(file, names) {
  return new Function(...Object.keys(helpers), strip(await source(file)) + `\nreturn {${names.join(',')}};`)(...Object.values(helpers))
}
Object.assign(helpers, await load('helpers/partialDate.helpers.js', ['datePartsToInteger', 'partialDateIntegerToString', 'partialDateIntegerToYear', 'partialDateIntegerToMonth', 'partialDateIntegerToDay']))
Object.assign(helpers, new Function(...Object.keys(helpers), '_getFindAGraveCemeteryUrl', '_getFindAGraveMemorialUrl', '_getFindAGraveMemorialSearchUrl', 'parseFullName',
  strip(await source('helpers/findagrave.helpers.js')) + '\nreturn {getFindAGraveCemeteryUrl,getFindAGraveMemorialUrl,getFindAGraveMemorialSearchUrl};')(
  ...Object.values(helpers), cemeteryUtils.getFindAGraveCemeteryUrl, cemeteryUtils.getFindAGraveMemorialUrl, cemeteryUtils.getFindAGraveMemorialSearchUrl, cemeteryUtils.parseFullName))
for (const name of ['createAuditLogEntries', 'addContractInterment', 'updateContractInterment', 'deleteContractInterment', 'getContractInterments', 'addContractServiceType', 'updateContractServiceType', 'deleteContractServiceType', 'getContractServiceTypes']) {
  Object.assign(helpers, await load(`database/${name}.js`, [name]))
}
const handlers = {}
for (const name of ['doAddContractInterment', 'doUpdateContractInterment', 'doDeleteContractInterment', 'doAddContractServiceType', 'doUpdateContractServiceType', 'doDeleteContractServiceType']) {
  handlers[name] = (await load(`handlers/contractsPost/${name}.js`, ['handler'])).handler
}
const actor = { username: 'synthetic-items' }
const editor = { username: 'synthetic-items-editor' }
function fresh() {
  database?.close()
  database = new DatabaseSync(':memory:')
  for (const sql of statements) database.exec(sql)
  connectionCloses = 0
}
function insert(table, values) {
  const data = { ...values, recordCreate_username: actor.username, recordCreate_timeMillis: 1, recordUpdate_username: actor.username, recordUpdate_timeMillis: 1 }
  return Number(database.prepare(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(() => '?').join(',')})`).run(...Object.values(data)).lastInsertRowid)
}
const seed = []
function setup(record = false) {
  fresh()
  const add = (table, values) => { const id = insert(table, values); if (record) seed.push({ table, id, values }); return id }
  add('ContractTypes', { contractType: 'Synthetic contract', orderNumber: 0 })
  add('BurialSiteTypes', { burialSiteType: 'Synthetic grave', orderNumber: 0 })
  add('Cemeteries', { cemeteryName: 'Synthetic cemetery', cemeteryKey: 'SYN', findagraveCemeteryId: 123 })
  add('BurialSites', { burialSiteTypeId: 1, cemeteryId: 1, burialSiteName: 'SYN-A01', burialSiteNameSegment1: 'A01', burialSiteNameSegment2: '', burialSiteNameSegment3: '', burialSiteNameSegment4: '', burialSiteNameSegment5: '' })
  add('Contracts', { contractTypeId: 1, burialSiteId: 1, contractNumber: 'SYN-ITEM-1', purchaserName: 'Synthetic purchaser', contractStartDate: 20261020 })
  add('Contracts', { contractTypeId: 1, contractNumber: 'SYN-ITEM-2', purchaserName: 'Synthetic other', contractStartDate: 20261020 })
  for (const [name, orderNumber, isCremationType, deleted] of [['Synthetic casket', 2, 0, false], ['Synthetic urn', 1, 1, false], ['Synthetic deleted container', -1, 1, true]]) add('IntermentContainerTypes', {
    intermentContainerType: name, orderNumber, isCremationType, ...(deleted ? { recordDelete_timeMillis: 1 } : {}) })
  for (const [intermentDepth, deleted] of [['Synthetic depth', false], ['Synthetic deleted depth', true]]) add('IntermentDepths', { intermentDepth, orderNumber: 0, ...(deleted ? { recordDelete_timeMillis: 1 } : {}) })
  for (const [serviceType, orderNumber, deleted] of [['Name ', 1, false], ['Name', 1, false], ['🪦', 1, false], ['\uE000', 1, false], ['Synthetic first', 0, false], ['Synthetic deleted', -1, true]]) add('ServiceTypes', { serviceType, orderNumber, ...(deleted ? { recordDelete_timeMillis: 1 } : {}) })
}
setup(true)
const fullForm = { contractId: 1, deceasedName: 'Synthetic Person', deceasedAddress1: '1 Synthetic Way', deceasedAddress2: '', deceasedCity: 'Synthetic City', deceasedProvince: 'BB', deceasedPostalCode: 'a1b 2c3', birthYear: '1900', birthMonth: '2', birthDay: '31', birthPlace: 'Synthetic birthplace', deathYear: '2000', deathMonth: '1', deathDay: '3', deathPlace: 'Synthetic death place', deathAge: '100', deathAgePeriod: 'Years', intermentContainerTypeId: '1', intermentDepthId: '1', findagraveMemorialId: '456' }
function clean(value) {
  if (Array.isArray(value)) return value.map(clean)
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith('record')).map(([key, item]) => [key, clean(item)]))
  return value
}
function raw(table, where = '1=1', params = []) { return database.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY ${table === 'ContractInterments' ? 'contractId,intermentNumber' : 'contractId,serviceTypeId'}`).all(...params).map(row => ({ ...clean(row), deleted: row.recordDelete_timeMillis !== null })) }
function audit() {
  return database.prepare('SELECT * FROM AuditLog ORDER BY rowid').all().map(row => ({ ...Object.fromEntries(['mainRecordType', 'mainRecordId', 'updateTable', 'recordIndex', 'updateField', 'updateType', 'updateUsername'].map(key => [key, row[key]])),
    fromValue: row.fromValue === null ? null : clean(JSON.parse(row.fromValue)), toValue: row.toValue === null ? null : clean(JSON.parse(row.toValue)) }))
}
const defaults = []
for (const form of [{ contractId: 1 }, fullForm, { ...fullForm, birthMonth: '', birthDay: '', deathMonth: '10', deathDay: '', deathAge: '', intermentContainerTypeId: '', intermentDepthId: '', findagraveMemorialId: '' },
  { ...fullForm, birthYear: '0', deathYear: '-1', deathAge: '0', intermentContainerTypeId: '3', intermentDepthId: '2', findagraveMemorialId: '0' },
  { ...fullForm, birthMonth: '99', birthDay: '99', deathMonth: '-1', deathDay: '-10' }]) {
  setup()
  const number = helpers.addContractInterment(form, actor, shared)
  defaults.push({ form, number, expected: raw('ContractInterments')[0], retrieved: helpers.getContractInterments(1, shared) })
}
const fractional = []
for (const overrides of [{ birthDay: '1.5' }, { birthYear: '1900.5', birthMonth: '2.3', birthDay: '3.4' }, { deathAge: '2.5' }, { findagraveMemorialId: '123.5' }, { birthYear: '2000.5', birthMonth: '', birthDay: '' }, { birthMonth: '2.5', birthDay: '1' }]) {
  setup()
  const form = { ...fullForm, ...overrides }
  helpers.addContractInterment(form, actor, shared)
  fractional.push({ form, expected: raw('ContractInterments')[0], retrieved: helpers.getContractInterments(1, shared) })
}
const updates = []
for (const overrides of [{ deceasedName: 'Synthetic Updated', deceasedPostalCode: 'z9z 9z9', birthYear: '1950', birthMonth: '', birthDay: '', deathYear: '', deathMonth: '', deathDay: '', deathAge: '0' },
  { deathAge: '', intermentContainerTypeId: '', intermentDepthId: '', findagraveMemorialId: '' },
  { birthMonth: '0', birthDay: '31', deathYear: '2026', deathMonth: '2', deathDay: '31', intermentContainerTypeId: '2' }]) {
  setup()
  helpers.addContractInterment(fullForm, actor, shared)
  const form = { ...fullForm, intermentNumber: 1, ...overrides }
  const success = helpers.updateContractInterment(form, editor, shared)
  updates.push({ form, success, expected: raw('ContractInterments')[0], retrieved: helpers.getContractInterments(1, shared), audit: audit() })
}
setup()
const lifecycle = []
for (const action of ['add', 'delete', 'delete', 'updateDeleted', 'add', 'updateMissing', 'deleteMissing', 'addOtherContract']) {
  let result
  if (action === 'add') result = helpers.addContractInterment(fullForm, actor, shared)
  else if (action === 'delete') result = helpers.deleteContractInterment(1, 1, editor, shared)
  else if (action === 'updateDeleted') result = helpers.updateContractInterment({ ...fullForm, intermentNumber: 1, deceasedName: 'Must stay deleted' }, editor, shared)
  else if (action === 'updateMissing') result = helpers.updateContractInterment({ ...fullForm, intermentNumber: 999 }, editor, shared)
  else if (action === 'deleteMissing') result = helpers.deleteContractInterment(1, 999, editor, shared)
  else result = helpers.addContractInterment({ ...fullForm, contractId: 2 }, actor, shared)
  lifecycle.push({ action, result, rows: raw('ContractInterments'), retrieved: helpers.getContractInterments(1, shared) })
}
const lifecycleAudit = audit()
setup()
const serviceLifecycle = []
for (const [action, serviceTypeId, details] of [['add', 1, 'Synthetic first'], ['add', 1, 'Synthetic overwritten duplicate'], ['update', 1, 'Synthetic edited'], ['delete', 1], ['delete', 1], ['update', 1, 'Must stay deleted'], ['add', 1, 'Synthetic revived'], ['add', 6, 'Synthetic deleted catalog remains hidden'], ['update', 2], ['delete', 2]]) {
  const form = { contractId: 1, serviceTypeId, ...(details === undefined ? {} : { contractServiceDetails: details }) }
  const result = action === 'delete' ? helpers.deleteContractServiceType(1, serviceTypeId, editor, shared) : helpers[action === 'add' ? 'addContractServiceType' : 'updateContractServiceType'](form, action === 'add' ? actor : editor, shared)
  serviceLifecycle.push({ action, form, result, rows: raw('ContractServiceTypes'), retrieved: helpers.getContractServiceTypes(1, shared) })
}
const serviceAudit = audit()
setup()
const retrievalSeed = []
function retrievalInsert(table, values) { insert(table, values); retrievalSeed.push({ table, values }) }
for (const [index, deceasedName, container, depth, deleted] of [[1, 'Name ', 1, 1, false], [2, 'Name', 1, 2, false], [3, '🪦', 1, null, false], [4, '\uE000', 1, null, false], [5, 'Synthetic urn', 2, 1, false], [6, 'Synthetic no container', null, null, false], [7, 'Synthetic deleted container', 3, 2, false], [8, 'Synthetic deleted person', 2, 1, true], [9, 'Name', 1, 1, false]]) {
  retrievalInsert('ContractInterments', { contractId: 1, intermentNumber: index, deceasedName, deceasedAddress1: '', deceasedAddress2: '', deceasedCity: '', deceasedProvince: '', deceasedPostalCode: '', birthDate: 19000000, deathDate: 20000100, intermentContainerTypeId: container, intermentDepthId: depth, ...(deleted ? { recordDelete_timeMillis: 1 } : {}) })
}
for (let serviceTypeId = 1; serviceTypeId <= 6; serviceTypeId++) retrievalInsert('ContractServiceTypes', { contractId: 1, serviceTypeId, contractServiceDetails: `Synthetic detail ${serviceTypeId}` })
const retrieval = { seed: retrievalSeed, interments: helpers.getContractInterments(1, shared), services: helpers.getContractServiceTypes(1, shared) }
database.prepare('UPDATE Contracts SET recordDelete_timeMillis=1 WHERE contractId=1').run()
retrieval.deletedParentInterments = helpers.getContractInterments(1, shared)
retrieval.deletedParentServices = helpers.getContractServiceTypes(1, shared)
const handlerCases = []
for (const [handler, existing, body] of [
  ['doAddContractInterment', false, { contractId: 1, deceasedName: 'Synthetic HTTP' }],
  ['doUpdateContractInterment', true, { ...fullForm, intermentNumber: 1, deceasedName: 'Synthetic HTTP updated' }],
  ['doUpdateContractInterment', false, { ...fullForm, intermentNumber: 999 }],
  ['doDeleteContractInterment', true, { contractId: 1, intermentNumber: 1 }],
  ['doDeleteContractInterment', false, { contractId: 1, intermentNumber: 999 }],
  ['doUpdateContractInterment', true, { contractId: 1, intermentNumber: 1 }],
  ['doAddContractServiceType', false, { contractId: 1, serviceTypeId: 1 }],
  ['doAddContractServiceType', true, { contractId: 1, serviceTypeId: 1, contractServiceDetails: 'Synthetic duplicate HTTP' }],
  ['doUpdateContractServiceType', true, { contractId: 1, serviceTypeId: 1, contractServiceDetails: 'Synthetic edited HTTP' }],
  ['doUpdateContractServiceType', false, { contractId: 1, serviceTypeId: 1 }],
  ['doDeleteContractServiceType', true, { contractId: 1, serviceTypeId: 1 }],
  ['doDeleteContractServiceType', false, { contractId: 1, serviceTypeId: 1 }],
]) {
  setup()
  if (existing) {
    if (handler.includes('Interment')) helpers.addContractInterment(fullForm, actor, shared)
    else helpers.addContractServiceType({ contractId: 1, serviceTypeId: 1, contractServiceDetails: 'Synthetic original HTTP' }, actor, shared)
  }
  connectionCloses = 0
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this }, json(value) { this.body = value; return this } }
  handlers[handler]({ body, session: { user: editor } }, response)
  handlerCases.push({ handler, existing, body, expected: { status: response.statusCode, body: response.body }, connectionCloses })
}
setup()
const parentBefore = database.prepare('SELECT * FROM Contracts WHERE contractId=1').get()
helpers.addContractInterment(fullForm, actor, shared)
helpers.updateContractInterment({ ...fullForm, intermentNumber: 1 }, editor, shared)
helpers.deleteContractInterment(1, 1, editor, shared)
helpers.addContractServiceType({ contractId: 1, serviceTypeId: 1 }, actor, shared)
helpers.updateContractServiceType({ contractId: 1, serviceTypeId: 1, contractServiceDetails: 'Synthetic details' }, editor, shared)
helpers.deleteContractServiceType(1, 1, editor, shared)
const sideEffects = { parentUnchanged: JSON.stringify(parentBefore) === JSON.stringify(database.prepare('SELECT * FROM Contracts WHERE contractId=1').get()), auditTables: [...new Set(audit().map(row => row.updateTable))], unrelatedCounts: {} }
for (const table of ['ContractFees', 'ContractTransactions', 'ContractComments', 'ContractFields', 'WorkOrderContracts']) sideEffects.unrelatedCounts[table] = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count
database.close()
const result = JSON.parse(JSON.stringify({ reference_commit: commit, source_sha256: hashes, packages, today: 20261020, fixed_local_time: '09:05:42',
  oracle_boundaries: ['Original schema, function bodies, six handlers, partial-date and FindAGrave wrappers, locked runtime packages, audit differences and audit writer execute unchanged; imports/exports alone are removed.', 'Connection access/close is a shared in-memory-source boundary; handler close calls are counted. Debug output is a no-op.', 'No external FindAGrave HTTP call occurs: original URL construction executes locally.', 'Audit values omit record* properties in full record snapshots; scalar recordUpdate_username differences remain. Audit clock fields are omitted.'],
  dataLists, browserCalculator: { timezone: 'Europe/Berlin', cases: ages }, seed, fullForm, defaults, fractional, updates, lifecycle, lifecycleAudit, serviceLifecycle, serviceAudit, retrieval, handlers: handlerCases, sideEffects }))
const fixture = path.join(root, 'backend/tests/fixtures/contract-items-reference.json')
if (process.argv.includes('--write-fixture')) await fs.writeFile(fixture, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await fs.readFile(fixture, 'utf8')), result)
await fs.writeFile(path.join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: original Sunrise ${defaults.length} interment defaults, ${fractional.length} fractional storage cases, ${updates.length} updates, ${lifecycle.length} interment and ${serviceLifecycle.length} service lifecycle stages, ${handlerCases.length} handlers; original audit differences/writer, sorting, deleted catalogs/parent and side effects`)
