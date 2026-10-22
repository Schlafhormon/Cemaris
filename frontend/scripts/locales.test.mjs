import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const namespaces = ['app', 'admin', 'login', 'errors']
const languages = ['de', 'en']
const catalogs = Object.fromEntries(languages.map(language => [language, Object.fromEntries(
  namespaces.map(namespace => [namespace, JSON.parse(readFileSync(new URL(`public/locales/${language}/${namespace}.json`, root), 'utf8'))]),
)]))
const parameters = text => [...text.matchAll(/{{\s*([^}]+?)\s*}}/g)].map(match => match[1]).sort()
const sharedGermanWords = new Set(['Details', 'Name', 'Optional', 'Status', 'Logo', 'April', 'August', 'September', 'November'])

for (const namespace of namespaces) {
  test(`${namespace}: German and English expose the same complete keys`, () => {
    assert.deepEqual(Object.keys(catalogs.de[namespace]).sort(), Object.keys(catalogs.en[namespace]).sort())
    for (const language of languages) {
      for (const [key, value] of Object.entries(catalogs[language][namespace])) {
        assert.equal(typeof value, 'string', `${language}:${namespace}:${key}`)
        assert.ok(value.trim(), `${language}:${namespace}:${key} is empty`)
        assert.doesNotMatch(key, /consigno|ntfy|findagrave|dynamicsgp|diamond|^syncWithPortal$|^contracts\.orderForms$/i)
      }
    }
  })

  test(`${namespace}: German interpolation parameters match English`, () => {
    for (const [key, value] of Object.entries(catalogs.en[namespace])) {
      assert.deepEqual(parameters(catalogs.de[namespace][key]), parameters(value), `${namespace}:${key}`)
    }
  })

  test(`${namespace}: German contains translations instead of copied English sentences`, () => {
    for (const [key, value] of Object.entries(catalogs.de[namespace])) {
      if (!sharedGermanWords.has(value)) assert.notEqual(value, catalogs.en[namespace][key], `${namespace}:${key}`)
    }
  })
}

test('literal catalog lookups in the React application exist in both languages', () => {
  const missing = []
  for (const file of readdirSync(new URL('src/', root))) {
    if (!/\.tsx?$/.test(file)) continue
    const source = readFileSync(new URL(`src/${file}`, root), 'utf8')
    for (const [, key] of source.matchAll(/(?<![\w.])t\(\s*['"]([^'"]+)['"]/g)) {
      const [namespace, catalogKey] = key.includes(':') ? key.split(':', 2) : ['app', key]
      // Cemaris-specific additions are checked with their TypeScript source.
      if (namespace === 'cemaris') continue
      for (const language of languages) {
        if (!catalogs[language][namespace]?.[catalogKey]) missing.push(`${file}: ${language}:${namespace}:${catalogKey}`)
      }
    }
  }
  assert.deepEqual(missing, [])
})
