// Run only against the dedicated disposable password-QA installation.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.CEMARIS_PLAYWRIGHT_MODULE).href)
const base = 'http://127.0.0.1:18082/cemaris'
const output = '/output/browser'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium' })
const errors = []
const contexts = []
async function make() {
  const context = await browser.newContext({ locale: 'de-DE', viewport: { width: 1440, height: 1000 } })
  contexts.push(context)
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  page.on('dialog', dialog => dialog.accept())
  return page
}
async function login(page, username, password, forced = false) {
  await page.goto(base + '/login')
  await page.locator('#login--username').fill(username)
  await page.locator('#login--password').fill(password)
  await page.locator('#form--login button[type=submit]').click()
  await page.waitForURL(base + (forced ? '/password/change' : '/dashboard/'))
}
async function change(page, old, password) {
  await page.locator('#current-password').fill(old)
  await page.locator('#new-password').fill(password)
  await page.locator('#confirm-password').fill(password)
  await page.locator('#form--changePassword button[type=submit]').click()
}
async function api(page, route) {
  return page.evaluate(async url => { const r = await fetch(url); return { status: r.status, body: await r.json() } }, base + route)
}
try {
  const admin = await make()
  await admin.goto(base + '/login')
  await admin.getByRole('link', { name: 'Passwort vergessen?' }).click()
  await admin.getByRole('heading', { name: 'Passwort vergessen?' }).waitFor()
  assert.match(await admin.locator('main').innerText(), /Administrator.*Identität/s)
  await admin.reload()
  await admin.getByRole('link', { name: 'Zurück zur Anmeldung' }).waitFor()
  await login(admin, 'qa-admin', 'Synthetic browser admin password')
  await admin.goto(base + '/admin/users')
  await admin.locator('#button--addUser').waitFor()
  const previous = admin.locator('tr[data-username="qa-member"]')
  const existing = await api(admin, '/api/admin/users')
  if (existing.body.users.some(user => user.username === 'qa-member')) {
    await previous.waitFor()
    await previous.getByRole('button', { name: /qa-member/ }).last().click()
    await previous.waitFor({ state: 'detached' })
  }
  await admin.locator('#button--addUser').click()
  await admin.locator('#username').fill('qa-member')
  assert.match(await admin.locator('#form--addUser').innerText(), /Startpasswort.*Benutzernamen/s)
  await admin.locator('#form--addUser button[type=submit]').click()
  await admin.locator('tr[data-username="qa-member"]').waitFor()
  const member = await make()
  await login(member, 'qa-member', 'qa-member', true)
  assert.equal((await api(member, '/api/cemeteries')).status, 403)
  assert.equal(await member.locator('.navbar').count(), 0)
  await member.goto(base + '/contracts')
  await member.waitForURL(base + '/password/change')
  await member.reload()
  await member.locator('#form--changePassword').waitFor()
  await member.setViewportSize({ width: 390, height: 844 })
  assert.equal(await member.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await member.screenshot({ path: output + '/first-login-390.png', fullPage: true })
  await change(member, 'qa-member', 'Synthetic browser member password')
  await member.waitForURL(base + '/dashboard')
  assert.equal((await api(member, '/api/cemeteries')).status, 200)
  await member.goto(base + '/dashboard/userSettings')
  await member.getByRole('heading', { name: 'Passwort ändern', exact: true }).waitFor()
  await change(member, 'wrong password', 'Another browser member password')
  await member.getByRole('alert').filter({ hasText: 'Das bisherige Passwort ist falsch.' }).waitFor()
  const other = await make()
  await login(other, 'qa-member', 'Synthetic browser member password')
  await change(member, 'Synthetic browser member password', 'Another browser member password')
  await member.getByRole('status').filter({ hasText: 'Ihr Passwort wurde geändert.' }).waitFor()
  assert.equal((await api(other, '/api/cemeteries')).status, 401)
  await admin.locator('tr[data-username="qa-member"]').getByRole('button', { name: 'Passwort zurücksetzen: qa-member', exact: true }).click()
  await admin.getByRole('status').filter({ hasText: 'Passwort zurückgesetzt.' }).waitFor()
  assert.equal((await api(member, '/api/cemeteries')).status, 401)
  await login(member, 'qa-member', 'qa-member', true)
  await change(member, 'qa-member', 'Final browser member password')
  await member.waitForURL(base + '/dashboard')
  await member.goto(base + '/dashboard/userSettings?lng=en')
  await member.getByRole('heading', { name: 'Change password', exact: true }).waitFor()
  await member.screenshot({ path: output + '/password-settings-en.png', fullPage: true })
  // Preserve credentials for the controlled API restart/persistence check.
  await member.context().storageState({ path: output + '/member-storage.json' })
  assert.deepEqual(errors, [])
  await writeFile(output + '/result.json', JSON.stringify({ result: 'PASS', checks: ['Forgot-password recovery instructions', 'Admin creates user with username as initial password', 'First-login API restriction, reload and forced redirect', 'Password validation and change in settings', 'Change and admin reset revoke other sessions', 'Reset requires a new password', 'German/English and 390px layout'], javascriptErrors: errors }, null, 2))
  console.log('Password browser acceptance PASS')
} finally {
  await Promise.all(contexts.map(context => context.close()))
  await browser.close()
}
