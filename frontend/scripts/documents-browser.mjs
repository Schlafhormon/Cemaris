// Step-11: production React, real document endpoints and disposable SQL Server.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(process.env.CEMARIS_PLAYWRIGHT_MODULE ? pathToFileURL(path.resolve(process.env.CEMARIS_PLAYWRIGHT_MODULE)).href : 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.CEMARIS_BROWSER_EXECUTABLE ? { executablePath: process.env.CEMARIS_BROWSER_EXECUTABLE } : {}) })
const base = process.env.CEMARIS_SMOKE_URL
const output = process.env.CEMARIS_QA_DIRECTORY
const ids = JSON.parse(process.env.CEMARIS_QA_DOCUMENT_IDS)
await mkdir(output, { recursive: true })
const context = await browser.newContext({ locale: 'en-CA', timezoneId: 'Europe/Berlin', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const errors = [], confirmations = [], report = [{ case: 'Runtime', browser: browser.version(), fixture: 'Production build, real API and fresh SQL Server; no response stubs' }]
page.on('pageerror', error => errors.push(error.message))
page.on('dialog', async dialog => { confirmations.push(dialog.message()); await dialog.accept() })
const dialog = page.locator('dialog')
const panel = page.locator('#panel--contractAttachments')
const file = { name: 'synthetic-Übung-🪦.txt', mimeType: 'text/plain', buffer: Buffer.from('SYNTHETIC ONLY\r\nÜbung 🪦 <literal> & test\r\n\0End', 'utf8') }
let screenshots = 0
async function login(target, reader = false) {
  await target.goto(new URL('/login?lng=en', base).href)
  await target.locator('#login--username').fill(process.env[reader ? 'CEMARIS_QA_READER_USERNAME' : 'CEMARIS_QA_USERNAME'])
  await target.locator('#login--password').fill(process.env[reader ? 'CEMARIS_QA_READER_PASSWORD' : 'CEMARIS_QA_PASSWORD'])
  await target.locator('#form--login button[type=submit]').click()
  await target.waitForURL(/\/dashboard\/?$/)
}
async function visit(url, selector) { await page.goto(new URL(url, base).href); await page.locator(selector).waitFor() }
async function api(url, body, target = page, expected = 200, csrf = true) {
  const result = await target.evaluate(async ({ url, body, csrf }) => {
    const session = await (await fetch('/api/session')).json()
    const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': session.csrfToken } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, body: await response.json() }
  }, { url, body, csrf })
  assert.equal(result.status, expected, JSON.stringify(result.body))
  return result.body
}
async function post(name, click) {
  const url = '/api/contracts/' + name
  const pending = page.waitForResponse(response => new URL(response.url()).pathname === url && response.request().method() === 'POST')
  await click()
  const response = await pending
  assert.equal(response.status(), 200, await response.text())
  const body = await response.json(); assert.equal(body.success, true, JSON.stringify(body))
  return body
}
async function shots(name, target = page) {
  for (const width of [1440, 390, 320]) {
    await target.setViewportSize({ width, height: 1000 })
    await target.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur(); window.scrollTo(0, 0) })
    assert.equal(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}/${width}: page overflow`)
    await target.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true }); screenshots++
  }
  await target.setViewportSize({ width: 1440, height: 1000 })
}
const row = id => panel.locator(`[data-attachment-id="${id}"]`)
const close = () => dialog.getByRole('button', { name: 'Close / Schließen', exact: true }).click()
const state = async () => (await api(`/api/contracts/${ids.contract}`)).contract
async function byteDownload(target, locator, name) {
  const pending = target.waitForEvent('download')
  await locator.click()
  const download = await pending
  assert.equal(download.suggestedFilename(), name)
  const destination = path.join(output, 'downloaded-' + name)
  await download.saveAs(destination)
  assert.deepEqual(await readFile(destination), file.buffer)
}
try {
  await login(page)
  const original = await state()
  await visit(`/contracts/${ids.contract}/edit?lng=en`, '#form--contract')
  assert.match(await panel.innerText(), /No attachments have been uploaded/)
  await page.locator('#contract--purchaserName').fill('Unsaved Synthetic Document Purchaser')
  await page.locator('#button--uploadAttachment').click()
  await dialog.locator('#contractAttachmentUpload--file:not([disabled])').waitFor()
  assert.equal(await dialog.locator('#contractAttachmentUpload--maxAttachmentFileSize').innerText(), '1')
  assert.equal(await dialog.locator('[name=file]').getAttribute('accept'), '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv,.xls,.xlsx')
  await dialog.locator('[name=file]').setInputFiles({ name: 'oversized.txt', mimeType: 'text/plain', buffer: Buffer.alloc(1024 * 1024 + 1) })
  assert.match(await dialog.locator('[role=alert]').innerText(), /maximum size/)
  assert.equal(await dialog.locator('[name=file]').inputValue(), '')
  await shots('attachment-limit-en')
  await dialog.locator('[name=file]').setInputFiles(file)
  await dialog.locator('[name=attachmentDetails]').fill('Synthetic details <literal> & Übung 🪦\nSecond line')
  await shots('attachment-upload-en')
  const uploaded = await post('doUploadContractAttachment', () => dialog.locator('button[type=submit]').click())
  const attachment = uploaded.contractAttachments.find(item => item.contractAttachmentId === uploaded.attachmentId)
  assert.ok(attachment, JSON.stringify(uploaded))
  assert.equal(attachment.attachmentTitle, '')
  assert.equal(attachment.fileName, file.name)
  await row(attachment.contractAttachmentId).waitFor()
  assert.equal(await row(attachment.contractAttachmentId).locator('td a').innerText(), file.name)
  assert.equal(await page.locator('#contract--purchaserName').inputValue(), 'Unsaved Synthetic Document Purchaser')
  assert.equal((await state()).purchaserName, original.purchaserName)
  await byteDownload(page, row(attachment.contractAttachmentId).locator('td a'), file.name)
  report.push({ case: 'Maximum-size validation clears file; source accept/optional title/details; Unicode filename fallback; byte-exact browser download; child upload retains unsaved parent and unchanged SQL purchaser', pass: true })

  await row(attachment.contractAttachmentId).locator('[data-cy=edit-attachment]').click()
  assert.equal(await dialog.locator('[name=attachmentTitle]').getAttribute('required'), '')
  assert.equal(await dialog.locator('[name=attachmentTitle]').getAttribute('maxlength'), '100')
  assert.equal(await dialog.locator('[name=attachmentDetails]').getAttribute('maxlength'), '500')
  await dialog.locator('[name=attachmentTitle]').fill('Synthetic <literal> & Übung 🪦')
  await dialog.locator('[name=attachmentDetails]').fill('Synthetic edited <script>literal only</script>\nNext line')
  await shots('attachment-edit-en')
  const edited = await post('doUpdateContractAttachment', () => dialog.locator('button[type=submit]').click())
  assert.equal(edited.contractAttachments.find(item => item.contractAttachmentId === attachment.contractAttachmentId).attachmentTitle, 'Synthetic <literal> & Übung 🪦')
  assert.equal(await row(attachment.contractAttachmentId).locator('td a').innerText(), 'Synthetic <literal> & Übung 🪦')
  assert.equal(await row(attachment.contractAttachmentId).locator('script').count(), 0)
  await shots('attachments-populated-en')
  await api('/api/contracts/doUpdateContractAttachment', { contractAttachmentId: attachment.contractAttachmentId, attachmentTitle: 'no csrf' }, page, 403, false)
  await api('/api/contracts/doDeleteContractAttachment', { contractAttachmentId: attachment.contractAttachmentId }, page, 403, false)
  report.push({ case: 'Required edit title/max lengths; escaped literal title and multiline details; successful update; edit/delete reject missing CSRF', pass: true })

  await page.locator('#button--uploadAttachment').click()
  await dialog.locator('#contractAttachmentUpload--file:not([disabled])').waitFor()
  await dialog.locator('[name=file]').setInputFiles(file)
  const collision = await post('doUploadContractAttachment', () => dialog.locator('button[type=submit]').click())
  const second = collision.contractAttachments.find(item => item.contractAttachmentId === collision.attachmentId)
  assert.equal(second.fileName, file.name.replace(/\.txt$/, ' (1).txt'))
  await byteDownload(page, row(second.contractAttachmentId).locator('td a'), second.fileName)
  report.push({ case: 'Repeated filename is preserved as a distinct collision-suffixed file with byte-exact download', pass: true })

  // Fresh pages discard only the intentionally unsaved parent input.
  await visit(`/contracts/${ids.contract}?lng=de`, '#contract-detail')
  await page.locator('.print-menu summary').waitFor()
  assert.equal(await page.locator('#button--uploadAttachment, [data-cy=edit-attachment], [data-cy=delete-attachment]').count(), 0)
  await shots('attachments-view-de')
  await page.locator('.print-menu summary').click()
  const contractLink = page.locator('.print-menu-items a[href*="screen/contract"]').first()
  await contractLink.waitFor()
  const customLink = page.locator('.print-menu-items a[href*="pdf/synthetic"]').first()
  await customLink.waitFor()
  const customResponse = await context.request.get(new URL(await customLink.getAttribute('href'), base).href)
  assert.equal(customResponse.status(), 200, await customResponse.text())
  assert.match(customResponse.headers()['content-type'], /application\/pdf/)
  assert.equal((await customResponse.body()).subarray(0, 5).toString(), '%PDF-')
  await writeFile(path.join(output, 'custom-synthetic-contract.pdf'), await customResponse.body())
  await shots('contract-print-menu-de')
  const popupPromise = page.waitForEvent('popup')
  await contractLink.click()
  const printPage = await popupPromise
  printPage.on('pageerror', error => errors.push(error.message))
  await printPage.waitForLoadState('networkidle')
  assert.equal(new URL(printPage.url()).origin, new URL(base).origin)
  const favicon = await printPage.evaluate(async () => {
    const link = document.querySelector('link[rel~="icon"]')
    const response = await fetch(link.href)
    return { ok: response.ok, signature: [...new Uint8Array(await response.arrayBuffer()).slice(0, 8)] }
  })
  assert.equal(favicon.ok, true)
  assert.deepEqual(favicon.signature, [137, 80, 78, 71, 13, 10, 26, 10])
  assert.match(await printPage.title(), /Cemaris/)
  assert.match(await printPage.locator('h1').innerText(), /Burial Site Contract/)
  await printPage.screenshot({ path: path.join(output, 'contract-screen-desktop.png'), fullPage: true }); screenshots++
  await writeFile(path.join(output, 'contract-screen.html'), await printPage.content())
  let printed = false
  await printPage.exposeFunction('qaPrinted', () => { printed = true })
  await printPage.evaluate(() => { window.print = () => window.qaPrinted() })
  await printPage.locator('button[title="Print"]').click()
  await printPage.waitForTimeout(100)
  assert.equal(printed, true)
  await printPage.emulateMedia({ media: 'print' })
  await printPage.pdf({ path: path.join(output, 'contract-screen-browser.pdf'), format: 'Letter', printBackground: true })
  await printPage.close()
  report.push({ case: 'DE view has read-only linked attachments; configured contract print opens rendered Cemaris HTML, functional print button and browser-rendered PDF sample', pass: true })

  for (const suffix of ['', '/edit']) {
    await visit(`/workOrders/${ids.work_order}${suffix}?lng=en`, suffix ? '#form--workOrderEdit' : '#panel--milestones')
    await page.locator('.print-menu summary').waitFor()
    await page.locator('.print-menu summary').click()
    const choices = await page.locator('.print-menu-items a').evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute('href'), title: node.textContent })))
    assert.ok(choices.some(item => item.href.includes('/pdf/workOrder?')))
    assert.ok(choices.some(item => item.href.includes('/pdf/workOrder-commentLog?')))
    if (!suffix) {
      await shots('work-order-print-menu-en')
      for (const choice of choices) {
        const response = await context.request.get(new URL(choice.href, base).href)
        assert.equal(response.status(), 200, await response.text())
        assert.match(response.headers()['content-type'], /application\/pdf/)
        const bytes = await response.body()
        assert.equal(bytes.subarray(0, 5).toString(), '%PDF-')
        assert.match(response.headers()['content-disposition'], /\.pdf/i)
        await writeFile(path.join(output, choice.href.includes('commentLog') ? 'work-order-comment-log.pdf' : 'work-order-field-sheet.pdf'), bytes)
      }
    }
  }
  await visit('/workOrders?lng=en', '#container--searchResults tbody tr')
  const firstPrint = page.locator(`#container--searchResults [data-work-order-id="${ids.work_order}"] a[href*="/print/"]`)
  await firstPrint.waitFor()
  assert.match(await firstPrint.getAttribute('href'), /\/print\/pdf\/workOrder\?workOrderId=/)
  report.push({ case: 'Workorder view/edit configured PDF choices, both real PDFs with filenames/content signature; search first-print action', pass: true })

  await visit('/admin/contractTypes?lng=en', '#tab-prints')
  await page.locator('#tab-prints').click()
  const printTypePanel = page.locator(`#catalog-prints [data-catalog-id="${ids.contract_type}"]`)
  assert.ok(await page.locator('#catalog-prints').getByText('Synthetic Custom Print', { exact: true }).count())
  await printTypePanel.getByRole('button', { name: 'Add Print', exact: true }).click()
  assert.equal(await dialog.locator('option[value="pdf/synthetic"]').innerText(), 'Synthetic Custom Print')
  await dialog.locator('[name=printEJS]').selectOption('*')
  const wildcardPending = page.waitForResponse(response => new URL(response.url()).pathname === '/api/admin/catalogs/contractTypePrints/add')
  await dialog.locator('button[type=submit]').click()
  assert.equal((await (await wildcardPending).json()).success, true)
  await dialog.waitFor({ state: 'detached' })
  await shots('print-config-custom-en')
  const mutation = (action, printEJS) => api(`/api/admin/catalogs/contractTypePrints/${action}`, { contractTypeId: ids.contract_type, printEJS })
  await mutation('delete', 'screen/contract'); await mutation('delete', 'pdf/synthetic')
  assert.deepEqual((await api(`/api/print/options?contractId=${ids.contract}`)).prints.map(item => item.path), ['screen/contract', 'pdf/synthetic'])
  await mutation('delete', '*')
  assert.deepEqual((await api(`/api/print/options?contractId=${ids.contract}`)).prints, [])
  await mutation('add', 'screen/contract'); await mutation('add', 'pdf/synthetic')
  report.push({ case: 'Administrator sees discovered custom title and selector; wildcard supplies all configured defaults after individual removal; no assignment returns no choices; explicit selections restored', pass: true })

  const readerContext = await browser.newContext()
  const reader = await readerContext.newPage()
  reader.on('pageerror', error => errors.push(error.message))
  await login(reader, true)
  await reader.goto(new URL(`/contracts/${ids.contract}?lng=en`, base).href)
  await reader.locator('#panel--contractAttachments').waitFor()
  assert.equal(await reader.locator('#button--uploadAttachment, [data-cy=edit-attachment], [data-cy=delete-attachment]').count(), 0)
  await byteDownload(reader, reader.locator(`[data-attachment-id="${attachment.contractAttachmentId}"] td a`), file.name)
  for (const [name, body] of [
    ['doUpdateContractAttachment', { contractAttachmentId: attachment.contractAttachmentId, attachmentTitle: 'forbidden' }],
    ['doDeleteContractAttachment', { contractAttachmentId: attachment.contractAttachmentId }],
  ]) await api('/api/contracts/' + name, body, reader, 403)
  const deniedUpload = await reader.evaluate(async contractId => {
    const session = await (await fetch('/api/session')).json()
    const form = new FormData(); form.set('contractId', String(contractId)); form.set('file', new Blob(['forbidden']), 'forbidden.txt')
    return (await fetch('/api/contracts/doUploadContractAttachment', { method: 'POST', body: form, headers: { 'X-CSRF-Token': session.csrfToken } })).status
  }, ids.contract)
  assert.equal(deniedUpload, 403)
  const readerPrint = await readerContext.request.get(new URL(`/print/screen/contract?contractId=${ids.contract}`, base).href)
  assert.equal(readerPrint.status(), 200)
  assert.match(await readerPrint.text(), /Burial Site Contract/)
  const readerPdf = await readerContext.request.get(new URL(`/print/pdf/workOrder?workOrderId=${ids.work_order}`, base).href)
  assert.equal(readerPdf.status(), 200)
  assert.equal((await readerPdf.body()).subarray(0, 5).toString(), '%PDF-')
  await shots('attachments-reader-en', reader)
  await readerContext.close()
  const anonymous = await browser.newContext()
  const anonymousFile = await anonymous.request.get(new URL(`/api/contracts/attachment/${attachment.contractAttachmentId}`, base).href)
  assert.equal(anonymousFile.status(), 401)
  await anonymous.close()
  report.push({ case: 'Authenticated reader downloads byte-exact file and HTML/PDF; no write controls, forbidden upload/edit/delete; anonymous download denied', pass: true })

  await visit(`/contracts/${ids.contract}/edit?lng=de`, '#form--contract')
  await page.locator('#button--uploadAttachment').click()
  await dialog.locator('#contractAttachmentUpload--file:not([disabled])').waitFor()
  assert.match(await dialog.locator('h2').innerText(), /Anhang hochladen/)
  await shots('attachment-upload-de')
  await close()
  for (const item of [attachment, second]) {
    await post('doDeleteContractAttachment', () => row(item.contractAttachmentId).locator('[data-cy=delete-attachment]').click())
    assert.ok(confirmations.at(-1).includes('unwiderruflich'))
    assert.equal(await row(item.contractAttachmentId).count(), 0)
  }
  assert.deepEqual((await state()).contractAttachments, [])
  await shots('attachments-empty-de')
  // Source soft deletion retains bytes but removes the active download route.
  const historical = await context.request.get(new URL(`/api/contracts/attachment/${attachment.contractAttachmentId}`, base).href)
  assert.equal(historical.status(), 404)
  report.push({ case: 'DE upload and irreversible-delete confirmation; SQL active list emptied and deleted attachment route returns404 as in source; responsive 1440/390/320px views', pass: true })

  assert.deepEqual(errors, [])
  const result = { result: 'PASS', report, screenshots, javascriptErrors: errors }
  await writeFile(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {})
  await writeFile(path.join(output, 'failure.txt'), String(error.stack || error))
  throw error
} finally { await browser.close() }
