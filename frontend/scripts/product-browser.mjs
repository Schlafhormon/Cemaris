// Product acceptance against a real API and a disposable SQL Server database.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright')
const base = process.env.CEMARIS_SMOKE_URL
const output = process.env.CEMARIS_QA_DIRECTORY
const ids = JSON.parse(process.env.CEMARIS_QA_CONTRACT_IDS || '{}')
const mount = new URL(base).pathname.replace(/\/$/, '')
const url = route => new URL(mount + route, base).href
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
// A German browser receives German; query and cookie language choices remain supported.
const context = await browser.newContext({ locale: 'de-DE', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const errors = []
const report = []
page.on('pageerror', error => errors.push(error.message))
page.on('dialog', dialog => dialog.accept())
async function visit(route, selector = 'main h1') { await page.goto(url(route)); await page.locator(selector).first().waitFor() }
async function cleanProductPage() {
  assert.doesNotMatch(await page.locator('main').innerText(), /ConsignO|Find.?a.?Grave|Dynamics GP|Diamond|ntfy|Sunrise|Sync with Portal/i)
  assert.equal(await page.locator('a[href*="sunrise-cms"]').count(), 0)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
}
try {
  await visit('/login', '#form--login')
  assert.equal(await page.locator('html').getAttribute('lang'), 'de')
  assert.equal(await page.locator('#language').inputValue(), 'de')
  assert.equal(await page.getByRole('link', { name: /hilfe|help/i }).count(), 0)
  await cleanProductPage()
  report.push('German interface in a fresh German browser; no inherited help links')
  await page.locator('#login--username').fill(process.env.CEMARIS_QA_USERNAME)
  await page.locator('#login--password').fill(process.env.CEMARIS_QA_PASSWORD)
  await page.locator('#form--login button[type=submit]').click()
  await page.waitForURL(new RegExp(`${mount}/dashboard/?$`))
  await page.locator('.dashboard-cards').first().waitFor()
  await cleanProductPage()
  await visit('/dashboard?error=accessDenied')
  assert.match(await page.locator('.notification.danger').innerText(), /Zugriff verweigert/ )
  await visit('/dashboard?error=unknown')
  assert.match(await page.locator('.notification.danger').innerText(), /Anfrage.*Server/ )

  await visit('/dashboard/userSettings')
  assert.equal(await page.locator('.notification.warning').filter({ hasText: /unvollständig|incomplete/i }).count(), 0)
  await cleanProductPage()
  await visit('/admin/settings', '.settings-table')
  await page.locator('.settings-table label').filter({ hasText: 'Bezeichnungen – Belegnummer' }).waitFor()
  await page.locator('#language').selectOption('en')
  await page.locator('.settings-table label').filter({ hasText: 'Aliases - External Receipt Number' }).waitFor()
  await page.locator('#language').selectOption('de')
  await page.locator('.settings-table label').filter({ hasText: 'Bezeichnungen – Belegnummer' }).waitFor()
  await cleanProductPage()

  await visit('/cemeteries/new', '#form--cemetery')
  const cemeteryPostal = page.locator('[name=cemeteryPostalCode]')
  await cemeteryPostal.fill('12345')
  assert.equal(await cemeteryPostal.evaluate(input => input.checkValidity()), true)
  await cemeteryPostal.fill('A1B2C')
  assert.equal(await cemeteryPostal.evaluate(input => input.checkValidity()), false)
  assert.equal(await page.locator('[name=cemeteryProvince]').getAttribute('maxlength'), '100')
  assert.equal(await page.locator('[name=cemeteryCity]').getAttribute('maxlength'), '100')
  await cleanProductPage()

  await visit('/contracts/new', '#form--contract')
  const postal = page.locator('[name=purchaserPostalCode]')
  for (const value of ['01234', '1234', 'SW1A1AA']) {
    await postal.fill(value)
    assert.equal(await postal.evaluate(input => input.checkValidity()), true, value)
  }
  assert.equal(await page.locator('[name=purchaserProvince]').getAttribute('maxlength'), '100')
  assert.equal(await page.locator('[name=purchaserCity]').getAttribute('maxlength'), '100')
  assert.match(await page.locator('[name=deathAgePeriod]').innerText(), /Jahre/)
  assert.doesNotMatch(await page.locator('[name=deathAgePeriod]').innerText(), /Years|Stillborn/)
  await cleanProductPage()
  report.push('German addresses and age units; international contact postcodes remain accepted')

  if (ids.contract) {
    await visit(`/contracts/${ids.contract}`, '#container--contractFees')
    const amounts = await page.locator('#container--contractFees .finance-number').allTextContents()
    assert.ok(amounts.some(value => /\d+,\d{2}\s*€/.test(value)), 'German contract amounts use euro and decimal commas')
    assert.ok(amounts.every(value => !value.includes('$')))
    assert.doesNotMatch(await page.locator('main').innerText(), /\b2026-10-21\b/)
    await cleanProductPage()
  }
  await visit('/reports?tab=configTableExports', '#report-panel')
  assert.doesNotMatch((await page.locator('.report-download').allTextContents()).join(' '), /Burial Site|Contract Type|Work Order|Fee Categories|Interment Container/i)
  await cleanProductPage()
  await visit('/workOrders/milestoneCalendar', '.work-order-calendar')
  assert.match(await page.locator('.work-order-calendar th').first().innerText(), /^Mo/)
  for (const route of ['/help', '/contracts/orderForms']) {
    await visit(route)
    assert.match(await page.locator('main h1').innerText(), /nicht gefunden/i)
  }
  report.push('German report names, Monday calendar and removed help/portal routes')

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await visit('/dashboard')
    await cleanProductPage()
    await page.screenshot({ path: path.join(output, `cemaris-product-de-${width}.png`), fullPage: true })
  }
  assert.deepEqual(errors, [])
  const logoutStatus = await page.evaluate(async endpoint => {
    const session = await (await fetch(endpoint + '/api/session')).json()
    return (await fetch(endpoint + '/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken }, body: '{}' })).status
  }, new URL(mount, base).href.replace(/\/$/, ''))
  assert.equal(logoutStatus, 200)
  await writeFile(path.join(output, 'product-result.json'), JSON.stringify({ result: 'PASS', report, javascriptErrors: errors }, null, 2) + '\n')
  console.log(JSON.stringify({ result: 'PASS', report, javascriptErrors: errors }, null, 2))
} finally { await context.close(); await browser.close() }
