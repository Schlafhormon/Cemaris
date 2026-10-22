// Step-12 production React, real reports/dashboard API and disposable SQL Server.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
const base = process.env.CEMARIS_SMOKE_URL, output = process.env.CEMARIS_QA_DIRECTORY
const ids = JSON.parse(process.env.CEMARIS_QA_REPORT_IDS)
await mkdir(output, { recursive: true })
const context = await browser.newContext({ locale: 'en-CA', timezoneId: 'Europe/Berlin', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage(), errors = [], report = []
page.on('pageerror', error => errors.push(error.message))
let screenshots = 0
async function login(target, reader = false) {
  await target.goto(new URL('/login?lng=en', base).href)
  await target.locator('#login--username').fill(process.env[reader ? 'CEMARIS_QA_READER_USERNAME' : 'CEMARIS_QA_USERNAME'])
  await target.locator('#login--password').fill(process.env[reader ? 'CEMARIS_QA_READER_PASSWORD' : 'CEMARIS_QA_PASSWORD'])
  await target.locator('#form--login button[type=submit]').click()
  await target.waitForURL(/\/dashboard\/?$/)
}
async function visit(url, selector) { await page.goto(new URL(url, base).href); await page.locator(selector).waitFor() }
async function shots(name, target = page) {
  for (const width of [1440, 390, 320]) {
    await target.setViewportSize({ width, height: 1000 })
    await target.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur(); window.scrollTo(0, 0) })
    assert.equal(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}/${width}: page overflow`)
    await target.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true }); screenshots++
  }
  await target.setViewportSize({ width: 1440, height: 1000 })
}
async function download(locator, name, target = page) {
  const pending = target.waitForEvent('download')
  await locator.click()
  const result = await pending
  assert.match(result.suggestedFilename(), new RegExp(`^${name}-\\d+\\.csv$`))
  const saved = path.join(output, result.suggestedFilename()); await result.saveAs(saved)
  return (await readFile(saved)).toString('utf8')
}
async function updatesDone(target = page) { await target.locator('#loading--updateLog').waitFor({ state: 'hidden' }) }
try {
  await login(page)
  await page.locator('a.card-title[href="/reports"]').waitFor()
  await shots('dashboard-en')
  await page.locator('a.card-title[href="/reports"]').click()
  await page.locator('#report-panel form').first().waitFor()
  const metadata = await (await context.request.get(new URL('/api/reports', base).href)).json()
  assert.equal(metadata.reportNames.length, 45)
  assert.equal(metadata.simpleReports.length, 36)
  await page.locator('#contracts-current-byCemeteryId--cemeteryId').selectOption(String(ids.child_cemetery))
  let csv = await download(page.locator('[data-report="contracts-current-byCemeteryId"] button'), 'contracts-current-byCemeteryId')
  assert.match(csv, /TEST-2026-001/)
  await page.locator('#contractTransactions-byTransactionDateString--transactionDateString').fill('2026-10-19')
  csv = await download(page.locator('[data-report="contractTransactions-byTransactionDateString"] button'), 'contractTransactions-byTransactionDateString')
  assert.match(csv, /220.35825/)
  await download(page.locator('[data-report="contractInterments-directory"]'), 'contractInterments-directory')
  for (const query of ['tab=unknown', 'tab=', 'tab=contracts&tab=workOrders']) {
    await page.goto(new URL(`/reports?${query}`, base).href)
    await page.locator('#report-panel').waitFor({ state: 'attached' })
    assert.equal(await page.locator('#report-panel .report-download, #report-panel form').count(), 0)
    assert.equal(await page.locator('[role=tab][aria-selected=true]').count(), 0)
  }
  for (const language of ['en', 'de']) {
    for (const tab of ['contracts', 'workOrders', 'cemeteries', 'dataTableExports', 'configTableExports']) {
      await visit(`/reports/?tab=${tab}&lng=${language}`, '#report-panel')
      assert.equal(await page.locator(`#report-tab--${tab}`).getAttribute('aria-selected'), 'true')
      if (tab === 'dataTableExports') assert.equal(await page.locator('.report-download').count(), 19)
      if (tab === 'configTableExports') assert.equal(await page.locator('.report-download').count(), 14)
      await shots(`reports-${tab}-${language}`)
    }
  }
  await visit('/reports?tab=cemeteries&lng=en', '#report-panel')
  csv = await download(page.locator('[data-report="cemeteries-formatted"]'), 'cemeteries-formatted')
  assert.match(csv, /"Synthetic, ""Cemetery"" 🪦"/)
  for (const reportName of ['burialSites-byCemeteryId', 'burialSites-byBurialSiteTypeId', 'burialSites-byBurialSiteStatusId']) {
    if (reportName === 'burialSites-byCemeteryId') await page.locator('#burialSites-byCemeteryId--cemeteryId').selectOption(String(ids.child_cemetery))
    csv = await download(page.locator(`[data-report="${reportName}"] button`), reportName)
    assert.match(csv, /burialSiteName/)
  }
  await visit('/reports?tab=workOrders', '#report-panel')
  csv = await download(page.locator('[data-report="workOrders-open"]'), 'workOrders-open')
  assert.match(csv, /TEST-WO-001/)
  await visit(`/contracts/${ids.contract}`, '#container--contractInterments')
  csv = await download(page.locator('#container--contractInterments a[download]'), 'contractInterments-byContractId')
  assert.match(csv, /deceasedName/)
  await visit(`/workOrders/${ids.work_order}/edit`, '#panel--milestones')
  csv = await download(page.locator('#panel--milestones a[href*="/api/reports/"]'), 'workOrderMilestones-byWorkOrderId')
  assert.match(csv, /workOrderMilestoneCompletionTime/)
  await visit('/funeralHomes', 'a[href="/api/reports/funeralHomes-formatted"]')
  await download(page.locator('a[href="/api/reports/funeralHomes-formatted"]'), 'funeralHomes-formatted')
  report.push({ case: '45 reports registered; all five library tabs; nine library exports; contract/milestone/bestatter CSV actions and Unicode/quotes', pass: true })
  // The legacy public CSV URL reaches the backend through the same-origin proxy.
  const legacy = await context.request.get(new URL('/reports/cemeteries-formatted', base).href)
  assert.equal(legacy.status(), 200); assert.match(legacy.headers()['content-type'], /text\/csv/)
  assert.equal(await legacy.text(), await (await context.request.get(new URL('/api/reports/cemeteries-formatted', base).href)).text())
  const missing = await context.request.get(new URL('/api/reports/unknown', base).href)
  assert.equal(missing.status(), 404); assert.deepEqual(await missing.json(), { success: false, message: 'Report Not Found' })
  await page.locator('#navbar--quickSearch').click()
  await page.locator('#form--quickSearchContract').waitFor()
  assert.equal(await page.locator('#quickSearchContract--searchValue').evaluate(element => element === document.activeElement), true)
  assert.equal(await page.locator('#quickSearchContract--searchField').inputValue(), 'contractNumber')
  await page.locator('#quickSearchContract--searchValue').fill('TEST-2026-001')
  await shots('quick-search-en')
  await page.locator('#form--quickSearchContract button[type=submit]').click()
  await page.waitForURL(/contracts\/\?contractNumber=TEST-2026-001/)
  const contactToggle = page.locator('[data-cy="contact-filters-toggle"]')
  await contactToggle.click()
  await page.locator('#searchFilter--purchaserName').fill('Synthetic retained filter')
  await contactToggle.click()
  assert.equal(await page.locator('#contract-contact-filters').isVisible(), false)
  await contactToggle.click()
  assert.equal(await page.locator('#searchFilter--purchaserName').inputValue(), 'Synthetic retained filter')
  await page.locator('#navbar--quickSearch').click()
  await page.locator('#quickSearchContract--searchField').selectOption('deceasedName')
  await page.locator('#quickSearchContract--searchValue').fill('Muster & 🪦')
  await page.locator('#form--quickSearchContract button[type=submit]').click()
  assert.equal(new URL(page.url()).searchParams.get('deceasedName'), 'Muster & 🪦')
  await page.locator('#navbar--quickSearch').click()
  await page.locator('#quickSearchWorkOrder--workOrderNumber').fill('TEST-WO-001')
  await page.locator('#form--quickSearchWorkOrder button[type=submit]').click()
  await page.waitForURL(new RegExp(`/workOrders/${ids.work_order}$`))
  await visit('/dashboard/updateLog?lng=en', '#table--updateLog')
  await updatesDone()
  await page.locator('#filter--limit').selectOption('10'); await updatesDone()
  assert.equal(await page.locator('#table--updateLog tbody tr').count(), 10)
  await page.locator('#button--updateLogLoadMore').click(); await updatesDone()
  assert.equal(await page.locator('#table--updateLog tbody tr').count(), 20)
  await page.locator('#filter--recordType').selectOption('comments'); await updatesDone()
  assert.match(await page.locator('#table--updateLog tbody').innerText(), /Synthetic recent comment/)
  assert.equal(await page.locator('#table--updateLog script').count(), 0)
  await page.locator('#header--created button').click(); await updatesDone()
  assert.equal(await page.locator('#header--created').getAttribute('aria-sort'), 'descending')
  await page.locator('#header--created button').click(); await updatesDone()
  assert.equal(await page.locator('#header--created').getAttribute('aria-sort'), 'ascending')
  await shots('update-log-en')
  await visit('/dashboard/updateLog?lng=de', '#table--updateLog'); await updatesDone(); await shots('update-log-de')
  await visit('/dashboard?lng=de', 'a.card-title[href="/reports"]'); await shots('dashboard-de')
  const noCsrf = await context.request.post(new URL('/api/dashboard/doGetRecordUpdateLog', base).href, { data: {} })
  assert.equal(noCsrf.status(), 403)
  const readerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const reader = await readerContext.newPage(); reader.on('pageerror', error => errors.push(error.message))
  await login(reader, true)
  await reader.goto(new URL('/reports', base).href); await reader.locator('#report-panel').waitFor()
  await reader.locator('#report-tab--dataTableExports').click(); await reader.locator('[data-report="contracts-all"]').waitFor()
  csv = await download(reader.locator('[data-report="contracts-all"]'), 'contracts-all', reader)
  assert.match(csv, /TEST-2026-001/)
  await reader.goto(new URL('/dashboard/updateLog', base).href); await reader.locator('#table--updateLog').waitFor(); await updatesDone(reader)
  assert.ok(await reader.locator('#table--updateLog tbody tr').count() > 0)
  assert.equal(await reader.locator('a[href="/admin/auditLog"]').count(), 0)
  await readerContext.close()
  const anonymous = await browser.newContext()
  assert.equal((await anonymous.request.get(new URL('/api/reports/contracts-all', base).href)).status(), 401)
  assert.equal((await anonymous.request.get(new URL('/api/dashboard', base).href)).status(), 401)
  await anonymous.close()
  report.push({ case: 'Update log pagination/type/sort/literal text, source reader rights, anonymous and CSRF rejection, exact unknown CSV response and legacy URL', pass: true })
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ screenshots, errors, report }, null, 2))
  console.log(JSON.stringify({ pass: true, screenshots, errors, report }, null, 2))
} finally { await browser.close() }
