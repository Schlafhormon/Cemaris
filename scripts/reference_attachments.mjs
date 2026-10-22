// Execute fixed Sunrise attachment storage, SQL modules and actual handlers.
// Source SQLite is only an oracle; target persistence is tested on SQL Server.
// Original MIT provenance: licenses/Sunrise-LICENSE.md.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = path.resolve(root, '../Sunrise-Referenz')
const commit = '451ce034863b16502484367044f3e9b65370111a'
assert.equal(execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit)
const work = path.join(root, '.local/reference-attachments')
await fs.mkdir(work, { recursive: true })
const hashes = {}
async function source(name) {
  const raw = await fs.readFile(path.join(reference, name), 'utf8')
  hashes[name] = createHash('sha256').update(raw).digest('hex')
  return raw
}
const lock = JSON.parse(await source('package-lock.json'))
const packages = []
for (const name of ['@cityssm/utils-datetime', '@cityssm/object-difference', 'sanitize-filename', 'truncate-utf8-bytes', 'utf8-byte-length']) {
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
const require = createRequire(path.join(work, 'probe.cjs'))
const sanitizeFileName = require('sanitize-filename')
const datetime = await import(pathToFileURL(path.join(work, 'node_modules/@cityssm/utils-datetime/index.js')).href)
const { default: getObjectDifference } = await import(pathToFileURL(path.join(work, 'node_modules/@cityssm/object-difference/index.js')).href)
process.env.TZ = 'Europe/Berlin'
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [2026, 9, 20, 9, 5, 42])) }
  static now() { return new Date(2026, 9, 20, 9, 5, 42).getTime() }
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
function strip(raw) {
  return raw.replace(/^import .*;\r?$/gm, '').replaceAll('export default async function', 'async function')
    .replaceAll('export default function', 'function').replaceAll('export async function', 'async function').replaceAll('export function', 'function')
}
const schema = await source('database/initializeDatabase.js')
const statements = new Function(schema.slice(schema.indexOf('const recordColumns'), schema.indexOf('const initializingUser')) + '\nreturn sqlCreateStatements;')()
let database
const shared = { prepare: (...args) => database.prepare(...args), close() {} }
const helpers = { ...Object.fromEntries(Object.entries(datetime).filter(([key]) => key !== 'default')), Date: Clock,
  isAuditLoggingEnabled: true, getDatabaseConnection: () => shared, getObjectDifference,
  cacheTableNames: [], clearCacheByTableName() {}, startSyncDataToPortalTask() {},
  Debug: () => () => {}, DEBUG_NAMESPACE: 'synthetic-attachments', path: path.posix, sanitizeFileName,
  getConfigProperty: key => ({ 'application.attachmentsPath': 'data/attachments', 'application.maxAttachmentFileSize': 20 })[key],
  getContract: async id => database.prepare('SELECT * FROM Contracts WHERE contractId=? AND recordDelete_timeMillis IS NULL').get(id),
}
let files = new Map()
const virtualFs = { async mkdir() {}, async access(name) { if (!files.has(name)) throw new Error('ENOENT') },
  async writeFile(name, bytes) { files.set(name, Buffer.from(bytes)) } }
helpers.fs = virtualFs
async function load(name, names) {
  const raw = await source(name)
  const Constructor = raw.includes('async function') ? AsyncFunction : Function
  return new Constructor(...Object.keys(helpers), strip(raw) + `\nreturn {${names.join(',')}};`)(...Object.values(helpers))
}
Object.assign(helpers, await load('helpers/attachments.helpers.js', ['writeAttachment']))
for (const name of ['createAuditLogEntries', 'addContractAttachment', 'updateContractAttachment', 'getContractAttachment', 'getContractAttachments']) {
  Object.assign(helpers, await load(`database/${name}.js`, [name]))
}
Object.assign(helpers, await load('database/deleteRecord.js', ['deleteRecord']))
const handlers = {}
for (const name of ['doUploadContractAttachment', 'doUpdateContractAttachment', 'doDeleteContractAttachment']) {
  handlers[name] = (await load(`handlers/contractsPost/${name}.js`, ['handler'])).handler
}
const download = (await load('handlers/contractsGet/attachment.js', ['handler'])).handler
for (const file of Object.keys(hashes).filter(name => name.endsWith('.js'))) await source(file.replace(/\.js$/, '.ts'))
for (const file of ['routes/contracts.ts', 'public/javascripts/contract.editAttachments.ts', 'public/html/contract-uploadAttachment.html',
  'public/html/contract-editAttachment.html', 'views/contracts/edit.ejs', 'views/contracts/view.ejs', 'helpers/config.defaults.ts']) await source(file)

const actor = { username: 'synthetic-attachments' }
function setup() {
  database?.close()
  database = new DatabaseSync(':memory:')
  for (const sql of statements) database.exec(sql)
  for (const [table, values] of [['ContractTypes', { contractType: 'Synthetic contract type' }],
    ['Contracts', { contractTypeId: 1, contractNumber: 'SYN-ATTACH-1', contractStartDate: 20261020, purchaserName: 'Synthetic purchaser' }],
    ['Contracts', { contractTypeId: 1, contractNumber: 'SYN-ATTACH-2', contractStartDate: 20261020, purchaserName: 'Synthetic other' }]]) {
    const data = { ...values, recordCreate_username: actor.username, recordCreate_timeMillis: 1, recordUpdate_username: actor.username, recordUpdate_timeMillis: 1 }
    database.prepare(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(() => '?').join(',')})`).run(...Object.values(data))
  }
  files = new Map()
}
function clean(value) {
  if (Array.isArray(value)) return value.map(clean)
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !key.startsWith('record') || key === 'recordUpdate_username').map(([key, item]) => [key, clean(item)]))
  return value
}
function audit() {
  return database.prepare('SELECT * FROM AuditLog ORDER BY rowid').all().map(row => ({
    ...Object.fromEntries(['mainRecordType', 'mainRecordId', 'updateTable', 'recordIndex', 'updateField', 'updateType', 'updateUsername'].map(key => [key, row[key]])),
    fromValue: row.fromValue === null ? null : clean(JSON.parse(row.fromValue)), toValue: row.toValue === null ? null : clean(JSON.parse(row.toValue)) }))
}
const sanitizer = ['report.pdf', 'A:/bad\\file?*.txt', '../escape.txt', 'CON', 'nul.txt', 'com0.csv', 'LPT9', 'lpt10', '..', '...', '.hidden',
  'with trailing. ', '  beginning', '\u0001control\u0080.txt', 'Grüße 🪦.pdf', 'é'.repeat(130), '🪦'.repeat(65), 'CON.txt\n', 'aux .txt']
  .map(input => ({ input, expected: sanitizeFileName(input) }))
setup()
const writes = []
for (const input of ['report.pdf', 'report.pdf', 'report.pdf', '../escape.txt', '../escape.txt', 'a:b.txt', 'a:b.txt', 'CON', 'CON', 'Grüße 🪦.pdf']) {
  const bytes = Buffer.from('Synthetic attachment <literal>\n' + input)
  const result = await helpers.writeAttachment(input, bytes)
  writes.push({ input, result, content_sha256: createHash('sha256').update(files.get(path.posix.join(result.filePath, result.fileName))).digest('hex') })
}
const defaults = []
for (const form of [{ contractId: 1, fileName: 'report.pdf', filePath: 'data/attachments/2026-10' },
  { contractId: 1, fileName: 'Grüße 🪦.pdf', filePath: 'data/attachments/2026-10', attachmentTitle: '', attachmentDetails: '' },
  { contractId: 2, fileName: 'report.txt', filePath: 'data/attachments/2026-10', attachmentTitle: 'Synthetic title', attachmentDetails: '<literal>\nSecond line' }]) {
  setup()
  const identifier = helpers.addContractAttachment(form, actor, shared)
  defaults.push({ form, identifier, expected: clean(helpers.getContractAttachment(identifier, shared)), listed: clean(helpers.getContractAttachments(form.contractId, shared)), audit: audit() })
}
setup()
const initial = { contractId: 1, fileName: 'report.pdf', filePath: 'data/attachments/2026-10', attachmentTitle: 'Initial', attachmentDetails: 'Synthetic initial' }
const identifier = helpers.addContractAttachment(initial, actor, shared)
const lifecycle = []
for (const [action, form] of [['update', { attachmentTitle: 'Edited <literal>', attachmentDetails: 'Synthetic\nsecond' }], ['update', {}],
  ['delete', {}], ['delete', {}], ['update', { attachmentTitle: 'Must remain deleted' }]]) {
  const result = action === 'delete' ? helpers.deleteRecord('ContractAttachments', identifier, { username: 'synthetic-editor' }, shared)
    : helpers.updateContractAttachment(identifier, form, { username: 'synthetic-editor' }, shared)
  lifecycle.push({ action, form, result, retrieved: clean(helpers.getContractAttachment(identifier, shared)) ?? null,
    listed: clean(helpers.getContractAttachments(1, shared)), deleted: database.prepare('SELECT recordDelete_timeMillis FROM ContractAttachments WHERE contractAttachmentId=1').get().recordDelete_timeMillis !== null })
}
const lifecycleAudit = audit()
const handlerCases = []
for (const [name, existing, body, file, parentDeleted] of [
  ['doUploadContractAttachment', false, { contractId: '1' }, undefined, false],
  ['doUploadContractAttachment', false, { contractId: '999' }, { originalname: 'report.pdf' }, false],
  ['doUploadContractAttachment', false, { contractId: '1', attachmentTitle: '', attachmentDetails: 'Synthetic upload' }, { originalname: 'report.pdf' }, false],
  ['doUploadContractAttachment', false, { contractId: '1' }, { originalname: 'report.pdf' }, false],
  ['doUploadContractAttachment', false, { contractId: '1' }, { originalname: 'report.pdf' }, true],
  ['doUpdateContractAttachment', false, { contractAttachmentId: '999' }, undefined, false],
  ['doUpdateContractAttachment', true, { contractAttachmentId: '1', attachmentTitle: 'Edited', attachmentDetails: '<literal>' }, undefined, false],
  ['doUpdateContractAttachment', true, { contractAttachmentId: '1' }, undefined, false],
  ['doUpdateContractAttachment', true, { contractAttachmentId: '1' }, undefined, true],
  ['doDeleteContractAttachment', false, { contractAttachmentId: '999' }, undefined, false],
  ['doDeleteContractAttachment', true, { contractAttachmentId: '1' }, undefined, false],
  ['doDeleteContractAttachment', true, { contractAttachmentId: '1' }, undefined, true],
]) {
  setup()
  if (existing) helpers.addContractAttachment(initial, actor, shared)
  if (parentDeleted) database.prepare('UPDATE Contracts SET recordDelete_timeMillis=1 WHERE contractId=1').run()
  const response = { statusCode: 200, json(value) { this.body = value } }
  await handlers[name]({ body, ...(file ? { file: { ...file, buffer: Buffer.from('Synthetic uploaded file') } } : {}), session: { user: actor } }, response)
  handlerCases.push({ name, existing, body, file: file?.originalname ?? null, parentDeleted,
    expected: { status: response.statusCode, body: clean(response.body) }, files: [...files.keys()] })
}
const downloads = []
for (const state of ['active', 'deleted', 'missing', 'parentDeleted']) {
  setup()
  helpers.addContractAttachment(initial, actor, shared)
  if (state === 'deleted') helpers.deleteRecord('ContractAttachments', 1, actor, shared)
  if (state === 'parentDeleted') database.prepare('UPDATE Contracts SET recordDelete_timeMillis=1 WHERE contractId=1').run()
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this }, send() {}, sendFile(file, options) { this.file = file; this.headers = options.headers } }
  download({ params: { attachmentId: state === 'missing' ? '999' : '1' } }, response)
  downloads.push({ state, expected: { status: response.statusCode, ...(response.file ? { file: response.file, headers: response.headers } : {}) } })
}
// A real disk write additionally executes the original helper with native fs.
const actualRoot = path.join(work, 'physical')
const actualHelpers = { ...helpers, fs, path, getConfigProperty: () => actualRoot }
const physicalWriter = new AsyncFunction(...Object.keys(actualHelpers), strip(await source('helpers/attachments.helpers.js')) + '\nreturn writeAttachment;')(...Object.values(actualHelpers))
const physical = await physicalWriter
const physicalBytes = Buffer.from('Synthetic physical attachment\n')
const physicalResult = await physical('probe.txt', physicalBytes)
assert.deepEqual(await fs.readFile(path.join(physicalResult.filePath, physicalResult.fileName)), physicalBytes)
await fs.unlink(path.join(physicalResult.filePath, physicalResult.fileName))
database.close()
const result = JSON.parse(JSON.stringify({ reference_commit: commit, source_sha256: hashes, packages,
  fixed_local_time: '2026-10-20 09:05:42 Europe/Berlin', storage_path_model: 'POSIX (Ubuntu)',
  oracle_boundaries: ['Unchanged original function/handler bodies execute after import/export stripping. Original schema/audit writer/object difference execute.',
    'Storage naming cases use a byte-preserving virtual fs with POSIX paths; a separate original-helper native-fs write/read verifies physical bytes.',
    'Only handler getContract is an injected active-parent SQL lookup; the attachment readers and writes execute original SQL.',
    'Clock and config are fixed; audit snapshots omit record metadata except recordUpdate_username; API lists omit recordCreate_timeMillis from comparison.'],
  sanitizer, writes, defaults, initial, lifecycle, lifecycleAudit, handlers: handlerCases, downloads,
  physical_content_sha256: createHash('sha256').update(physicalBytes).digest('hex') }))
const fixture = path.join(root, 'backend/tests/fixtures/attachments-reference.json')
if (process.argv.includes('--write-fixture')) await fs.writeFile(fixture, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await fs.readFile(fixture, 'utf8')), result)
await fs.writeFile(path.join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: ${sanitizer.length} original sanitizer cases, ${writes.length} original writes, ${defaults.length} SQL defaults, ${lifecycle.length} lifecycle stages, ${handlerCases.length} handlers, ${downloads.length} downloads; ${Object.keys(hashes).length} source hashes and ${packages.length} lock archives; physical bytes verified`)
