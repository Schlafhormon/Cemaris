// Step-04 live UI QA. Run exclusively through scripts/qa_catalog_browser.py.
// Uses a newly created disposable SQL Server database and synthetic accounts.
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
const report = [{ case: 'Runtime', browser: browser.version() }]
const errors = []
const context = await browser.newContext({ locale: 'en-CA', viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
page.on('pageerror', (error) => errors.push(error.message))
const prefix = `Synthetic ${Date.now()}`
const dialog = page.locator('dialog')
const name = (resource) => resource.endsWith('Statuses') ? resource.slice(0, -2) : resource.endsWith('ies') ? `${resource.slice(0, -3)}y` : resource.slice(0, -1)
const state = async () => page.evaluate(async () => (await (await fetch('/api/admin/catalogs')).json()))
async function post(resource, action, click, expected = 200) {
  const response = page.waitForResponse((value) => value.url().includes(`/api/admin/catalogs/${resource}/${action}`) && value.request().method() === 'POST')
  await click()
  const result = await response
  assert.equal(result.status(), expected, await result.text())
  return result.json()
}
async function save(resource, action = 'update') {
  const result = await post(resource, action, () => dialog.locator('button[type=submit]').click())
  return result
}
async function visit(route, language = 'en') {
  await page.goto(new URL(`/admin/${route}?lng=${language}`, base).href)
  await page.locator('.page-content h1').waitFor()
  await page.locator('#button--addBurialSiteType, #button--addContractType, #button--addFeeCategory, [data-table=workOrderTypes]').first().waitFor()
  await page.waitForFunction(() => {
    const add = document.querySelector('#button--addBurialSiteType, #button--addContractType, #button--addFeeCategory')
    return add ? !add.disabled : Boolean(document.querySelector('[data-table=workOrderTypes]'))
  })
}
async function login(target, username, password) {
  await target.goto(new URL('/login?lng=en', base).href)
  await target.locator('#login--username').fill(username)
  await target.locator('#login--password').fill(password)
  await target.locator('#form--login button[type=submit]').click()
  await target.waitForURL(/\/dashboard\/?$/)
}
async function addType(resource, title) {
  await page.locator(`#button--add${resource === 'burialSiteTypes' ? 'BurialSiteType' : 'ContractType'}`).click()
  await dialog.locator(`[name=${name(resource)}]`).fill(title)
  if (resource === 'burialSiteTypes') {
    await dialog.locator('[name=bodyCapacityMax]').fill('2')
    await dialog.locator('[name=crematedCapacityMax]').fill('8')
  } else await dialog.locator('[name=isPreneed]').check()
  const result = await save(resource, 'add')
  await dialog.waitFor({ state: 'detached' })
  return result[resource].find((row) => row[name(resource)] === title)
}
async function addField(resource, parent, fieldTitle, global = false) {
  const panel = global ? page.locator('[data-catalog-global=true]') : page.locator(`#container--${resource === 'contractTypeFields' ? 'contractTypes' : 'burialSiteTypes'} [data-catalog-id="${parent[resource === 'contractTypeFields' ? 'contractTypeId' : 'burialSiteTypeId']}"]`)
  await panel.getByRole('button', { name: 'Add Field', exact: true }).click()
  await dialog.locator(`[name=${name(resource)}]`).fill(fieldTitle)
  const result = await save(resource, 'add')
  await dialog.locator('[name=fieldType]').waitFor()
  await dialog.locator('[name=fieldType]').selectOption('select')
  assert.equal(await dialog.locator('[name=minLength]').isDisabled(), true)
  assert.equal(await dialog.locator('[name=fieldValues]').isDisabled(), false)
  await dialog.locator('[name=fieldValues]').fill('First\nSecond\n<Safe & literal>')
  await dialog.locator('[name=isRequired]').selectOption('1')
  await save(resource)
  await dialog.waitFor({ state: 'detached' })
  return result[`${name(resource)}Id`]
}
try {
  await login(page, process.env.CEMARIS_QA_USERNAME, process.env.CEMARIS_QA_PASSWORD)
  await visit('burialSiteTypes')
  const burial = await addType('burialSiteTypes', `${prefix} Site`)
  const burialId = burial.burialSiteTypeId
  const burialFieldId = await addField('burialSiteTypeFields', burial, `${prefix} Field`)
  await page.reload()
  let panel = page.locator(`[data-catalog-id="${burialId}"]`)
  await panel.locator('button[aria-expanded]').click()
  await panel.locator(`[data-field-id="${burialFieldId}"] .text-button`).click()
  assert.equal(await dialog.locator('[name=fieldValues]').inputValue(), 'First\nSecond\n<Safe & literal>')
  await dialog.locator('[name=fieldType]').selectOption('date')
  assert.equal(await dialog.locator('[name=fieldValues]').isDisabled(), true)
  assert.equal(await dialog.locator('[name=pattern]').isDisabled(), true)
  await save('burialSiteTypeFields')
  await dialog.waitFor({ state: 'detached' })
  await panel.locator(`[data-field-id="${burialFieldId}"] .text-button`).click()
  await dialog.locator('[name=fieldType]').selectOption('text')
  await dialog.locator('[name=minLength]').fill('2')
  await dialog.locator('[name=maxLength]').fill('12')
  await dialog.locator('[name=pattern]').fill('[A-Z]+')
  await save('burialSiteTypeFields')
  await dialog.waitFor({ state: 'detached' })
  await panel.locator('.catalog-name').click()
  assert.equal(await dialog.locator('[name=bodyCapacityMax]').inputValue(), '2')
  await dialog.locator('[name=bodyCapacityMax]').fill('3')
  await save('burialSiteTypes')
  await dialog.waitFor({ state: 'detached' })
  const second = await addType('burialSiteTypes', `${prefix} Second Site`)
  await post('burialSiteTypes', 'moveUp', () => page.locator(`[data-catalog-id="${second.burialSiteTypeId}"]`).getByRole('button', { name: 'Move Up', exact: true }).click({ modifiers: ['Shift'] }))
  assert.equal((await state()).burialSiteTypes[0].burialSiteTypeId, second.burialSiteTypeId)
  await page.reload()
  assert.equal((await state()).burialSiteTypes.find((row) => row.burialSiteTypeId === burialId).bodyCapacityMax, 3)
  report.push({ case: 'Burial types, defaults/capacity, field select/date/text state, literal values, required/pattern/length, shift move-to-top and SQL reload', passed: true })

  await visit('contractTypes')
  const contract = await addType('contractTypes', `${prefix} Contract`)
  const fieldId = await addField('contractTypeFields', contract, `${prefix} Contract Field`)
  const globalId = await addField('contractTypeFields', {}, `${prefix} Shared Field`, true)
  const globalSecondId = await addField('contractTypeFields', {}, `${prefix} Second Shared Field`, true)
  const globalField = page.locator(`[data-catalog-global=true] [data-field-id="${globalSecondId}"]`)
  await post('contractTypeFields', 'moveDown', () => globalField.getByRole('button', { name: 'Move Down', exact: true }).click(), 409)
  await page.getByRole('alert').filter({ hasText: 'source_global_field_move' }).waitFor()
  await page.getByRole('tab', { name: 'Prints', exact: true }).click()
  panel = page.locator(`#catalog-prints [data-catalog-id="${contract.contractTypeId}"]`)
  const config = (await state()).config
  await panel.getByRole('button', { name: 'Add Print', exact: true }).click()
  await dialog.locator('[name=printEJS]').selectOption('*')
  await save('contractTypePrints', 'add')
  await dialog.waitFor({ state: 'detached' })
  if (Object.keys(config.contractTypePrintTitles).length) {
    const print = Object.keys(config.contractTypePrintTitles)[0]
    await panel.getByRole('button', { name: 'Add Print', exact: true }).click()
    await dialog.locator('[name=printEJS]').selectOption(print)
    await save('contractTypePrints', 'add')
    await dialog.waitFor({ state: 'detached' })
    await post('contractTypePrints', 'moveUp', () => panel.locator(`[data-print="${print}"]`).getByRole('button', { name: 'Move Up', exact: true }).click())
    page.once('dialog', (value) => value.accept())
    await post('contractTypePrints', 'delete', () => panel.locator(`[data-print="${print}"]`).getByRole('button', { name: 'Delete', exact: true }).click())
  }
  await page.reload()
  const persistedContract = (await state()).contractTypes.find((row) => row.contractTypeId === contract.contractTypeId)
  assert.equal(persistedContract.isPreneed, true)
  assert.ok(persistedContract.contractTypeFields.some((row) => row.contractTypeFieldId === fieldId))
  assert.deepEqual(persistedContract.contractTypePrints, ['*'])
  assert.ok((await state()).allContractTypeFields.some((row) => row.contractTypeFieldId === globalId))
  report.push({ case: 'Contract types/prenneed, type/global fields, preserved source global move error, wildcard/configured prints add/move/delete, SQL reload', passed: true })

  await visit('tables')
  for (const resource of ['workOrderTypes', 'workOrderStatuses', 'workOrderMilestoneTypes', 'committalTypes', 'serviceTypes', 'intermentContainerTypes', 'intermentDepths', 'burialSiteStatuses']) {
    const table = page.locator(`[data-table=${resource}]`)
    await table.locator('.panel-heading button').click()
    const form = table.locator('.catalog-add-form')
    const title = `${prefix} ${resource}`
    await form.locator(`[name=${name(resource)}]`).fill(title)
    if (resource === 'intermentContainerTypes') await form.locator('[name=isCremationType]').selectOption('1')
    const added = await post(resource, 'add', () => form.locator('button[type=submit]').click())
    const record = added[resource].find((row) => row[name(resource)] === title)
    const row = table.locator(`[data-record-id="${record[`${name(resource)}Id`]}"]`)
    await row.locator(`[name=${name(resource)}]`).fill(`${title} Edited`)
    await post(resource, 'update', () => row.getByRole('button', { name: 'Save', exact: true }).click())
    await post(resource, 'moveUp', () => row.getByRole('button', { name: 'Move Up', exact: true }).click({ modifiers: ['Shift'] }))
    assert.equal((await state())[resource][0][name(resource)], `${title} Edited`)
    page.once('dialog', (value) => value.accept())
    await post(resource, 'delete', () => row.getByRole('button', { name: `Delete: ${title} Edited`, exact: true }).click())
    await row.waitFor({ state: 'detached' })
  }
  await page.reload()
  report.push({ case: 'All eight general catalogs: add/update/shift order/delete; cremation flags; reload', passed: true })

  await visit('fees')
  await page.locator('#button--addFeeCategory').click()
  await dialog.locator('[name=feeCategory]').fill(`${prefix} Fees`)
  await dialog.locator('[name=isGroupedFee]').check()
  const categories = await save('feeCategories', 'add')
  await dialog.waitFor({ state: 'detached' })
  const category = categories.feeCategories.find((row) => row.feeCategory === `${prefix} Fees`)
  const categoryPanel = page.locator(`[data-category-id="${category.feeCategoryId}"]`)
  await categoryPanel.getByRole('button', { name: 'Add · Fees', exact: true }).click()
  await dialog.locator('[name=feeName]').fill(`${prefix} Fee`)
  await dialog.locator('[name=feeAccount]').fill('SYNTH-001')
  await dialog.locator('[name=feeDescription]').fill('Synthetic fee\n<Safe & literal>')
  await dialog.locator('[name=contractTypeId]').selectOption(String(contract.contractTypeId))
  await dialog.locator('[name=burialSiteTypeId]').selectOption(String(burialId))
  await dialog.locator('[name=feeAmount]').fill('123.45')
  assert.equal(await dialog.locator('[name=taxAmount]').isDisabled(), true)
  await dialog.locator('[name=taxPercentage]').fill('')
  assert.equal(await dialog.locator('[name=taxAmount]').isDisabled(), false)
  await dialog.locator('[name=taxAmount]').fill('2.34')
  await dialog.locator('[name=includeQuantity]').selectOption('1')
  await dialog.locator('[name=quantityUnit]').fill('hours')
  await dialog.locator('[name=isRequired]').selectOption('')
  let fees = await save('fees', 'add')
  await dialog.waitFor({ state: 'detached' })
  let fee = fees.feeCategories.find((row) => row.feeCategoryId === category.feeCategoryId).fees[0]
  assert.equal(fee.isRequired, false)
  assert.equal(fee.taxAmount, 2.34)
  assert.equal(fee.taxPercentage, null)
  assert.equal(await categoryPanel.locator('.panel-heading').getByRole('button', { name: 'Delete', exact: true }).count(), 0, 'Nonempty categories cannot be deleted through the source UI')
  let feeRow = categoryPanel.locator(`[data-fee-id="${fee.feeId}"]`)
  await feeRow.getByRole('button', { name: `Fee Amount: ${prefix} Fee`, exact: true }).click()
  await dialog.locator('[name=feeAmount]').fill('234.56')
  await save('fees', 'updateAmount')
  await dialog.waitFor({ state: 'detached' })
  await feeRow.locator('.catalog-name').click()
  await dialog.locator('[name=includeQuantity]').selectOption('')
  assert.equal(await dialog.locator('[name=quantityUnit]').isDisabled(), true)
  await dialog.locator('[name=taxPercentage]').fill('13')
  await dialog.locator('[name=isRequired]').selectOption('1')
  fees = await save('fees')
  await dialog.waitFor({ state: 'detached' })
  fee = fees.feeCategories.find((row) => row.feeCategoryId === category.feeCategoryId).fees[0]
  assert.equal(fee.isRequired, true)
  assert.equal(fee.includeQuantity, false)
  assert.equal(fee.taxPercentage, 13)
  await page.reload()
  assert.equal((await state()).feeCategories.find((row) => row.feeCategoryId === category.feeCategoryId).fees[0].feeAmount, 234.56)
  await categoryPanel.locator('.panel-heading .catalog-name').click()
  await dialog.locator('[name=feeCategory]').fill(`${prefix} Fees Edited`)
  await dialog.locator('[name=isGroupedFee]').uncheck()
  await save('feeCategories')
  await dialog.waitFor({ state: 'detached' })
  report.push({ case: 'Grouped fee category; fee filters/account/description, amount-only edit, flat/percentage tax precedence, optional/required, quantity/unit; nonempty category delete protection; SQL reload', passed: true })

  // Capture real data in each view at desktop/mobile sizes, both languages.
  for (const route of ['burialSiteTypes', 'contractTypes', 'tables', 'fees']) {
    await visit(route, 'de')
    if (route === 'burialSiteTypes' || route === 'contractTypes') {
      const id = route === 'burialSiteTypes' ? burialId : contract.contractTypeId
      await page.locator(`[data-catalog-id="${id}"] button[aria-expanded]`).click()
    } else if (route === 'tables') await page.locator('[data-table=intermentContainerTypes] .panel-heading button').click()
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0) })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: overflow at ${width}px`)
      await page.screenshot({ path: path.join(output, `catalog-${route}-de-${width}.png`), fullPage: true })
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await visit('fees')
  await feeRow.locator('.catalog-name').click()
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Fee dialog overflow at ${width}px`)
    await page.screenshot({ path: path.join(output, `catalog-fee-dialog-en-${width}.png`), fullPage: true })
  }
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  report.push({ case: 'All four views German at 1440/390/320px; English fee dialog at same sizes, no horizontal overflow', passed: true })

  const readerContext = await browser.newContext({ locale: 'en-CA' })
  const reader = await readerContext.newPage()
  reader.on('pageerror', (error) => errors.push(error.message))
  await login(reader, process.env.CEMARIS_QA_READER_USERNAME, process.env.CEMARIS_QA_READER_PASSWORD)
  for (const route of ['burialSiteTypes', 'contractTypes', 'tables', 'fees']) {
    await reader.goto(new URL(`/admin/${route}`, base).href)
    await reader.waitForURL('**/dashboard/?error=accessDenied')
  }
  assert.equal((await reader.request.get(new URL('/api/admin/catalogs', base).href)).status(), 403)
  await readerContext.close()
  report.push({ case: 'Read-only user denied all four pages and catalog API', passed: true })

  // Delete through UI so dependencies remain reviewable. DB itself is dropped by runner.
  await page.setViewportSize({ width: 1440, height: 1000 })
  await visit('fees')
  await feeRow.locator('.catalog-name').click()
  page.once('dialog', (value) => value.accept())
  await post('fees', 'delete', () => dialog.getByRole('button', { name: 'Delete', exact: true }).click())
  await dialog.waitFor({ state: 'detached' })
  page.once('dialog', (value) => value.accept())
  await post('feeCategories', 'delete', () => categoryPanel.locator('.panel-heading').getByRole('button', { name: 'Delete', exact: true }).click())
  await categoryPanel.waitFor({ state: 'detached' })
  assert.deepEqual(errors, [], 'No browser JavaScript errors')
  await writeFile(path.join(output, 'catalog-report.json'), JSON.stringify({ report, pageErrors: errors }, null, 2))
  console.log(JSON.stringify({ report, pageErrors: errors }, null, 2))
} catch (error) {
  await page.screenshot({ path: path.join(output, 'catalog-failure.png'), fullPage: true }).catch(() => {})
  await writeFile(path.join(output, 'catalog-report.json'), JSON.stringify({ report, pageErrors: errors, failure: error.stack }, null, 2))
  throw error
} finally { await context.close(); await browser.close() }
