/**
 * Read-only semantic probe of the pinned Sunrise reference. Node 24+.
 * Executes copied/extracted source only under Cemaris/.local, never installs or
 * writes in Sunrise. SQLite here measures the SOURCE, not the SQL Server target.
 * Regenerate the synthetic committed contract:
 *   node scripts/reference_semantics.mjs --write-fixture
 * Verify committed expectations: node scripts/reference_semantics.mjs --check-fixture
 * Otherwise output is written only to .local/reference-semantics/result.json.
 * Original Sunrise CMS source is MIT: licenses/Sunrise-LICENSE.md.
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const reference = path.resolve(root, '../Sunrise-Referenz')
const expectedCommit = '451ce034863b16502484367044f3e9b65370111a'
const commit = execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
assert.equal(commit, expectedCommit, 'Sunrise reference must remain pinned')
const local = path.join(root, '.local/reference-semantics')
await fs.mkdir(local, { recursive: true })
const sourceHashes = {}
async function readSource(relative) {
  const bytes = await fs.readFile(path.join(reference, relative))
  sourceHashes[relative] = createHash('sha256').update(bytes).digest('hex')
  return bytes.toString('utf8')
}
const partialSource = await readSource('helpers/partialDate.helpers.js')
await fs.writeFile(path.join(local, 'partialDate.helpers.mjs'), partialSource)
const partial = await import(pathToFileURL(path.join(local, 'partialDate.helpers.mjs')))
const databaseSource = await readSource('helpers/database.helpers.js')
const limitDefault = databaseSource.match(/const LIMIT_DEFAULT = \d+;/)?.[0]
const sanitizeSource = databaseSource.slice(databaseSource.indexOf('export function sanitizeLimit'), databaseSource.indexOf('export async function getLastBackupDate'))
assert.ok(limitDefault && sanitizeSource.includes('sanitizeOffset'))
await fs.writeFile(path.join(local, 'sanitize.mjs'), `${limitDefault}\n${sanitizeSource}`)
const sanitize = await import(pathToFileURL(path.join(local, 'sanitize.mjs')))
const filterSource = await readSource('helpers/functions.sqlFilters.js')
const today = 20261019
// Keep the complete source filter functions. Only replace their external date
// utility with a deterministic date integer for this clock-controlled probe.
await fs.writeFile(path.join(local, 'filters.mjs'), filterSource.replace(/^import .*utils-datetime.*;\r?\n/m, `const dateToInteger = () => ${today};\n`))
const filters = await import(pathToFileURL(path.join(local, 'filters.mjs')))
const database = new DatabaseSync(':memory:')
database.exec(`
  CREATE TABLE Names (nameId INTEGER PRIMARY KEY, burialSiteName TEXT, purchaserName TEXT, deceasedName TEXT);
  CREATE TABLE Contracts (contractId INTEGER PRIMARY KEY, contractStartDate INTEGER, contractEndDate INTEGER);
  CREATE TABLE NumericValues (quantity DECIMAL(4,1), feeAmount DECIMAL(8,2), deathAge INTEGER, fieldValue TEXT);
`)
const names = [
  'AbC Jones', 'ABC', 'Änne Müller', 'änne müller', 'Élodie', 'élodie',
  'Plot %_[]! End', 'Plot 12 End', 'ABC ', 'ABC\n', '', null,
  'A\tB', 'A  B', 'Straße', 'STRASSE', '🪦 ABC', 'ABC 🪦', 'İ', 'i\u0307',
  'ABC\u0001', 'ABC\u0001 ', 'ABC\u0001X', 'é', 'e\u0301', 'A\u00adBC', 'AＢC',
]
for (const [index, value] of names.entries()) {
  database.prepare('INSERT INTO Names VALUES (?, ?, ?, ?)').run(index + 1, value, value, value)
}
const searches = [
  ['', ''], ['ABC', ''], ['  ABC abc   JONES ', ''], ['Änne', ''],
  ['änne', ''], ['É', ''], ['STRASSE', ''], ['Straße', ''], ['%_[]!', ''],
  ['A\tB', ''], ['A B', ''], ['ABC', 'startsWith'], ['ABC', 'endsWith'],
  ['ABC ', 'endsWith'], ['ABC\n', 'endsWith'], ['Plot %', 'startsWith'],
  ['Plot _', 'startsWith'], ['Plot [', 'startsWith'], ['%_[]!', 'endsWith'],
  ['🪦', 'startsWith'], ['_ ABC', 'startsWith'], ['ABC _', 'endsWith'],
  ['İ', ''], ['İ', 'startsWith'], ['i\u0307', ''],
  ['ABC\u0001', 'endsWith'], ['\u0001', 'endsWith'], ['ABC\u0001 ', 'endsWith'],
  ['A_', 'startsWith'], ['é', 'startsWith'], ['e\u0301', 'startsWith'],
  ['A\u00adBC', 'startsWith'],
]
const searchResults = searches.map(([query, searchType]) => {
  const site = filters.getBurialSiteNameWhereClause(query, searchType, 'n')
  const purchaser = filters.getPurchaserNameWhereClause(query, 'n')
  const deceased = filters.getDeceasedNameWhereClause(query, 'n')
  const run = (filter) => database.prepare(`SELECT nameId FROM Names n WHERE 1=1 ${filter.sqlWhereClause} ORDER BY nameId`).all(...filter.sqlParameters).map(row => row.nameId)
  return { query, searchType, parameters: site.sqlParameters, site: run(site), purchaser: run(purchaser), deceased: run(deceased) }
})
const contracts = [
  [1, today, null], [2, today, today], [3, 20261018, 20261018],
  [4, 20261020, null], [5, 20261018, 20261020], [6, null, null],
  [7, 20261020, 20261018], [8, 20261018, null],
]
for (const row of contracts) database.prepare('INSERT INTO Contracts VALUES (?, ?, ?)').run(...row)
const contractResults = ['', 'current', 'future', 'past', 'unknown', null].map(contractTime => {
  const filter = filters.getContractTimeWhereClause(contractTime, 'c')
  return { contractTime, ids: database.prepare(`SELECT contractId FROM Contracts c WHERE 1=1 ${filter.sqlWhereClause} ORDER BY contractId`).all(...filter.sqlParameters).map(row => row.contractId) }
})
const numericInputs = ['', ' ', '\ufeff42\u00a0', '0', '0x10', '0b11', '0o10', '1e2', '1_000', '1.9', '-1.9', 'bad', 'inf', 'Infinity', '-Infinity', '٤', null, 0, 1.75, 9007199254740993]
const dateParts = [
  ['', '', ''], ['bad', 1, 1], [-1, 1, 1], [0, 1, 1], [1901, '', ''],
  [1901, 3, ''], [1901, 3, 15], [1901, 0, 15], [2024, 2, 31],
  ['2024', -1, -2], [2024, 99, 99], [2024, 'bad', 'bad'], ['0x7e8', '0x2', '0x1d'],
  [2000.5, 1, 2], [2000, 1.5, 2.5], [2024, 'Infinity', '-Infinity'],
  ['Infinity', 1, 1], [null, null, null],
]
const partialDates = [null, 0, -1, 19010000, 19010300, 19010315, 19010015, 20240231, 10101, 20000102.5, 123456789, 1e21, 1e-7, 1e-6, NaN, Infinity]
const numericRows = [
  [1.25, 12.345, null, ''], [0, 0.1 + 0.2, 0, null],
  [-0.125, -12.345, '', 'zero'], ['1.5', '42.125', '20', 'Änne 🪦'],
  [12345.625, 1234567890.125, 20.5, 'beyond declared precision'],
]
for (const row of numericRows) database.prepare('INSERT INTO NumericValues VALUES (?, ?, ?, ?)').run(...row)
function encode(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) return { $number: String(value) }
  if (value === undefined) return null
  if (Array.isArray(value)) return value.map(encode)
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)]))
  return value
}
const result = encode({
  referenceCommit: commit, sourceHashes, today,
  numeric: numericInputs.map(input => ({ input, number: Number(input), limit: sanitize.sanitizeLimit(input), offset: sanitize.sanitizeOffset(input) })),
  dateParts: dateParts.map(parts => ({ parts, integer: partial.datePartsToInteger(...parts) })),
  partialDates: partialDates.map(input => ({ input, string: partial.partialDateIntegerToString(input), year: partial.partialDateIntegerToYear(input), month: partial.partialDateIntegerToMonth(input), day: partial.partialDateIntegerToDay(input) })),
  names, searches: searchResults, contracts, contractResults, numericRows,
  numericStorage: database.prepare('SELECT *, typeof(quantity) AS quantityType, typeof(feeAmount) AS feeAmountType, typeof(deathAge) AS deathAgeType FROM NumericValues').all(),
})
database.close()
const serialized = JSON.stringify(result, null, 2) + '\n'
await fs.writeFile(path.join(local, 'result.json'), serialized)
if (process.argv.includes('--write-fixture')) {
  const fixture = path.join(root, 'backend/tests/fixtures/semantics-reference.json')
  await fs.mkdir(path.dirname(fixture), { recursive: true })
  await fs.writeFile(fixture, serialized)
}
if (process.argv.includes('--check-fixture')) {
  const fixture = await fs.readFile(path.join(root, 'backend/tests/fixtures/semantics-reference.json'), 'utf8')
  assert.deepEqual(JSON.parse(fixture), result, 'Committed expectations differ from the executed reference')
}
console.log(`PASS: source ${commit}, ${result.numeric.length} number, ${result.dateParts.length} date-parts, ${result.partialDates.length} partial-date, ${result.searches.length} search, ${result.contractResults.length} contract-time probes; local result ${path.relative(root, path.join(local, 'result.json'))}`)
