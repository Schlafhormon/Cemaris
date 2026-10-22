// Execute the frozen original catalogue database modules with their original
// SQLite schema. SQLite here is only the Sunrise oracle; target tests use SQL Server.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const root = fileURLToPath(new URL('../', import.meta.url))
const ref = path.resolve(root, '../Sunrise-Referenz')
const commit = '451ce034863b16502484367044f3e9b65370111a'
assert.equal(execFileSync('git', ['-C', ref, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit)
const hashes = {}
async function source(name) {
  const content = await readFile(path.join(ref, name), 'utf8')
  hashes[name] = createHash('sha256').update(content).digest('hex')
  return content
}
const schemaSource = await source('database/initializeDatabase.js')
const statements = new Function(schemaSource.slice(schemaSource.indexOf('const recordColumns'), schemaSource.indexOf('const initializingUser')) + '\nreturn sqlCreateStatements;')()
let database
function fresh() {
  database?.close()
  database = new DatabaseSync(':memory:')
  for (const sql of statements) database.exec(sql)
  return database
}
const helpers = {
  getDatabaseConnection: () => database,
  clearCacheByTableName: () => {},
  startSyncDataToPortalTask: () => {},
  isAuditLoggingEnabled: false,
  getConfigProperty: () => ['contract.sample', 'contract.second'],
}
async function load(name, exports = [name], extra = {}) {
  const raw = await source(`database/${name}.js`)
  const code = raw.replace(/^import .*;\r?$/gm, '')
    .replace(/^export default ([A-Za-z_$][\w$]*);?\r?$/gm, '')
    .replaceAll('export default function', 'function').replaceAll('export function', 'function')
  const inputs = { ...helpers, ...extra }
  return new Function(...Object.keys(inputs), code + `\nreturn {${exports.join(',')}};`)(...Object.values(inputs))
}
const { updateRecordOrderNumber } = await load('updateRecordOrderNumber')
helpers.updateRecordOrderNumber = updateRecordOrderNumber
const { getFee } = await load('getFee')
helpers.getFee = getFee
const { getFees } = await load('getFees')
helpers.getFees = getFees
const { getFeeCategories } = await load('getFeeCategories')
const { getBurialSiteTypeFields } = await load('getBurialSiteTypeFields')
const { getContractTypeFields } = await load('getContractTypeFields')
const { getContractTypePrints } = await load('getContractTypePrints')
Object.assign(helpers, { getBurialSiteTypeFields, getContractTypeFields, getContractTypePrints })
const { getBurialSiteTypes } = await load('getBurialSiteTypes')
const { moveRecordUp, moveRecordDown, moveRecordUpToTop, moveRecordDownToBottom } = await load('moveRecord', ['moveRecordUp', 'moveRecordDown', 'moveRecordUpToTop', 'moveRecordDownToBottom'])
const generic = await load('addRecord', ['addBurialSiteStatus', 'addWorkOrderMilestoneType', 'addWorkOrderStatus', 'addWorkOrderType'])
const actor = { username: 'synthetic-catalog' }
const specs = [
  ['burialSiteTypes', 'BurialSiteTypes', 'burialSiteTypeId', 'addBurialSiteType', { burialSiteType: 'Synthetic Plot', bodyCapacityMax: '', crematedCapacityMax: '2' }],
  ['contractTypes', 'ContractTypes', 'contractTypeId', 'addContractType', { contractType: 'Synthetic Contract' }],
  ['contractTypes', 'ContractTypes', 'contractTypeId', 'addContractType', { contractType: 'Preneed Presence', isPreneed: '' }],
  ['committalTypes', 'CommittalTypes', 'committalTypeId', 'addCommittalType', { committalType: 'Synthetic Committal' }],
  ['intermentContainerTypes', 'IntermentContainerTypes', 'intermentContainerTypeId', 'addIntermentContainerType', { intermentContainerType: 'Synthetic Container' }],
  ['intermentDepths', 'IntermentDepths', 'intermentDepthId', 'addIntermentDepth', { intermentDepth: 'Synthetic Depth' }],
  ['serviceTypes', 'ServiceTypes', 'serviceTypeId', 'addServiceType', { serviceType: 'Synthetic Service' }],
  ['feeCategories', 'FeeCategories', 'feeCategoryId', 'addFeeCategory', { feeCategory: 'Synthetic Fee Category' }],
  ['feeCategories', 'FeeCategories', 'feeCategoryId', 'addFeeCategory', { feeCategory: 'Grouped', isGroupedFee: true }],
]
for (const [resource, table, id, fn, field] of [
  ['burialSiteStatuses', 'BurialSiteStatuses', 'burialSiteStatusId', 'addBurialSiteStatus', 'burialSiteStatus'],
  ['workOrderMilestoneTypes', 'WorkOrderMilestoneTypes', 'workOrderMilestoneTypeId', 'addWorkOrderMilestoneType', 'workOrderMilestoneType'],
  ['workOrderStatuses', 'WorkOrderStatuses', 'workOrderStatusId', 'addWorkOrderStatus', 'workOrderStatus'],
  ['workOrderTypes', 'WorkOrderTypes', 'workOrderTypeId', 'addWorkOrderType', 'workOrderType'],
]) specs.push([resource, table, id, fn, { [field]: 'Synthetic Status', orderNumber: '' }])
const defaults = []
for (const [resource, table, idField, fn, form] of specs) {
  fresh()
  const api = fn in generic ? generic : await load(fn)
  const id = fn in generic ? api[fn](Object.values(form)[0], form.orderNumber, actor, database) : api[fn](form, actor, database)
  const raw = database.prepare(`SELECT * FROM ${table} WHERE ${idField} = ?`).get(id)
  const expected = Object.fromEntries(Object.entries(raw).filter(([name]) => name !== idField && !name.startsWith('record')))
  defaults.push({ resource, table, idField, form, expected })
}

const fields = []
for (const [resource, table, idField, parentField, fn, label] of [
  ['burialSiteTypeFields', 'BurialSiteTypeFields', 'burialSiteTypeFieldId', 'burialSiteTypeId', 'addBurialSiteTypeField', 'burialSiteTypeField'],
  ['contractTypeFields', 'ContractTypeFields', 'contractTypeFieldId', 'contractTypeId', 'addContractTypeField', 'contractTypeField'],
]) {
  const api = await load(fn)
  for (const required of [undefined, '', '0', '1']) {
    fresh()
    database.exec("INSERT INTO BurialSiteTypes (burialSiteType, recordCreate_username, recordCreate_timeMillis, recordUpdate_username, recordUpdate_timeMillis) VALUES ('Synthetic parent', 'test', 1, 'test', 1)")
    const form = { [label]: 'Synthetic Field', [parentField]: resource === 'contractTypeFields' ? '' : 1 }
    if (required !== undefined) form.isRequired = required
    const id = api[fn](form, actor, database)
    const raw = database.prepare(`SELECT * FROM ${table} WHERE ${idField} = ?`).get(id)
    const expected = Object.fromEntries(Object.entries(raw).filter(([name]) => name !== idField && !name.startsWith('record')))
    fields.push({ resource, table, idField, parentField, form, expected })
  }
}

fresh()
const addType = (await load('addBurialSiteType')).addBurialSiteType
for (const [name, order] of [['B', 7], ['A', 7], ['Deleted', -9]]) {
  const id = addType({ burialSiteType: name, bodyCapacityMax: '', crematedCapacityMax: '', orderNumber: order }, actor, database)
  if (name === 'Deleted') database.prepare('UPDATE BurialSiteTypes SET recordDelete_timeMillis = 5 WHERE burialSiteTypeId = ?').run(id)
}
const rawOrders = () => database.prepare('SELECT burialSiteType AS name, orderNumber FROM BurialSiteTypes ORDER BY burialSiteType').all()
const beforeRead = rawOrders()
getBurialSiteTypes(true, database)
const afterIncludeDeleted = rawOrders()
const activeTypes = getBurialSiteTypes(false, database).map(x => ({ name: x.burialSiteType, orderNumber: x.orderNumber }))
const afterRead = rawOrders()

const moves = []
for (const [direction, fn] of [['up', moveRecordUp], ['down', moveRecordDown], ['top', moveRecordUpToTop], ['bottom', moveRecordDownToBottom]]) {
  for (const index of [0, 1, 2]) {
    fresh()
    const ids = ['A', 'B', 'C'].map((name, i) => generic.addWorkOrderStatus(name, i, actor, database))
    const success = fn('WorkOrderStatuses', ids[index], database)
    const expected = database.prepare('SELECT workOrderStatus AS name, orderNumber FROM WorkOrderStatuses ORDER BY workOrderStatus').all()
    moves.push({ direction, index, success, expected })
  }
}

fresh()
const addPrint = (await load('addContractTypePrint')).addContractTypePrint
;(await load('addContractType')).addContractType({ contractType: 'Synthetic print parent' }, actor, database)
for (const [printEJS, orderNumber] of [['contract.sample', 9], ['unconfigured', 4], ['*', 7]]) addPrint({ contractTypeId: 1, printEJS, orderNumber }, actor, database)
const prints = getContractTypePrints(1, database)
const printOrders = database.prepare('SELECT printEJS, orderNumber FROM ContractTypePrints ORDER BY printEJS').all()

const feeFilters = []
const addCategory = (await load('addFeeCategory')).addFeeCategory
const addContract = (await load('addContractType')).addContractType
const addFee = (await load('addFee')).addFee
for (const [filters, includeFees] of [[{}, false], [{}, true], [{ contractTypeId: '' }, true], [{ contractTypeId: 1 }, true], [{ contractTypeId: 1, burialSiteTypeId: 1 }, true], [{ feeCategoryId: 2 }, true]]) {
  fresh()
  for (const name of ['First', 'Second']) {
    addContract({ contractType: name }, actor, database)
    addType({ burialSiteType: name, bodyCapacityMax: '', crematedCapacityMax: '' }, actor, database)
  }
  const firstCategory = addCategory({ feeCategory: 'Alpha', orderNumber: 8 }, actor, database)
  const secondCategory = addCategory({ feeCategory: 'Beta', orderNumber: 9 }, actor, database)
  const base = { feeDescription: '', feeAccount: '', feeAmount: '', taxAmount: '', taxPercentage: '' }
  for (const [feeName, feeCategoryId, contractTypeId, burialSiteTypeId, orderNumber] of [
    ['Cross A', firstCategory, 1, 2, 10], ['Cross B', firstCategory, 2, 1, 12], ['Global', secondCategory, '', '', 7],
  ]) addFee({ ...base, feeName, feeCategoryId, contractTypeId, burialSiteTypeId, orderNumber }, actor, database)
  const selected = getFeeCategories(filters, { includeFees }, database).map(category => ({
    name: category.feeCategory, orderNumber: category.orderNumber,
    ...(includeFees ? { fees: category.fees.map(fee => ({ name: fee.feeName, orderNumber: fee.orderNumber })) } : {}),
  }))
  const persistedCategories = database.prepare('SELECT feeCategory AS name, orderNumber FROM FeeCategories ORDER BY feeCategory').all()
  const persistedFees = database.prepare('SELECT feeName AS name, orderNumber FROM Fees ORDER BY feeName').all()
  feeFilters.push({ filters, includeFees, selected, persistedCategories, persistedFees })
}

const fieldUpdateOmissions = []
const addContractField = (await load('addContractTypeField')).addContractTypeField
const updateContractField = (await load('updateContractTypeField')).updateContractTypeField
for (const fieldType of ['text', 'date']) {
  fresh()
  const id = addContractField({ contractTypeId: '', contractTypeField: 'Synthetic Field', isRequired: '' }, actor, database)
  const form = { contractTypeFieldId: id, contractTypeField: 'Updated Field', isRequired: '0', fieldType }
  try {
    const success = updateContractField(form, actor, database)
    fieldUpdateOmissions.push({ fieldType, success })
  } catch (error) {
    fieldUpdateOmissions.push({ fieldType, error: error.name, code: error.code, message: error.message })
  }
}

// Run initializeData itself, including each real getter's read side effects.
const seedInputs = { ...helpers, debug: () => {}, getFeeCategories, ...generic }
const seedTables = [
  ['BurialSiteTypes', 'burialSiteType'], ['BurialSiteStatuses', 'burialSiteStatus'],
  ['ContractTypes', 'contractType'], ['ServiceTypes', 'serviceType'],
  ['IntermentContainerTypes', 'intermentContainerType'], ['IntermentDepths', 'intermentDepth'],
  ['CommittalTypes', 'committalType'], ['FeeCategories', 'feeCategory'],
  ['WorkOrderTypes', 'workOrderType'], ['WorkOrderStatuses', 'workOrderStatus'],
  ['WorkOrderMilestoneTypes', 'workOrderMilestoneType'],
]
for (const [table, label] of seedTables) {
  const getter = `get${table}`
  if (!(getter in seedInputs)) seedInputs[getter] = (await load(getter))[getter]
  const adder = `add${label[0].toUpperCase()}${label.slice(1)}`
  if (!(adder in seedInputs)) seedInputs[adder] = (await load(adder))[adder]
}
const seedCode = schemaSource.slice(schemaSource.indexOf('const initializingUser')).replaceAll('export function', 'function')
const initializeData = new Function(...Object.keys(seedInputs), seedCode + '\nreturn initializeData;')(...Object.values(seedInputs))
fresh()
const seedRows = () => Object.fromEntries(seedTables.map(([table, label]) => [table,
  database.prepare(`SELECT ${label} AS name, orderNumber FROM ${table} ORDER BY ${label}`).all()]))
initializeData(database)
const seeded = seedRows()
initializeData(database)
const reread = seedRows()

// Node SQLite returns records with a null prototype. Compare their JSON wire
// values to the persisted oracle, not the JavaScript object prototypes.
const result = JSON.parse(JSON.stringify({ reference_commit: commit, source_sha256: hashes, defaults, fields, readNormalization: { beforeRead, afterIncludeDeleted, activeTypes, afterRead }, moves, prints: { visible: prints, rows: printOrders }, feeFilters, fieldUpdateOmissions, initialization: { seeded, reread } }))
database.close()
const output = path.join(root, 'backend/tests/fixtures/catalog-reference.json')
if (process.argv.includes('--write-fixture')) await writeFile(output, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), result)
await mkdir(path.join(root, '.local/reference-catalogs'), { recursive: true })
await writeFile(path.join(root, '.local/reference-catalogs/result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: original Sunrise ${defaults.length} catalogue defaults, ${fields.length} field defaults, ${moves.length} moves, ${feeFilters.length} fee filters, 46 initial values, read normalization, print filtering and two omitted-field errors`)
