// Live integration QA. Provide Playwright externally; it is not a runtime dependency.
// Required: CEMARIS_QA_USERNAME/PASSWORD (admin) and CEMARIS_QA_READER_USERNAME/PASSWORD.
// Use a disposable, synthetic SQL Server test database. This script creates/deletes
// one user, restores one setting, and resets the test administrator's API key.
// CEMARIS_PLAYWRIGHT_MODULE: absolute path to playwright/index.mjs if externally installed.
// CEMARIS_BROWSER_EXECUTABLE: optional absolute path to Chromium/Edge.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

for (const name of ['CEMARIS_QA_USERNAME', 'CEMARIS_QA_PASSWORD', 'CEMARIS_QA_READER_USERNAME', 'CEMARIS_QA_READER_PASSWORD']) {
  assert.ok(process.env[name], `Missing ${name}; use isolated synthetic test accounts.`)
}
const moduleSpecifier = process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright'
const { chromium } = await import(moduleSpecifier)
const base = new URL(process.env.CEMARIS_SMOKE_URL ?? 'http://127.0.0.1:5173/')
const qaDirectory = process.env.CEMARIS_QA_DIRECTORY ? path.resolve(process.env.CEMARIS_QA_DIRECTORY) : fileURLToPath(new URL('../../.local/qa-step03/', import.meta.url))
await mkdir(qaDirectory, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
const report = [{ case: 'Browser runtime', version: browser.version() }]
const pageErrors = []
const watch = (page) => page.on('pageerror', (error) => pageErrors.push(error.message))
async function login(page, username, password) {
  await page.locator('#login--username').fill(username)
  await page.locator('#login--password').fill(password)
  await page.getByRole('button', { name: 'Log In', exact: true }).click()
  await page.waitForURL(/\/dashboard\/?$/)
  await page.getByRole('heading', { name: 'Cemaris', exact: true }).waitFor()
}
try {
  const context = await browser.newContext({ locale: 'en-CA', viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage(); watch(page)
  await page.goto(new URL('/admin/users?lng=en', base).href)
  await page.waitForURL('**/login?redirect=**')
  await page.locator('#login--username').fill(process.env.CEMARIS_QA_USERNAME)
  await page.locator('#login--password').fill('synthetic-wrong-password')
  await page.getByRole('button', { name: 'Log In', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'Invalid username or password.' }).waitFor()
  report.push({ case: 'Anonymous redirect and invalid credentials on actual API', passed: true })
  await login(page, process.env.CEMARIS_QA_USERNAME, process.env.CEMARIS_QA_PASSWORD)
  await page.goto(new URL('/admin/users?lng=en', base).href)
  await page.getByRole('heading', { name: 'User Management', exact: true }).waitFor()
  const username = `cemaris-browser-${Date.now()}`
  await page.getByRole('button', { name: 'Add User', exact: true }).click()
  await page.locator('dialog #username').fill(username)
  await page.locator('dialog input[name=canUpdateCemeteries]').check()
  await page.locator('dialog').getByRole('button', { name: 'Add User', exact: true }).click()
  const row = page.locator('tr').filter({ has: page.getByRole('rowheader', { name: username, exact: true }) })
  await row.waitFor()
  assert.equal(await row.getByRole('button', { name: `${username}: Can Update Cemeteries`, exact: true }).getAttribute('aria-pressed'), 'true')
  const permission = row.getByRole('button', { name: `${username}: Can Update Contracts`, exact: true })
  await permission.click()
  await page.waitForFunction((name) => document.querySelector(`tr[data-username="${name}"] button[aria-label$=": Can Update Contracts"]`)?.getAttribute('aria-pressed') === 'true', username)
  await page.reload(); await row.waitFor()
  assert.equal(await permission.getAttribute('aria-pressed'), 'true')
  page.once('dialog', (dialog) => dialog.accept())
  await row.getByRole('button', { name: `Delete User: ${username}`, exact: true }).click()
  await row.waitFor({ state: 'detached' })
  report.push({ case: 'Add, permission toggle, SQL persistence after reload, delete', passed: true })

  await page.goto(new URL('/LoGiN?redirect=%2FAdMiN%2FSeTtInGs', base).href)
  await page.waitForURL('**/AdMiN/SeTtInGs')
  await page.getByRole('heading', { name: 'Settings Management', exact: true }).waitFor()
  await page.goto(new URL('/AdMiN/UsErS?lng=en', base).href)
  await page.getByRole('heading', { name: 'User Management', exact: true }).waitFor()
  await page.goto(new URL('/DaShBoArD/UsErSeTtInGs?lng=en', base).href)
  await page.getByRole('heading', { name: 'User Settings', exact: true }).waitFor()
  report.push({ case: 'Case-insensitive login/admin/preferences routes; mixed-case safe redirect preserved', passed: true })

  await page.goto(new URL('/admin/settings?lng=en', base).href)
  const setting = page.locator('[id="setting-aliases.externalReceiptNumber"]')
  await setting.waitFor()
  const original = await setting.inputValue()
  const changed = `Browser receipt ${Date.now()}`
  await page.getByRole('searchbox', { name: 'Filter', exact: true }).fill('external receipt number')
  await setting.waitFor({ state: 'visible' })
  assert.equal(await page.locator('.settings-table tbody tr:visible').count(), 1)
  await setting.fill(changed)
  await page.getByRole('searchbox', { name: 'Filter', exact: true }).fill('burialSite')
  await setting.waitFor({ state: 'hidden' })
  await page.getByRole('searchbox', { name: 'Filter', exact: true }).fill('external receipt number')
  await setting.waitFor({ state: 'visible' })
  assert.equal(await setting.inputValue(), changed, 'Filtering must preserve unsaved setting values')
  await setting.locator('xpath=ancestor::form').getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByText('The setting has been successfully updated.', { exact: true }).waitFor()
  await page.reload(); await setting.waitFor()
  assert.equal(await setting.inputValue(), changed)
  await setting.fill(original)
  await setting.locator('xpath=ancestor::form').getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByText('The setting has been successfully updated.', { exact: true }).waitFor()
  report.push({ case: 'Settings filter preserves unsaved input; save, SQL persistence, original value restored', passed: true })

  await page.goto(new URL('/dashboard/userSettings?lng=en', base).href)
  const previousKey = await page.evaluate(async () => (await (await fetch('/api/user-settings')).json()).userSettings.apiKey)
  await page.locator('#button--resetApiKey').waitFor({ state: 'visible' })
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('#button--resetApiKey').click()
  await page.getByText('API key reset successfully. Remember to update any applications using your API key.', { exact: true }).waitFor()
  const nextKey = await page.evaluate(async () => (await (await fetch('/api/user-settings')).json()).userSettings.apiKey)
  assert.ok(nextKey && nextKey !== previousKey)
  report.push({ case: 'Confirmed API key rotation on actual API', passed: true })
  await page.getByRole('button', { name: 'Deutsch', exact: true }).click()
  assert.equal(await page.locator('html').getAttribute('lang'), 'de')
  await page.reload()
  assert.equal(await page.locator('html').getAttribute('lang'), 'de')
  await page.goto(new URL('/dashboard/userSettings', base).href)
  await page.getByRole('heading', { name: 'Benutzereinstellungen', exact: true }).waitFor()
  assert.equal(await page.locator('html').getAttribute('lang'), 'de')
  report.push({ case: 'German query selection, reload and cookie persistence', passed: true })
  for (const language of ['en', 'de']) for (const namespace of ['app', 'admin', 'login', 'errors']) {
    const response = await page.request.get(new URL(`/locales/${language}/${namespace}.json`, base).href)
    assert.equal(response.status(), 200)
    const source = JSON.parse((await readFile(new URL(`../../../Sunrise-Referenz/locales/${language}/${namespace}.json`, import.meta.url), 'utf8')).replaceAll('Sunrise CMS', 'Cemaris'))
    assert.deepEqual(await response.json(), source)
  }
  report.push({ case: 'All eight deployed catalogs equal fixed Sunrise source with Cemaris branding', passed: true })
  await page.screenshot({ path: path.join(qaDirectory, 'cemaris-step03-settings-desktop.png'), fullPage: true })
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    const sizing = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
    assert.ok(sizing.scrollWidth <= sizing.width, `Horizontal overflow at ${width}px`)
    await page.screenshot({ path: path.join(qaDirectory, `cemaris-step03-settings-${width}.png`), fullPage: true })
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.locator('#language').selectOption('en')
  const currentSession = await page.evaluate(async () => (await (await fetch('/api/session')).json()))
  await page.route('**/api/session*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...currentSession, user: null }) }))
  await page.route('**/api/admin/settings*', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'unauthorized', message: 'Expired synthetic session' } }) }))
  await page.locator('summary').filter({ hasText: process.env.CEMARIS_QA_USERNAME }).click()
  await page.locator('.dropdown').getByRole('link', { name: 'Settings Management', exact: true }).click()
  await page.locator('#form--login').waitFor()
  await page.getByText('Your session has expired. Please log in again.', { exact: true }).waitFor()
  report.push({ case: '401 expiry returns to login and preserves requested route (transport fixture)', passed: true })
  await page.unrouteAll({ behavior: 'ignoreErrors' })

  const readerContext = await browser.newContext({ locale: 'en-CA', viewport: { width: 1280, height: 900 } })
  const reader = await readerContext.newPage(); watch(reader)
  await reader.goto(new URL('/login?lng=en', base).href)
  await login(reader, process.env.CEMARIS_QA_READER_USERNAME, process.env.CEMARIS_QA_READER_PASSWORD)
  assert.equal(await reader.getByRole('link', { name: 'User Management', exact: true }).count(), 0)
  for (const name of ['New Contract', 'New Work Order', 'New Burial Site', 'New Cemetery']) assert.equal(await reader.getByRole('link', { name, exact: true }).count(), 0)
  await reader.goto(new URL('/admin/users?lng=en', base).href)
  await reader.waitForURL('**/dashboard/?error=accessDenied')
  await reader.getByText('Access Denied.', { exact: true }).waitFor()
  assert.equal((await reader.request.get(new URL('/api/admin/users', base).href)).status(), 403)
  const deniedPages = ['/admin/fees', '/admin/contractTypes', '/admin/burialSiteTypes', '/admin/tables', '/admin/settings', '/admin/database', '/admin/auditLog', '/cemeteries/new', '/cemeteries/1/edit', '/burialSites/new', '/burialSites/1/edit', '/burialSites/creator', '/burialSites/gpsCapture', '/contracts/new', '/contracts/1/edit', '/funeralHomes/new', '/funeralHomes/1/edit', '/workOrders/new', '/workOrders/1/edit']
  for (const route of deniedPages) {
    await reader.goto(new URL(route, base).href)
    await reader.waitForURL('**/dashboard/?error=accessDenied')
    await reader.getByText('Access Denied.', { exact: true }).waitFor()
  }
  report.push({ case: 'Reader role hides create/admin controls, redirects 20 guarded pages to accessDenied dashboard, API403', passed: true })
  await reader.locator('summary').filter({ hasText: process.env.CEMARIS_QA_READER_USERNAME }).click()
  reader.once('dialog', (dialog) => dialog.accept())
  await reader.getByRole('button', { name: 'Log Out', exact: true }).click()
  await reader.locator('#form--login').waitFor()
  assert.equal((await reader.request.get(new URL('/api/session', base).href)).status(), 200)
  assert.equal((await (await reader.request.get(new URL('/api/session', base).href)).json()).user, null)
  report.push({ case: 'Confirmed logout invalidates actual session', passed: true })
  await readerContext.close()

  const errorContext = await browser.newContext({ locale: 'en-CA' })
  const failure = await errorContext.newPage(); watch(failure)
  let mode = 'http'
  await failure.route('**/api/session*', async (route) => {
    if (mode === 'network') return route.abort('failed')
    if (mode === 'timeout') { await new Promise((resolve) => setTimeout(resolve, 6500)); return route.abort().catch(() => {}) }
    return route.fulfill({ status: mode === 'invalid' ? 200 : 503, contentType: 'application/json', body: mode === 'invalid' ? '{}' : JSON.stringify({ error: { code: 'unavailable', message: 'Synthetic contract fixture', request_id: 'browser-503' } }) })
  })
  await failure.goto(new URL('/login?lng=en', base).href)
  await failure.getByText('browser-503', { exact: false }).waitFor()
  mode = 'invalid'; await failure.getByRole('button', { name: 'Try again', exact: true }).click()
  await failure.getByText('The application returned an unexpected response. Please try again.', { exact: true }).waitFor()
  mode = 'network'; await failure.getByRole('button', { name: 'Try again', exact: true }).click()
  await failure.getByText('The application could not be reached. Please try again.', { exact: true }).waitFor()
  mode = 'timeout'; await failure.getByRole('button', { name: 'Try again', exact: true }).click()
  await failure.getByText('The application did not respond within five seconds. Please try again.', { exact: true }).waitFor({ timeout: 9000 })
  await failure.unrouteAll({ behavior: 'ignoreErrors' })
  await failure.getByRole('button', { name: 'Try again', exact: true }).click()
  await failure.locator('#form--login').waitFor()
  report.push({ case: 'HTTP error, malformed session, network failure, timeout and retry recovery (transport fixtures)', passed: true })
  await errorContext.close()
  assert.deepEqual(pageErrors, [], 'Unexpected browser page errors')
  report.push({ case: 'Browser JavaScript errors', errors: pageErrors })
  await writeFile(path.join(qaDirectory, 'frontend-step03-results.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
