// Contract inline creation workflows against real API/SQL.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
const base = process.env.CEMARIS_SMOKE_URL
const output = process.env.CEMARIS_QA_DIRECTORY
const ids = JSON.parse(process.env.CEMARIS_QA_CONTRACT_IDS)
await mkdir(output, { recursive: true })
const context = await browser.newContext({ locale: 'en-CA', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const errors = []
const report = []
page.on('pageerror', error => errors.push(error.message))
page.on('dialog', dialog => dialog.accept())
const dialog = page.locator('dialog')
async function visit(url, selector) { await page.goto(new URL(url, base).href); await page.locator(selector).waitFor() }
async function api(url, body) {
  return page.evaluate(async ({ url, body }) => {
    const session = await (await fetch('/api/session')).json()
    const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  }, { url, body })
}
async function post(url, click) {
  const pending = page.waitForResponse(value => new URL(value.url()).pathname === url && value.request().method() === 'POST')
  await click()
  const response = await pending
  assert.equal(response.status(), 200, await response.text())
  return response.json()
}
try {
  await visit('/login?lng=en', '#form--login')
  await page.locator('#login--username').fill(process.env.CEMARIS_QA_USERNAME)
  await page.locator('#login--password').fill(process.env.CEMARIS_QA_PASSWORD)
  await page.locator('#form--login button[type=submit]').click()
  await page.waitForURL(/\/dashboard\/?$/)
  await visit(`/funeralHomes/${ids.funeral_home}/edit?lng=en`, '#form--funeralHome')
  await page.locator('[name=funeralHomePhoneNumber]').fill('000-1111')
  await post(`/api/funeral-homes/${ids.funeral_home}/update`, () => page.locator('#form--funeralHome button[type=submit]').click())
  report.push({ case: 'Funeral home contact update remains available', pass: true })

  await visit('/contracts/new?lng=en', '#form--contract')
  await page.locator('[name=contractTypeId]').selectOption(String(ids.contract_type))
  await page.locator('[name=purchaserName]').fill('Synthetic inline purchaser')
  await page.locator('[name=purchaserAddress1]').fill('10 Synthetic Road')
  await page.locator('[name=purchaserCity]').fill('Synthetic City')
  await page.locator('[name=purchaserProvince]').fill('Brandenburg')
  await page.locator('[name=purchaserPostalCode]').fill('01234')
  await page.getByRole('button', { name: 'Copy from Purchaser', exact: true }).click()
  assert.equal(await page.locator('[name=deceasedName]').inputValue(), 'Synthetic inline purchaser')
  assert.equal(await page.locator('[name=deceasedAddress1]').inputValue(), '10 Synthetic Road')
  for (const [key, value] of Object.entries({ birthYear: '2000', birthMonth: '2', birthDay: '31', deathYear: '2020', deathMonth: '2', deathDay: '29' })) await page.locator(`[name=${key}]`).fill(value)
  await page.locator('[name=deceasedName]').focus()
  assert.equal(await page.locator('[name=birthDay]').inputValue(), '29')
  await page.getByRole('button', { name: 'Calculate Age', exact: true }).click()
  assert.equal(await page.locator('[name=deathAge]').inputValue(), '20')
  await page.locator('[name=funeralHomeId]').selectOption('new')
  await page.locator('[name=funeralHomeName]').fill('Synthetic inline funeral')
  await page.locator('[name=funeralHomeCity]').fill('Synthetic City')
  await page.locator('[name=funeralHomeProvince]').fill('Brandenburg')
  await page.locator('[name=funeralHomePostalCode]').fill('d4e 5f6')
  await page.locator('#contract--burialSiteName').click()
  await dialog.getByRole('button', { name: 'Create New Burial Site', exact: true }).click()
  await dialog.locator('#burialSiteCreate--burialSiteTypeId').selectOption(String(ids.burial_site_type))
  await dialog.locator('#burialSiteCreate--cemeteryId').selectOption(String(ids.child_cemetery))
  await dialog.locator('[name=burialSiteNameSegment1]').fill('INLINE-03')
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => { (document.activeElement instanceof HTMLElement) && document.activeElement.blur(); window.scrollTo(0, 0) })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.screenshot({ path: path.join(output, `inline-site-picker-${width}.png`), fullPage: true })
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  const site = await post('/api/burialSites/doCreateBurialSite', () => dialog.locator('#form--burialSiteCreate button[type=submit]').click())
  assert.equal(await page.locator('[name=burialSiteId]').inputValue(), String(site.burialSiteId))
  const created = await post('/api/contracts', () => page.locator('#form--contract button[type=submit]').click())
  await page.waitForURL(new RegExp(`/contracts/${created.contractId}/edit`))
  await page.reload()
  await page.locator('#form--contract').waitFor()
  const result = (await api(`/api/contracts/${created.contractId}`)).contract
  assert.equal(result.funeralHomeName, 'Synthetic inline funeral')
  assert.equal(result.funeralHomePostalCode, 'D4E 5F6')
  assert.equal(result.burialSiteName, 'INLINE-03')
  assert.equal(result.contractInterments[0].birthDate, 20000229)
  assert.equal(result.contractInterments[0].deathDate, 20200229)
  assert.equal(result.contractInterments[0].deathAge, 20)
  assert.equal(result.contractInterments[0].deceasedPostalCode, '01234')
  await visit(`/contracts/${created.contractId}?lng=en`, '#contract-detail')
  report.push({ case: 'Inline new home/site, purchaser copy, leap-day normalization, age calculation, complete dates', pass: true })
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ result: 'PASS', report, javascriptErrors: errors, screenshots: 3 }, null, 2) + '\n')
  console.log(JSON.stringify({ result: 'PASS', report, javascriptErrors: errors }, null, 2))
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {})
  await writeFile(path.join(output, 'failure.txt'), String(error.stack || error))
  throw error
} finally { await browser.close() }
