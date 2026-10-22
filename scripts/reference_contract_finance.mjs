// Execute immutable Sunrise fee/transaction bodies, handlers and browser renderers.
// SQLite is exclusively the SOURCE oracle. Target comparisons use SQL Server.
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
const work = path.join(root, '.local/reference-contract-finance')
await fs.mkdir(work, { recursive: true })
const hashes = {}
async function source(name) {
  const raw = await fs.readFile(path.join(reference, name), 'utf8')
  hashes[name] = createHash('sha256').update(raw).digest('hex')
  return raw
}
const lock = JSON.parse(await source('package-lock.json'))
const packages = []
for (const name of ['@cityssm/utils-datetime', '@cityssm/object-difference']) {
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
const datetime = await import(pathToFileURL(path.join(work, 'node_modules/@cityssm/utils-datetime/index.js')).href)
const { default: getObjectDifference } = await import(pathToFileURL(path.join(work, 'node_modules/@cityssm/object-difference/index.js')).href)
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
const helpers = {
  ...Object.fromEntries(Object.entries(datetime).filter(([key]) => key !== 'default')),
  getObjectDifference, Date: Clock, getDatabaseConnection: () => shared,
  isAuditLoggingEnabled: true, Debug: () => () => {}, DEBUG_NAMESPACE: 'synthetic-finance',
  getConfigProperty: () => false,
  // getContract's unrelated child lists are outside this oracle. Its actual
  // SELECT/date/fee/transaction logic is executed; fee calculation ignores contract.
  getContractFields: () => [], getContractInterments: () => [], getContractServiceTypes: () => [],
  getContractComments: () => [], getContractAttachments: () => [],
  getWorkOrders: async () => ({ workOrders: [] }), getContracts: async () => ({ contracts: [] }),
}
function strip(raw) {
  return raw.replace(/^import .*;\r?$/gm, '').replace(/^export default ([A-Za-z_$][\w$]*);?\r?$/gm, '')
    .replaceAll('export default async function', 'async function').replaceAll('export default function', 'function').replaceAll('export function', 'function')
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
async function load(file, names) {
  await source(file.replace(/\.js$/, '.ts'))
  return new AsyncFunction(...Object.keys(helpers), strip(await source(file)) + `\nreturn {${names.join(',')}};`)(...Object.values(helpers))
}
Object.assign(helpers, await load('helpers/functions.fee.js', ['calculateFeeAmount', 'calculateTaxAmount']))
Object.assign(helpers, await load('helpers/contracts.helpers.js', ['getFeesByFeeCategory', 'getFieldValueByContractTypeField', 'getTransactionTotal']))
for (const name of ['createAuditLogEntries', 'updateRecordOrderNumber', 'getFee', 'getFees', 'getContractFees', 'getContractTransactions', 'getContract', 'addContractFee', 'addContractFeeCategory', 'updateContractFeeQuantity', 'deleteContractFee', 'addContractTransaction', 'updateContractTransaction', 'deleteContractTransaction', 'deleteContract']) {
  if (name === 'addContractFee') Object.assign(helpers, await load('database/getFeeCategories.js', ['getFeeCategories', 'getFeeCategory']))
  Object.assign(helpers, await load(`database/${name}.js`, [name]))
}
const handlers = {}
for (const name of ['doGetFees', 'doAddContractFee', 'doAddContractFeeCategory', 'doUpdateContractFeeQuantity', 'doDeleteContractFee', 'doAddContractTransaction', 'doUpdateContractTransaction', 'doDeleteContractTransaction']) {
  handlers[name] = (await load(`handlers/contractsPost/${name}.js`, ['handler'])).handler
}
const actor = { username: 'synthetic-finance' }
const editor = { username: 'synthetic-finance-editor' }
function fresh() {
  database?.close()
  database = new DatabaseSync(':memory:')
  for (const sql of statements) database.exec(sql)
  connectionCloses = 0
}
function insert(table, values) {
  const data = { recordCreate_username: actor.username, recordCreate_timeMillis: 1, recordUpdate_username: actor.username, recordUpdate_timeMillis: 1, ...values }
  return Number(database.prepare(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(() => '?').join(',')})`).run(...Object.values(data)).lastInsertRowid)
}
const seed = []
function setup(record = false) {
  fresh()
  const add = (table, values) => { const id = insert(table, values); if (record) seed.push({ table, id, values }); return id }
  add('ContractTypes', { contractType: 'Synthetic contract', orderNumber: 0 })
  add('ContractTypes', { contractType: 'Synthetic other contract', orderNumber: 1 })
  add('BurialSiteTypes', { burialSiteType: 'Synthetic grave', orderNumber: 0 })
  add('BurialSiteTypes', { burialSiteType: 'Synthetic other grave', orderNumber: 1 })
  add('BurialSites', { burialSiteTypeId: 1, burialSiteName: 'SYN-FIN-01', burialSiteNameSegment1: 'SYN-FIN-01', burialSiteNameSegment2: '', burialSiteNameSegment3: '', burialSiteNameSegment4: '', burialSiteNameSegment5: '' })
  add('Contracts', { contractTypeId: 1, burialSiteId: 1, contractNumber: 'SYN-FIN-1', purchaserName: 'Synthetic purchaser', contractStartDate: 20261020 })
  add('Contracts', { contractTypeId: 2, contractNumber: 'SYN-FIN-2', purchaserName: 'Synthetic other purchaser', contractStartDate: 20261020 })
  add('FeeCategories', { feeCategory: 'Synthetic individual', isGroupedFee: 0, orderNumber: 0 })
  add('FeeCategories', { feeCategory: 'Synthetic grouped', isGroupedFee: 1, orderNumber: 1 })
  const fees = [
    { feeName: 'Synthetic percentage', feeAmount: 10.005, taxPercentage: 13, includeQuantity: 1, quantityUnit: 'units' },
    { feeName: 'Synthetic manual', feeAmount: null, taxAmount: 1.255, includeQuantity: 1 },
    { feeName: 'Synthetic function', feeAmount: 999, feeFunction: 'contract.area * 12', taxAmount: 2.675 },
    { feeName: 'Synthetic other type', feeAmount: 5, contractTypeId: 2 },
    { feeName: 'Synthetic other grave', feeAmount: 6, burialSiteTypeId: 2 },
    { feeName: 'Synthetic deleted fee', feeAmount: 7, recordDelete_timeMillis: 1 },
    { feeName: 'Synthetic group matching', feeAmount: 3.335, taxPercentage: 0, taxAmount: 0.005, feeCategoryId: 2, contractTypeId: 1, burialSiteTypeId: 1 },
    { feeName: 'Synthetic group other', feeAmount: 20, feeCategoryId: 2, contractTypeId: 2, burialSiteTypeId: 2 },
  ]
  fees.forEach((values, index) => add('Fees', { feeCategoryId: 1, orderNumber: index, ...values }))
}
setup(true)
function clean(value) {
  if (Array.isArray(value)) return value.map(clean)
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith('record')).map(([key, item]) => [key, clean(item)]))
  return value
}
function raw(table) {
  const key = table === 'ContractFees' ? 'feeId' : 'transactionIndex'
  return database.prepare(`SELECT * FROM ${table} ORDER BY contractId,${key}`).all().map(row => ({ ...clean(row), deleted: row.recordDelete_timeMillis !== null }))
}
function audit() {
  return database.prepare('SELECT * FROM AuditLog ORDER BY rowid').all().map(row => ({ ...Object.fromEntries(['mainRecordType', 'mainRecordId', 'updateTable', 'recordIndex', 'updateField', 'updateType', 'updateUsername'].map(key => [key, row[key]])),
    fromValue: row.fromValue === null ? null : clean(JSON.parse(row.fromValue)), toValue: row.toValue === null ? null : clean(JSON.parse(row.toValue)) }))
}
const calculations = []
for (const fee of [{}, { feeAmount: null, taxAmount: null }, { feeAmount: 0, taxAmount: 0 },
  { feeAmount: 10.005, taxPercentage: 13, taxAmount: 5 }, { feeAmount: 1.005, taxPercentage: 0, taxAmount: 2.675 },
  { feeAmount: -10.005, taxPercentage: -5, taxAmount: 99 }, { feeAmount: 999, feeFunction: 'contract.amount * 2', taxPercentage: 13 },
  { feeAmount: 999, feeFunction: 'unknown function', taxAmount: 2.675 }, { feeAmount: 2.675, feeFunction: '', taxAmount: 0.005 }]) {
  const amount = helpers.calculateFeeAmount(fee, { amount: 42 })
  calculations.push({ fee, contract: { amount: 42 }, feeAmount: amount, taxAmount: helpers.calculateTaxAmount(fee, amount) })
}
const sharedHelpers = []
for (const contract of [{}, { contractFees: null, contractTransactions: null, contractFields: null }, {
  contractFees: [{ feeCategory: 'Synthetic PERPETUAL Care', feeAmount: 1 }, { feeCategory: 'Perpetual', feeAmount: 2 }, { feeCategory: 'other', feeAmount: 3 }],
  contractTransactions: [{ transactionAmount: 0.1 }, { transactionAmount: 0.2 }, { transactionAmount: -0.05 }],
  contractFields: [{ contractTypeField: 'Synthetic FIELD', fieldValue: '' }, { contractTypeField: 'Synthetic field', fieldValue: 'second' }],
}]) {
  sharedHelpers.push({ contract, feeCategory: 'pErPeTuAl', contractTypeField: 'synthetic field', expected: {
    exact: helpers.getFeesByFeeCategory(contract, 'pErPeTuAl'), contains: helpers.getFeesByFeeCategory(contract, 'pErPeTuAl', true),
    field: helpers.getFieldValueByContractTypeField(contract, 'synthetic field') ?? null, transactionTotal: helpers.getTransactionTotal(contract),
  } })
}
const feeDefaults = []
for (const form of [{ contractId: 1, feeId: 1, quantity: '1.5' }, { contractId: 1, feeId: 2, quantity: 1 },
  { contractId: 1, feeId: 3, quantity: 1 }, { contractId: 1, feeId: 1, quantity: '2', feeAmount: '12.345', taxAmount: '1.005' },
  { contractId: 1, feeId: 1, quantity: 2, feeAmount: 12.345, taxAmount: 1.005 },
  { contractId: 1, feeId: 1, quantity: '0', feeAmount: '0', taxAmount: '' },
  { contractId: 1, feeId: 1, quantity: '-1.25', feeAmount: '2.675', taxAmount: '-0.005' },
  { contractId: 1, feeId: 4, quantity: 1 }, { contractId: 1, feeId: 5, quantity: 1 }]) {
  setup()
  const result = await helpers.addContractFee(form, actor, shared)
  feeDefaults.push({ form, result, rows: raw('ContractFees'), retrieved: helpers.getContractFees(1, shared), audit: audit() })
}
setup()
const feeLifecycle = []
const feeActions = [
  { action: 'add', form: { contractId: 1, feeId: 1, quantity: '2' } },
  { action: 'add', form: { contractId: 1, feeId: 1, quantity: '0.5' } },
  { action: 'add', form: { contractId: 1, feeId: 1, quantity: '3', feeAmount: '20.125', taxAmount: '2.675' } },
  { action: 'quantity', form: { contractId: 1, feeId: 1, quantity: '1.25' } },
  { action: 'delete', form: { contractId: 1, feeId: 1 } },
  { action: 'delete', form: { contractId: 1, feeId: 1 } },
  { action: 'quantity', form: { contractId: 1, feeId: 1, quantity: '10' } },
  { action: 'add', form: { contractId: 1, feeId: 1, quantity: '1' } },
  { action: 'delete', form: { contractId: 2, feeId: 1 } },
  { action: 'quantity', form: { contractId: 1, feeId: 999, quantity: '3' } },
]
for (const { action, form } of feeActions) {
  const result = action === 'add' ? await helpers.addContractFee(form, actor, shared)
    : action === 'quantity' ? helpers.updateContractFeeQuantity(form, editor, shared)
      : helpers.deleteContractFee(form.contractId, form.feeId, editor, shared)
  feeLifecycle.push({ action, form, result, rows: raw('ContractFees'), retrieved: helpers.getContractFees(1, shared), audit: audit() })
}
const categories = []
for (const contractId of [1, 2]) {
  setup()
  const contract = await helpers.getContract(contractId, shared)
  categories.push({ contractId, expected: helpers.getFeeCategories({ contractTypeId: contract.contractTypeId, burialSiteTypeId: contract.burialSiteTypeId }, { includeFees: true }, shared) })
}
setup()
const categoryAdds = []
for (const feeCategoryId of [2, 2, 999]) {
  const form = { contractId: 1, feeCategoryId }
  const result = await helpers.addContractFeeCategory(form, actor, shared)
  categoryAdds.push({ form, result, rows: raw('ContractFees'), retrieved: helpers.getContractFees(1, shared), audit: audit() })
}
setup()
await helpers.addContractFee({ contractId: 1, feeId: 1, quantity: 2 }, actor, shared)
const beforeCatalogChange = raw('ContractFees')
database.prepare('UPDATE Fees SET feeAmount=20.125,taxPercentage=5 WHERE feeId=1').run()
const afterCatalogChange = raw('ContractFees')
await helpers.addContractFee({ contractId: 1, feeId: 1, quantity: 1 }, editor, shared)
const catalogChange = { before: beforeCatalogChange, after: afterCatalogChange, readded: raw('ContractFees'), audit: audit() }
const fullTransaction = { contractId: 1, transactionDateString: '2026-10-19', transactionTimeString: '14:35', transactionAmount: '12.345', isInvoiced: '1', externalReceiptNumber: 'SYN-REC-1', transactionNote: 'Synthetic note\nSecond line <literal>' }
const transactionDefaults = []
for (const overrides of [{}, { transactionDateString: '', transactionTimeString: '', isInvoiced: null },
  { transactionAmount: '-2.675', isInvoiced: '0', externalReceiptNumber: '', transactionNote: '' },
  { transactionAmount: 0.005, isInvoiced: 1, transactionTimeString: '00:00' },
  { transactionAmount: '0', isInvoiced: 0, transactionTimeString: '23:59' },
  { transactionDateString: '2026-02-31', transactionTimeString: '99:99', isInvoiced: '1' }]) {
  setup()
  const form = { ...fullTransaction, ...overrides }
  const result = helpers.addContractTransaction(form, actor, shared)
  transactionDefaults.push({ form, result, rows: raw('ContractTransactions'), retrieved: await helpers.getContractTransactions(1, { includeIntegrations: true }, shared), audit: audit() })
}
const storageBoundaries = []
for (const [table, overrides] of [['ContractFees', { quantity: '' }], ['ContractFees', { quantity: 'not numeric' }],
  ['ContractTransactions', { transactionAmount: '' }], ['ContractTransactions', { transactionAmount: 'not numeric' }],
  ['ContractTransactions', { isInvoiced: '2' }], ['ContractTransactions', { isInvoiced: 'false' }]]) {
  setup()
  const form = table === 'ContractFees' ? { contractId: 1, feeId: 1, quantity: 1, ...overrides } : { ...fullTransaction, ...overrides }
  const result = table === 'ContractFees' ? await helpers.addContractFee(form, actor, shared) : helpers.addContractTransaction(form, actor, shared)
  storageBoundaries.push({ table, form, result, rows: raw(table) })
}
setup()
const transactionLifecycle = []
const transactionActions = [
  { action: 'add', form: fullTransaction },
  { action: 'update', form: { ...fullTransaction, transactionIndex: 0, transactionAmount: '-2.675', isInvoiced: '0', externalReceiptNumber: '', transactionNote: 'Changed' } },
  { action: 'delete', form: { contractId: 1, transactionIndex: 0 } },
  { action: 'delete', form: { contractId: 1, transactionIndex: 0 } },
  { action: 'update', form: { ...fullTransaction, transactionIndex: 0 } },
  { action: 'add', form: { ...fullTransaction, transactionDateString: '2026-10-18', transactionTimeString: '10:30' } },
  { action: 'add', form: { ...fullTransaction, transactionDateString: '2026-10-18', transactionTimeString: '09:00', transactionAmount: '0.005' } },
  { action: 'update', form: { ...fullTransaction, transactionIndex: 999 } },
  { action: 'delete', form: { contractId: 2, transactionIndex: 1 } },
  { action: 'add', form: { ...fullTransaction, contractId: 2 } },
]
for (const { action, form } of transactionActions) {
  const result = action === 'add' ? helpers.addContractTransaction(form, actor, shared)
    : action === 'update' ? helpers.updateContractTransaction(form, editor, shared)
      : helpers.deleteContractTransaction(form.contractId, form.transactionIndex, editor, shared)
  transactionLifecycle.push({ action, form, result, rows: raw('ContractTransactions'), retrieved: await helpers.getContractTransactions(1, { includeIntegrations: false }, shared), audit: audit() })
}
setup()
await helpers.addContractFee({ contractId: 1, feeId: 1, quantity: 1 }, actor, shared)
helpers.addContractTransaction(fullTransaction, actor, shared)
database.prepare('UPDATE Fees SET recordDelete_timeMillis=1 WHERE feeId=1').run()
database.prepare('UPDATE FeeCategories SET recordDelete_timeMillis=1 WHERE feeCategoryId=1').run()
const deletedCatalog = helpers.getContractFees(1, shared)
const deletedParentResult = helpers.deleteContract(1, editor, shared)
const deletionBoundaries = { deletedCatalog, deletedParentResult, fees: raw('ContractFees'), transactions: raw('ContractTransactions'), retrievedFees: helpers.getContractFees(1, shared), retrievedTransactions: await helpers.getContractTransactions(1, { includeIntegrations: false }, shared), parentMissing: (await helpers.getContract(1, shared)) === undefined }
const handlerCases = []
for (const [name, body, existing] of [
  ['doGetFees', { contractId: 1 }, false],
  ['doAddContractFee', { contractId: 1, feeId: 1, quantity: '2' }, false],
  ['doAddContractFee', { contractId: 1, feeId: 6, quantity: 1 }, false],
  ['doAddContractFeeCategory', { contractId: 1, feeCategoryId: 2 }, false],
  ['doUpdateContractFeeQuantity', { contractId: 1, feeId: 1, quantity: '2.5' }, true],
  ['doUpdateContractFeeQuantity', { contractId: 1, feeId: 1, quantity: '2' }, false],
  ['doDeleteContractFee', { contractId: 1, feeId: 1 }, true],
  ['doDeleteContractFee', { contractId: 1, feeId: 1 }, false],
  ['doAddContractTransaction', fullTransaction, false],
  ['doUpdateContractTransaction', { ...fullTransaction, transactionIndex: 0, transactionAmount: '5.005' }, true],
  ['doUpdateContractTransaction', { ...fullTransaction, transactionIndex: 999 }, false],
  ['doDeleteContractTransaction', { contractId: 1, transactionIndex: 0 }, true],
  ['doDeleteContractTransaction', { contractId: 1, transactionIndex: 0 }, false],
]) {
  setup()
  if (existing) {
    if (name.includes('Transaction')) helpers.addContractTransaction(fullTransaction, actor, shared)
    else await helpers.addContractFee({ contractId: 1, feeId: 1, quantity: 1 }, actor, shared)
  }
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } }
  await handlers[name]({ body, session: { user: editor } }, response)
  handlerCases.push({ handler: name, body, existing, expected: { status: response.statusCode, body: response.body }, connectionCloses })
}
// Execute the actual renderer bodies on minimal DOM/event objects. DOM storage
// preserves original row markup, labels, toFixed rounding and balance decisions.
const browserSource = await source('public/javascripts/contract.editFees.js')
await source('public/javascripts/contract.editFees.ts')
const rendererCode = browserSource.slice(browserSource.indexOf('function getFeeGrandTotal()'), browserSource.indexOf('function editContractFeeQuantity('))
  + browserSource.slice(browserSource.indexOf('function renderContractFees()'), browserSource.indexOf('const addFeeButtonElement'))
  + browserSource.slice(browserSource.indexOf('function renderContractTransactions()'), browserSource.indexOf('const addTransactionButtonElement'))
class Element {
  constructor() { this.innerHTML = ''; this.textContent = ''; this.children = []; this.dataset = {}; this.selected = {} }
  querySelector(selector) { return this.selected[selector] ??= new Element() }
  addEventListener() {}
  append(element) { this.children.push(element) }
  insertAdjacentHTML(_, html) { this.warning = html }
}
const browserCases = []
for (const [fees, transactions] of [
  [[], []], [[{ feeAmount: 1.005, taxAmount: 0, quantity: 1 }], [{ transactionAmount: 1 }]],
  [[{ feeAmount: 2.675, taxAmount: 0.005, quantity: 1.5 }], [{ transactionAmount: 4.02, isInvoiced: 1 }]],
  [[{ feeAmount: 10.005, taxAmount: 1.3006500000000003, quantity: 2 }], [{ transactionAmount: 1 }]],
  [[{ feeAmount: null, taxAmount: null, quantity: null }], [{ transactionAmount: 0 }]],
  [[{ feeAmount: 0.1, taxAmount: 0.2, quantity: 1 }, { feeAmount: 0.1, taxAmount: 0.2, quantity: 1 }], [{ transactionAmount: 0.6 }]],
  [[{ feeAmount: 5, taxAmount: 0, quantity: 1 }], [{ transactionAmount: 6, isInvoiced: 1 }]],
  [[{ feeAmount: 5, taxAmount: 0, quantity: 1 }], [{ transactionAmount: 5, isInvoiced: 0 }]],
  [[{ feeAmount: -2.675, taxAmount: -0.005, quantity: 1 }], [{ transactionAmount: -2.67 }]],
]) {
  const contractFees = fees.map((fee, index) => ({ feeId: index + 1, feeName: 'Synthetic fee', feeCategory: 'Synthetic category', includeQuantity: 1, ...fee }))
  const contractTransactions = transactions.map((transaction, index) => ({ transactionIndex: index, externalReceiptNumber: '', transactionDateString: '2026-10-20', transactionTimeString: '09:05', ...transaction }))
  const feesContainer = new Element(); const transactionsContainer = new Element()
  const result = new Function('contractFees', 'contractTransactions', 'contractFeesContainerElement', 'contractTransactionsContainerElement', 'document', 'cityssm', 'sunrise',
    'editContractFeeQuantity', 'deleteContractFee', 'editContractTransaction', 'deleteContractTransaction', rendererCode + '\nrenderContractFees(); return getFeeGrandTotal();')(
    contractFees, contractTransactions, feesContainer, transactionsContainer, { createElement: () => new Element() }, { escapeHTML: value => String(value ?? '') }, { escapedAliases: { ExternalReceiptNumber: 'Receipt number' }, dynamicsGPIntegrationIsEnabled: false }, () => {}, () => {}, () => {}, () => {})
  browserCases.push({ fees: contractFees, transactions: contractTransactions, expected: { feeGrandTotal: result,
    feeTotals: Object.fromEntries(Object.entries(feesContainer.selected).filter(([key]) => key.startsWith('#')).map(([key, element]) => [key, element.textContent])),
    transactionTotal: transactionsContainer.selected['#contractTransactions--grandTotal']?.textContent ?? null,
    warning: transactionsContainer.warning?.includes('Overpayment') ? 'Overpayment' : transactionsContainer.warning?.includes('Outstanding Balance') ? 'Outstanding Balance' : null,
    warningAmount: transactionsContainer.warning?.match(/\$([\d.]+)/)?.[1] ?? null,
    rowTotals: feesContainer.selected.tbody?.children.map(row => [...row.innerHTML.matchAll(/\$([\d.-]+)/g)].map(match => match[1])) ?? [],
    invoiced: transactionsContainer.selected.tbody?.children.map(row => row.innerHTML.includes('Invoiced')) ?? [],
  } })
}
database.close()
const result = JSON.parse(JSON.stringify({ reference_commit: commit, source_sha256: hashes, packages, today: 20261020, fixed_local_time: '09:05:42',
  oracle_boundaries: ['Original schema, fee/transaction functions, eight handlers, fee/tax helpers, actual getContract SELECT, audit writer/differences and locked dependencies execute unchanged; import/export declarations alone are removed.', 'getContract unrelated child functions return empty lists. Original contract SELECT, fee/transaction child functions and date derivation run. calculateFeeAmount never inspects its contract argument.', 'Connection access/close uses a shared in-memory SOURCE boundary; handler close calls are counted. Debug is a no-op. Dynamics GP is disabled: its later integration remains step 14.', 'Original browser renderers run on minimal DOM/event objects; escapeHTML is a string boundary for numeric synthetic inputs. Row markup, toFixed rounding, totals, invoice labels and balance decisions execute unchanged.', 'Audit values omit record* properties in full snapshots; scalar recordUpdate_username differences remain. Audit clock fields are omitted.'],
  seed, calculations, sharedHelpers, feeDefaults, feeLifecycle, categories, categoryAdds, catalogChange, fullTransaction, transactionDefaults, storageBoundaries, transactionLifecycle, deletionBoundaries, handlers: handlerCases, browserCases }))
const fixture = path.join(root, 'backend/tests/fixtures/contract-finance-reference.json')
if (process.argv.includes('--write-fixture')) await fs.writeFile(fixture, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await fs.readFile(fixture, 'utf8')), result)
await fs.writeFile(path.join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: original Sunrise ${calculations.length} fee/tax and ${sharedHelpers.length} shared helper cases, ${feeDefaults.length} fee defaults, ${feeLifecycle.length} fee stages, ${categoryAdds.length} group stages, ${transactionDefaults.length} transaction defaults, ${transactionLifecycle.length} transaction stages, ${storageBoundaries.length} SQL storage boundaries, ${handlerCases.length} handlers and ${browserCases.length} original render cases; locked packages, audit, catalog and parent deletion boundaries`)
