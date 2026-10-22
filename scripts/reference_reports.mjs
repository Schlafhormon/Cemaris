// Immutable Sunrise report SQL, actual handlers, and locked Papa Parse CSV.
// SQLite is exclusively the source oracle; target evidence uses SQL Server.
// Source copyright/MIT: licenses/Sunrise-LICENSE.md.
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
const work = path.join(root, '.local/reference-reports')
await fs.mkdir(work, { recursive: true })
const hashes = {}
async function source(name) {
  const raw = await fs.readFile(path.join(reference, name), 'utf8')
  hashes[name] = createHash('sha256').update(raw).digest('hex')
  return raw
}
const lock = JSON.parse(await source('package-lock.json'))
const packages = []
for (const name of ['@cityssm/utils-datetime', 'papaparse']) {
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
const { default: papaParse } = await import(pathToFileURL(path.join(work, 'node_modules/papaparse/papaparse.js')).href)
process.env.TZ = 'Europe/Berlin'
const RealDate = Date
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [2026, 9, 20, 9, 5, 42])) }
  static now() { return new RealDate(2026, 9, 20, 9, 5, 42).getTime() }
}
const schema = await source('database/initializeDatabase.js')
await source('database/initializeDatabase.ts')
const statements = new Function(schema.slice(schema.indexOf('const recordColumns'), schema.indexOf('const initializingUser')) + '\nreturn sqlCreateStatements;')()
const database = new DatabaseSync(':memory:')
for (const sql of statements) database.exec(sql)
let closes = 0
const shared = { prepare: (...args) => database.prepare(...args), function: (...args) => database.function(...args), close() { closes++ } }
const helpers = { ...Object.fromEntries(Object.entries(datetime).filter(([key]) => key !== 'default')), Date: Clock, getDatabaseConnection: () => shared, papaParse }
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
async function load(file, names) {
  await source(file.replace(/\.js$/, '.ts'))
  const raw = (await source(file)).replace(/^import .*;\r?$/gm, '').replaceAll('export default function', 'function').replaceAll('export const', 'const')
  return new AsyncFunction(...Object.keys(helpers), raw + `\nreturn {${names.join(',')}};`)(...Object.values(helpers))
}
Object.assign(helpers, await load('helpers/reports.helpers.js', ['simpleReports']))
Object.assign(helpers, await load('database/getReportData.js', ['getReportData']))
const { handler } = await load('handlers/reportsGet/reportName.js', ['handler'])
const reportTables = new Set([...helpers.simpleReports.values()].map(sql => /FROM\s+(\w+)/i.exec(sql)[1]))
reportTables.add('WorkOrderStatuses')
const tables = database.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row => row.name).filter(name => reportTables.has(name))
const seed = []
function insert(table, values) {
  database.prepare(`INSERT INTO ${table} (${Object.keys(values).join(',')}) VALUES (${Object.keys(values).map(() => '?').join(',')})`).run(...Object.values(values))
  seed.push({ table, values })
}
// Two connected rows per table: one active, one soft-deleted. All required
// columns are filled using actual SQLite metadata/defaults. Explicit IDs make
// every source/target value comparable without hiding relational differences.
for (const table of tables) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all()
  for (const id of [1, 2]) {
    const values = {}
    for (const column of columns) {
      const key = column.name
      let value = null
      if (column.notnull || column.pk) {
        if (column.dflt_value !== null) value = database.prepare(`SELECT ${column.dflt_value} AS value`).get().value
        else if (/INT|DECIMAL|BIT/i.test(column.type)) value = id
        else {
          const length = Number(/\((\d+)\)/.exec(column.type)?.[1] ?? 100)
          value = `SYN${id}-${key}`.slice(0, length)
        }
      }
      if (column.pk && /INT/i.test(column.type)) value = id
      if (/record(?:Create|Update)_username/.test(key)) value = 'synthetic-reports'
      if (/record(?:Create|Update)_timeMillis/.test(key)) value = 1792487142000
      if (key === 'recordDelete_timeMillis') value = id === 2 ? 1792487142001 : null
      if (key === 'recordDelete_username') value = id === 2 ? 'synthetic-reports' : null
      // Preserve intended relations explicitly; both databases enforce their
      // declared FK model. All referenced parent rows are part of the seed.
      if (['burialSiteTypeId', 'burialSiteStatusId', 'burialSiteTypeFieldId', 'cemeteryId', 'contractId', 'contractIdA', 'contractIdB',
        'contractTypeId', 'contractTypeFieldId', 'serviceTypeId', 'feeCategoryId', 'feeId', 'funeralHomeId', 'committalTypeId',
        'intermentContainerTypeId', 'intermentDepthId', 'workOrderId', 'workOrderTypeId', 'workOrderStatusId', 'workOrderMilestoneTypeId',
        'burialSiteId'].includes(key)) value = id
      if (['contractStartDate', 'workOrderOpenDate', 'transactionDate'].includes(key)) value = 20261019
      if (key === 'isPreneed') value = id === 2 ? 1 : 0
      if (key === 'isCremated') value = 1
      if (key === 'isInvoiced') value = id === 2 ? 1 : 0
      if (key === 'workOrderMilestoneCompletionDate') value = id === 2 ? 20261020 : null
      if (key === 'cemeteryName') value = id === 1 ? ' Synthetic, "Cemetery" Ü\nNorth ' : 'Deleted cemetery'
      if (key === 'deceasedName') value = id === 1 ? 'Synthetic, "Person" Ü\nName' : 'Deleted person'
      if (key === 'deathDate') value = id === 1 ? 20261000 : null
      if (key === 'birthDate') value = 19350000
      if (key === 'deathAgePeriod') value = ''
      if (key === 'transactionAmount') value = id === 1 ? 123.45000000000002 : -0.0000001
      if (key === 'transactionNote') value = '=SUM(A1:A2)'
      if (key === 'orderFormId') value = id
      values[key] = value
    }
    if (table === 'RelatedContracts') values.contractIdB = id + 1
    insert(table, values)
  }
}
function extra(table, id, overrides = {}) {
  const original = seed.find(row => row.table === table).values
  const values = { ...original, ...overrides }
  const columns = database.prepare(`PRAGMA table_info(${table})`).all()
  const keys = columns.filter(column => column.pk && /INT/i.test(column.type))
  if (keys.length === 1) values[keys[0].name] = id
  else if (table === 'ContractInterments') values.intermentNumber = id
  insert(table, values)
}
// Date boundaries: future-start contracts are current in one report but not
// the directory; contracts ending today are excluded only by the directory.
for (const [id, start, end, type, deleted, site] of [
  [3, 20261021, null, 1, null, 1], [4, 20200101, 20261020, 1, null, 1],
  [5, 20200101, 20261019, 1, null, 1], [6, 20200101, null, 2, null, 1],
  [7, 20200101, null, 1, 1792487142001, 1], [8, 20200101, null, 1, null, null],
  [9, 20200101, null, 1, null, 2], [10, 20200101, null, 1, null, 1],
]) {
  extra('Contracts', id, { contractNumber: `SYN-C-${id}`, contractStartDate: start, contractEndDate: end,
    contractTypeId: type, recordDelete_timeMillis: deleted, burialSiteId: site })
  extra('ContractInterments', id, { contractId: id, deceasedName: id === 10 ? 'Synthetic, "Person" Ü\nName' : `Synthetic person ${id}`, deathDate: id === 10 ? 20260900 : 20261000 })
}
extra('ContractInterments', 11, { contractId: 1, intermentNumber: 11, deceasedName: 'Deleted child', recordDelete_timeMillis: 1 })
extra('WorkOrders', 3, { workOrderNumber: 'SYN-EMPTY', workOrderDescription: '', workOrderCloseDate: null })
extra('WorkOrders', 4, { workOrderNumber: 'SYN-CLOSED', workOrderCloseDate: 20261020 })
extra('WorkOrderMilestones', 3, { workOrderId: 1, workOrderMilestoneCompletionDate: null, workOrderMilestoneCompletionTime: 0 })
extra('WorkOrderMilestones', 4, { workOrderId: 1, workOrderMilestoneCompletionDate: 20261020, workOrderMilestoneCompletionTime: 0 })
extra('WorkOrderMilestones', 5, { workOrderId: 1, workOrderMilestoneCompletionDate: 20261020, recordDelete_timeMillis: 1 })
extra('Cemeteries', 3, { cemeteryName: 'AAA first', cemeteryKey: 'SYN-C3' })
extra('Cemeteries', 4, { cemeteryName: 'zzz last', cemeteryKey: 'SYN-C4' })
const sortNames = ['', '\u0000', 'A', 'A ', 'A  ', 'a', 'Á', 'ä', '\uE000', '😀', '\u{10000}']
for (const [index, name] of sortNames.entries()) {
  extra('Cemeteries', index + 5, { cemeteryName: name, cemeteryKey: `SYN-SORT-${index}` })
  for (const [offset, deathDate] of [null, 20261000].entries()) {
    extra('ContractInterments', 12 + index * 2 + offset, { contractId: 1, deceasedName: name, deathDate })
  }
}
// Actual lookup page handler and browser helper are recorded as provenance;
// the React/browser behavior is covered by the step 12 production-browser QA.
await source('views/report-search.ejs')
await source('public/javascripts/report.search.js')
await source('public/javascripts/report.search.ts')
await source('routes/reports.ts')
await source('routes/reports.js')
await source('app/app.ts')
helpers.getCachedBurialSiteStatuses = () => database.prepare('SELECT * FROM BurialSiteStatuses WHERE recordDelete_timeMillis IS NULL ORDER BY orderNumber, burialSiteStatus').all()
helpers.getCachedBurialSiteTypes = () => database.prepare('SELECT * FROM BurialSiteTypes WHERE recordDelete_timeMillis IS NULL ORDER BY orderNumber, burialSiteType').all()
helpers.getCachedCemeteries = () => database.prepare('SELECT * FROM Cemeteries WHERE recordDelete_timeMillis IS NULL ORDER BY cemeteryName').all()
helpers.i18next = { t: (key, options) => `${options.lng}:${key}` }
const { handler: search } = await load('handlers/reportsGet/search.js', ['handler'])
const searchCases = []
for (const tab of [undefined, 'contracts', 'workOrders', 'cemeteries', 'dataTableExports', 'configTableExports', 'unknown']) {
  let result
  search({ query: tab === undefined ? {} : { tab } }, { locals: { lng: 'de' }, render(view, data) { result = { view, ...data } } })
  searchCases.push({ query: tab === undefined ? {} : { tab }, result })
}
const parameterNames = {
  'burialSites-byBurialSiteStatusId': 'burialSiteStatusId', 'burialSites-byBurialSiteTypeId': 'burialSiteTypeId',
  'burialSites-byCemeteryId': 'cemeteryId', 'contractInterments-byContractId': 'contractId', 'contractInterments-directory': null,
  'contracts-current-byCemeteryId': 'cemeteryId', 'contractTransactions-byTransactionDateString': 'transactionDateString',
  'workOrderMilestones-byWorkOrderId': 'workOrderId', 'workOrders-open': null,
}
const reportNames = [...helpers.simpleReports.keys(), ...Object.keys(parameterNames)]
assert.equal(reportNames.length, 45)
const reports = reportNames.map(reportName => {
  const key = parameterNames[reportName]
  const parameters = key ? { [key]: key === 'transactionDateString' ? '2026-10-19' : '1' } : {}
  const rows = helpers.getReportData(reportName, parameters, shared)
  assert.ok(rows.length > 0, reportName)
  return { reportName, parameters, rows, csv: papaParse.unparse(rows), explicitlySorted: ['cemeteries-formatted', 'contractInterments-directory'].includes(reportName) }
})
const parameters = []
for (const [reportName, key] of Object.entries(parameterNames).filter(([, key]) => key !== null)) {
  for (const value of key === 'transactionDateString' ? ['2026-10-19', '2026-02-31', '2026-00-00', '2026-19-39', '', 'no-date', '2026-1-1'] :
    ['1', '01', ' 1 ', '1.0', '1e0', '2', '999', '', 'garbage', '1 OR 1=1', '0x1', '1.5', '-1']) {
    const input = { [key]: value }
    try { const rows = helpers.getReportData(reportName, input, shared); parameters.push({ reportName, parameters: input, rows, csv: papaParse.unparse(rows) }) }
    catch (error) { parameters.push({ reportName, parameters: input, error: { name: error.name, message: error.message } }) }
  }
  try { helpers.getReportData(reportName, {}, shared); assert.fail('Missing parameter must fail') }
  catch (error) { parameters.push({ reportName, parameters: {}, error: { name: error.name, message: error.message } }) }
}
const csvCases = []
for (const value of [null, '', ' ', ' leading', 'trailing ', '\t', '\tindent', '\u000b', 'embedded\ufeffbom', '\ufefffirst', 'comma,value',
  'quote"value', 'line\nfeed', 'carriage\rreturn', '\r\n', 'Ü 😀 <>&', '=SUM(A1:A2)', '+123', '-123', '@command', 0, -0, 123.45,
  123.45000000000002, 1e-7, 1e21, true, false]) {
  const rows = [{ value, other: null }]
  csvCases.push({ rows, csv: papaParse.unparse(rows) })
}
for (const rows of [[], [{ a: null }], [{ a: 1, b: 2 }, { b: 3, a: 4, extra: 5 }], [{ ' spaced ': 'value' }]]) csvCases.push({ rows, csv: papaParse.unparse(rows) })
const handlerCases = []
for (const [reportName, query, body] of [['cemeteries-formatted', {}, {}], ['burialSites-byCemeteryId', { cemeteryId: '1' }, { cemeteryId: '2' }],
  ['workOrders-open', {}, {}], ['no-such-report', {}, {}], ['contracts-all', {}, {}]]) {
  const result = { status: 200, headers: {} }
  handler({ params: { reportName }, query, body }, {
    status(status) { result.status = status; return this }, json(value) { result.json = value },
    setHeader(key, value) { result.headers[key] = value }, send(value) { result.csv = value },
  })
  handlerCases.push({ reportName, query, body, result })
}
const methodCases = []
for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'TRACE']) {
  const result = { status: 200, headers: {} }
  handler({ method, params: { reportName: 'burialSites-byCemeteryId' }, query: { cemeteryId: '1' }, body: { cemeteryId: '2' } }, {
    status(status) { result.status = status; return this }, json(value) { result.json = value },
    setHeader(key, value) { result.headers[key] = value }, send(value) { result.csv = value },
  })
  methodCases.push({ method, reportName: 'burialSites-byCemeteryId', query: { cemeteryId: '1' }, body: { cemeteryId: '2' }, result })
}
const emptyCases = []
for (const table of [...tables].reverse()) database.exec(`DELETE FROM ${table}`)
for (const reportName of reportNames) {
  const key = parameterNames[reportName]
  const input = key ? { [key]: key === 'transactionDateString' ? '2026-10-19' : '1' } : {}
  const rows = helpers.getReportData(reportName, input, shared)
  assert.deepEqual(rows, [])
  assert.equal(papaParse.unparse(rows), '')
  emptyCases.push({ reportName, parameters: input, csv: '' })
}
assert.equal(helpers.getReportData('missing'), undefined)
closes = 0
helpers.getReportData('cemeteries-all')
assert.equal(closes, 1)
database.close()
const result = { commit, sourceHashes: hashes, packages, boundary: 'Original SQL/function bodies and actual locked Papa Parse; SQLite source oracle only. SQL Server target is verified by Python tests. Clock fixed to 2026-10-20, 09:05:42 local. HTTP request/response and cache dependencies injected.',
  today: 20261020, sortNames, seed, reportNames, reports, parameters, csvCases, handlerCases, methodCases, searchCases, emptyCases }
const target = path.join(root, 'backend/tests/fixtures/reports-reference.json')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(JSON.stringify(result)), JSON.parse(await fs.readFile(target, 'utf8')))
else await fs.writeFile(target, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ reports: reports.length, parameterCases: parameters.length, csvCases: csvCases.length,
  handlerCases: handlerCases.length, methodCases: methodCases.length, searchCases: searchCases.length, emptyCases: emptyCases.length, hashes: Object.keys(hashes).length, fixtureChecked: process.argv.includes('--check-fixture') }))
