// Step-07 UI/API/SQL QA. Run through scripts/qa_contracts_browser.py.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

for (const key of ['CEMARIS_QA_USERNAME', 'CEMARIS_QA_PASSWORD', 'CEMARIS_QA_READER_USERNAME', 'CEMARIS_QA_READER_PASSWORD', 'CEMARIS_QA_DIRECTORY', 'CEMARIS_QA_CONTRACT_IDS']) assert.ok(process.env[key], `Missing ${key}`)
const { chromium } = await import(process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
const base = process.env.CEMARIS_SMOKE_URL ?? 'http://127.0.0.1:4173/'
const output = process.env.CEMARIS_QA_DIRECTORY
const ids = JSON.parse(process.env.CEMARIS_QA_CONTRACT_IDS)
await mkdir(output, { recursive: true })
const context = await browser.newContext({ locale: 'en-CA', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const errors = []
const report = [{ case: 'Runtime', browser: browser.version(), fixture: 'All application requests use real API and disposable SQL Server' }]
page.on('pageerror', error => errors.push(error.message))
page.on('dialog', dialog => dialog.accept())
const dialog = page.locator('dialog')
const prefix = `Synthetic ${Date.now()}`
async function login(target, reader = false) {
  await target.goto(new URL('/login?lng=en', base).href)
  await target.locator('#login--username').fill(process.env[reader ? 'CEMARIS_QA_READER_USERNAME' : 'CEMARIS_QA_USERNAME'])
  await target.locator('#login--password').fill(process.env[reader ? 'CEMARIS_QA_READER_PASSWORD' : 'CEMARIS_QA_PASSWORD'])
  await target.locator('#form--login button[type=submit]').click()
  await target.waitForURL(/\/dashboard\/?$/)
}
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
  return response.json()
}
async function visit(url, selector) {
  await page.goto(new URL(url, base).href)
  await page.locator(selector).waitFor()
}
async function shots(name, url, selector) {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    if (url) await visit(url, selector)
    await page.evaluate(() => { (document.activeElement instanceof HTMLElement) && document.activeElement.blur(); window.scrollTo(0, 0) })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow ${name}/${width}`)
    await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true })
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
}

try {
  await login(page)
  await visit('/funeralHomes/new?lng=en', '#form--funeralHome')
  for (const [key, value] of Object.entries({ funeralHomeName: `${prefix} Funeral`, funeralHomeAddress1: '1 Synthetic Road', funeralHomeAddress2: 'Literal <safe> %_', funeralHomeCity: 'Synthetic City', funeralHomeProvince: 'Brandenburg', funeralHomePostalCode: '12345', funeralHomePhoneNumber: '000-0000' })) await page.locator(`[name=${key}]`).fill(value)
  const homeCreated = await post('/api/funeral-homes', () => page.locator('#form--funeralHome button[type=submit]').click())
  const homeId = homeCreated.funeralHomeId
  await page.waitForURL(new RegExp(`/funeralHomes/${homeId}/edit`))
  await page.reload()
  await page.locator('#form--funeralHome').waitFor()
  assert.equal(await page.locator('[name=funeralHomePostalCode]').inputValue(), '12345')
  await page.locator('[name=funeralHomeName]').fill(`${prefix} Edited`)
  await post(`/api/funeral-homes/${homeId}/update`, () => page.locator('#form--funeralHome button[type=submit]').click())
  assert.equal((await api(`/api/funeral-homes/${homeId}`)).funeralHome.funeralHomeName, `${prefix} Edited`)
  report.push({ case: 'Funeral home create/edit, five-digit postal code, fresh SQL reload, literal address', pass: true })

  await visit(`/contracts/${ids.contract}?lng=en`, '.contract-recipient')
  assert.ok((await page.locator('main').innerText()).includes('Übungsperson Gamma'))
  assert.ok((await page.locator('main').innerText()).includes('Testgebühr'))
  await shots('contract-detail-de', `/contracts/${ids.contract}?lng=de`, '.contract-recipient')
  await visit(`/contracts/${ids.contract}/edit?lng=en`, '#form--contract')
  const blocked = page.waitForResponse(value => value.url().includes(`/api/contracts/${ids.contract}/delete`))
  await page.locator('#button--deleteContract').click()
  assert.equal((await blocked).status(), 400)
  await page.locator('[role=alert]').waitFor()
  assert.equal((await api(`/api/contracts/${ids.contract}`)).contract.contractId, ids.contract)
  report.push({ case: 'Existing child data displayed, open work order blocks deletion', pass: true })

  await visit(`/contracts/new?burialSiteId=${ids.burial_site}&lng=en`, '#form--contract')
  assert.equal(await page.locator('[name=burialSiteId]').inputValue(), String(ids.burial_site))
  await page.locator('[name=contractTypeId]').selectOption(String(ids.contract_type))
  await page.locator(`[name=contractFieldValue_${ids.contract_type_field}]`).fill('Creation source anomaly')
  for (const [key, value] of Object.entries({ purchaserName: `${prefix} Purchaser`, purchaserAddress1: '2 Synthetic Road', purchaserCity: 'Synthetic City', purchaserProvince: 'Brandenburg', purchaserPostalCode: '54321', purchaserEmail: 'qa@example.invalid', purchaserRelationship: 'Synthetic relative', deceasedName: `${prefix} Recipient`, birthYear: '1935', deathYear: '2026', deathMonth: '10' })) await page.locator(`[name=${key}]`).fill(value)
  await page.locator('[name=funeralHomeId]').selectOption(String(homeId))
  await page.locator('[name=funeralDirectorName]').fill('Synthetic Director')
  await page.locator('[name=funeralDateString]').fill('2099-01-02')
  await page.locator('[name=funeralTimeString]').fill('09:15')
  await page.locator('[name=committalTypeId]').selectOption(String(ids.committal_type))
  await shots('contract-new-en')
  const created = await post('/api/contracts', () => page.locator('#form--contract button[type=submit]').click())
  const contractId = created.contractId
  await page.waitForURL(new RegExp(`/contracts/${contractId}/edit`))
  await page.reload()
  await page.locator('#form--contract').waitFor()
  assert.equal(await page.locator('[name=purchaserPostalCode]').inputValue(), '54321')
  // Executed original source dynamically names create fields differently from its INSERT helper.
  assert.equal(await page.locator(`[name=fieldValue_${ids.contract_type_field}]`).inputValue(), '')
  await page.locator(`[name=fieldValue_${ids.contract_type_field}]`).fill('Persisted after edit')
  await page.getByRole('button', { name: 'Unlock Field: Burial Site', exact: true }).click()
  await page.locator('#contract--burialSiteName').click()
  await dialog.locator('#burialSiteSelect--contractStatus').selectOption('')
  await dialog.locator('#burialSiteSelect--burialSiteName').fill('QA-A-02')
  await dialog.locator('.contract-picker-row').filter({ hasText: 'QA-A-02' }).click()
  await page.locator('[name=directionOfArrival]').selectOption('N')
  await post(`/api/contracts/${contractId}/update`, () => page.locator('#form--contract button[type=submit]').click())
  await page.reload()
  await page.locator('#form--contract').waitFor()
  const stored = (await api(`/api/contracts/${contractId}`)).contract
  assert.equal(stored.burialSiteId, ids.second_site)
  assert.equal(stored.contractFields[0].fieldValue, 'Persisted after edit')
  assert.equal(stored.contractInterments[0].birthDate, 19350000)
  assert.equal(stored.contractInterments[0].deathDate, 20261000)
  assert.equal(stored.funeralTime, 915)
  report.push({ case: 'Contract create with participant/partial dates, source create-field anomaly, edit fields, burial picker/directions and SQL reload', pass: true })

  await page.locator('#button--addComment').click()
  await dialog.locator('[name=comment]').fill('Synthetic comment <literal & safe>')
  const commented = await post('/api/contracts/doAddContractComment', () => dialog.locator('button[type=submit]').click())
  let commentRow = page.locator('tr').filter({ hasText: 'Synthetic comment <literal & safe>' })
  await commentRow.getByRole('button', { name: 'Edit', exact: true }).click()
  await dialog.locator('[name=comment]').fill('Edited synthetic comment')
  await dialog.locator('[name=commentDateString]').fill('2026-01-02')
  await dialog.locator('[name=commentTimeString]').fill('00:00')
  await post('/api/contracts/doUpdateContractComment', () => dialog.locator('button[type=submit]').click())
  commentRow = page.locator('tr').filter({ hasText: 'Edited synthetic comment' })
  await post('/api/contracts/doDeleteContractComment', () => commentRow.getByRole('button', { name: 'Delete', exact: true }).click())
  assert.equal(commented.contractComments.length, 1)
  assert.equal((await api(`/api/contracts/${contractId}`)).contract.contractComments.length, 0)

  await page.locator('#button--addRelatedContract').click()
  await dialog.locator('#relatedContractSelect--burialSiteName').fill('')
  await dialog.locator(`[data-contract-id="${ids.contract}"]`).getByRole('button', { name: 'Select', exact: true }).click()
  const related = (await api(`/api/contracts/${ids.contract}`)).contract.relatedContracts
  assert.ok(related.some(row => row.contractId === contractId))
  await page.locator('.is-view-audit-log-button').click()
  await dialog.locator('tbody tr').first().waitFor()
  assert.ok((await dialog.locator('tbody').innerText()).includes('Contracts'))
  await shots('contract-audit-en')
  await dialog.getByRole('button', { name: 'Close / Schließen', exact: true }).click()
  report.push({ case: 'Comment create/edit/delete, symmetric related contract selection and record audit dialog', pass: true })

  const copied = await post(`/api/contracts/${contractId}/copy`, () => page.locator('#button--copyContract').click())
  const copyId = copied.contractId
  await page.waitForURL(new RegExp(`/contracts/${copyId}/edit`))
  await page.locator('#form--contract').waitFor()
  const copy = (await api(`/api/contracts/${copyId}`)).contract
  assert.notEqual(copy.contractNumber, stored.contractNumber)
  assert.equal(copy.contractEndDate, null)
  assert.equal(copy.directionOfArrival, '')
  assert.equal(copy.committalTypeId, null)
  assert.equal(copy.contractFields[0].fieldValue, 'Persisted after edit')
  assert.equal(copy.contractInterments[0].birthDate, 19350000)
  assert.equal(copy.contractComments.length, 1)
  assert.equal(copy.relatedContracts[0].contractId, contractId)
  const relatedRow = page.locator(`[data-contract-id="${contractId}"]`)
  await post('/api/contracts/doDeleteRelatedContract', () => relatedRow.getByRole('button', { name: 'Delete', exact: true }).click())
  assert.equal((await api(`/api/contracts/${copyId}`)).contract.relatedContracts.length, 0)
  await shots('contract-edit-de', `/contracts/${copyId}/edit?lng=de`, '#form--contract')
  report.push({ case: 'Copy number/reset/partial dates/field preservation/comment and symmetric unlink', pass: true })

  await visit('/contracts?deceasedName=Recipient&lng=en', '#searchFilter--deceasedName')
  assert.equal(await page.locator('#searchFilter--deceasedName').inputValue(), 'Recipient')
  await page.locator('#container--searchResults tbody tr').first().waitFor()
  assert.equal(await page.locator('#searchFilter--cemeteryId').isVisible(), false)
  await page.locator('[data-cy=location-filters-toggle]').click()
  assert.equal(await page.locator('#searchFilter--cemeteryId').isVisible(), true)
  await shots('contract-search-en')
  await visit(`/contracts?cemeteryId=${ids.child_cemetery}&lng=de`, '#searchFilter--cemeteryId')
  assert.equal(await page.locator('#searchFilter--cemeteryId').isVisible(), true)

  // Bestatter guard must observe the contract saved by the browser.
  await api(`/api/funeral-homes/${homeId}/delete`, {}, page, 400)
  await visit(`/contracts/${copyId}/edit?lng=en`, '#form--contract')
  await post(`/api/contracts/${copyId}/delete`, () => page.locator('#button--deleteContract').click())
  await page.waitForURL(/\/contracts\/?$/)
  await api(`/api/contracts/${copyId}`, undefined, page, 404)
  await visit(`/contracts/${contractId}/edit?lng=en`, '#form--contract')
  await post(`/api/contracts/${contractId}/delete`, () => page.locator('#button--deleteContract').click())
  await page.waitForURL(/\/contracts\/?$/)
  await visit(`/funeralHomes/${homeId}/edit?lng=en`, '#form--funeralHome')
  await post(`/api/funeral-homes/${homeId}/delete`, () => page.locator('#button--deleteFuneralHome').click())
  await page.waitForURL(/\/funeralHomes\/?$/)
  await visit(`/funeralHomes/${homeId}?lng=en`, '#button--restoreFuneralHome')
  await post(`/api/funeral-homes/${homeId}/restore`, () => page.locator('#button--restoreFuneralHome').click())
  await page.locator(`a[href="/funeralHomes/${homeId}/edit"]`).waitFor()
  await shots('funeral-view-de', `/funeralHomes/${homeId}?lng=de`, '.contract-address')
  await shots('funeral-edit-en', `/funeralHomes/${homeId}/edit?lng=en`, '#form--funeralHome')

  const readerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-CA' })
  const reader = await readerContext.newPage()
  reader.on('pageerror', error => errors.push(error.message))
  await login(reader, true)
  await reader.goto(new URL(`/contracts/${ids.contract}?lng=en`, base).href)
  await reader.locator('.contract-recipient').waitFor()
  assert.equal(await reader.locator(`a[href="/contracts/${ids.contract}/edit"]`).count(), 0)
  assert.equal(await reader.locator('#button--addComment').count(), 0)
  await api('/api/contracts', {}, reader, 403)
  await api(`/api/contracts/${ids.contract}/copy`, {}, reader, 403)
  await api('/api/funeral-homes', {}, reader, 403)
  await api(`/api/funeral-homes/${homeId}/restore`, {}, reader, 403)
  await reader.goto(new URL('/contracts/new?lng=en', base).href)
  await reader.waitForURL(/\/dashboard\/?\?error=accessDenied$/)
  await readerContext.close()
  report.push({ case: 'Search query prefills and collapsible filters, delete guards, soft delete/restore, independent reader controls/API denial', pass: true })
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ result: 'PASS', screenshots: 'see PNGs', report, javascriptErrors: errors }, null, 2) + '\n')
  console.log(JSON.stringify({ result: 'PASS', report, javascriptErrors: errors }, null, 2))
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {})
  await writeFile(path.join(output, 'failure.txt'), String(error.stack || error))
  throw error
} finally {
  await browser.close()
}
