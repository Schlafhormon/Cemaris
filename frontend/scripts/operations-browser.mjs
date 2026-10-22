// Step 15: production React, real admin API, native backup and disposable SQL.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
const base = process.env.CEMARIS_SMOKE_URL, output = process.env.CEMARIS_QA_DIRECTORY
const ids = JSON.parse(process.env.CEMARIS_QA_OPERATIONS_IDS)
await mkdir(output, { recursive: true })
const context = await browser.newContext({ locale: 'en-CA', timezoneId: 'Europe/Berlin', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage(), errors = [], report = [], confirms = []
let screenshots = 0, decision = 'accept', cleanupRequests = 0
page.on('pageerror', error => errors.push(error.message))
page.on('dialog', async dialog => { confirms.push(dialog.message()); await dialog[decision]() })
page.on('request', request => { if (request.url().includes('/doCleanupDatabase')) cleanupRequests++ })
const dialog = page.locator('dialog')
async function login(target, reader = false) {
  await target.goto(new URL('/login?lng=en', base).href)
  await target.locator('#login--username').fill(process.env[reader ? 'CEMARIS_QA_READER_USERNAME' : 'CEMARIS_QA_USERNAME'])
  await target.locator('#login--password').fill(process.env[reader ? 'CEMARIS_QA_READER_PASSWORD' : 'CEMARIS_QA_PASSWORD'])
  await target.locator('#form--login button[type=submit]').click()
  await target.waitForURL(/\/dashboard\/?$/)
}
async function api(url, body, target = page, expected = 200, csrf = true) {
  const result = await target.evaluate(async ({ url, body, csrf }) => {
    const session = await (await fetch('/api/session')).json()
    const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': session.csrfToken } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, body: await response.json() }
  }, { url, body, csrf })
  assert.equal(result.status, expected, JSON.stringify(result.body))
  return result.body
}
async function visit(url, selector) { await page.goto(new URL(url, base).href); await page.locator(selector).waitFor() }
async function auditDone() { await page.locator('#container--auditLog[aria-busy="false"]').waitFor() }
async function filter(selector, value, select = false) {
  const response = page.waitForResponse(item => item.url().includes('/api/admin/doGetAuditLog') && item.request().method() === 'POST')
  if (select) await page.locator(selector).selectOption(value)
  else await page.locator(selector).fill(value)
  await response; await auditDone()
}
async function shots(name) {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur(); window.scrollTo(0, 0) })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}/${width}: page overflow`)
    if (await dialog.count()) assert.equal(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, `${name}/${width}: dialog overflow`)
    await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true }); screenshots++
    if (width < 500 && await dialog.count()) {
      await dialog.locator('.actions').last().scrollIntoViewIfNeeded()
      const box = await dialog.locator('.actions').last().boundingBox()
      assert.ok(box && box.y >= 0 && box.y + box.height <= 1000, `${name}/${width}: actions inaccessible`)
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
}
async function purgeAge(age, expected) {
  await page.locator('#button--purgeAuditLog').click()
  await dialog.locator('#purge--age').selectOption(age)
  const response = page.waitForResponse(item => item.url().includes('/api/admin/doPurgeAuditLog'))
  await dialog.locator('button[type=submit]').click()
  const result = await (await response).json()
  assert.deepEqual(result, { success: true, purgedCount: expected })
  await dialog.waitFor({ state: 'hidden' }); await auditDone()
  await page.locator('.notification.success').filter({ hasText: String(expected) }).waitFor()
}
try {
  await login(page)
  const databaseInfo = await api('/api/admin/database')
  assert.equal(databaseInfo.backupTaskIsEnabled, false)
  assert.equal(databaseInfo.recordDeleteAgeDays, 60)
  assert.equal(databaseInfo.auditLogEnabled, true)
  for (const language of ['en', 'de']) {
    await visit(`/admin/database?lng=${language}`, '#button--backupDatabase')
    assert.match(await page.title(), /Cemaris/)
    await page.locator('.admin-menu a[href="/admin/auditLog"]').waitFor()
    await shots(`database-${language}`)
  }
  decision = 'dismiss'
  await page.locator('#button--cleanupDatabase').click()
  assert.equal(cleanupRequests, 0)
  assert.match(confirms.at(-1), /bereinigen/)
  decision = 'accept'
  const backupResponse = page.waitForResponse(item => item.url().includes('/api/admin/doBackupDatabase'), { timeout: 360000 })
  await page.locator('#button--backupDatabase').click()
  const backup = await (await backupResponse).json()
  assert.equal(backup.success, true, JSON.stringify(backup))
  assert.match(backup.fileName, /^cemaris-.+\.bak$/)
  await writeFile(path.join(output, 'backup-result.json'), JSON.stringify({ databaseName: process.env.CEMARIS_QA_OPERATIONS_DATABASE, fileName: backup.fileName }, null, 2) + '\n')
  await page.locator('.notification.success').filter({ hasText: backup.fileName }).waitFor()
  assert.equal(await page.locator('#database--lastBackup').innerText(), 'Gerade eben')
  await shots('database-backup-de')
  assert.ok((await api('/api/admin/database')).lastBackupDateString)
  const cleanupResponse = page.waitForResponse(item => item.url().includes('/api/admin/doCleanupDatabase'))
  await page.locator('#button--cleanupDatabase').click()
  const cleanup = await (await cleanupResponse).json()
  assert.ok(cleanup.purgedRecordCount >= 2, JSON.stringify(cleanup))
  await page.locator('.notification.success').filter({ hasText: 'endgültig gelöscht' }).waitFor()
  await shots('database-cleanup-de')
  assert.deepEqual(await api('/api/admin/doCleanupDatabase', {}), { inactivatedRecordCount: 0, purgedRecordCount: 0 })
  report.push({ case: 'Native SQL backup with CHECKSUM/VERIFYONLY, last-backup refresh, DE/EN maintenance panels, cancel/confirm and real old comment/attachment cleanup plus idempotent rerun', pass: true, backupFile: backup.fileName, cleanup })

  await visit('/admin/auditLog?lng=en', '#form--auditLogFilters')
  await auditDone()
  const all = await api('/api/admin/doGetAuditLog', { limit: 50, offset: 0 })
  assert.equal(all.count, 58)
  assert.equal(await page.locator('.audit-table tbody tr').count(), 50)
  assert.equal(await page.locator('#filter--mainRecordType option').count(), 17)
  assert.equal(await page.locator('.audit-table tbody tr').first().locator('td').nth(4).innerText(), 'null')
  const raw = process.env.CEMARIS_QA_AUDIT_LONG_VALUE
  const value = page.locator('.audit-table tbody tr').first().locator('td').nth(5).locator('code')
  assert.equal(await value.getAttribute('title'), raw)
  assert.equal(await value.innerText(), raw.slice(0, 100) + '…')
  assert.equal(await page.locator('.audit-table tbody tr').first().locator('td').nth(1).locator('a').getAttribute('href'), `/contracts/${ids.contract}`)
  assert.equal(await page.locator('.audit-table script').count(), 0)
  assert.ok(await page.locator('.audit-created').count())
  assert.ok(await page.locator('.audit-deleted').count())
  assert.ok(await page.locator('.audit-updated').count())
  await shots('audit-en')
  const next = page.waitForResponse(item => item.url().includes('/api/admin/doGetAuditLog'))
  await page.locator('[data-page="next"]').click(); await next; await auditDone()
  assert.equal(await page.locator('.audit-table tbody tr').count(), 8)
  assert.equal(await page.locator('[data-page="next"]').isDisabled(), true)
  const previous = page.waitForResponse(item => item.url().includes('/api/admin/doGetAuditLog'))
  await page.locator('[data-page="previous"]').click(); await previous; await auditDone()
  assert.equal(await page.locator('.audit-table tbody tr').count(), 50)
  await filter('#filter--updateUsername', 'Needle')
  assert.equal(await page.locator('.audit-table tbody tr').count(), 1)
  assert.match(await page.locator('.audit-table tbody').innerText(), /NeedleUserÄ/)
  await filter('#filter--updateUsername', 'Missing synthetic username')
  await page.getByText('No audit log entries found.', { exact: true }).waitFor()
  await filter('#filter--updateUsername', '')
  await filter('#filter--mainRecordType', 'burialSite', true)
  assert.equal(await page.locator('.audit-table tbody tr').count(), 27)
  await filter('#filter--mainRecordType', '', true)
  const date = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })
  await filter('#filter--logDateFrom', date)
  await filter('#filter--logDateTo', date)
  assert.match(await page.locator('.administration-pager').innerText(), /55/)
  await filter('#filter--logDateFrom', '')
  await filter('#filter--logDateTo', '')
  report.push({ case: 'All 16 source record types, first/next/previous page, username substring/no results, type and inclusive date filters, exact JSON/raw values, null, 100-char truncation/title, record links and color classes', pass: true })

  for (const language of ['en', 'de']) {
    await visit(`/admin/auditLog?lng=${language}`, '#form--auditLogFilters'); await auditDone()
    if (language === 'de') await shots('audit-de')
    await page.locator('#button--purgeAuditLog').click()
    assert.deepEqual(await dialog.locator('#purge--age option').evaluateAll(nodes => nodes.map(node => node.value)), ['thirtyDays', 'ninetyDays', 'oneYear', 'all'])
    await shots(`audit-purge-${language}`)
    await dialog.getByRole('button', { name: 'Close / Schließen', exact: true }).click()
  }
  assert.equal((await api('/api/admin/doPurgeAuditLog', { age: 'invalid' }, page, 400)).success, false)
  assert.equal((await api('/api/admin/doGetAuditLog', {})).count, 58)
  for (const name of ['doBackupDatabase', 'doCleanupDatabase', 'doGetAuditLog', 'doPurgeAuditLog']) {
    await api(`/api/admin/${name}`, name === 'doPurgeAuditLog' ? { age: 'all' } : {}, page, 403, false)
  }
  const readerContext = await browser.newContext(), reader = await readerContext.newPage()
  await login(reader, true)
  for (const name of ['database', 'auditLog']) await api(`/api/admin/${name}`, undefined, reader, 403)
  for (const name of ['doBackupDatabase', 'doCleanupDatabase', 'doGetAuditLog', 'doPurgeAuditLog']) await api(`/api/admin/${name}`, name === 'doPurgeAuditLog' ? { age: 'all' } : {}, reader, 403)
  await reader.goto(new URL('/admin/database', base).href)
  await reader.waitForURL(/dashboard\/?\?error=accessDenied/)
  await readerContext.close()
  const anonymous = await browser.newContext(), anonPage = await anonymous.newPage()
  await anonPage.goto(base); await api('/api/admin/database', undefined, anonPage, 401); await anonymous.close()
  report.push({ case: 'EN/DE purge dialog ages/cancel, invalid purge request preserves entries, CSRF on every POST, reader admin-page/API denial and anonymous protection', pass: true })

  await purgeAge('oneYear', 1)
  await purgeAge('ninetyDays', 1)
  await purgeAge('thirtyDays', 1)
  await purgeAge('all', 55)
  assert.equal((await api('/api/admin/doGetAuditLog', {})).count, 0)
  await page.getByText('Keine Auditprotokolleinträge gefunden.', { exact: true }).waitFor()
  await shots('audit-empty-de')
  report.push({ case: 'Actual SQL age-based purges at 365/90/30 days and everything, success messages, refreshed counts and empty state', pass: true })
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'browser-results.json'), JSON.stringify({ result: 'PASS', screenshots, report, errors, confirms }, null, 2) + '\n')
  console.log(JSON.stringify({ result: 'PASS', screenshots, cases: report.length, errors: errors.length }))
} finally {
  await browser.close()
}
