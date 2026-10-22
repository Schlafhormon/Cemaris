// Execute Sunrise's exact locked multer.memoryStorage()/single('file') boundary.
// Archives resolve by package-lock paths, including nested dependency versions.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { PassThrough } from 'node:stream'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = path.resolve(root, '../Sunrise-Referenz')
const commit = '451ce034863b16502484367044f3e9b65370111a'
assert.equal(execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit)
const work = path.join(root, '.local/reference-upload-multipart')
await fs.mkdir(work, { recursive: true })
const hashes = {}
async function source(name) {
  const bytes = await fs.readFile(path.join(reference, name))
  hashes[name] = createHash('sha256').update(bytes).digest('hex')
  return bytes.toString('utf8')
}
const lock = JSON.parse(await source('package-lock.json'))
const route = await source('routes/contracts.js')
await source('routes/contracts.ts')
assert.ok(route.includes("storage: multer.memoryStorage()"))
assert.ok(route.includes("upload.single('file')"))
assert.ok(route.includes("getConfigProperty('application.maxAttachmentFileSize') * 1024 * 1024"))
const installed = new Set()
const packages = []
function dependencyPath(parent, name) {
  let directory = parent
  while (directory !== '.') {
    const candidate = path.posix.join(directory, 'node_modules', name)
    if (lock.packages[candidate]) return candidate
    directory = path.posix.dirname(directory)
  }
  const candidate = 'node_modules/' + name
  assert.ok(lock.packages[candidate], `Unresolved ${name} from ${parent}`)
  return candidate
}
async function install(key) {
  if (installed.has(key)) return
  installed.add(key)
  const info = lock.packages[key]
  const archive = path.join(work, key.replaceAll('/', '_') + '-' + info.version + '.tgz')
  try { await fs.access(archive) } catch {
    const response = await fetch(info.resolved)
    assert.ok(response.ok, info.resolved)
    await fs.writeFile(archive, Buffer.from(await response.arrayBuffer()))
  }
  const bytes = await fs.readFile(archive)
  const [algorithm, integrity] = info.integrity.split('-')
  assert.equal(createHash(algorithm).update(bytes).digest('base64'), integrity, key)
  const destination = path.join(work, key)
  await fs.mkdir(destination, { recursive: true })
  execFileSync('tar', ['-xzf', archive, '-C', destination, '--strip-components=1'])
  packages.push({ path: key, version: info.version, integrity: info.integrity })
  for (const name of Object.keys(info.dependencies ?? {}).sort()) await install(dependencyPath(key, name))
}
await install('node_modules/multer')
const require = createRequire(path.join(work, 'probe.cjs'))
const multer = require('multer')
const boundary = 'CemarisSyntheticBoundary11'
const cases = [
  { name: 'missing-file', fields: { contractId: '1', attachmentTitle: 'Synthetic title' }, files: [] },
  { name: 'binary-bytes', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'report.bin', content_hex: '000102ff807f0d0a253c3e', content_type: 'application/octet-stream' }] },
  { name: 'metadata', fields: { contractId: '1', attachmentTitle: '', attachmentDetails: '<literal>\nGrüße 🪦' }, files: [{ field: 'file', filename: 'report.txt', content_hex: '53796e746865746963', content_type: 'text/plain' }] },
  { name: 'multiple-files', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'one.txt', content_hex: '31' }, { field: 'file', filename: 'two.txt', content_hex: '32' }] },
  { name: 'unexpected-field', fields: { contractId: '1' }, files: [{ field: 'other', filename: 'other.txt', content_hex: '31' }] },
  { name: 'exact-limit', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'exact.bin', content_hex: '78'.repeat(32) }] },
  { name: 'below-limit', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'below.bin', content_hex: '78'.repeat(31) }] },
  { name: 'over-limit', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'over.bin', content_hex: '78'.repeat(33) }] },
  { name: 'zero-byte', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'empty.txt', content_hex: '' }] },
  { name: 'empty-filename', fields: { contractId: '1' }, files: [{ field: 'file', filename: '', content_hex: '' }] },
  { name: 'unicode-filename', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'Grüße 🪦.pdf', content_hex: '255044462d312e340a', content_type: 'application/pdf' }] },
  { name: 'unfiltered-type', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'program.exe', content_hex: '4d5a', content_type: 'application/x-msdownload' }] },
  { name: 'chunked-body', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'chunked.txt', content_hex: '53796e746865746963' }], chunk_size: 7, chunked: true },
  { name: 'windows-basename', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'C:\\folder\\report.pdf', content_hex: '31' }] },
  { name: 'posix-basename', fields: { contractId: '1' }, files: [{ field: 'file', filename: '../folder/report.pdf', content_hex: '31' }] },
  { name: 'posix-empty-basename', fields: { contractId: '1' }, files: [{ field: 'file', filename: '../folder/', content_hex: '31' }] },
  { name: 'windows-empty-basename', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'C:\\folder\\', content_hex: '31' }] },
  { name: 'escaped-quote-filename', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'quote%22name.txt', content_hex: '31' }] },
  { name: 'literal-percent-filename', fields: { contractId: '1' }, files: [{ field: 'file', filename: '50%.txt', content_hex: '31' }] },
  { name: 'escaped-newline-filename', fields: { contractId: '1' }, files: [{ field: 'file', filename: 'first%0Asecond.txt', content_hex: '31' }] },
]
function multipart(item) {
  const buffers = []
  for (const [name, value] of Object.entries(item.fields)) buffers.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`))
  for (const file of item.files) buffers.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\nContent-Type: ${file.content_type ?? 'application/octet-stream'}\r\n\r\n`), Buffer.from(file.content_hex, 'hex'), Buffer.from('\r\n'))
  buffers.push(Buffer.from(`--${boundary}--\r\n`))
  return Buffer.concat(buffers)
}
async function parse(item) {
  const body = multipart(item)
  const request = new PassThrough()
  request.method = 'POST'
  request.headers = { 'content-type': `multipart/form-data; boundary=${boundary}`,
    ...(item.chunked ? { 'transfer-encoding': 'chunked' } : { 'content-length': String(body.length) }) }
  const middleware = multer({ storage: multer.memoryStorage(), limits: { fileSize: 32 } }).single('file')
  let timer
  const completion = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Multer callback timed out: ${item.name}`)), 5000)
    middleware(request, {}, error => {
    resolve({ fields: { ...request.body }, file: request.file ? { fieldname: request.file.fieldname,
      originalname: request.file.originalname, mimetype: request.file.mimetype, size: request.file.size,
      ...(Buffer.isBuffer(request.file.buffer) ? { content_hex: request.file.buffer.toString('hex'),
        content_sha256: createHash('sha256').update(request.file.buffer).digest('hex') } : { buffer_removed: true }) } : null,
    ...(error ? { error: { name: error.name, code: error.code ?? null, field: error.field ?? null, message: error.message } } : {}) })
    })
  }).finally(() => clearTimeout(timer))
  const chunkSize = item.chunk_size ?? body.length
  for (let offset = 0; offset < body.length; offset += chunkSize) request.write(body.subarray(offset, offset + chunkSize))
  request.end()
  return completion
}
for (const item of cases) item.expected = await parse(item)
const result = { reference_commit: commit, source_sha256: hashes, packages: packages.sort((a, b) => a.path.localeCompare(b.path)),
  file_size_limit_bytes: 32, boundary,
  oracle_boundaries: ['Actual locked multer memoryStorage single(file) middleware runs unchanged on PassThrough HTTP-shaped multipart streams.',
    'The original configured limit formula is asserted in its route; its byte limit is scaled to 32 for below/exact/above comparisons.',
    'No Express response handler, authentication, file storage, database or external service is exercised here.'], cases }
const fixture = path.join(root, 'backend/tests/fixtures/upload-multipart-reference.json')
if (process.argv.includes('--write-fixture')) await fs.writeFile(fixture, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await fs.readFile(fixture, 'utf8')), result)
await fs.writeFile(path.join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: ${cases.length} original multer multipart cases, ${packages.length} exact lock archives verified; ${cases.filter(item => item.expected.error).length} parser failures captured`)
