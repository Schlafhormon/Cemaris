// Step-06 UI/API/SQL QA. Invoke scripts/qa_geography_browser.py (fresh MSSQL).
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

for (const key of ['CEMARIS_QA_USERNAME', 'CEMARIS_QA_PASSWORD', 'CEMARIS_QA_READER_USERNAME', 'CEMARIS_QA_READER_PASSWORD', 'CEMARIS_QA_DIRECTORY', 'CEMARIS_QA_GEO_IDS']) assert.ok(process.env[key], `Missing ${key}`)
const { chromium } = await import(process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
const base = process.env.CEMARIS_SMOKE_URL ?? 'http://127.0.0.1:4173/'
const output = process.env.CEMARIS_QA_DIRECTORY
const ids = JSON.parse(process.env.CEMARIS_QA_GEO_IDS)
await mkdir(output, { recursive: true })
const context = await browser.newContext({ locale: 'en-CA', viewport: { width: 1440, height: 1000 }, permissions: ['geolocation'], geolocation: { latitude: 51.654321987, longitude: 13.543219876, accuracy: 4 } })
const tile = await readFile(path.join(output, 'customizations/public-internal/images/burialSites/synthetic.png'))
let tileRequests = 0
// Only external map tiles are fixtures. All application requests use the real API.
await context.route(/^https:\/\/[^/]*tile\.openstreetmap\.org\//, async route => { tileRequests++; await route.fulfill({ contentType: 'image/png', body: tile }) })
await context.addInitScript(() => {
  window.qaGeoWatches = { started: 0, stopped: 0 }
  const watch = navigator.geolocation.watchPosition.bind(navigator.geolocation)
  const clear = navigator.geolocation.clearWatch.bind(navigator.geolocation)
  navigator.geolocation.watchPosition = (...args) => { window.qaGeoWatches.started++; return watch(...args) }
  navigator.geolocation.clearWatch = (...args) => { window.qaGeoWatches.stopped++; return clear(...args) }
})
const page = await context.newPage()
const errors = []
const report = [{ case: 'Runtime', browser: browser.version(), externalTiles: 'Synthetic PNG responses at original OSM URLs', position: 'Browser-emulated GPS; no physical-device claim' }]
page.on('pageerror', error => errors.push(error.message))
page.on('dialog', dialog => dialog.accept())
const dialog = page.locator('dialog')
async function login(target, username, password) {
  await target.goto(new URL('/login?lng=en', base).href)
  await target.locator('#login--username').fill(username)
  await target.locator('#login--password').fill(password)
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
  const waiting = page.waitForResponse(value => value.url().includes(url) && value.request().method() === 'POST')
  await click()
  const response = await waiting
  assert.equal(response.status(), 200, await response.text())
  return response.json()
}
async function visit(url, selector) {
  await page.goto(new URL(url, base).href)
  await page.locator(selector).waitFor()
}
async function waitCount(selector, count) {
  await page.waitForFunction(({ selector, count }) => document.querySelectorAll(selector).length === count, { selector, count })
}
async function screenshot(name, width) {
  await page.setViewportSize({ width, height: width === 1440 ? 1000 : 900 })
  await page.evaluate(() => window.scrollTo(0, 0))
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal document overflow: ${name} ${width}`)
  await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true })
}
try {
  await login(page, process.env.CEMARIS_QA_USERNAME, process.env.CEMARIS_QA_PASSWORD)
  const options = await api('/api/cemeteries/options')
  assert.ok(options.cemeterySVGs.includes('synthetic.svg'))
  await visit(`/cemeteries/${ids.cemetery}/edit?lng=en`, '#form--cemetery')
  await page.locator('[name=cemeterySvg]').selectOption('synthetic.svg')
  await page.locator('#button--selectCoordinate').click()
  await dialog.locator('#map--selectCoordinate.leaflet-container').waitFor()
  await dialog.locator('#map--selectCoordinate').click({ position: { x: 240, y: 180 } })
  await dialog.locator('.is-update-button').click()
  await dialog.waitFor({ state: 'detached' })
  const selectedLat = await page.locator('[name=cemeteryLatitude]').inputValue()
  const selectedLng = await page.locator('[name=cemeteryLongitude]').inputValue()
  assert.match(selectedLat, /^-?\d+\.\d{8}$/)
  assert.match(selectedLng, /^-?\d+\.\d{8}$/)
  await post('/api/cemeteries/doUpdateCemetery', () => page.locator('#form--cemetery button[type=submit]').click())
  await page.reload()
  await page.locator('#form--cemetery').waitFor()
  assert.equal(await page.locator('[name=cemeterySvg]').inputValue(), 'synthetic.svg')
  assert.equal(Number(await page.locator('[name=cemeteryLatitude]').inputValue()), Number(selectedLat))
  await visit(`/cemeteries/${ids.cemetery}?lng=en`, '.cemetery-svg svg')
  await page.locator('#cemetery--leaflet.leaflet-container').waitFor()
  await visit(`/burialSites/${ids.free}?lng=en`, '#burialSite--cemeterySvg svg #sector-A.geo-highlight')
  await page.locator('#burialSite--leaflet.leaflet-container').waitFor()
  assert.equal(await page.locator('#burialSite--cemeterySvg #sector-B').getAttribute('fill'), "url('#qa-gradient')")
  assert.equal(await page.locator('#burialSite--cemeterySvg #sector-B').getAttribute('clip-path'), 'url("#qa-clip")')
  assert.equal(await page.locator('#burialSite--cemeterySvg script').count(), 0)
  assert.equal(await page.locator('#burialSite--cemeterySvg #qa-external').getAttribute('href'), null)
  for (const width of [1440, 390, 320]) await screenshot('burial-svg-en', width)
  await page.setViewportSize({ width: 1440, height: 1000 })
  report.push({ case: 'Cemetery SVG selection, coordinate picker with 8 decimals and SQL reload, live Leaflet views, ancestor SVG highlight', passed: true })

  await visit(`/burialSites/map?cemeteryId=${ids.cemetery}&lng=en`, '#map--burialSites.leaflet-container')
  await waitCount('#map--burialSites path.leaflet-interactive', 4)
  assert.equal(await page.locator('#stats--mapped').innerText(), '4')
  assert.equal(await page.locator('#stats--total').innerText(), '5')
  const colors = await page.locator('#map--burialSites path.leaflet-interactive').evaluateAll(elements => elements.map(element => element.getAttribute('fill')).sort())
  assert.deepEqual(colors, ['green', 'red', 'yellow', 'yellow'])
  await page.locator('#filter--deceasedName').fill('  OCCUPIED PERSON  ')
  await waitCount('#map--burialSites path.leaflet-interactive', 1)
  await page.locator('#map--burialSites path.leaflet-interactive').click()
  await page.locator('.leaflet-popup-content').waitFor()
  assert.match(await page.locator('.leaflet-popup-content').innerText(), /Synthetic occupied Person/)
  assert.equal(await page.locator(`.leaflet-popup-content a[href='/contracts/${ids.occupiedContract}']`).count(), 1)
  assert.equal(await page.locator('#stats--mapped').innerText(), '4')
  await page.locator('#filter--deceasedName').fill('no synthetic match')
  await waitCount('#map--burialSites path.leaflet-interactive', 0)
  await page.locator('#filter--deceasedName').fill('')
  await waitCount('#map--burialSites path.leaflet-interactive', 4)
  report.push({ case: 'Map source direct-cemetery count, missing coordinates, green/red/yellow including future, trimmed name filter, contract popup links and unchanged counters', passed: true })

  await visit(`/burialSites/gpsCapture?cemeteryId=${ids.cemetery}&lng=en`, '#gps-status-text')
  await page.waitForFunction(() => document.querySelector('#gps-status-text')?.textContent.includes('ready'))
  await page.locator(`#capture-${ids.missing}`).waitFor()
  assert.equal(await page.locator('#container--burialSites section.panel').count(), 6)
  await page.locator('#filter--hasCoordinates').selectOption('no')
  await waitCount('#container--burialSites section.panel', 1)
  await post('/api/burialSites/doUpdateBurialSiteLatitudeLongitude', () => page.locator(`#capture-${ids.missing}`).click())
  assert.match(await page.locator(`#coords-${ids.missing}`).innerText(), /51\.65432199/)
  assert.match(await page.locator(`#coords-${ids.missing}`).innerText(), /13\.54321988/)
  let saved = (await api(`/api/burialSites/${ids.missing}`)).burialSite
  assert.equal(saved.burialSiteLatitude, 51.65432199)
  assert.equal(saved.burialSiteLongitude, 13.54321988)
  await page.locator('#form--filters button[type=submit]').click()
  await waitCount('#container--burialSites section.panel', 0)
  await page.locator('#filter--hasCoordinates').selectOption('yes')
  await waitCount('#container--burialSites section.panel', 6)
  await page.locator('#filter--burialSiteName').fill('Child')
  await waitCount('#container--burialSites section.panel', 1)
  assert.match(await page.locator('#container--burialSites section.panel').innerText(), /Synthetic Map Child/)
  await page.locator('.page-content a[href="/burialSites/map"]').click()
  await page.locator('#map--burialSites.leaflet-container').waitFor()
  assert.deepEqual(await page.evaluate(() => window.qaGeoWatches), { started: 1, stopped: 1 })
  report.push({ case: 'Browser-emulated GPS watch, direct+child search, coordinate status/name filters, capture rounding and SQL persistence, clean watch teardown', passed: true })

  await visit('/burialSites/creator?lng=en', '#form--burialSiteCreator')
  await page.locator('#burialSiteCreator--cemeteryId').selectOption(String(ids.cemetery))
  await page.locator('#burialSiteCreator--burialSiteNameSegment1_from').fill('R')
  await page.locator('#burialSiteCreator--burialSiteNameSegment1_to').fill('R')
  await page.locator('#burialSiteCreator--burialSiteNameSegment2_from').fill('01')
  await page.locator('#burialSiteCreator--burialSiteNameSegment2_to').fill('03')
  await post('/api/burialSites/doGetBurialSiteNamesByRange', () => page.locator('#burialSiteCreator--submit').click())
  await waitCount('#panel--burialSitePreview_new .geo-range-row', 3)
  const candidate = page.locator('#panel--burialSitePreview_new .geo-range-row[data-burial-site-name="MAP-R-01"]')
  await candidate.locator('button').click()
  await page.getByRole('alert').filter({ hasText: /type/i }).waitFor()
  await page.locator('#burialSitePreview--burialSiteTypeId').selectOption(String(ids.type))
  await candidate.locator('button').click()
  await page.getByRole('alert').filter({ hasText: /status/i }).waitFor()
  await page.locator('#burialSitePreview--burialSiteStatusId').selectOption(String(ids.status))
  const created = await post('/api/burialSites/doCreateBurialSite', () => candidate.locator('button').click())
  await waitCount('#panel--burialSitePreview_new .geo-range-row', 2)
  await waitCount('#panel--burialSitePreview_existing .geo-range-row', 1)
  saved = (await api(`/api/burialSites/${created.burialSiteId}`)).burialSite
  assert.equal(saved.burialSiteName, 'MAP-R-01')
  assert.equal(saved.burialSiteStatusId, ids.status)
  await page.getByRole('tab', { name: /Define Ranges/ }).click()
  await post('/api/burialSites/doGetBurialSiteNamesByRange', () => page.locator('#burialSiteCreator--submit').click())
  await waitCount('#panel--burialSitePreview_existing .geo-range-row', 1)
  await page.getByRole('tab', { name: /Define Ranges/ }).click()
  await page.locator('#burialSiteCreator--burialSiteNameSegment2_to').fill('1001')
  await post('/api/burialSites/doGetBurialSiteNamesByRange', () => page.locator('#burialSiteCreator--submit').click())
  await waitCount('#panel--burialSitePreview_new .geo-range-row', 0)
  await page.locator('.page-content .notification.info').filter({ hasText: /1000/ }).waitFor()
  report.push({ case: 'Range preview padding, type/status guards, individual create, existing-name detection after SQL save, >1000 rejection', passed: true })

  await visit(`/burialSites/${ids.free}/edit?lng=en`, '#form--burialSite')
  await page.locator('[name=burialSiteImage]').selectOption('synthetic.png')
  await page.locator('#button--selectCoordinate').click()
  await dialog.locator('#map--selectCoordinate.leaflet-container').waitFor()
  await dialog.locator('.is-update-button').click()
  await post('/api/burialSites/doUpdateBurialSite', () => page.locator('#form--burialSite button[type=submit]').click())
  await visit(`/burialSites/${ids.free}?lng=en`, '.burial-site-image')
  assert.equal(await page.locator('#burialSite--cemeterySvg').count(), 0)
  assert.equal(await page.locator('.burial-site-image').evaluate(image => image.complete && image.naturalWidth === 240), true)
  report.push({ case: 'Burial coordinate picker and raster selection, SQL save and raster priority over SVG', passed: true })

  for (const [name, route, selector] of [['map-de', `/burialSites/map?cemeteryId=${ids.cemetery}`, '#map--burialSites.leaflet-container'], ['gps-de', `/burialSites/gpsCapture?cemeteryId=${ids.cemetery}`, '#gps-status-text'], ['creator-de', '/burialSites/creator?', '#form--burialSiteCreator'], ['cemetery-map-de', `/cemeteries/${ids.cemetery}?`, '.cemetery-svg svg']]) {
    await visit(`${route}${route.includes('?') && !route.endsWith('?') ? '&' : ''}lng=de`, selector)
    for (const width of [1440, 390, 320]) await screenshot(name, width)
    if (name === 'creator-de') {
      await page.locator('#burialSiteCreator--cemeteryId').selectOption(String(ids.cemetery))
      await page.locator('#burialSiteCreator--burialSiteNameSegment1_from').fill('R')
      await page.locator('#burialSiteCreator--burialSiteNameSegment1_to').fill('R')
      await page.locator('#burialSiteCreator--burialSiteNameSegment2_from').fill('01')
      await page.locator('#burialSiteCreator--burialSiteNameSegment2_to').fill('03')
      await post('/api/burialSites/doGetBurialSiteNamesByRange', () => page.locator('#burialSiteCreator--submit').click())
      await waitCount('#panel--burialSitePreview_new .geo-range-row', 2)
      for (const width of [1440, 390, 320]) await screenshot('creator-preview-de', width)
    }
  }
  await visit(`/burialSites/${ids.free}/edit?lng=en`, '#form--burialSite')
  await page.locator('#button--selectCoordinate').click()
  await dialog.locator('#map--selectCoordinate.leaflet-container').waitFor()
  for (const width of [1440, 390, 320]) await screenshot('coordinate-picker-en', width)
  await dialog.getByRole('button', { name: 'Close / Schließen' }).click()

  const deniedContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await deniedContext.addInitScript(() => {
    navigator.geolocation.watchPosition = (_success, failure) => { setTimeout(() => failure({ code: 1 }), 0); return 1 }
    navigator.geolocation.clearWatch = () => {}
  })
  const denied = await deniedContext.newPage()
  denied.on('pageerror', error => errors.push(error.message))
  await login(denied, process.env.CEMARIS_QA_USERNAME, process.env.CEMARIS_QA_PASSWORD)
  await denied.goto(new URL('/burialSites/gpsCapture?lng=en', base).href)
  await denied.getByRole('status').filter({ hasText: /permission denied/i }).waitFor()
  await deniedContext.close()
  const readerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await readerContext.route(/^https:\/\/[^/]*tile\.openstreetmap\.org\//, route => route.fulfill({ contentType: 'image/png', body: tile }))
  const reader = await readerContext.newPage()
  reader.on('pageerror', error => errors.push(error.message))
  await login(reader, process.env.CEMARIS_QA_READER_USERNAME, process.env.CEMARIS_QA_READER_PASSWORD)
  await reader.goto(new URL(`/burialSites/map?cemeteryId=${ids.cemetery}`, base).href)
  await reader.locator('#map--burialSites.leaflet-container').waitFor()
  assert.equal(await reader.locator('.page-content a[href="/burialSites/gpsCapture"],.page-content a[href="/burialSites/creator"]').count(), 0)
  for (const route of ['/burialSites/gpsCapture', '/burialSites/creator']) {
    await reader.goto(new URL(route, base).href)
    await reader.waitForURL(/dashboard/)
  }
  for (const endpoint of ['doSearchBurialSitesForGPS', 'doUpdateBurialSiteLatitudeLongitude', 'doGetBurialSiteNamesByRange']) await api(`/api/burialSites/${endpoint}`, { cemeteryId: ids.cemetery, burialSiteId: ids.free }, reader, 403)
  await readerContext.close()
  report.push({ case: 'DE pages and EN picker at 1440/390/320px, denied-GPS fixture, reader map and denied GPS/creator/API mutations', passed: true })
  assert.deepEqual(errors, [])
  assert.ok(tileRequests > 0)
  await writeFile(path.join(output, 'geography-result.json'), JSON.stringify({ passed: true, report, tileRequests, errors }, null, 2))
  console.log(`PASS: Step06 browser ${report.length - 1} groups, 21 responsive screenshots, no JavaScript errors`)
} catch (error) {
  await page.screenshot({ path: path.join(output, 'geography-failure.png'), fullPage: true }).catch(() => {})
  await writeFile(path.join(output, 'geography-result.json'), JSON.stringify({ passed: false, report, errors, error: String(error) }, null, 2))
  throw error
} finally {
  await browser.close()
}
