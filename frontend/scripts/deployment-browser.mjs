// Complete build over real HTTPS, two nginx hops, API and disposable SQL Server.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
const base = process.env.CEMARIS_SMOKE_URL
const mount = new URL(base).pathname.replace(/\/$/, '')
const out = process.env.CEMARIS_QA_DIRECTORY
const ids = JSON.parse(process.env.CEMARIS_QA_IDS)
const url = value => new URL(value.replace(/^\//, ''), base).href
const context = await browser.newContext({ ignoreHTTPSErrors: true, locale: 'en-CA', timezoneId: 'Europe/Berlin', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage(), errors = [], escapedRequests = [], report = []
page.on('pageerror', error => errors.push(error.message))
page.on('request', request => {
  const value = new URL(request.url())
  if (mount && value.origin === new URL(base).origin && !value.pathname.startsWith(mount + '/') && value.pathname !== mount) escapedRequests.push(value.pathname)
})
page.on('dialog', dialog => dialog.accept())
let screenshots = 0
async function login(target, reader = false) {
  await target.goto(url('/login?lng=en'))
  await target.locator('#login--username').fill(reader ? 'qa-reader' : 'qa-admin')
  await target.locator('#login--password').fill(reader ? 'synthetic-reader-password' : 'synthetic-qa-password')
  await target.locator('#form--login button[type=submit]').click()
  await target.waitForURL(new RegExp(`${mount}/dashboard/?$`))
  await target.waitForLoadState('networkidle')
}
async function visit(value, selector = 'main h1') {
  const response = await page.goto(url(value))
  assert.equal(response.status(), 200)
  await page.locator(selector).first().waitFor()
  await page.waitForLoadState('networkidle')
}
async function api(value, body, target = page, status = 200, csrf = true) {
  const result = await target.evaluate(async ({ endpoint, sessionUrl, body, csrf }) => {
    const session = await (await fetch(sessionUrl)).json()
    const response = await fetch(endpoint, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': session.csrfToken } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, body: await response.json() }
  }, { endpoint: url(value), sessionUrl: url('/api/session'), body, csrf })
  assert.equal(result.status, status, JSON.stringify(result.body))
  return result.body
}
async function shot(name) {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur(); window.scrollTo(0, 0) })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}/${width}: overflow`)
    await page.screenshot({ path: path.join(out, `${name}-${width}.png`), fullPage: true }); screenshots++
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
}
async function download(locator) {
  const pending = page.waitForEvent('download')
  await locator.click()
  const file = await pending
  const destination = path.join(out, file.suggestedFilename())
  await file.saveAs(destination)
  return readFile(destination)
}
try {
  const health = await context.request.get(url('/api/health'))
  assert.equal(health.status(), 200)
  assert.equal((await health.json()).application, 'Cemaris')
  const realIp = await context.request.get(url('/_qa-client'), { headers: { 'X-Real-IP': '198.51.100.42', 'X-Forwarded-For': '203.0.113.42' } })
  assert.equal(await realIp.text(), '127.0.0.1', 'Outer proxy replaces spoofed client IP headers')
  const trusted = await context.request.get('http://127.0.0.1:4173' + mount + '/_qa-client', { headers: { 'X-Real-IP': '198.51.100.42' } })
  assert.equal(await trusted.text(), '198.51.100.42', 'Inner real-IP module accepts the configured trusted proxy')
  const slash = await context.request.get(url('/api/session/'), { maxRedirects: 0 })
  assert.equal(slash.status(), 307)
  assert.equal(slash.headers().location, url('/api/session'), 'Framework redirects preserve HTTPS, public port and mount')
  if (mount) {
    const mountEntry = await context.request.get(base.slice(0, -1), { maxRedirects: 0 })
    assert.equal(mountEntry.status(), 308)
    assert.equal(new URL(mountEntry.headers().location, base).href, base)
    assert.equal((await context.request.get(new URL('/api/session', base).href)).status(), 404)
  }
  assert.equal((await context.request.get(url('/assets/missing-qa.js'))).status(), 404)
  const badApi = await context.request.get(url('/api/no-such-route'))
  assert.equal(badApi.status(), 404); assert.match(badApi.headers()['content-type'], /application\/json/)
  for (const name of ['cemaris-icon.png', 'cemaris-logo.png']) {
    const response = await context.request.get(url('/branding/' + name))
    assert.equal(response.status(), 200)
    assert.deepEqual(await response.body(), await readFile('frontend/public/branding/' + name))
  }
  assert.match(await (await context.request.get(url('/robots.txt'))).text(), /Disallow: \//)
  assert.match(await (await context.request.get(url('/THIRD-PARTY-NOTICES.txt'))).text(), /The Corporation of the City of Sault Ste. Marie/)
  await login(page)
  const cookies = await context.cookies()
  assert.ok(cookies.some(cookie => cookie.name === 'cemaris-user-sid' && cookie.path === (mount + '/') && cookie.secure && cookie.httpOnly))
  const session = await api('/api/session')
  const ics = await context.request.get(url(`/api/${session.user.userSettings.apiKey}/milestoneICS`))
  assert.equal(ics.status(), 200); assert.match(ics.headers()['content-type'], /text\/calendar/)
  assert.match(await ics.text(), /BEGIN:VCALENDAR/)
  assert.match(await ics.text(), new RegExp(`${mount}/workOrders/`))
  report.push('HTTPS login; secure scoped session/CSRF; original iCal key URL; branding/licenses/robots; API 404 remains JSON; slash redirects and trusted client-IP chain')

  await visit(`/contracts/${ids.contract}/edit?lng=en`, '#form--contract')
  await page.locator('#contract--purchaserName').fill('Synthetic Proxy Purchaser 🪦')
  const saved = page.waitForResponse(response => new URL(response.url()).pathname === mount + `/api/contracts/${ids.contract}/update` && response.request().method() === 'POST')
  await page.locator('#form--contract button[type=submit]').click()
  assert.equal((await saved).status(), 200)
  await page.reload(); await page.locator('#form--contract').waitFor()
  assert.equal(await page.locator('#contract--purchaserName').inputValue(), 'Synthetic Proxy Purchaser 🪦')
  await page.locator('#button--uploadAttachment').click()
  const dialog = page.locator('dialog')
  const bytes = Buffer.from('SYNTHETIC HTTPS proxy attachment\r\nÜbung 🪦\r\n', 'utf8')
  await dialog.locator('[name=file]').setInputFiles({ name: 'synthetic-proxy.txt', mimeType: 'text/plain', buffer: bytes })
  const uploaded = page.waitForResponse(response => new URL(response.url()).pathname === mount + '/api/contracts/doUploadContractAttachment')
  await dialog.locator('button[type=submit]').click()
  assert.equal((await uploaded).status(), 200)
  const attachment = page.locator('#panel--contractAttachments a[download]').first()
  await attachment.waitFor()
  assert.ok((await attachment.getAttribute('href')).startsWith(mount + '/api/'))
  assert.deepEqual(await download(attachment), bytes)
  const screen = await context.request.get(url(`/print/screen/contract?contractId=${ids.contract}`))
  assert.equal(screen.status(), 200); assert.ok((await screen.text()).includes('Übungsperson Gamma'), 'Screen print contains fixture interment')
  const pdf = await context.request.get(url(`/print/pdf/workOrder?workOrderId=${ids.work_order}`))
  assert.equal(pdf.status(), 200); assert.ok((await pdf.body()).subarray(0, 5).equals(Buffer.from('%PDF-')))
  report.push('Real contract form save/reload; multipart upload and byte-identical browser download; EJS HTML and Chromium PDF through both proxies')

  await visit('/reports?tab=cemeteries&lng=en', '#report-panel')
  const csv = await download(page.locator('[data-report="cemeteries-formatted"]'))
  assert.match(csv.toString('utf8'), /Musterfriedhof – Übung Süd/)
  const legacy = await context.request.get(url('/reports/cemeteries-formatted'))
  assert.equal(legacy.status(), 200); assert.deepEqual(await legacy.body(), csv)
  await visit(`/workOrders/${ids.work_order}/edit?lng=en`, '#form--workOrderEdit')
  await page.locator('[name=workOrderDescription]').fill('Synthetic HTTPS work order')
  const workSaved = page.waitForResponse(response => response.url().includes('/api/work-orders/doUpdateWorkOrder') && response.request().method() === 'POST')
  await page.locator('#form--workOrderEdit button[type=submit]').click()
  assert.equal((await workSaved).status(), 200)
  await page.reload(); await page.locator('#form--workOrderEdit').waitFor()
  assert.equal(await page.locator('[name=workOrderDescription]').inputValue(), 'Synthetic HTTPS work order')
  report.push('CSV browser download and legacy report URL; linked work-order form save/reload')

  const routes = [
    ['/dashboard', 'main h1'], ['/cemeteries', 'main h1'], ['/burialSites', 'main h1'],
    [`/burialSites/${ids.burial_site}`, 'main h1'], [`/contracts/${ids.contract}`, '.contract-recipient'],
    ['/workOrders/milestoneCalendar', '.work-order-calendar'], ['/reports', '#report-panel'],
    ['/admin/users', 'main h1'], ['/admin/tables', 'main h1'], ['/admin/database', 'main h1'],
    ['/admin/auditLog', '#form--auditLogFilters'], ['/dashboard/userSettings', 'main h1'],
  ]
  for (const language of ['en', 'de']) {
    for (const [route, selector] of routes) {
      await visit(`${route}?lng=${language}`, selector)
      if (mount) {
        const links = await page.locator('a[href], img[src], form[action]').evaluateAll(elements => elements.map(element => element.getAttribute('href') ?? element.getAttribute('src') ?? element.getAttribute('action')).filter(value => value?.startsWith('/') && !value.startsWith('//')))
        assert.deepEqual(links.filter(value => !value.startsWith(mount + '/') && value !== mount), [], route)
      }
      if (['/dashboard', `/contracts/${ids.contract}`, '/admin/auditLog'].includes(route)) await shot(`${route.replaceAll('/', '_')}-${language}`)
    }
  }
  await visit('/missing-page?lng=en')
  assert.match(await page.locator('main').innerText(), /not found/i)
  assert.doesNotMatch(await page.locator('main').innerText(), /later porting step/i)
  report.push('Twelve central routes in DE/EN; 1440/390/320 responsive views; local links/assets retain mount; 404 has no porting placeholder')

  const readerContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: 'en-CA' })
  const reader = await readerContext.newPage()
  await login(reader, true)
  await api(`/api/contracts/${ids.contract}/update`, {}, reader, 403)
  await api(`/api/contracts/${ids.contract}/update`, {}, page, 403, false)
  const anonymous = await browser.newContext({ ignoreHTTPSErrors: true })
  assert.equal((await anonymous.request.get(url(`/print/screen/contract?contractId=${ids.contract}`))).status(), 401)
  await anonymous.close()
  await readerContext.close()
  report.push('Independent reader role cannot mutate; missing CSRF refused; anonymous print refused')
  assert.deepEqual(errors, [])
  assert.deepEqual(escapedRequests, [])
  await writeFile(path.join(out, 'browser-result.json'), JSON.stringify({ mount, browser: browser.version(), screenshots, report, errors, escapedRequests }, null, 2) + '\n')
  console.log(`PASS: ${mount || '/'} real HTTPS/nginx acceptance; ${screenshots} responsive screenshots; no JS errors or escaping requests`)
} catch (error) {
  await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true }).catch(() => {})
  throw error
} finally {
  await browser.close()
}
