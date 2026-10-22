// Inspect the exact locked Sunrise form serializer in a real browser. Archives
// remain under Cemaris/.local; the immutable reference is only read.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = path.resolve(root, '../Sunrise-Referenz')
assert.equal(execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), '451ce034863b16502484367044f3e9b65370111a')
const lock = JSON.parse(await readFile(path.join(reference, 'package-lock.json'), 'utf8'))
const info = lock.packages['node_modules/@cityssm/bulma-webapp-js']
const directory = path.join(root, '.local/catalog-forms')
await mkdir(directory, { recursive: true })
const archive = path.join(directory, 'package.tgz')
try { await access(archive) } catch {
  const response = await fetch(info.resolved)
  assert.ok(response.ok)
  await writeFile(archive, Buffer.from(await response.arrayBuffer()))
}
const bytes = await readFile(archive)
assert.equal(`sha512-${createHash('sha512').update(bytes).digest('base64')}`, info.integrity)
const source = execFileSync('tar', ['-xOf', archive, 'package/src/cityssm.js'], { encoding: 'utf8' })
const specifier = process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright'
const { chromium } = await import(specifier)
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
try {
  const page = await browser.newPage()
  await page.setContent('<meta name="csrf-token" content="synthetic-token"><form><input name="fieldType" value="text"><textarea name="fieldValues" disabled>historical\nchoices</textarea><input name="minLength" value="3"><input name="maxLength" value="100"><input name="pattern" value="[A-Z]+"></form>')
  await page.addScriptTag({ content: source })
  const cases = await page.evaluate(async () => {
    globalThis.fetch = async (_url, options) => ({ json: async () => JSON.parse(options.body) })
    const form = document.querySelector('form')
    const send = () => new Promise(resolve => globalThis.cityssm.postJSON('/synthetic', form, resolve))
    const text = await send()
    form.elements.fieldType.value = 'date'
    for (const name of ['minLength', 'maxLength', 'pattern']) form.elements[name].disabled = true
    const date = await send()
    form.elements.fieldType.value = 'select'
    form.elements.fieldValues.disabled = false
    const select = await send()
    return { text, date, select }
  })
  assert.deepEqual(cases, {
    text: { fieldType: 'text', minLength: '3', maxLength: '100', pattern: '[A-Z]+' },
    date: { fieldType: 'date' },
    select: { fieldType: 'select', fieldValues: 'historical\nchoices' },
  })
  await writeFile(path.join(directory, 'result.json'), JSON.stringify({ package: info.version, integrity: info.integrity, cases }, null, 2) + '\n')
  console.log(`PASS: 3 original form serializer cases, @cityssm/bulma-webapp-js ${info.version}; disabled fields omitted`)
} finally { await browser.close() }
