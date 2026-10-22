// Execute the frozen Sunrise recent-record SQL and real dashboard handlers.
// SQLite is exclusively the original oracle; Cemaris is verified on SQL Server.
// Original provenance: licenses/Sunrise-LICENSE.md (MIT).
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = path.resolve(root, '../Sunrise-Referenz')
const commit = '451ce034863b16502484367044f3e9b65370111a'
assert.equal(execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit)
const hashes = {}
async function source(name) {
  const raw = await fs.readFile(path.join(reference, name), 'utf8')
  hashes[name] = createHash('sha256').update(raw).digest('hex')
  return raw
}
const schema = await source('database/initializeDatabase.js')
const statements = new Function(schema.slice(schema.indexOf('const recordColumns'), schema.indexOf('const initializingUser')) + '\nreturn sqlCreateStatements;')()
const database = new DatabaseSync(':memory:')
for (const statement of statements) database.exec(statement)
const clock = 1792487142000
const minimum = clock - 30 * 24 * 3600 * 1000
class Clock extends Date { static now() { return clock } }
const strip = raw => raw.replace(/^import .*;\r?$/gm, '').replaceAll('export default function', 'function').replaceAll('export const ', 'const ')
const raw = await source('database/getRecordUpdateLog.js')
const getRecordUpdateLog = new Function('Date', 'daysToMillis', 'getDatabaseConnection', strip(raw) + '\nreturn getRecordUpdateLog;')(
  Clock, days => days * 24 * 3600 * 1000, () => database)
const data = []
let counter = 0
function add(table, values, recent = true) {
  const millis = recent ? clock - (++counter * 10000) : 1
  const row = { recordCreate_username: 'synthetic-dashboard', recordCreate_timeMillis: millis,
    recordUpdate_username: 'synthetic-dashboard', recordUpdate_timeMillis: millis, ...values }
  const result = database.prepare(`INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row))
  const identity = database.prepare(`PRAGMA table_info(${table})`).all().filter(column => column.pk > 0)
  if (identity.length === 1) row[identity[0].name] ??= Number(result.lastInsertRowid)
  data.push({ table, values: row })
  return Number(result.lastInsertRowid)
}
const contractType = add('ContractTypes', { contractType: 'Synthetic <contract> 😀' }, false)
const workType = add('WorkOrderTypes', { workOrderType: 'Synthetic Work Type' }, false)
const workStatus = add('WorkOrderStatuses', { workOrderStatus: 'Synthetic Open' }, false)
const milestoneType = add('WorkOrderMilestoneTypes', { workOrderMilestoneType: 'Synthetic milestone' }, false)
const siteType = add('BurialSiteTypes', { burialSiteType: 'Synthetic Site' }, false)
const siteStatus = add('BurialSiteStatuses', { burialSiteStatus: 'Synthetic available' }, false)
const category = add('FeeCategories', { feeCategory: 'Synthetic fees' }, false)
const fee = add('Fees', { feeCategoryId: category, feeName: 'Synthetic & fee' }, false)
const contract = add('Contracts', { contractTypeId: contractType, contractNumber: 'SYN-RECENT', contractStartDate: 20261020, purchaserName: 'Synthetic purchaser' })
const deletedContract = add('Contracts', { contractTypeId: contractType, contractNumber: 'SYN-DELETED', contractStartDate: 20261020, purchaserName: 'Synthetic purchaser', recordDelete_timeMillis: clock })
add('Contracts', { contractTypeId: contractType, contractNumber: 'SYN-CUTOFF', contractStartDate: 20261020, purchaserName: 'Synthetic purchaser', recordCreate_timeMillis: 1, recordUpdate_timeMillis: minimum })
add('Contracts', { contractTypeId: contractType, contractNumber: 'SYN-OLD', contractStartDate: 20261020, purchaserName: 'Synthetic purchaser', recordUpdate_timeMillis: minimum - 1 })
const work = add('WorkOrders', { workOrderTypeId: workType, workOrderStatusId: workStatus, workOrderNumber: 'SYN-WORK', workOrderDescription: 'Synthetic <work> 😀', recordCreate_timeMillis: 2 })
const deletedWork = add('WorkOrders', { workOrderTypeId: workType, workOrderStatusId: workStatus, workOrderNumber: 'SYN-WORK-DELETED', recordDelete_timeMillis: clock })
add('WorkOrders', { workOrderTypeId: workType, workOrderStatusId: workStatus, workOrderNumber: 'SYN-WORK-EMPTY', workOrderDescription: '' })
add('WorkOrders', { workOrderTypeId: workType, workOrderStatusId: workStatus, workOrderNumber: 'SYN-WORK-SPACES', workOrderDescription: '  ' })
function site(name, deleted) {
  return add('BurialSites', { burialSiteTypeId: siteType, burialSiteStatusId: siteStatus, burialSiteName: name,
    burialSiteNameSegment1: name, burialSiteNameSegment2: '', burialSiteNameSegment3: '', burialSiteNameSegment4: '', burialSiteNameSegment5: '', ...(deleted ? { recordDelete_timeMillis: clock } : {}) })
}
const burialSite = site('SYN-SITE', false), deletedSite = site('SYN-DELETED', true)
for (const parent of [work, deletedWork]) {
  add('WorkOrderMilestones', { workOrderId: parent, workOrderMilestoneTypeId: milestoneType, workOrderMilestoneDate: 20261020, workOrderMilestoneDescription: 'Synthetic <milestone>' })
}
add('WorkOrderMilestones', { workOrderId: work, workOrderMilestoneTypeId: null, workOrderMilestoneDate: 20261020, workOrderMilestoneDescription: '' })
add('ContractFees', { contractId: contract, feeId: fee, feeAmount: 1.005, taxAmount: 0 })
add('ContractFees', { contractId: deletedContract, feeId: fee, feeAmount: -1.335, taxAmount: 0, recordCreate_timeMillis: 3 })
const notes = [null, '', ' ', 'Synthetic <note> 😀']
for (let index = 0; index < notes.length; index++) {
  add('ContractTransactions', { contractId: index === 1 ? deletedContract : contract, transactionIndex: index + 1,
    transactionDate: 20261020, transactionTime: 905, transactionAmount: [2.675, -0.005, 42, 100][index], transactionNote: notes[index] })
}
for (const [table, parentKey, parents] of [['ContractComments', 'contractId', [contract, deletedContract]], ['WorkOrderComments', 'workOrderId', [work, deletedWork]], ['BurialSiteComments', 'burialSiteId', [burialSite, deletedSite]]]) {
  for (const parent of parents) add(table, { [parentKey]: parent, commentDate: 20261020, commentTime: 905,
    comment: 'x'.repeat(98) + '😀ä' + '<literal>'.repeat(2) })
  add(table, { [parentKey]: parents[0], commentDate: 20261020, commentTime: 905, comment: 'Synthetic deleted child', recordDelete_timeMillis: clock })
}
const filters = ['', 'contract', 'contractTransactions', 'workOrder', 'workOrderMilestone', 'burialSite', 'contractFee', 'comments', 'contractComment', 'workOrderComment', 'burialSiteComment']
const queries = []
for (const recordType of filters) {
  for (const options of [{}, { limit: 2, offset: 1, sortBy: 'recordCreate_timeMillis', sortDirection: 'asc' }, { limit: 0 }, { limit: -1, offset: -2 }, { limit: 20000, sortBy: 'invalid', sortDirection: 'invalid' }]) {
    queries.push({ recordType, options, expected: getRecordUpdateLog({ recordType }, options, database) })
  }
}
const rawHandler = await source('handlers/dashboardPost/doGetRecordUpdateLog.js')
const handler = new Function('getRecordUpdateLog', 'defaultRecordLimit', strip(rawHandler) + '\nreturn handler;')(
  (filters, options) => getRecordUpdateLog(filters, options, database), 100)
const handlers = []
for (const body of [{}, { recordType: 'contract' }, { recordType: 'comments', limit: '2.9', offset: '-2.9', sortBy: 'recordCreate_timeMillis', sortDirection: 'asc' }, { recordType: 'workOrder', limit: null, offset: null }, { recordType: 'burialSite', limit: '-1' }]) {
  let expected
  handler({ body }, { json(value) { expected = value } })
  handlers.push({ body, expected })
}
const money = [0, -0, 0.005, -0.005, 1.005, -1.005, 2.675, 1.335, -1.335, 9.995, 2.685, 0.004999999999999999,
  123456789.125, 100000000000000.12, 999999999999999.9, 1e16, 1e-20].map(value => ({ value, expected: database.prepare("SELECT PRINTF('%.2f', ?) AS value").get(value).value }))
const pageHandlers = {}
for (const name of ['dashboard', 'updateLog']) {
  const page = new Function('i18next', strip(await source(`handlers/dashboardGet/${name}.js`)) + '\nreturn handler;')({ t: key => key })
  pageHandlers[name] = []
  for (const error of [undefined, 'accessDenied', 'printConfigNotFound', '<literal>']) {
    page({ query: { ...(error === undefined ? {} : { error }) } }, { locals: { lng: 'en' }, render(template, values) { pageHandlers[name].push({ query: error ?? null, template, values }) } })
  }
}
// Execute the unmodified original browser controller against an injected DOM
// boundary; verify routes, escaping, paging and sort events with real SQL rows.
process.env.TZ = 'Europe/Berlin'
class Element {
  constructor() { this.value = ''; this.innerHTML = ''; this.rows = []; this.events = {}; this.style = {}; this.classList = { add() {}, remove() {}, toggle() {} } }
  addEventListener(name, handler) { this.events[name] = handler }
  querySelector(selector) { return selector === 'tbody' ? body : new Element() }
  closest() { return table }
  insertAdjacentHTML(_where, value) { this.innerHTML += value }
  append(row) { this.rows.push(row.innerHTML) }
  replaceChildren() { this.rows = [] }
}
const body = new Element(), table = new Element()
const elements = Object.fromEntries(['filter--limit', 'filter--recordType', 'table--updateLog', 'loading--updateLog', 'button--updateLogLoadMore', 'header--updated', 'header--created'].map(id => ['#' + id, id === 'table--updateLog' ? table : new Element()]))
elements['#filter--limit'].value = '50'
const browserCalls = []
const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
const dateToString = value => Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
const dateToTimeString = value => Intl.DateTimeFormat('en-CA', { hourCycle: 'h24', hour: '2-digit', minute: '2-digit' }).format(value)
new Function('exports', 'document', 'cityssm', await source('public/javascripts/updateLog.js'))(
  { sunrise: { urlPrefix: '', getContractUrl: id => `/contracts/${id}`, getWorkOrderUrl: id => `/workOrders/${id}`, getBurialSiteUrl: id => `/burialSites/${id}` } },
  { querySelector: selector => elements[selector] ?? null, querySelectorAll: () => [elements['#header--updated'], elements['#header--created']], createElement: () => new Element() },
  { escapeHTML, dateToString, dateToTimeString, postJSON(url, request, callback) {
    browserCalls.push({ url, request })
    callback({ updateLog: getRecordUpdateLog({ recordType: request.recordType }, request, database) })
  } })
const browserRows = [...body.rows]
elements['#header--created'].events.click()
elements['#header--created'].events.click()
elements['#header--updated'].events.click()
elements['#filter--limit'].value = '10'
elements['#filter--limit'].events.change()
elements['#button--updateLogLoadMore'].events.click()
elements['#filter--recordType'].value = 'comments'
elements['#filter--recordType'].events.change()
const targetSource = await fs.readFile(path.join(root, 'frontend/src/dashboard.tsx'), 'utf8')
const target = stripTypeScriptTypes(targetSource.slice(targetSource.indexOf('export function updateRecordUrl'), targetSource.indexOf('export function UpdateLog'))).replaceAll('export ', '')
const targetHelpers = new Function(target + '\nreturn {updateRecordUrl, localTimestamp};')()
const initialRows = queries[0].expected
for (const [index, entry] of initialRows.entries()) {
  assert.ok(browserRows[index].includes(`href="${targetHelpers.updateRecordUrl(entry)}"`))
  assert.ok(browserRows[index].includes(escapeHTML(entry.recordDescription)))
  const timestamp = targetHelpers.localTimestamp(entry.recordUpdate_timeMillis).split(' ')
  assert.ok(browserRows[index].includes(timestamp[0]))
  assert.ok(browserRows[index].includes(timestamp[1]))
}
for (const clock of [new Date(2026, 9, 20, 0, 5).getTime(), new Date(2026, 2, 29, 3, 5).getTime()]) {
  assert.equal(targetHelpers.localTimestamp(clock), `${dateToString(new Date(clock))} ${dateToTimeString(new Date(clock))}`)
}
const browser = { rows: browserRows.length, calls: browserCalls, midnight: targetHelpers.localTimestamp(new Date(2026, 9, 20, 0, 5).getTime()) }
const quickSearchHtml = await source('public/html/quickSearch.html')
const defaultContractField = /<select[^>]+id="quickSearchContract--searchField"[^>]*>[\s\S]*?<option value="([^"]+)"/.exec(quickSearchHtml)?.[1]
assert.equal(defaultContractField, 'contractNumber')
const quickSearch = []
for (const urlPrefix of ['', '/synthetic']) {
  const controls = Object.fromEntries(['navbar--quickSearch', 'quickSearchContract--searchField', 'quickSearchContract--searchValue',
    'quickSearchWorkOrder--workOrderNumber', 'quickSearch--contractsLink', 'quickSearch--workOrdersLink',
    'form--quickSearchContract', 'form--quickSearchWorkOrder'].map(id => ['#' + id, new Element()]))
  controls['#quickSearchContract--searchField'].value = defaultContractField
  const modal = { querySelector: selector => selector === 'input' ? { focus() {} } : controls[selector] ?? null }
  let options, assignedUrl, alert, prevented = 0, clipped = 0
  const event = { preventDefault() { prevented++ } }
  new Function('document', 'globalThis', 'cityssm', 'bulmaJS', 'i18next', await source('public/javascripts/theme.js'))(
    { querySelector: selector => selector === 'main' ? { dataset: { urlPrefix, sessionKeepAliveMillis: '0' } } : controls[selector] ?? null, querySelectorAll: () => [] },
    { location: { assign(url) { assignedUrl = url } } },
    { openHtmlModal(name, config) { assert.equal(name, 'quickSearch'); options = config; config.onshow(modal); config.onshown(modal) } },
    { toggleHtmlClipped() { clipped++ }, alert(value) { alert = value } }, { t: key => key })
  controls['#navbar--quickSearch'].events.click(event)
  assert.equal(controls['#quickSearch--contractsLink'].href, urlPrefix + '/contracts')
  assert.equal(controls['#quickSearch--workOrdersLink'].href, urlPrefix + '/workOrders')
  for (const [field, value] of [['contractNumber', 'SYN-001'], ['deceasedName', 'Müller & Söhne/😀?=+\''],
    ['contractNumber', '<literal> & %_[]'], ['invalid', 'Synthetic invalid field'], ['', 'Synthetic empty field']]) {
    controls['#quickSearchContract--searchField'].value = field
    controls['#quickSearchContract--searchValue'].value = value
    assignedUrl = undefined; alert = undefined
    controls['#form--quickSearchContract'].events.submit(event)
    if (['contractNumber', 'deceasedName'].includes(field)) assert.equal(assignedUrl, `${urlPrefix}/contracts/?${field}=${encodeURIComponent(value)}`)
    else assert.deepEqual(alert, { contextualColorName: 'danger', title: 'Invalid Search', message: 'Please enter a valid search value.' })
    quickSearch.push({ prefix: urlPrefix, type: 'contract', field, value, expected: assignedUrl ? { url: assignedUrl } : { alert } })
  }
  for (const value of ['SYN-12', 'SYN/12 & Ä 😀?#']) {
    controls['#quickSearchWorkOrder--workOrderNumber'].value = value
    controls['#form--quickSearchWorkOrder'].events.submit(event)
    assert.equal(assignedUrl, `${urlPrefix}/workOrders/byWorkOrderNumber/${encodeURIComponent(value)}`)
    quickSearch.push({ prefix: urlPrefix, type: 'workOrder', value, expected: { url: assignedUrl } })
  }
  options.onremoved()
  assert.equal(clipped, 2)
  assert.equal(prevented, 8)
}
const filterToggles = []
for (const initiallyHidden of [true, false]) {
  const classes = new Set(initiallyHidden ? ['is-hidden'] : [])
  const caretClasses = new Set(initiallyHidden ? [] : ['fa-rotate-90'])
  const toggle = set => ({ toggle(value) { set.has(value) ? set.delete(value) : set.add(value) } })
  const sibling = { classList: toggle(classes), value: 'Synthetic retained filter' }
  let click, prevented = 0
  const element = { nextElementSibling: sibling, querySelector: () => ({ classList: toggle(caretClasses) }), addEventListener(_name, handler) { click = handler } }
  new Function('document', await source('public/javascripts/search.js'))({ querySelectorAll: () => [element] })
  const states = []
  for (let count = 0; count < 2; count++) {
    click({ currentTarget: element, preventDefault() { prevented++ } })
    states.push({ hidden: classes.has('is-hidden'), caretExpanded: caretClasses.has('fa-rotate-90'), value: sibling.value })
  }
  assert.equal(prevented, 2)
  assert.equal(states[0].hidden, !initiallyHidden)
  assert.equal(states[1].hidden, initiallyHidden)
  assert.equal(states[1].value, 'Synthetic retained filter')
  // Missing adjacent blocks/icons are deliberately tolerated by the original.
  element.nextElementSibling = null; element.querySelector = () => null
  click({ currentTarget: element, preventDefault() {} })
  filterToggles.push({ initiallyHidden, states, missingElementsTolerated: true })
}
for (const name of ['database/getRecordUpdateLog.ts', 'handlers/dashboardPost/doGetRecordUpdateLog.ts', 'handlers/dashboardGet/dashboard.ts', 'handlers/dashboardGet/updateLog.ts',
  'routes/dashboard.ts', 'routes/api.ts', 'handlers/apiGet/milestoneICS.ts', 'views/dashboard/dashboard.ejs', 'views/dashboard/updateLog.ejs',
  'public/javascripts/updateLog.js', 'public/javascripts/updateLog.ts', 'cypress/e2e/03readOnly/updateLog.cy.ts', 'cypress/e2e/xxOther/dashboard.cy.ts', 'app/app.ts',
  'public/javascripts/theme.ts', 'public/javascripts/search.ts', 'views/contracts/search.ejs']) await source(name)
const result = JSON.stringify({ referenceCommit: commit, sourceHashes: hashes, clock, data, queries, handlers, money, pageHandlers, browser, defaultContractField, quickSearch, filterToggles }, null, 2) + '\n'
const fixture = path.join(root, 'backend/tests/fixtures/dashboard-reference.json')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await fs.readFile(fixture, 'utf8')), JSON.parse(result))
else await fs.writeFile(fixture, result)
database.close()
console.log(JSON.stringify({ ok: true, sourceArtifacts: Object.keys(hashes).length, queries: queries.length, handlers: handlers.length, money: money.length, records: data.length, quickSearch: quickSearch.length, filterToggles: filterToggles.length }))
