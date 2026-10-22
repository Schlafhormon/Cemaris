import assert from 'node:assert/strict'
import test from 'node:test'
import { appUrl, applicationLocation, internalPath } from '../src/paths.ts'
import { normalizePrefix as vitePrefix, RESERVED_PREFIX_SEGMENTS as viteReserved } from '../vite.config.ts'
import { normalizePrefix as nginxPrefix, RESERVED_PREFIX_SEGMENTS as nginxReserved } from '../../deploy/render-nginx.mjs'

for (const prefix of ['', '/cemaris', '/department/cemaris.v1']) {
  test(`application routes and assets at ${prefix || '/'}`, () => {
    for (const path of ['/dashboard', '/api/session?lng=de', '/print/pdf/contract?contractId=1',
      '/api/contracts/attachment/1', '/api/reports/contracts-all', '/branding/cemaris-logo.png',
      '/locales/de/app.json', '/burialSites/1#details', '/']) {
      assert.equal(appUrl(path, prefix), prefix + path)
      assert.equal(appUrl(appUrl(path, prefix), prefix), prefix + path)
      assert.equal(internalPath(prefix + path, prefix), path)
    }
  })
}

for (const value of ['https://provider.example.invalid/workflow/1', '//tiles.example.invalid/1.png',
  '#main', 'mailto:someone@example.invalid', 'data:image/png;base64,abc', 'relative.txt']) {
  test(`external URL or fragment remains ${value}`, () => assert.equal(appUrl(value, '/cemaris'), value))
}

test('mount boundaries and direct mount entry preserve route and query', () => {
  assert.equal(appUrl('/cemaris2/dashboard', '/cemaris'), '/cemaris/cemaris2/dashboard')
  assert.equal(internalPath('/cemaris2/dashboard', '/cemaris'), '/cemaris2/dashboard')
  assert.equal(internalPath('/cemaris', '/cemaris'), '/')
  assert.equal(internalPath('/cemaris?lng=de', '/cemaris'), '/?lng=de')
  assert.equal(internalPath('/cemaris#main', '/cemaris'), '/#main')
  assert.equal(appUrl('/cemaris?lng=de', '/cemaris'), '/cemaris?lng=de')
})

test('browser application location retains search', () => {
  globalThis.window = { location: { pathname: '/contracts/123/edit', search: '?lng=de' } }
  assert.equal(applicationLocation(), '/contracts/123/edit?lng=de')
  delete globalThis.window
})

test('Vite and Nginx reserve the same internal first segments', () => {
  assert.deepEqual([...viteReserved].sort(), [...nginxReserved].sort())
})

for (const segment of nginxReserved) {
  test(`reserved mount /${segment} fails before build`, () => {
    for (const prefix of [`/${segment}`, `/${segment.toUpperCase()}/nested`]) {
      assert.throws(() => vitePrefix(prefix), /reserved/)
      assert.throws(() => nginxPrefix(prefix), /reserved/)
    }
  })
}

test('Root and independent single or nested mount names remain valid', () => {
  for (const prefix of ['', '/', '/cemaris', '/department/cemaris', '/department/api', '/api-v2']) {
    assert.equal(vitePrefix(prefix), prefix === '/' ? '' : prefix)
    assert.equal(nginxPrefix(prefix), prefix === '/' ? '' : prefix)
  }
})
