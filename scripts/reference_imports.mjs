// Run immutable Sunrise import processors with injected CSV/CRUD boundaries.
// Sunrise MIT copyright: licenses/Sunrise-LICENSE.md. No reference writes.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = path.resolve(root, '../Sunrise-Referenz')
assert.equal(execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), '451ce034863b16502484367044f3e9b65370111a')
const hashes = {}
const sources = {}
for (const directory of ['cli/findAGraveMemorialExtractorImport', 'temp/legacyImportFromCsv']) {
  for (const file of (await fs.readdir(path.join(reference, directory))).sort()) {
    const name = `${directory}/${file}`
    const raw = await fs.readFile(path.join(reference, name), 'utf8')
    sources[name] = raw
    hashes[name] = createHash('sha256').update(raw).digest('hex')
  }
}
for (const name of ['database/initializeDatabase.js', 'database/getCommittalTypes.js', 'database/getIntermentContainerTypes.js',
  'database/getIntermentDepths.js', 'database/getContractTypes.js', 'database/updateRecordOrderNumber.js', 'database/addFee.js',
  'helpers/cache/contractTypes.cache.js']) {
  const raw = await fs.readFile(path.join(reference, name), 'utf8')
  sources[name] = raw
  hashes[name] = createHash('sha256').update(raw).digest('hex')
}
const lockRaw = await fs.readFile(path.join(reference, 'package-lock.json'), 'utf8')
hashes['package-lock.json'] = createHash('sha256').update(lockRaw).digest('hex')
const lock = JSON.parse(lockRaw)
const meowInfo = lock.packages['node_modules/meow']
assert.equal(meowInfo.version, '14.1.0')
assert.deepEqual(meowInfo.dependencies ?? {}, {})
const work = path.join(root, '.local/reference-imports')
await fs.mkdir(work, { recursive: true })
const archive = path.join(work, `meow-${meowInfo.version}.tgz`)
try { await fs.access(archive) } catch {
  const response = await fetch(meowInfo.resolved)
  assert.ok(response.ok, meowInfo.resolved)
  await fs.writeFile(archive, Buffer.from(await response.arrayBuffer()))
}
assert.equal(`sha512-${createHash('sha512').update(await fs.readFile(archive)).digest('base64')}`, meowInfo.integrity)
const meowDirectory = path.join(work, 'node_modules/meow')
await fs.mkdir(meowDirectory, { recursive: true })
execFileSync('tar', ['-xzf', archive, '-C', meowDirectory, '--strip-components=1'])
const meowPackage = JSON.parse(await fs.readFile(path.join(meowDirectory, 'package.json'), 'utf8'))
assert.equal(meowPackage.version, meowInfo.version)
const packages = [{ name: 'meow', version: meowInfo.version, integrity: meowInfo.integrity }]
const meowEntrypoint = typeof meowPackage.exports === 'string' ? meowPackage.exports : meowPackage.exports?.default ?? meowPackage.main
assert.equal(typeof meowEntrypoint, 'string')
const cliBody = sources['cli/findAGraveMemorialExtractorImport/cli.js']
  .replace(/^#!.*\r?$/m, '').replace(/^import .*;\r?$/gm, '')
  .split("const runFindAGraveMemorialExtractorImport = await import('./import.js');")[0]
  .replace('importMeta: import.meta', `importMeta: { url: ${JSON.stringify(pathToFileURL(path.join(reference, 'cli/findAGraveMemorialExtractorImport/cli.js')).href)} }`)
const cliProbePath = path.join(work, 'meow-probe.mjs')
await fs.writeFile(cliProbePath, `import meow from ${JSON.stringify(pathToFileURL(path.join(meowDirectory, meowEntrypoint)).href)};
process.argv = [process.execPath, ${JSON.stringify(path.join(reference, 'cli/findAGraveMemorialExtractorImport/cli.js'))}, ...process.argv.slice(2)];
let debugEnabled = false; const Debug = Object.assign(() => () => {}, { enable() { debugEnabled = true; } });
const DEBUG_ENABLE_NAMESPACES = 'synthetic:*'; const DEBUG_NAMESPACE = 'synthetic';
${cliBody}
console.log(JSON.stringify({ input: cli.input, flags: cli.flags, debugEnabled, testDatabases: process.env.TEST_DATABASES, call: [cemeteryId, pathToCsvFile] }));
`)
const cliParser = []
for (const input of [['123', './graveMemorials.csv'], ['123', './graveMemorials.csv', '--showDebug'], ['--showDebug', '123', './graveMemorials.csv'], [], ['123'], ['1', '2', '3'], ['--help']]) {
  const child = spawnSync(process.execPath, [cliProbePath, ...input], { encoding: 'utf8' })
  assert.equal(child.signal, null)
  assert.equal(child.stderr, '')
  const stdout = child.stdout.replaceAll('\r\n', '\n')
  if (stdout.trim().startsWith('{')) {
    assert.equal(child.status, 0)
    const result = JSON.parse(stdout)
    assert.equal(result.input.length, 2)
    assert.equal(result.flags.showDebug, input.includes('--showDebug'))
    assert.equal(result.debugEnabled, input.includes('--showDebug'))
    assert.equal(result.testDatabases, 'true')
    cliParser.push({ input, result })
  } else {
    assert.equal(child.status, input.includes('--help') ? 0 : 2)
    assert.ok(stdout.includes('Usage'))
    assert.ok(stdout.includes('--showDebug'))
    assert.ok(stdout.includes('findAGraveMemorialExtractorImport'))
    cliParser.push({ input, help: true, exitCode: child.status, text: stdout })
  }
}
function body(name) { return sources[`temp/legacyImportFromCsv/${name}.js`].replace(/^import .*;\r?$/gm, '').replaceAll('export ', '') }
const rawCemeteries = body('data.cemeteries')
const cemeteries = new Function(rawCemeteries + '\nreturn cemeteryKeyToCemetery')()
const funeralHomes = new Function(body('data.funeralHomes') + '\nreturn funeralHomes')()
const fields = {}
const recordTypes = sources['temp/legacyImportFromCsv/recordTypes.ts']
for (const [kind, name] of Object.entries({ master: 'MasterRecord', prepaid: 'PrepaidRecord', workOrder: 'WorkOrderRecord' })) {
  fields[kind] = [...recordTypes.match(new RegExp(`interface ${name} \{([\\s\\S]*?)\\}`))[1].matchAll(/\s+(\w+): string/g)].map(match => match[1])
}
const data = { city: 'Sault Ste. Marie', province: 'ON', cemeteries, funeralHomes, fields }
const dataPath = path.join(root, 'backend/cemaris/import_tools/legacy-data.json')
if (process.argv.includes('--write-fixture')) await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')
else assert.deepEqual(JSON.parse(await fs.readFile(dataPath, 'utf8')), data)
const utilities = new Function(body('utilities') + '\nreturn { formatDateString, formatTimeString, formatContractNumber, user }')()
const periods = new Function(body('data.deathAgePeriods') + '\nreturn getDeathAgePeriod')()
const ids = {
  availableBurialSiteStatusId: 101, reservedBurialSiteStatusId: 102, occupiedBurialSiteStatusId: 103,
  preneedContractType: { contractTypeId: 201, contractType: 'Preneed' }, atNeedContractType: { contractTypeId: 202, contractType: 'At Need' },
  intermentServiceTypeId: 401, cremationServiceTypeId: 402, entombmentServiceTypeId: 403, nicheServiceTypeId: 404, disintermentServiceTypeId: 405,
  acknowledgedWorkOrderMilestoneTypeId: 501, deathWorkOrderMilestoneTypeId: 502, funeralWorkOrderMilestoneTypeId: 503,
  cremationWorkOrderMilestoneTypeId: 504, intermentWorkOrderMilestoneTypeId: 505, intermentWorkOrderTypeId: 601, enteredWorkOrderStatusId: 701,
}
const siteTypes = { 'In-Ground Grave': 301, Columbarium: 302, Crematorium: 303, Mausoleum: 304, 'Niche Wall': 305, 'Urn Garden': 306 }
const types = new Function('getCachedBurialSiteTypesByBurialSiteType', body('data.burialSiteTypes') + '\nreturn { getBurialSiteTypeId, inGroundBurialSiteTypeId }')(
  name => ({ burialSiteTypeId: siteTypes[name] }))
function row(kind, values) { return { ...Object.fromEntries(fields[kind].map(key => [key, ''])), ...values } }
const masterBase = { CM_CEMETERY: 'TEST', CM_BLOCK: 'A', CM_RANGE1: '0', CM_RANGE2: '2', CM_LOT1: '3', CM_LOT2: '0', CM_GRAVE1: '0', CM_GRAVE2: '0', CM_PRENEED_OWNER: 'Synthetic Owner', CM_DECEASED_NAME: 'Synthetic Person', CM_ADDRESS: '1 Example St', CM_CITY: 'Test City', CM_PROV: 'ON', CM_POST1: 'A1A', CM_POST2: '1A1', CM_WORK_ORDER: ' 42 ', CM_PURCHASE_YR: '2020', CM_PURCHASE_MON: '2', CM_PURCHASE_DAY: '3', CM_DEATH_YR: '2025', CM_DEATH_MON: '4', CM_DEATH_DAY: '5', CM_INTERMENT_YR: '2025', CM_INTERMENT_MON: '4', CM_INTERMENT_DAY: '7', CM_FUNERAL_HOME: 'SYN', CM_FUNERAL_YR: '2025', CM_FUNERAL_MON: '4', CM_FUNERAL_DAY: '6', CM_COMMITTAL_TYPE: 'X', CM_CONTAINER_TYPE: 'Y', CM_DEPTH: 'Z', CM_AGE: '75', CM_PERIOD: 'YRS', CM_REMARK1: 'first, quoted', CM_REMARK2: 'second\nline' }
const prepaidBase = { CMPP_CEMETERY: 'TEST', CMPP_BLOCK: 'A', CMPP_RANGE1: '0', CMPP_RANGE2: '2', CMPP_LOT1: '3', CMPP_LOT2: '0', CMPP_GRAVE1: '0', CMPP_GRAVE2: '0', CMPP_PREPAID_FOR_NAME: 'Synthetic Person', CMPP_ARRANGED_BY_NAME: 'Synthetic Owner', CMPP_PROV: 'ONTARIO', CMPP_ORDER_NO: '42', CMPP_PURCH_YR: '2020', CMPP_PURCH_MON: '2', CMPP_PURCH_DAY: '3', CMPP_REMARK1: 'prepaid first', CMPP_REMARK2: 'prepaid second' }
for (const suffix of ['GRAV_SD', 'GRAV_DD', 'CHAP_SD', 'CHAP_DD', 'ENTOMBMENT', 'CREM', 'NICHE', 'DISINTERMENT']) {
  prepaidBase[`CMPP_FEE_${suffix}`] = '0.0'; prepaidBase[`CMPP_GST_${suffix}`] = '0.0'
}
const workBase = { WO_CEMETERY: 'TEST', WO_BLOCK: 'A', WO_RANGE1: '0', WO_RANGE2: '2', WO_LOT1: '3', WO_LOT2: '0', WO_GRAVE1: '0', WO_GRAVE2: '0', WO_WORK_ORDER: '42', WO_INITIATION_DATE: '20250401', WO_DECEASED_NAME: 'Synthetic Person', WO_ADDRESS: '1 Example St', WO_PROV: 'ONTARIO', WO_FUNERAL_HOME: 'SYN', WO_FUNERAL_YR: '2025', WO_FUNERAL_MON: '4', WO_FUNERAL_DAY: '6', WO_FUNERAL_HR: '2', WO_FUNERAL_MIN: '30', WO_INTERMENT_YR: '2025', WO_INTERMENT_MON: '4', WO_INTERMENT_DAY: '7', WO_DEATH_YR: '2025', WO_DEATH_MON: '4', WO_DEATH_DAY: '5', WO_DEATH_PLACE: 'Example City', WO_AGE: '75', WO_PERIOD: 'mts', WO_COMMITTAL_TYPE: 'X', WO_CONTAINER_TYPE: 'Y', WO_DEPTH: 'Z', WO_CONFIRMATION_IN: 'Y', WO_REMARK1: 'First', WO_REMARK2: 'Second', WO_REMARK3: 'Third' }
const scenarios = []
function scenario(name, kind, values, state = {}) { scenarios.push({ name, kind, rows: [row(kind, values)], state }) }
scenario('master-both-contracts', 'master', masterBase)
scenario('master-preneed-reserved', 'master', { ...masterBase, CM_DECEASED_NAME: '', CM_INTERMENT_YR: '', CM_WORK_ORDER: '' })
scenario('master-only-deceased', 'master', { ...masterBase, CM_PRENEED_OWNER: '' })
scenario('master-zero-dates', 'master', { ...masterBase, CM_PURCHASE_YR: '0', CM_PURCHASE_MON: '0', CM_PURCHASE_DAY: '0', CM_INTERMENT_YR: '0', CM_INTERMENT_MON: '0', CM_INTERMENT_DAY: '0', CM_DEATH_YR: '0', CM_DEATH_MON: '0', CM_DEATH_DAY: '0' })
scenario('master-purchase-from-interment', 'master', { ...masterBase, CM_PURCHASE_YR: '0', CM_PURCHASE_MON: '0', CM_PURCHASE_DAY: '0' })
scenario('master-purchase-from-death', 'master', { ...masterBase, CM_PURCHASE_YR: '0', CM_PURCHASE_MON: '0', CM_PURCHASE_DAY: '0', CM_INTERMENT_YR: '', CM_INTERMENT_MON: '', CM_INTERMENT_DAY: '' })
scenario('master-cremation-no-site', 'master', { ...masterBase, CM_CEMETERY: '00', CM_CREMATION: 'Y', CM_CONTAINER_TYPE: '' })
scenario('master-columbarium-existing-site', 'master', { ...masterBase, CM_CEMETERY: 'HC' }, { site: true })
scenario('master-status-P-only', 'master', { ...masterBase, CM_PRENEED_OWNER: '', CM_DECEASED_NAME: '', CM_STATUS: 'P' })
scenario('master-no-contracts', 'master', { ...masterBase, CM_PRENEED_OWNER: '', CM_DECEASED_NAME: '' })
scenario('prepaid-skip-blank-name', 'prepaid', { ...prepaidBase, CMPP_PREPAID_FOR_NAME: '' })
scenario('prepaid-all-fees', 'prepaid', { ...prepaidBase, ...Object.fromEntries(Object.keys(prepaidBase).filter(key => key.startsWith('CMPP_FEE_')).map(key => [key, '10.25'])), ...Object.fromEntries(Object.keys(prepaidBase).filter(key => key.startsWith('CMPP_GST_')).map(key => [key, '0.75'])) })
scenario('prepaid-disinterment-sentinel', 'prepaid', { ...prepaidBase, CMPP_FEE_DISINTERMENT: '20202.02', CMPP_GST_DISINTERMENT: '20202.02' })
scenario('prepaid-existing-preneed', 'prepaid', { ...prepaidBase, CMPP_FEE_CREM: '4' }, { site: true, preneed: true })
scenario('prepaid-remapped-cemetery', 'prepaid', { ...prepaidBase, CMPP_CEMETERY: '.m', CMPP_ARRANGED_BY_NAME: 'Synthetic Person' })
scenario('prepaid-cremation', 'prepaid', { ...prepaidBase, CMPP_CEMETERY: '00', CMPP_FEE_CREM: '12', CMPP_GST_CREM: '1.5' })
scenario('prepaid-available-site', 'prepaid', prepaidBase, { site: true, status: 101 })
scenario('workorder-close-all-complete', 'workOrder', workBase)
scenario('workorder-reopen-existing', 'workOrder', workBase, { order: true, closed: true, site: true, linked: true })
scenario('workorder-incomplete', 'workOrder', { ...workBase, WO_CONFIRMATION_IN: '' })
scenario('workorder-future-today', 'workOrder', { ...workBase, WO_INTERMENT_YR: '2026', WO_INTERMENT_MON: '10', WO_INTERMENT_DAY: '20' })
scenario('workorder-cremation', 'workOrder', { ...workBase, WO_CEMETERY: '00', WO_CREMATION: 'Y', WO_CONTAINER_TYPE: '', WO_FUNERAL_HR: '' })
scenario('workorder-no-dates', 'workOrder', { ...workBase, WO_DEATH_YR: '', WO_FUNERAL_YR: '', WO_INTERMENT_YR: '', WO_FUNERAL_HR: '7' })
scenario('workorder-no-optional-milestones', 'workOrder', workBase, { noOptional: true })
scenarios.push({ name: 'workorder-repeat-number', kind: 'workOrder', rows: [row('workOrder', workBase), row('workOrder', { ...workBase, WO_DECEASED_NAME: 'Second Person' })], state: {} })

const normalize = value => JSON.parse(JSON.stringify(value))
// Original ordered catalog readers and legacy cache helpers run on the
// original SQLite schema. SQLite is solely the source oracle, never target DB.
const lookupDatabase = new DatabaseSync(':memory:')
const schemaSource = sources['database/initializeDatabase.js']
const statements = new Function(schemaSource.slice(schemaSource.indexOf('const recordColumns ='), schemaSource.indexOf('const initializingUser =')) + '\nreturn sqlCreateStatements')()
for (const statement of statements) lookupDatabase.exec(statement)
const borrowedSourceDatabase = { prepare: (...args) => lookupDatabase.prepare(...args), close() {} }
function originalFunction(name, dependencies) {
  const raw = sources[name].replace(/^import .*;\r?$/gm, '').replace('export default', 'return')
  return new Function(...Object.keys(dependencies), raw)(...Object.values(dependencies))
}
const updateRecordOrderNumber = originalFunction('database/updateRecordOrderNumber.js', {})
function insertSource(table, record) {
  const row = { ...record, recordCreate_username: 'fixture', recordCreate_timeMillis: 1, recordUpdate_username: 'fixture', recordUpdate_timeMillis: 1 }
  lookupDatabase.prepare(`INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row))
}
const lookupCases = []
for (const [table, nameKey, idKey, helperName] of [
  ['CommittalTypes', 'committalType', 'committalTypeId', 'data.committalTypes'],
  ['IntermentContainerTypes', 'intermentContainerType', 'intermentContainerTypeId', 'data.intermentContainerTypes'],
  ['IntermentDepths', 'intermentDepth', 'intermentDepthId', 'data.intermentDepths'],
]) {
  const rows = [
    { [idKey]: 1, [nameKey]: 'Z duplicate first id', [nameKey + 'Key']: 'DUP', orderNumber: 9, ...(table === 'IntermentContainerTypes' ? { isCremationType: 1 } : {}) },
    { [idKey]: 2, [nameKey]: 'A duplicate selected', [nameKey + 'Key']: 'DUP', orderNumber: 1, ...(table === 'IntermentContainerTypes' ? { isCremationType: 0 } : {}) },
    { [idKey]: 3, [nameKey]: 'Exact lowercase key', [nameKey + 'Key']: 'dup', orderNumber: 0 },
    { [idKey]: 4, [nameKey]: 'Exact trailing space', [nameKey + 'Key']: 'DUP ', orderNumber: 0 },
  ]
  for (const row of rows) insertSource(table, row)
  const getterName = 'get' + table
  const getter = originalFunction(`database/${getterName}.js`, { getDatabaseConnection: () => borrowedSourceDatabase, updateRecordOrderNumber })
  const helperFunctionName = { CommittalTypes: 'getCommittalTypeIdByKey', IntermentContainerTypes: 'getIntermentContainerTypeIdByKey', IntermentDepths: 'getIntermentDepthIdByKey' }[table]
  const dependencies = { [getterName]: getter, ['add' + nameKey[0].toUpperCase() + nameKey.slice(1)]: () => { throw Error('Unexpected original catalog creation') }, Debug: () => () => {}, DEBUG_NAMESPACE: 'synthetic' }
  const lookup = new Function(...Object.keys(dependencies), body(helperName) + `\nreturn ${helperFunctionName}`)(...Object.values(dependencies))
  const queries = ['DUP', 'dup', 'DUP '].map(key => ({ key, expectedId: lookup(key, utilities.user, borrowedSourceDatabase) }))
  assert.deepEqual(queries.map(row => row.expectedId), [2, 3, 4])
  lookupCases.push({ table, nameKey, idKey, rows, queries })
}
const contractRows = [
  { contractTypeId: 1, contractType: 'duplicate-case', orderNumber: 2 },
  { contractTypeId: 2, contractType: 'DUPLICATE-CASE', orderNumber: 2 },
]
for (const row of contractRows) insertSource('ContractTypes', row)
const contractGetter = originalFunction('database/getContractTypes.js', { getDatabaseConnection: () => borrowedSourceDatabase,
  updateRecordOrderNumber, getContractTypeFields: () => [], getContractTypePrints: () => [] })
const contractCache = new Function('getContractTypesFromDatabase', sources['helpers/cache/contractTypes.cache.js']
  .replace(/^import .*;\r?$/gm, '').replaceAll('export ', '') + '\nreturn getCachedContractTypeByContractType')(contractGetter)
const nameLookup = { table: 'ContractTypes', nameKey: 'contractType', idKey: 'contractTypeId', rows: contractRows,
  name: 'DuPlIcAtE-CaSe', expectedId: contractCache('DuPlIcAtE-CaSe', true).contractTypeId }
assert.equal(nameLookup.expectedId, 2)
for (const feeCategoryId of [10, 20]) insertSource('FeeCategories', { feeCategoryId, feeCategory: `Synthetic ${feeCategoryId}` })
for (const row of [{ feeId: 1, feeCategoryId: 10, feeName: 'first', feeDescription: 'CMPP_FEE_DUP' },
  { feeId: 2, feeCategoryId: 20, feeName: 'last', feeDescription: 'CMPP_FEE_DUP' }]) insertSource('Fees', row)
let createdFee
const originalFeeLookup = new Function('getDatabaseConnection', 'addFee', body('data.fees') + '\nreturn getFeeIdByFeeDescription')(
  () => borrowedSourceDatabase, form => { createdFee = form; return 3 })
const feeLookup = { rows: [{ feeId: 1, feeCategoryId: 10, feeName: 'first', feeDescription: 'CMPP_FEE_DUP' },
  { feeId: 2, feeCategoryId: 20, feeName: 'last', feeDescription: 'CMPP_FEE_DUP' }],
  expectedId: originalFeeLookup('CMPP_FEE_DUP', utilities.user) }
assert.equal(feeLookup.expectedId, 2)
originalFeeLookup('CMPP_FEE_NEW', utilities.user)
feeLookup.createdForm = createdFee
assert.equal(createdFee.feeCategoryId, 10)
// The source's zero category also has a concrete outcome with the current
// node:sqlite defaults: its own INSERT fails rather than silently repairing it.
lookupDatabase.exec('DELETE FROM Fees')
const addOriginalFee = originalFunction('database/addFee.js', { getDatabaseConnection: () => borrowedSourceDatabase,
  isAuditLoggingEnabled: false, getFee: () => undefined, createAuditLogEntries() {} })
const missingCategoryLookup = new Function('getDatabaseConnection', 'addFee', body('data.fees') + '\nreturn getFeeIdByFeeDescription')(
  () => borrowedSourceDatabase, addOriginalFee)
try { missingCategoryLookup('CMPP_FEE_NEW', utilities.user); assert.fail('Missing original category must fail its FK') }
catch (error) { assert.equal(error.message, 'FOREIGN KEY constraint failed'); feeLookup.missingCategoryError = error.message }
lookupDatabase.close()
const siteName = (key, parts) => [key, ...[1, 2, 3, 4].map(index => parts[`burialSiteNameSegment${index}`])].join('-')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
for (const scenario of scenarios) {
  const operations = []
  let site = scenario.state.site ? { burialSiteId: 1, burialSiteStatusId: scenario.state.status ?? 103 } : undefined
  let order = scenario.state.order ? { workOrderId: 1, workOrderNumber: '000042', workOrderBurialSites: scenario.state.linked ? [{ burialSiteId: 1 }] : [], ...(scenario.state.closed ? { workOrderCloseDate: 20250407 } : {}) } : undefined
  let contractId = 0
  const gateway = {
    fs: { readFileSync: () => '' }, papa: { parse: () => ({ data: scenario.rows, errors: [] }) },
    console: { time() {}, timeEnd() {}, log() {}, error(error) { throw error } },
    getDatabaseConnection: () => ({ exec() {}, close() {} }),
    ...utilities, ...types, getDeathAgePeriod: periods, cremationCemeteryKeys: new Set(['', '00', '`', 'N', 'R']),
    importIds: { ...ids, ...(scenario.state.noOptional ? { acknowledgedWorkOrderMilestoneTypeId: undefined, deathWorkOrderMilestoneTypeId: undefined } : {}) },
    getCemeteryIdByKey: key => `cemetery:${key}`, buildBurialSiteName: siteName,
    getBurialSiteByBurialSiteName: () => site, getBurialSite: () => site,
    getFuneralHomeIdByKey: key => `FuneralHomes:${key}`, getCommittalTypeIdByKey: key => `CommittalTypes:${key}`,
    getIntermentContainerTypeIdByKey: key => `IntermentContainerTypes:${key}`, getIntermentDepthIdByKey: key => `IntermentDepths:${key}`,
    getFeeIdByFeeDescription: key => `fee:${key}`,
    getContracts: () => ({ contracts: scenario.state.preneed ? [{ contractId: 99 }] : [] }),
    getWorkOrderByWorkOrderNumber: () => order, getWorkOrder: () => order,
    dateToString: () => '2026-10-20', dateIntegerToString: value => { const text = String(value).padStart(8, '0'); return `${text.slice(0, -4)}-${text.slice(-4, -2)}-${text.slice(-2)}` },
  }
  for (const operation of ['addBurialSite', 'updateBurialSiteStatus', 'addContract', 'addContractComment', 'addContractServiceType', 'addRelatedContract', 'addContractFee', 'addContractTransaction', 'addWorkOrder', 'addWorkOrderBurialSite', 'addWorkOrderContract', 'addWorkOrderMilestone', 'closeWorkOrder', 'reopenWorkOrder']) {
    gateway[operation] = form => {
      // Status has two arguments; retain both in the operation oracle.
      operations.push({ operation, form: normalize(form) })
      if (operation === 'addContract') return ++contractId
      if (operation === 'addBurialSite') { site = { burialSiteId: 1, burialSiteStatusId: form.burialSiteStatusId }; return { burialSiteId: 1 } }
      if (operation === 'addWorkOrder') { order = { ...form, workOrderId: 1, workOrderBurialSites: [] }; return 1 }
      if (operation === 'closeWorkOrder') order.workOrderCloseDate = 20250407
      if (operation === 'reopenWorkOrder') delete order.workOrderCloseDate
      return true
    }
  }
  gateway.updateBurialSiteStatus = (identifier, status) => { operations.push({ operation: 'updateBurialSiteStatus', form: { identifier, status } }); if (site) site.burialSiteStatusId = status }
  const file = { master: 'import.master', prepaid: 'import.prepaid', workOrder: 'import.workOrder' }[scenario.kind]
  const processor = new AsyncFunction(...Object.keys(gateway), body(file).replace('default async function', 'async function') + `\nreturn ${file === 'import.master' ? 'importFromMasterCSV' : file === 'import.prepaid' ? 'importFromPrepaidCSV' : 'importFromWorkOrderCSV'}()`)
  await processor(...Object.values(gateway))
  scenario.operations = operations
}

const findagrave = []
const findagraveSource = sources['cli/findAGraveMemorialExtractorImport/import.js'].replace(/^import .*;\r?$/gm, '').replace('export default', 'return')
for (const state of [{ testing: false, cemetery: true }, { testing: true, cemetery: false }, { testing: true, cemetery: true }]) {
  try {
    const run = new Function('Debug', 'DEBUG_NAMESPACE', 'sunriseDB', 'useTestDatabases', 'getCemetery', findagraveSource)(() => () => {}, 'test', 'test.sqlite', state.testing, () => state.cemetery ? { cemeteryId: 1 } : undefined)
    run('1', 'missing-never-opened.csv')
    findagrave.push({ ...state, error: null })
  } catch (error) { findagrave.push({ ...state, error: error.message }) }
}
const fixture = { referenceCommit: '451ce034863b16502484367044f3e9b65370111a', boundaries: 'Actual JS record bodies, original catalog/fee lookup helpers on source SQLite schema and locked meow parser; CSV parsed rows, CRUD, naming, date clock and record catalog IDs injected. SQL Server tests cover target persistence.', hashes, packages, cliParser, lookupCases, nameLookup, feeLookup, utilities: {
  dates: [['3014', '2', '3'], ['2202', '0', '0'], ['', '', ''], ['12345', '123', '123']].map(input => ({ input, expected: utilities.formatDateString(...input) })),
  times: [['', ''], ['123', '456'], ['2', '5']].map(input => ({ input, expected: utilities.formatTimeString(...input) })),
  contractNumbers: ['', ' 42 ', '  '].map(input => ({ input, expected: utilities.formatContractNumber(input) ?? null })),
  periods: ['DYS', 'mts', 'yrs', 'unknown'].map(input => ({ input, expected: periods(input) })),
  types: ['', '00', 'GC', 'HC', 'MA', 'MN', 'NW', 'UG', 'TEST', 'R'].map(input => ({ input, expected: types.getBurialSiteTypeId(input) })),
}, findagrave, scenarios }
const fixturePath = path.join(root, 'backend/tests/fixtures/imports-reference.json')
if (process.argv.includes('--write-fixture')) await fs.writeFile(fixturePath, JSON.stringify(fixture, null, 2) + '\n')
else assert.deepEqual(JSON.parse(await fs.readFile(fixturePath, 'utf8')), fixture)
console.log(`Import reference verified: ${Object.keys(hashes).length} sources, locked meow ${meowInfo.version}, ${cliParser.length} CLI parser/help cases, ${scenarios.length} record scenarios, ${scenarios.reduce((n, row) => n + row.operations.length, 0)} CRUD calls, 3 Find-a-Grave guard cases.`)
