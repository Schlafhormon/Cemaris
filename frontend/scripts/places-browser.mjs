// Step-05 UI/API/SQL QA. Invoke scripts/qa_places_browser.py (fresh SQL DB).
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

for (const key of ['CEMARIS_QA_USERNAME', 'CEMARIS_QA_PASSWORD', 'CEMARIS_QA_READER_USERNAME', 'CEMARIS_QA_READER_PASSWORD', 'CEMARIS_QA_DIRECTORY']) assert.ok(process.env[key], `Missing ${key}`)
const { chromium } = await import(process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
const base = process.env.CEMARIS_SMOKE_URL ?? 'http://127.0.0.1:4173/'
const output = process.env.CEMARIS_QA_DIRECTORY
await mkdir(output, { recursive: true })
const context = await browser.newContext({ locale: 'en-CA', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const errors = []
const report = [{ case: 'Runtime', browser: browser.version() }]
page.on('pageerror', error => errors.push(error.message))
page.on('dialog', dialog => dialog.accept())
const prefix = `Synthetic ${Date.now()}`
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
  const response = page.waitForResponse(value => value.url().includes(url) && value.request().method() === 'POST')
  await click()
  const result = await response
  assert.equal(result.status(), 200, await result.text())
  return result.json()
}
async function visit(url, selector) {
  await page.goto(new URL(url, base).href)
  await page.locator(selector).waitFor()
}
async function createCemetery(name, key, parent) {
  await visit('/cemeteries/new?lng=en', '#form--cemetery')
  await page.locator('[name=cemeteryName]').fill(name)
  await page.locator('[name=cemeteryKey]').fill(key)
  await page.locator('[name=cemeteryDescription]').fill('Synthetic description <literal & safe>')
  await page.locator('[name=cemeteryAddress1]').fill('1 Synthetic Road')
  await page.locator('[name=cemeteryCity]').fill('Synthetic City')
  await page.locator('[name=cemeteryProvince]').fill('Niedersachsen')
  await page.locator('[name=cemeteryPostalCode]').fill('12345')
  await page.locator('[name=cemeteryPhoneNumber]').fill('000-000-0000')
  await page.locator('[name=cemeteryLatitude]').fill('51.125')
  await page.locator('[name=cemeteryLongitude]').fill('13.5')
  await page.locator('#cemetery--directionOfArrivalDescription_N').fill('Synthetic North Gate')
  await page.locator('#cemetery--directionOfArrival_NE').check()
  await page.locator('#cemetery--directionOfArrivalDescription_NE').fill('Synthetic Northeast Gate')
  if (parent) await page.locator('[name=parentCemeteryId]').selectOption(String(parent))
  const result = await post('/api/cemeteries/doCreateCemetery', () => page.locator('#form--cemetery button[type=submit]').click())
  await page.waitForURL(new RegExp(`/cemeteries/${result.cemeteryId}/edit`))
  await page.locator('#button--deleteCemetery').waitFor()
  await page.reload()
  await page.locator('#form--cemetery').waitFor()
  assert.equal(await page.locator('[name=cemeteryPostalCode]').inputValue(), '12345')
  assert.equal(await page.locator('#cemetery--directionOfArrivalDescription_NE').inputValue(), 'Synthetic Northeast Gate')
  return result.cemeteryId
}
async function createSite(cemeteryId, typeId, statusId, fieldId, number) {
  await visit(`/burialSites/new?cemeteryId=${cemeteryId}&lng=en`, '#form--burialSite')
  assert.equal(await page.locator('[name=cemeteryId]').inputValue(), String(cemeteryId))
  await page.locator('[name=burialSiteTypeId]').selectOption(String(typeId))
  await page.locator(`[name=fieldValue_${fieldId}]`).waitFor()
  await page.locator('[name=burialSiteNameSegment1]').fill('A')
  await page.locator('[name=burialSiteNameSegment2]').fill(number)
  await page.locator('[name=bodyCapacity]').fill('2')
  await page.locator('[name=crematedCapacity]').fill('6')
  await page.locator('[name=burialSiteStatusId]').selectOption(String(statusId))
  await page.locator('[name=burialSiteLatitude]').fill('51.12345678')
  await page.locator('[name=burialSiteLongitude]').fill('13.12345678')
  // Source field length/pattern checks are browser validation rules.
  await page.locator(`[name=fieldValue_${fieldId}]`).fill('bad')
  assert.equal(await page.locator('#form--burialSite').evaluate(form => form.checkValidity()), false)
  await page.locator(`[name=fieldValue_${fieldId}]`).fill('STONE')
  const result = await post('/api/burialSites/doCreateBurialSite', () => page.locator('#form--burialSite button[type=submit]').click())
  await page.waitForURL(new RegExp(`/burialSites/${result.burialSiteId}/edit`))
  await page.locator('#button--deleteBurialSite').waitFor()
  await page.reload()
  await page.locator('#form--burialSite').waitFor()
  assert.equal(await page.locator(`[name=fieldValue_${fieldId}]`).inputValue(), 'STONE')
  assert.equal(await page.locator('[name=bodyCapacity]').inputValue(), '2')
  return result.burialSiteId
}
async function audit() {
  await page.locator('.is-view-audit-log-button').click()
  await dialog.locator('tbody tr').first().waitFor()
  assert.ok((await dialog.locator('tbody tr').count()) > 0)
  assert.match(await dialog.locator('tbody').innerText(), /qa-admin/)
  await dialog.getByRole('button', { name: 'Close / Schließen' }).click()
}
async function screenshot(name, width) {
  await page.setViewportSize({ width, height: width === 1440 ? 1000 : 900 })
  await page.evaluate(() => window.scrollTo(0, 0))
  const overflow = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth,
    elements: [...document.querySelectorAll('body *')].flatMap(element => {
      const box = element.getBoundingClientRect()
      return box.width && (box.right > innerWidth || box.left < 0) ? [{ tag: element.tagName, id: element.id, class: element.className, left: box.left, right: box.right, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }] : []
    }) }))
  if (overflow.document > overflow.width) await writeFile(path.join(output, `overflow-${name}-${width}.json`), JSON.stringify(overflow, null, 2))
  assert.ok(overflow.document <= overflow.width, `Horizontal overflow ${name} ${width}`)
  await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true })
}
try {
  await login(page, process.env.CEMARIS_QA_USERNAME, process.env.CEMARIS_QA_PASSWORD)
  const catalog = '/api/admin/catalogs/'
  const type = await api(catalog + 'burialSiteTypes/add', { burialSiteType: prefix + ' Type', bodyCapacityMax: '3', crematedCapacityMax: '8' })
  const typeId = type.burialSiteTypeId
  const field = await api(catalog + 'burialSiteTypeFields/add', { burialSiteTypeId: typeId, burialSiteTypeField: 'Marker', fieldType: 'text', fieldValues: '', isRequired: '1', pattern: '[A-Z]+', minLength: '2', maxLength: '10' })
  const fieldId = field.burialSiteTypeFieldId
  const status = await api(catalog + 'burialSiteStatuses/add', { burialSiteStatus: prefix + ' Available' })
  const statusId = status.burialSiteStatusId
  const mainId = await createCemetery(prefix + ' Main', 'MAIN')
  await audit()
  const childId = await createCemetery(prefix + ' Child', 'CHILD', mainId)
  const main = (await api(`/api/cemeteries/${mainId}`)).cemetery
  assert.equal(main.childCemeteries[0].cemeteryId, childId)
  await visit('/cemeteries?lng=en', '#searchFilter--cemetery')
  await page.locator('#searchFilter--cemetery').fill('description MAIN')
  assert.equal(await page.locator('#cemeteries-table tbody tr').count(), 1)
  report.push({ case: 'Cemetery CRUD, hierarchy, directions, five-digit postal code, search and audit after SQL reload', passed: true })
  const siteId = await createSite(childId, typeId, statusId, fieldId, '01')
  await audit()
  await page.locator('#burialSiteComments--add').click()
  await dialog.locator('[name=comment]').fill('Synthetic comment <literal & safe>\nSecond line')
  await post('/api/burialSites/doAddBurialSiteComment', () => dialog.locator('button[type=submit]').click())
  await dialog.waitFor({ state: 'detached' })
  let commentRow = page.locator('#container--burialSiteComments tbody tr').first()
  await commentRow.locator('.button--edit').click()
  await dialog.locator('[name=comment]').fill('Synthetic edited comment')
  await dialog.locator('[name=commentDateString]').fill('2026-10-19')
  await dialog.locator('[name=commentTimeString]').fill('09:30')
  await post('/api/burialSites/doUpdateBurialSiteComment', () => dialog.locator('button[type=submit]').click())
  await dialog.waitFor({ state: 'detached' })
  await page.locator('#burialSiteComments--add').click()
  await dialog.locator('[name=comment]').fill('Synthetic delete comment')
  await post('/api/burialSites/doAddBurialSiteComment', () => dialog.locator('button[type=submit]').click())
  await dialog.waitFor({ state: 'detached' })
  await post('/api/burialSites/doDeleteBurialSiteComment', () => page.locator('#container--burialSiteComments tbody tr').filter({ hasText: 'Synthetic delete comment' }).locator('.button--delete').click())
  await page.reload()
  await page.locator('#container--burialSiteComments tbody tr').waitFor()
  assert.equal(await page.locator('#container--burialSiteComments tbody tr').count(), 1)
  assert.match(await page.locator('#container--burialSiteComments').innerText(), /Synthetic edited comment/)
  const comment = (await api(`/api/burialSites/${siteId}`)).burialSite.burialSiteComments[0]
  assert.equal(comment.commentDate, 20261019)
  assert.equal(comment.commentTime, 930)
  const secondId = await createSite(childId, typeId, statusId, fieldId, '02')
  await visit(`/burialSites?cemeteryId=${mainId}&lng=en`, '#searchFilter--burialSiteName')
  await page.locator('#burialSites-table tbody tr').first().waitFor()
  assert.equal(await page.locator('#burialSites-table tbody tr').count(), 2)
  await page.locator('#searchFilter--burialSiteName').fill('CHILD 01')
  await page.waitForFunction(() => document.querySelectorAll('#burialSites-table tbody tr').length === 1)
  await page.locator('#burialSites-table a').first().click()
  await page.locator('.page-content h1').waitFor()
  assert.equal(await page.locator('.page-content h1').innerText(), 'CHILD-A-01')
  await page.locator(`a[href='/burialSites/${siteId}/next']`).click()
  await page.waitForURL(new RegExp(`/burialSites/${secondId}$`))
  await page.locator(`a[href='/burialSites/${secondId}/previous']`).click()
  await page.waitForURL(new RegExp(`/burialSites/${siteId}$`))
  report.push({ case: 'Burial site create/edit/validation, configured segments, capacities, related cemetery filter, name search, next/previous and comments CRUD/reload', passed: true })
  await visit(`/cemeteries/${childId}/edit?lng=en`, '#form--cemetery')
  await page.locator('[name=cemeteryKey]').fill('NEW')
  await post('/api/cemeteries/doUpdateCemetery', () => page.locator('#form--cemetery button[type=submit]').click())
  assert.equal((await api(`/api/burialSites/${siteId}`)).burialSite.burialSiteName, 'NEW-A-01')
  await visit(`/burialSites/${siteId}/edit?lng=en`, '#form--burialSite')
  await post('/api/burialSites/doDeleteBurialSite', () => page.locator('#button--deleteBurialSite').click())
  await page.waitForURL(/\/burialSites\/?$/)
  await page.goto(new URL(`/burialSites/${siteId}/edit?lng=en`, base).href)
  await page.waitForURL(/\/burialSites\/?\?error=burialSiteIdNotFound/)
  await page.getByRole('alert').filter({ hasText: 'Burial Site ID not found.' }).waitFor()
  await visit(`/burialSites/${siteId}?lng=en`, '.is-restore-burial-site-button')
  await post('/api/burialSites/doRestoreBurialSite', () => page.locator('.is-restore-burial-site-button').click())
  await page.locator(`a[href='/burialSites/${siteId}/edit']`).waitFor()
  const restored = (await api(`/api/burialSites/${siteId}`)).burialSite
  assert.equal(restored.burialSiteFields[0].fieldValue, 'STONE')
  assert.equal(restored.burialSiteComments[0].comment, 'Synthetic edited comment')
  report.push({ case: 'Cemetery-key rename rebuild, burial deletion/admin restoration preserves fields/comments', passed: true })
  // Source paging UI is exercised with more than one real result page.
  for (let index = 1; index <= 51; index++) await api('/api/burialSites/doCreateBurialSite', { cemeteryId: mainId, burialSiteTypeId: typeId, burialSiteStatusId: '', burialSiteNameSegment1: 'P', burialSiteNameSegment2: String(index).padStart(3, '0') })
  await visit(`/burialSites?cemeteryId=${mainId}&lng=en`, '#searchFilter--burialSiteName')
  await page.locator('#searchFilter--limit').selectOption('50')
  await page.locator('#searchFilter--burialSiteName').fill('MAIN-P')
  await page.waitForFunction(() => document.querySelectorAll('#burialSites-table tbody tr').length === 50)
  await page.locator('.places-pager [data-page=next]').click()
  await page.waitForFunction(() => document.querySelectorAll('#burialSites-table tbody tr').length === 1)
  report.push({ case: '50-result SQL paging advances to remaining result', passed: true })
  await visit(`/cemeteries/${mainId}/next?lng=en`, '#searchFilter--cemetery')
  await page.getByRole('alert').filter({ hasText: 'No next Cemetery ID found.' }).waitFor()
  await visit(`/cemeteries/${mainId}?lng=en`, '.record-metadata')
  assert.equal(await page.title(), `${prefix} Main: Cemaris`)
  report.push({ case: 'Source missing-ID/no-next messages and record document titles', passed: true })
  for (const [name, route, selector] of [['cemetery-search', '/cemeteries', '#searchFilter--cemetery'], ['cemetery-detail', `/cemeteries/${mainId}`, '.page-content h1'], ['cemetery-edit', `/cemeteries/${childId}/edit`, '#form--cemetery'], ['burial-search', '/burialSites', '#searchFilter--burialSiteName'], ['burial-detail', `/burialSites/${siteId}`, '.record-metadata'], ['burial-edit', `/burialSites/${siteId}/edit`, '#form--burialSite']]) {
    await visit(route + '?lng=de', selector)
    if (name === 'burial-search') await page.locator('#burialSites-table tbody tr').first().waitFor()
    for (const width of [1440, 390, 320]) await screenshot(name, width)
  }
  await visit(`/burialSites/${siteId}/edit?lng=en`, '#form--burialSite')
  await page.locator('#burialSiteComments--add').click()
  for (const width of [1440, 390, 320]) await screenshot('comment-dialog-en', width)
  await dialog.getByRole('button', { name: 'Close / Schließen' }).click()
  const readerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const reader = await readerContext.newPage()
  reader.on('pageerror', error => errors.push(error.message))
  await login(reader, process.env.CEMARIS_QA_READER_USERNAME, process.env.CEMARIS_QA_READER_PASSWORD)
  for (const route of ['/cemeteries', `/cemeteries/${mainId}`, '/burialSites', `/burialSites/${siteId}`]) {
    await reader.goto(new URL(route, base).href)
    await reader.locator('.page-content h1').waitFor()
    assert.equal(await reader.locator('.is-view-audit-log-button, #button--deleteBurialSite, .is-restore-burial-site-button').count(), 0)
  }
  await reader.goto(new URL(`/burialSites/${siteId}/edit`, base).href)
  await reader.waitForURL(/dashboard/)
  await api('/api/burialSites/doDeleteBurialSite', { burialSiteId: siteId }, reader, 403)
  await api('/api/cemeteries/doDeleteCemetery', { cemeteryId: childId }, reader, 403)
  await api('/api/cemeteries/doGetRecordAuditLog', { mainRecordType: 'cemetery', mainRecordId: mainId }, reader, 403)
  await readerContext.close()
  await visit(`/cemeteries/${childId}/edit?lng=en`, '#form--cemetery')
  await post('/api/cemeteries/doDeleteCemetery', () => page.locator('#button--deleteCemetery').click())
  await page.waitForURL(/\/cemeteries\/?$/)
  const deletedSite = (await api(`/api/burialSites/${siteId}`)).burialSite
  assert.ok(deletedSite.recordDelete_timeMillis)
  assert.equal(deletedSite.burialSiteComments.length, 0)
  assert.equal(deletedSite.burialSiteFields[0].fieldValue, '')
  report.push({ case: 'Read-only views and denied mutation/audit/edit; cemetery deletion cascades active site fields/comments', passed: true })
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'places-result.json'), JSON.stringify({ passed: true, report, errors }, null, 2))
  console.log(`PASS: Step05 browser ${report.length - 1} groups, 21 responsive screenshots, no JavaScript errors`)
} catch (error) {
  await page.screenshot({ path: path.join(output, 'places-failure.png'), fullPage: true }).catch(() => {})
  await writeFile(path.join(output, 'places-result.json'), JSON.stringify({ passed: false, report, errors, error: String(error) }, null, 2))
  throw error
} finally {
  await browser.close()
}
