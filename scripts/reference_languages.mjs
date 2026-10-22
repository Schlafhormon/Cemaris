// Run the exact locked i18next detector without installing/changing Sunrise.
// npm tarballs are integrity-checked and extracted only below Cemaris/.local.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = path.resolve(root, '../Sunrise-Referenz')
const commit = '451ce034863b16502484367044f3e9b65370111a'
assert.equal(execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit)
const lock = JSON.parse(await readFile(path.join(reference, 'package-lock.json'), 'utf8'))
const modules = path.join(root, '.local/language-reference')
const packages = {}
for (const name of ['i18next', 'i18next-http-middleware']) {
  const info = lock.packages[`node_modules/${name}`]
  const destination = path.join(modules, name)
  await mkdir(destination, { recursive: true })
  const archive = path.join(destination, 'package.tgz')
  try { await access(archive) } catch {
    const response = await fetch(info.resolved)
    assert.ok(response.ok)
    await writeFile(archive, Buffer.from(await response.arrayBuffer()))
  }
  const data = await readFile(archive)
  assert.equal(`sha512-${createHash('sha512').update(data).digest('base64')}`, info.integrity)
  execFileSync('tar', ['-xzf', archive, '-C', destination])
  packages[name] = { version: info.version, integrity: info.integrity }
}
const { default: i18next } = await import(pathToFileURL(path.join(modules, 'i18next/package/dist/esm/i18next.js')).href)
const { default: Detector } = await import(pathToFileURL(path.join(modules, 'i18next-http-middleware/package/esm/LanguageDetector.js')).href)
await i18next.init({ fallbackLng: 'en', supportedLngs: ['en', 'de'], resources: { en: {}, de: {} } })
const detector = new Detector(i18next.services, {
  order: ['querystring', 'cookie', 'header'], lookupCookie: 'i18next', lookupQuerystring: 'lng',
}, { fallbackLng: 'en' })
const inputs = [
  {}, { query: 'de', cookie: 'en', header: 'en-US' }, { cookie: 'de', header: 'en-US' },
  { query: 'fr', cookie: 'de', header: 'en-US' }, { query: 'fr', header: 'de' },
  { query: 'en-US', cookie: 'de' }, { query: 'de-DE', cookie: 'en' },
  { query: 'DE' }, { query: 'de_DE' }, { query: 'en_GB', cookie: 'de' },
  { query: 'de<script>', cookie: 'en' }, { query: 'de/DE', cookie: 'en' },
  { query: 'de..DE', cookie: 'en' }, { query: 'de\\DE', cookie: 'en' },
  { header: 'de-DE,de;q=0.9,en;q=0.8' }, { header: 'de-DE,en;q=0.8' },
  { header: 'de;q=0.1,en;q=0.9' }, { header: 'de;q=0,en;q=1' },
  { header: 'de;q=0' }, { header: 'fr;q=1,de;q=0' }, { header: 'en-US;q=1,de;q=0.1' },
  { header: 'fr' }, { header: 'de-CH;q=0.9,en-GB;q=0.8' }, { header: '*' },
  { cookie: 'en-US', header: 'de' }, { cookie: 'de-CH', header: 'en' },
  { query: 'en', cookie: 'de' }, { query: 'de-CH', cookie: 'en' },
  { header: 'de;q=invalid,en;q=0.3' }, { header: 'en;q=0.1,de-DE;q=1' },
]
const cases = inputs.map(input => {
  const request = { query: input.query ? { lng: input.query } : {}, cookies: input.cookie ? { i18next: input.cookie } : {},
    headers: input.header ? { 'accept-language': input.header } : {}, url: '/' }
  return { ...input, expected: detector.detect(request, {}) }
})
const result = { reference_commit: commit, packages, cases }
const fixture = path.join(root, 'backend/tests/fixtures/language-reference.json')
if (process.argv.includes('--write-fixture')) await writeFile(fixture, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await readFile(fixture, 'utf8')), result)
console.log(`PASS: ${cases.length} language detection cases from locked original packages`)
