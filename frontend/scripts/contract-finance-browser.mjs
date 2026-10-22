// Step-09: production React build, real API and freshly created SQL Server DB.
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
const context = await browser.newContext({ locale: 'en-CA', timezoneId: 'Europe/Berlin', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const errors = [], dialogs = [], report = [{ case: 'Runtime', browser: browser.version(), fixture: 'Real API and disposable SQL Server; no request stubs' }]
page.on('pageerror', error => errors.push(error.message))
page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept() })
const dialog = page.locator('dialog')
let screenshots = 0
async function login(target, reader = false) {
  await target.goto(new URL('/login?lng=en', base).href)
  await target.locator('#login--username').fill(process.env[reader ? 'CEMARIS_QA_READER_USERNAME' : 'CEMARIS_QA_USERNAME'])
  await target.locator('#login--password').fill(process.env[reader ? 'CEMARIS_QA_READER_PASSWORD' : 'CEMARIS_QA_PASSWORD'])
  await target.locator('#form--login button[type=submit]').click()
  await target.waitForURL(/\/dashboard\/?$/)
}
async function visit(url, selector) { await page.goto(new URL(url, base).href); await page.locator(selector).waitFor() }
async function api(url, body, target = page, status = 200) {
  const result = await target.evaluate(async ({ url, body }) => {
    const session = await (await fetch('/api/session')).json()
    const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, body: await response.json() }
  }, { url, body })
  assert.equal(result.status, status, JSON.stringify(result.body))
  return result.body
}
async function post(action, click) {
  const url = '/api/contracts/do' + action
  const pending = page.waitForResponse(value => new URL(value.url()).pathname === url && value.request().method() === 'POST')
  await click()
  const response = await pending
  assert.equal(response.status(), 200, await response.text())
  const result = await response.json()
  assert.equal(result.success, true, JSON.stringify(result))
  return result
}
async function shots(name) {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => { document.activeElement instanceof HTMLElement && document.activeElement.blur(); window.scrollTo(0, 0) })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow ${name}/${width}`)
    await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true }); screenshots++
    if (width === 390 && name === 'transaction-edit-en') { await page.screenshot({ path: path.join(output, `${name}-viewport.png`), fullPage: false }); screenshots++ }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
}
const close = () => dialog.getByRole('button', { name: 'Close / Schließen', exact: true }).click()
const contractUrl = `/api/contracts/${ids.contract}`
const editUrl = `/contracts/${ids.contract}/edit?lng=en`
const feeRow = id => page.locator(`#container--contractFees [data-fee-id="${id}"]`)
const choice = id => dialog.locator(`.container--fee[data-fee-id="${id}"]`)
const txnRow = index => page.locator(`#container--contractTransactions [data-transaction-index="${index}"]`)
const masterKeys = ['purchaserName', 'contractStartDate', 'contractEndDate', 'funeralDate', 'funeralTime', 'burialSiteId', 'recordUpdate_timeMillis']
const pick = row => Object.fromEntries(masterKeys.map(key => [key, row[key]]))
async function state() { return (await api(contractUrl)).contract }
async function checkTotals() {
  const contract = await state()
  const fees = contract.contractFees, transactions = contract.contractTransactions
  const amount = fees.reduce((sum, fee) => sum + fee.feeAmount * fee.quantity, 0)
  const tax = fees.reduce((sum, fee) => sum + fee.taxAmount * fee.quantity, 0)
  const total = transactions.reduce((sum, txn) => sum + txn.transactionAmount, 0)
  assert.equal(await page.locator('#contractFees--feeAmountTotal').innerText(), '$' + amount.toFixed(2))
  assert.equal(await page.locator('#contractFees--taxAmountTotal').innerText(), '$' + tax.toFixed(2))
  assert.equal(await page.locator('#contractFees--grandTotal').innerText(), '$' + (amount + tax).toFixed(2))
  assert.equal(await page.locator('#contractTransactions--grandTotal').innerText(), '$' + total.toFixed(2))
  return { contract, feeTotal: fees.reduce((sum, fee) => sum + (fee.feeAmount + fee.taxAmount) * fee.quantity, 0), total }
}
try {
  await login(page)
  const originalRendererCases = JSON.parse(process.env.CEMARIS_QA_FINANCE_BROWSER_CASES || '[]')
  for (const fixture of originalRendererCases) {
    if (fixture.skipped) { report.push({ case: `Original renderer case ${fixture.sourceIndex}`, skipped: fixture.skipped }); continue }
    await visit(`/contracts/${fixture.contractId}/edit?lng=en`, '#form--contract')
    const expected = fixture.expected
    for (const selector of ['#contractFees--feeAmountTotal', '#contractFees--taxAmountTotal', '#contractFees--grandTotal']) {
      if (selector in expected.feeTotals) assert.equal(await page.locator(selector).innerText(), expected.feeTotals[selector], `Original fee total ${fixture.sourceIndex}/${selector}`)
      else assert.equal(await page.locator(selector).count(), 0, `Original empty fee footer ${fixture.sourceIndex}/${selector}`)
    }
    if (expected.transactionTotal === null) assert.equal(await page.locator('#contractTransactions--grandTotal').count(), 0, `Original empty transaction footer ${fixture.sourceIndex}`)
    else assert.equal(await page.locator('#contractTransactions--grandTotal').innerText(), expected.transactionTotal, `Original transaction total ${fixture.sourceIndex}`)
    const balance = page.locator('.finance-balance')
    if (expected.warning === null) assert.equal(await balance.count(), 0, `Original balance hidden after two-decimal comparison ${fixture.sourceIndex}`)
    else {
      assert.ok((await balance.innerText()).includes(expected.warning), `Original balance label ${fixture.sourceIndex}`)
      assert.equal(await balance.locator('strong').innerText(), '$' + expected.warningAmount, `Original balance amount ${fixture.sourceIndex}`)
    }
    for (let index = 0; index < fixture.feeIds.length; index++) {
      const amounts = [...(await feeRow(fixture.feeIds[index]).innerText()).matchAll(/\$([\d.-]+)/g)].map(match => match[1])
      assert.deepEqual(amounts, expected.rowTotals[index], `Original unit/row rounding ${fixture.sourceIndex}/${index}`)
    }
    for (let index = 0; index < fixture.transactionIndices.length; index++) {
      assert.equal(await txnRow(fixture.transactionIndices[index]).getByText('Invoiced', { exact: true }).count(), expected.invoiced[index] ? 1 : 0, `Original invoice flag ${fixture.sourceIndex}/${index}`)
    }
    report.push({ case: `Original renderer case ${fixture.sourceIndex}: persisted SQL amounts, React totals/row rounding/invoice labels/balance`, pass: true })
  }
  await visit(editUrl, '#form--contract')
  const before = await state()
  await checkTotals()
  await page.locator('#form--contract [name=purchaserName]').fill('Unsaved Synthetic Finance')
  await page.locator('#button--addFee').click()
  assert.match(dialogs.at(-1), /save all unsaved changes/)
  assert.equal(await dialog.count(), 0)
  await page.reload(); await page.locator('#form--contract').waitFor()
  await page.locator('#button--addFee').click()
  await choice(ids.variable_fee).waitFor()
  assert.equal(await choice(ids.excluded_fee).count(), 0)
  await dialog.locator('#feeSelect--feeName').fill('manual LITERAL')
  assert.equal(await choice(ids.variable_fee).count(), 1)
  assert.equal(await choice(ids.dynamic_fee).count(), 0)
  await shots('fee-picker-en')
  await choice(ids.variable_fee).click()
  await dialog.locator('[name=feeAmount]').fill('12.34')
  assert.equal(await dialog.locator('[name=feeAmount]').getAttribute('step'), '0.01')
  await shots('fee-amount-en')
  await dialog.locator('button[type=submit]').click()
  await dialog.locator('[name=quantity]').fill('2')
  assert.equal(await dialog.locator('[name=quantity]').getAttribute('max'), '1000')
  await shots('fee-quantity-en')
  let added = await post('AddContractFee', () => dialog.locator('button[type=submit]').click())
  let variable = added.contractFees.find(fee => fee.feeId === ids.variable_fee)
  assert.equal(variable.quantity, 2); assert.equal(variable.feeAmount, 12.34); assert.equal(variable.taxAmount, 0)
  await choice(ids.variable_fee).click()
  await page.keyboard.press('Escape')
  await dialog.locator('#feeSelect--feeName').waitFor()
  await dialog.locator('#feeSelect--feeName').fill('')
  added = await post('AddContractFee', () => choice(ids.dynamic_fee).click())
  assert.equal(added.contractFees.find(fee => fee.feeId === ids.dynamic_fee).feeAmount, 0)
  assert.equal(added.contractFees.find(fee => fee.feeId === ids.dynamic_fee).taxAmount, 2.5)
  assert.equal(await choice(ids.dynamic_fee).count(), 0)
  await post('AddContractFeeCategory', () => dialog.locator(`.container--feeCategory[data-fee-category-id="${ids.group_category}"] button`).click())
  await close()
  await checkTotals()
  await page.reload(); await page.locator('#form--contract').waitFor()
  assert.ok((await feeRow(ids.variable_fee).innerText()).includes('Synthetic variable <literal>'))
  report.push({ case: 'Dirty guard, type-filtered and multiword catalogue, manual amount/quantity (zero manual tax), nested Escape, zero dynamic fee/fixed tax, grouped fees, SQL reload', pass: true })

  await page.locator('#form--contract [name=purchaserName]').fill('Unsaved Synthetic Finance')
  await feeRow(ids.variable_fee).locator('.button--editQuantity').click()
  await dialog.locator('[name=quantity]').fill('3')
  await post('UpdateContractFeeQuantity', () => dialog.locator('button[type=submit]').click())
  assert.equal(await page.locator('#form--contract [name=purchaserName]').inputValue(), 'Unsaved Synthetic Finance')
  assert.equal((await state()).contractFees.find(fee => fee.feeId === ids.variable_fee).quantity, 3)
  const totals = await checkTotals()
  await page.locator('#button--addTransaction').click()
  const amountInput = dialog.locator('[name=transactionAmount]')
  assert.equal(await amountInput.inputValue(), Math.max(totals.feeTotal - totals.total, 0).toFixed(2))
  assert.equal(await amountInput.getAttribute('min'), (-totals.total).toFixed(2))
  assert.equal(await amountInput.getAttribute('max'), Math.max(totals.feeTotal - totals.total, 0).toFixed(2))
  await amountInput.fill('10.05')
  await dialog.locator('[name=isInvoiced]').selectOption('1')
  await dialog.locator('[name=externalReceiptNumber]').fill('SYNTHETIC <receipt>')
  await dialog.locator('[name=transactionNote]').fill('Synthetic <literal>\nSecond line')
  await shots('transaction-add-en')
  const result = await post('AddContractTransaction', () => dialog.locator('button[type=submit]').click())
  const transaction = result.contractTransactions.find(txn => txn.externalReceiptNumber === 'SYNTHETIC <receipt>')
  assert.ok(transaction.isInvoiced)
  assert.equal(await page.locator('#form--contract [name=purchaserName]').inputValue(), 'Unsaved Synthetic Finance')
  assert.deepEqual(pick(await state()), pick(before))
  await txnRow(transaction.transactionIndex).locator('.button--edit').click()
  assert.equal(await dialog.locator('[name=transactionAmount]').getAttribute('max'), null)
  await dialog.locator('[name=transactionAmount]').fill('999.99')
  await dialog.locator('[name=transactionDateString]').fill('2026-10-19')
  await dialog.locator('[name=transactionTimeString]').fill('00:00')
  await dialog.locator('[name=isInvoiced]').selectOption('0')
  await shots('transaction-edit-en')
  await post('UpdateContractTransaction', () => dialog.locator('button[type=submit]').click())
  await page.locator('.finance-balance').getByText('Overpayment', { exact: true }).waitFor()
  await page.locator('#button--addTransaction').click()
  assert.equal(await dialog.locator('[name=transactionAmount]').getAttribute('max'), '0.00')
  await dialog.locator('[name=transactionAmount]').fill('-10.00')
  await post('AddContractTransaction', () => dialog.locator('button[type=submit]').click())
  assert.ok((await state()).contractTransactions.some(txn => txn.transactionAmount === -10))
  await checkTotals()
  report.push({ case: 'Quantity update, add payment bounds/default, invoice flag, literal receipt/note, unsaved master preserved, unrestricted edit, midnight, overpayment and refund', pass: true })

  await page.locator('#form--contract [name=purchaserName]').fill(before.purchaserName)
  await post('DeleteContractTransaction', () => txnRow(transaction.transactionIndex).locator('.button--delete').click())
  await post('DeleteContractFee', () => feeRow(ids.dynamic_fee).locator('.button--delete').click())
  await page.reload(); await page.locator('#form--contract').waitFor()
  assert.equal(await feeRow(ids.dynamic_fee).count(), 0)
  assert.equal(await txnRow(transaction.transactionIndex).count(), 0)
  await page.locator('#button--addFee').click()
  await post('AddContractFee', () => choice(ids.dynamic_fee).click())
  await close()
  await page.locator('.is-view-audit-log-button').click()
  await dialog.locator('tbody tr').first().waitFor()
  assert.ok((await dialog.innerText()).includes('ContractFees'))
  assert.ok((await dialog.innerText()).includes('ContractTransactions'))
  await shots('finance-audit-en'); await close()
  report.push({ case: 'Fee/payment soft delete persists, fee recreation, full financial audit under contract permission', pass: true })

  const readerContext = await browser.newContext()
  const reader = await readerContext.newPage()
  reader.on('pageerror', error => errors.push(error.message))
  await login(reader, true)
  await reader.goto(new URL(`/contracts/${ids.contract}?lng=de`, base).href)
  await reader.locator('#contract-detail').waitFor()
  assert.equal(await reader.locator('#button--addFee, #button--addTransaction, .button--editQuantity').count(), 0)
  for (const action of ['GetFees', 'AddContractFee', 'AddContractFeeCategory', 'UpdateContractFeeQuantity', 'DeleteContractFee', 'AddContractTransaction', 'UpdateContractTransaction', 'DeleteContractTransaction']) {
    await api('/api/contracts/do' + action, { contractId: ids.contract }, reader, 403)
  }
  assert.ok((await api(contractUrl + '/fees', undefined, reader)).contractFees.length)
  assert.ok((await api(contractUrl + '/transactions', undefined, reader)).contractTransactions.length)
  await readerContext.close()
  await visit(`/contracts/${ids.contract}?lng=de`, '#contract-detail')
  await shots('finance-detail-de')
  await visit(`/contracts/${ids.contract}/edit?lng=de`, '#form--contract')
  await page.locator('#button--addTransaction').click()
  await shots('transaction-add-de'); await close()
  await page.locator('#button--addFee').click()
  await choice(ids.variable_fee).waitFor()
  await shots('fee-picker-de'); await close()
  report.push({ case: 'All eight reader mutations denied, financial reads allowed, English/German desktop/mobile layouts; no horizontal document overflow', pass: true })
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ result: 'PASS', report, screenshots, javascriptErrors: errors }, null, 2) + '\n')
  console.log(JSON.stringify({ result: 'PASS', report, screenshots, javascriptErrors: errors }, null, 2))
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {})
  await writeFile(path.join(output, 'failure.txt'), String(error.stack || error))
  throw error
} finally { await browser.close() }
