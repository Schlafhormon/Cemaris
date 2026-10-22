// Execute frozen Sunrise JavaScript with synthetic IO adapters. Never write to
// the reference or install its application. Outputs are behavioural fixtures.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
const ref = path.resolve(root, '../Sunrise-Referenz')
const commit = '451ce034863b16502484367044f3e9b65370111a'
assert.equal(execFileSync('git', ['-C', ref, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit)
const hashes = {}
async function source(name) {
  const content = await readFile(path.join(ref, name), 'utf8')
  hashes[name] = createHash('sha256').update(content).digest('hex')
  return content
}
function evaluate(code, inputs, names) {
  return new Function(...Object.keys(inputs), code.replaceAll('export ', '') + `\nreturn {${names.join(',')}};`)(...Object.values(inputs))
}

const authSource = await source('helpers/authentication.helpers.js')
const redirectCode = authSource.slice(authSource.indexOf('const safeRedirects'))
const redirectInputs = [undefined, '', '/dashboard', '/dashboard/', '/admin/users', '/admin/settings', '/admin/settings?x=1', '/contracts', '/Contracts/42/edit', '/cemeteries/0', '/burialSites/12', '/workOrders/99/edit', '/funeralHomes/42', '/print/pdf/workOrder/12?x=1', '/print/screen/contract/42', '/print/pdf/x_1', '//evil.example', 'https://evil.example', '/contracts/1/../../login', '/contracts/1?x=1', '/cemeteries/-1', '/cemeteries/１', '/dashboard/updatelog', '/workorders/milestonecalendar', '/reports', null, 1]
const redirects = []
for (const prefix of ['', '/cemaris']) {
  const api = evaluate(redirectCode, { getConfigProperty: () => prefix }, ['getSafeRedirectUrl'])
  for (const input of redirectInputs) {
    redirects.push({ prefix, input: input ?? null, omitted: input === undefined, expected: api.getSafeRedirectUrl(input) })
  }
  redirects.push({ prefix, input: `${prefix}/contracts/15/edit`, expected: api.getSafeRedirectUrl(`${prefix}/contracts/15/edit`) })
}

const userSource = await source('helpers/user.helpers.js')
const userCode = userSource.replace(/^import .*;\r?$/gm, '')
const configUsers = {
  'users.canLogin': ['ADMIN', 'view', 'update', 'cemetery', 'contract', 'work'],
  'users.canUpdate': ['update'], 'users.canUpdateCemeteries': ['cemetery'],
  'users.canUpdateContracts': ['contract'], 'users.canUpdateWorkOrders': ['work'],
  'users.isAdmin': ['admin'],
}
const users = []
for (const item of [
  { username: 'ADMIN' }, { username: 'view' }, { username: 'UPDATE' },
  { username: 'cemetery' }, { username: 'contract' }, { username: 'work' },
  { username: 'unknown' },
  { username: 'admin', local: { isActive: false, isAdmin: true } },
  { username: 'admin', local: { isActive: true, isAdmin: false, canUpdateContracts: true } },
  { username: 'local', local: { isActive: true, isAdmin: true, canUpdateWorkOrders: true } },
]) {
  const api = evaluate(userCode, {
    getUserFromDatabase: () => item.local,
    getUserSettings: (username) => ({ apiKey: `synthetic:${username}` }),
    getUsernameFromApiKey: () => undefined,
    getConfigProperty: (name) => configUsers[name],
  }, ['getUser'])
  users.push({ ...item, expected: api.getUser(item.username) ?? null })
}

const permissionSource = await source('handlers/permissions.js')
const permissionCode = permissionSource.slice(permissionSource.indexOf('const urlPrefix'))
const permissions = []
const names = ['adminGetHandler', 'adminPostHandler', 'updateCemeteriesGetHandler', 'updateCemeteriesPostHandler', 'updateContractsGetHandler', 'updateContractsPostHandler', 'updateWorkOrdersGetHandler', 'updateWorkOrdersPostHandler', 'apiGetHandler']
for (const permitted of [false, true]) {
  const api = evaluate(permissionCode, {
    getConfigProperty: () => '',
    canUserUpdateCemeteries: () => permitted, canUserUpdateContracts: () => permitted,
    canUserUpdateWorkOrders: () => permitted, isUserAdmin: () => permitted, isApiKeyValid: () => permitted,
  }, names)
  for (const name of names) {
    let result
    const response = { redirect: (url) => { result = { redirect: url } }, status: (status) => ({ json: (body) => { result = { status, body } } }) }
    api[name]({}, response, () => { result = { next: true } })
    permissions.push({ handler: name, permitted, expected: result })
  }
}

const settingsCode = await source('types/setting.types.js')
const { settingProperties } = evaluate(settingsCode, {}, ['settingProperties'])
const result = { reference_commit: commit, source_sha256: hashes, configUsers, redirects, users, permissions, settingProperties }
const fixturePath = path.join(root, 'backend/tests/fixtures/auth-reference.json')
if (process.argv.includes('--check-fixture')) {
  assert.deepEqual(JSON.parse(await readFile(fixturePath, 'utf8')), result)
} else if (process.argv.includes('--write-fixture')) {
  await writeFile(fixturePath, JSON.stringify(result, null, 2) + '\n')
}
await mkdir(path.join(root, '.local/reference-auth'), { recursive: true })
await writeFile(path.join(root, '.local/reference-auth/result.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`PASS: original Sunrise ${redirects.length} redirects, ${users.length} user resolutions, ${permissions.length} permission outcomes, ${settingProperties.length} setting descriptors`)
