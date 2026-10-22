// Run Sunrise's exact locked datetime package; downloads/extraction remain
// under Cemaris/.local. No installation or mutation of Sunrise-Referenz.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const reference = path.resolve(root, '../Sunrise-Referenz')
const commit = '451ce034863b16502484367044f3e9b65370111a'
assert.equal(execFileSync('git', ['-C', reference, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit)
const lock = JSON.parse(await readFile(path.join(reference, 'package-lock.json'), 'utf8'))
const packageName = '@cityssm/utils-datetime'
const info = lock.packages[`node_modules/${packageName}`]
const directory = path.join(root, '.local/datetime-reference')
await mkdir(directory, { recursive: true })
const archive = path.join(directory, 'package.tgz')
try { await access(archive) } catch {
  const response = await fetch(info.resolved)
  assert.ok(response.ok)
  await writeFile(archive, Buffer.from(await response.arrayBuffer()))
}
assert.equal(`sha512-${createHash('sha512').update(await readFile(archive)).digest('base64')}`, info.integrity)
execFileSync('tar', ['-xzf', archive, '-C', directory])
const helpers = await import(pathToFileURL(path.join(directory, 'package/index.js')).href)
const times = [0, 5, 30, 959, 1234, 1299, 2359, 2360, 2400, 2500, null].map(input => ({
  input, text: helpers.timeIntegerToString(input), period: helpers.timeIntegerToPeriodString(input),
}))
const calendars = ['2020-02-31', '2020-00-00', '0000-01-01', '2020-19-39', '2024-02-29', '2023-02-29'].map(input => {
  const expectedInteger = helpers.dateStringToInteger(input)
  return { input, expectedInteger, expectedString: helpers.dateIntegerToString(expectedInteger) }
})
const integerDates = [null, 0, 100, 101, 20261020, 20200231, 20200000, 20241939].map(input => ({ input, expected: helpers.dateIntegerToString(input) }))
const localDates = [[2026, 10, 20, 0, 0], [2026, 10, 20, 9, 5], [2026, 10, 20, 12, 34], [2026, 10, 20, 23, 59]].map(parts => {
  const [year, month, day, hour, minute] = parts
  const value = new Date(year, month - 1, day, hour, minute, 42)
  return { parts, expectedDate: helpers.dateToInteger(value), expectedTime: helpers.dateToTimeInteger(value) }
})
const invalidStrings = { dates: ['2020-1-01', '', 'bad', '2020-20-01'].map(input => ({ input, expected: helpers.dateStringToInteger(input) ?? null })),
  times: ['', '1:00', '24:00', '12:60', '12:34:00', 'bad'].map(input => ({ input, expected: helpers.timeStringToInteger(input) ?? null })) }
const result = { reference_commit: commit, package: { name: packageName, version: info.version, integrity: info.integrity }, times, calendars, integerDates, localDates, invalidStrings }
const fixture = path.join(root, 'backend/tests/fixtures/datetime-reference.json')
if (process.argv.includes('--write-fixture')) await writeFile(fixture, JSON.stringify(result, null, 2) + '\n')
if (process.argv.includes('--check-fixture')) assert.deepEqual(JSON.parse(await readFile(fixture, 'utf8')), result)
await writeFile(path.join(directory, 'result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: locked ${packageName} ${info.version}: ${times.length} time formats, ${calendars.length} calendar rollovers, ${integerDates.length} integer dates, ${localDates.length} HHMM dates and ${invalidStrings.dates.length + invalidStrings.times.length} rejected strings`)
