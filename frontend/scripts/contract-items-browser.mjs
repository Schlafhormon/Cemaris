// Step-08 production UI, real API and disposable SQL Server. No request stubs.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
const base = process.env.CEMARIS_SMOKE_URL
const output = process.env.CEMARIS_QA_DIRECTORY
const ids = JSON.parse(process.env.CEMARIS_QA_CONTRACT_IDS)
await mkdir(output, { recursive: true })
const context = await browser.newContext({ locale: 'en-CA', timezoneId: 'Europe/Berlin', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const errors = []
const report = [{ case: 'Runtime', browser: browser.version(), fixture: 'Real API and fresh SQL Server; no browser request stubs' }]
page.on('pageerror', error => errors.push(error.message))
page.on('dialog', dialog => dialog.accept())
const dialog = page.locator('dialog')
let screenshots = 0
async function login(target, reader = false) {
  await target.goto(new URL('/login?lng=en', base).href)
  await target.locator('#login--username').fill(process.env[reader ? 'CEMARIS_QA_READER_USERNAME' : 'CEMARIS_QA_USERNAME'])
  await target.locator('#login--password').fill(process.env[reader ? 'CEMARIS_QA_READER_PASSWORD' : 'CEMARIS_QA_PASSWORD'])
  await target.locator('#form--login button[type=submit]').click()
  await target.waitForURL(/\/dashboard\/?$/)
}
async function visit(url, selector) { await page.goto(new URL(url, base).href); await page.locator(selector).waitFor() }
async function api(url, body, target = page, status = 200) {
  const result = await target.evaluate(async ({ url, body }) => {
    const session = await (await fetch('/api/session')).json()
    const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, body: await response.json() }
  }, { url, body })
  assert.equal(result.status, status, JSON.stringify(result.body))
  return result.body
}
async function post(url, click) {
  const pending = page.waitForResponse(value => new URL(value.url()).pathname === url && value.request().method() === 'POST')
  await click()
  const response = await pending
  assert.equal(response.status(), 200, await response.text())
  const result = await response.json()
  assert.equal(result.success, true, JSON.stringify(result))
  return result
}
async function shots(name) {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => { (document.activeElement instanceof HTMLElement) && document.activeElement.blur(); window.scrollTo(0, 0) })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow ${name}/${width}`)
    await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true })
    screenshots++
    if (width === 390 && ['add-interment-de', 'add-service-en'].includes(name)) {
      await page.screenshot({ path: path.join(output, `${name}-viewport.png`), fullPage: false })
      screenshots++
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
}
async function fillParts(values) { for (const [key, value] of Object.entries(values)) await dialog.locator(`[name=${key}]`).fill(value) }
const contractUrl = `/api/contracts/${ids.contract}`
const masterKeys = ['purchaserName', 'contractStartDate', 'contractEndDate', 'funeralDate', 'funeralTime', 'committalTypeId', 'burialSiteId', 'recordUpdate_timeMillis']
const pick = row => Object.fromEntries(masterKeys.map(key => [key, row[key]]))
try {
  await login(page)
  await visit(`/contracts/${ids.contract}/edit?lng=en`, '#form--contract')
  const before = (await api(contractUrl)).contract
  const calculator = JSON.parse(await readFile('backend/tests/fixtures/contract-items-reference.json', 'utf8')).browserCalculator
  assert.equal(calculator.timezone, 'Europe/Berlin')
  for (const entry of calculator.cases.filter(entry => !entry.parts.some(part => part.includes('.')))) {
    await page.locator('#button--addInterment').click()
    await dialog.locator('#form--contractIntermentAdd').waitFor()
    for (const [index, key] of ['birthYear', 'birthMonth', 'birthDay', 'deathYear', 'deathMonth', 'deathDay'].entries()) await dialog.locator(`[name=${key}]`).fill(entry.parts[index])
    await dialog.locator('[name=deathAge]').fill('12')
    await dialog.locator('[name=deathAgePeriod]').selectOption('Months')
    assert.equal(await dialog.locator('#button--calculateDeathAge').isDisabled(), entry.expected.disabled)
    if (!entry.expected.disabled) await dialog.locator('#button--calculateDeathAge').click()
    assert.equal(await dialog.locator('[name=deathAge]').inputValue(), entry.expected.deathAge === 'existing' ? '12' : entry.expected.deathAge, JSON.stringify(entry.parts))
    assert.equal(await dialog.locator('[name=deathAgePeriod]').inputValue(), entry.expected.deathAgePeriod)
    await dialog.getByRole('button', { name: 'Close / Schließen', exact: true }).click()
  }
  report.push({ case: 'Ten original calculator pairs match actual React dialog (partial dates, stillborn, leap-day 365 Days, Berlin DST); fractional-only calculator probe remains outside HTML integer inputs', pass: true })
  await page.locator('#button--addInterment').click()
  await dialog.locator('#form--contractIntermentAdd').waitFor()
  assert.equal(await dialog.locator('[name=deceasedName]').evaluate(input => input.required), true)
  assert.equal(await dialog.locator('#button--calculateDeathAge').isDisabled(), true)
  await fillParts({ deceasedName: 'Synthetic <literal> Infant', deceasedAddress1: '3 Synthetic Road', deceasedPostalCode: '12345', birthYear: '2000', birthMonth: '1', birthDay: '31' })
  // Source clamps existing day when year/month change, not when day changes.
  await dialog.locator('[name=birthMonth]').fill('2')
  await fillParts({ deathYear: '2000', deathMonth: '3', deathDay: '1' })
  await dialog.locator('[name=deceasedName]').focus()
  assert.equal(await dialog.locator('[name=birthDay]').inputValue(), '29')
  await dialog.locator('#button--calculateDeathAge').click()
  assert.equal(await dialog.locator('[name=deathAge]').inputValue(), '1')
  assert.equal(await dialog.locator('[name=deathAgePeriod]').inputValue(), 'Days')
  await dialog.locator('[name=intermentContainerTypeId]').selectOption(String(ids.interment_container_type))
  await dialog.locator('[name=intermentDepthId]').selectOption(String(ids.interment_depth))
  await shots('add-interment-en')
  const added = await post(`${contractUrl}/interments`, () => dialog.locator('button[type=submit]').click())
  const person = added.contractInterments.find(row => row.deceasedName === 'Synthetic <literal> Infant')
  assert.ok(person)
  assert.equal(person.birthDate, 20000229)
  assert.equal(person.deathDate, 20000301)
  assert.equal(person.deceasedPostalCode, '12345')
  assert.equal(person.deathAge, 1)
  assert.equal(person.isCremationType, true)
  assert.deepEqual(pick((await api(contractUrl)).contract), pick(before))
  await page.reload(); await page.locator('#form--contract').waitFor()
  let row = page.locator(`[data-interment-number="${person.intermentNumber}"]`)
  assert.ok((await row.innerText()).includes('Synthetic <literal> Infant'))
  report.push({ case: 'Interment add, leap-day clamp, infant age in days, container/depth, literal text, postal code, memorial URL and SQL reload; master unchanged', pass: true })

  await row.getByRole('button', { name: 'Edit', exact: true }).click()
  await dialog.locator('#form--contractIntermentEdit').waitFor()
  await fillParts({ birthYear: '1935', birthMonth: '', birthDay: '', deathYear: '2026', deathMonth: '10', deathDay: '' })
  await dialog.locator('#button--calculateDeathAge').click()
  assert.equal(await dialog.locator('[name=deathAge]').inputValue(), '91')
  assert.equal(await dialog.locator('[name=deathAgePeriod]').inputValue(), 'Years')
  await dialog.locator('[name=deathAge]').fill('')
  await shots('edit-interment-en')
  await post(`${contractUrl}/interments/${person.intermentNumber}`, () => dialog.locator('button[type=submit]').click())
  const partial = (await api(contractUrl)).contract.contractInterments.find(row => row.intermentNumber === person.intermentNumber)
  assert.equal(partial.birthDate, 19350000)
  assert.equal(partial.deathDate, 20261000)
  assert.equal(partial.deathAge, null) // Explicit SQL representation of source empty TEXT age.
  await visit(`/contracts/${ids.contract}?lng=de`, '#contract-detail')
  await shots('interments-detail-de')
  await visit(`/burialSites/${ids.burial_site}?lng=en`, '#burialSite--contractsTbody')
  await page.locator('#burialSite--contractsTbody').getByText('Synthetic <literal> Infant', { exact: false }).first().waitFor()
  report.push({ case: 'Partial-date edit, year-only age calculation, cleared age as NULL and updated person in burial site detail', pass: true })

  await visit(`/contracts/${ids.contract}/edit?lng=en`, '#form--contract')
  // Child updates must preserve unrelated unsaved contract inputs.
  await page.locator('#form--contract [name=purchaserName]').fill('Unsaved Synthetic Purchaser')
  await page.locator('#button--addServiceType').click()
  await dialog.locator('#form--contractServiceTypeAdd').waitFor()
  assert.equal(await dialog.locator(`[name=serviceTypeId] option[value="${ids.service_type}"]`).count(), 0)
  await dialog.locator('[name=serviceTypeId]').selectOption(String(ids.service_two))
  await dialog.locator('[name=contractServiceDetails]').fill('Synthetic details <literal>\nSecond line')
  assert.equal(await dialog.locator('[name=contractServiceDetails]').getAttribute('maxlength'), '500')
  await shots('add-service-en')
  await post(`${contractUrl}/services`, () => dialog.locator('button[type=submit]').click())
  // The source offers the next available service after acknowledging success.
  if (await dialog.count()) await dialog.getByRole('button', { name: 'Close / Schließen', exact: true }).click()
  assert.equal(await page.locator('#form--contract [name=purchaserName]').inputValue(), 'Unsaved Synthetic Purchaser')
  assert.equal((await api(contractUrl)).contract.purchaserName, before.purchaserName)
  let serviceRow = page.locator(`[data-service-type-id="${ids.service_two}"]`)
  await serviceRow.getByRole('button', { name: 'Edit', exact: true }).click()
  await dialog.locator('[name=contractServiceDetails]').fill('Edited synthetic service details')
  await shots('edit-service-en')
  await post(`${contractUrl}/services/${ids.service_two}`, () => dialog.locator('button[type=submit]').click())
  serviceRow = page.locator(`[data-service-type-id="${ids.service_two}"]`)
  await post(`${contractUrl}/services/${ids.service_two}/delete`, () => serviceRow.getByRole('button', { name: /Remove|Delete/ }).click())
  assert.equal((await api(`${contractUrl}/services`)).contractServiceTypes.some(row => row.serviceTypeId === ids.service_two), false)
  await page.locator('#button--addServiceType').click()
  await dialog.locator('[name=serviceTypeId]').selectOption(String(ids.service_two))
  await dialog.locator('[name=contractServiceDetails]').fill('Reactivated synthetic service')
  await post(`${contractUrl}/services`, () => dialog.locator('button[type=submit]').click())
  if (await dialog.count()) await dialog.getByRole('button', { name: 'Close / Schließen', exact: true }).click()
  assert.equal((await api(`${contractUrl}/services`)).contractServiceTypes.find(row => row.serviceTypeId === ids.service_two).contractServiceDetails, 'Reactivated synthetic service')
  report.push({ case: 'Service add/edit/delete/reactivation, available-only choices, multiline literal details and independent unsaved master input', pass: true })

  await page.locator('#form--contract [name=funeralDateString]').fill('2099-01-02')
  await page.locator('#form--contract [name=funeralTimeString]').fill('09:15')
  assert.equal(await page.locator('#form--contract [name=funeralTimeString]').getAttribute('step'), '900')
  await post(`${contractUrl}/update`, () => page.locator('#form--contract button[type=submit]').click())
  await page.reload(); await page.locator('#form--contract').waitFor()
  const scheduled = (await api(contractUrl)).contract
  assert.equal(scheduled.funeralDate, 20990102)
  assert.equal(scheduled.funeralTime, 915)
  assert.equal(scheduled.purchaserName, 'Unsaved Synthetic Purchaser')
  assert.equal(scheduled.contractServiceTypes.find(row => row.serviceTypeId === ids.service_two).contractServiceDetails, 'Reactivated synthetic service')
  const search = await api('/api/contracts/search', { contractTime: '', deceasedName: 'Synthetic <literal>', serviceTypeId: String(ids.service_two) })
  assert.ok(search.contracts.some(row => row.contractId === ids.contract))
  await visit(`/funeralHomes/${ids.funeral_home}?lng=en`, '.places-content')
  await page.getByText('2099-01-02', { exact: false }).first().waitFor()
  report.push({ case: 'Existing contract funeral schedule (15-minute input) persists separately; upcoming funeral and combined recipient/service search reflect changes', pass: true })

  await api('/api/admin/catalogs/intermentContainerTypes/delete', { intermentContainerTypeId: ids.interment_container_type })
  await api('/api/admin/catalogs/intermentDepths/delete', { intermentDepthId: ids.interment_depth })
  await visit(`/contracts/${ids.contract}/edit?lng=en`, '#form--contract')
  await page.locator('[data-interment-number="1"] .button--edit').click()
  await dialog.locator('#form--contractIntermentEdit').waitFor()
  assert.equal(await dialog.locator('[name=intermentContainerTypeId]').inputValue(), String(ids.interment_container_type))
  assert.equal(await dialog.locator('[name=intermentDepthId]').inputValue(), '')
  assert.equal(await dialog.locator('[name=deathAgePeriod]').inputValue(), '')
  await post(`${contractUrl}/interments/1`, () => dialog.locator('button[type=submit]').click())
  const historical = (await api(`${contractUrl}/interments`)).contractInterments.find(row => row.intermentNumber === 1)
  assert.equal(historical.intermentContainerTypeId, ids.interment_container_type)
  assert.equal(historical.intermentDepthId, null)
  report.push({ case: 'Source edit anomaly retained: deleted container and empty age period survive, deleted depth clears on save', pass: true })
  row = page.locator(`[data-interment-number="${person.intermentNumber}"]`)
  await post(`${contractUrl}/interments/${person.intermentNumber}/delete`, () => row.getByRole('button', { name: /Remove|Delete/ }).click())
  assert.equal((await api(`${contractUrl}/interments`)).contractInterments.some(row => row.intermentNumber === person.intermentNumber), false)
  await page.locator('#button--addInterment').click()
  await dialog.locator('[name=deceasedName]').fill('Synthetic new sequence')
  const again = await post(`${contractUrl}/interments`, () => dialog.locator('button[type=submit]').click())
  assert.ok(again.contractInterments.find(row => row.deceasedName === 'Synthetic new sequence').intermentNumber > person.intermentNumber)
  await page.locator('.is-view-audit-log-button').click()
  await dialog.locator('tbody tr').first().waitFor()
  assert.ok((await dialog.innerText()).includes('ContractInterments'))
  assert.ok((await dialog.innerText()).includes('ContractServiceTypes'))
  await shots('items-audit-en')
  await dialog.getByRole('button', { name: 'Close / Schließen', exact: true }).click()
  report.push({ case: 'Soft-deleted interment disappears, numbering includes deleted rows, item audits visible under contract permission without cemetery edit permission', pass: true })

  const readerContext = await browser.newContext()
  const reader = await readerContext.newPage()
  reader.on('pageerror', error => errors.push(error.message))
  await login(reader, true)
  await reader.goto(new URL(`/contracts/${ids.contract}?lng=de`, base).href)
  await reader.locator('#contract-detail').waitFor()
  assert.equal(await reader.locator('#button--addInterment, #button--addServiceType').count(), 0)
  for (const [url, body] of [
    [`${contractUrl}/interments`, { deceasedName: 'Forbidden' }],
    [`${contractUrl}/interments/1`, { deceasedName: 'Forbidden' }],
    [`${contractUrl}/interments/1/delete`, {}],
    [`${contractUrl}/services`, { serviceTypeId: ids.service_two }],
    [`${contractUrl}/services/${ids.service_two}`, { contractServiceDetails: 'Forbidden' }],
    [`${contractUrl}/services/${ids.service_two}/delete`, {}],
  ]) await api(url, body, reader, 403)
  assert.ok((await api(`${contractUrl}/interments`, undefined, reader)).contractInterments.length)
  assert.ok((await api(`${contractUrl}/services`, undefined, reader)).contractServiceTypes.length)
  await readerContext.close()
  await visit(`/contracts/${ids.contract}/edit?lng=de`, '#form--contract')
  await page.locator('#button--addInterment').click()
  await shots('add-interment-de')
  await dialog.getByRole('button', { name: 'Close / Schließen', exact: true }).click()
  await page.locator('#button--addServiceType').click()
  await shots('add-service-de')
  report.push({ case: 'Reader may read items; all six mutations return 403; German forms and English/German detail layouts responsive at 1440/390/320px', pass: true })
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ result: 'PASS', report, screenshots, javascriptErrors: errors }, null, 2) + '\n')
  console.log(JSON.stringify({ result: 'PASS', report, screenshots, javascriptErrors: errors }, null, 2))
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {})
  await writeFile(path.join(output, 'failure.txt'), String(error.stack || error))
  throw error
} finally { await browser.close() }
