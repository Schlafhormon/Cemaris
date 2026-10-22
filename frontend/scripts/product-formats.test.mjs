import assert from 'node:assert/strict'
import test from 'node:test'
import { displayLocale, formatCurrency, formatDate, formatTimestamp, localDateInput } from '../src/format.ts'

globalThis.document = { documentElement: { lang: 'de' } }

test('German amounts use EUR, thousands separator and decimal comma', () => {
  assert.equal(formatCurrency(1234.56), '1.234,56\u00a0€')
  assert.equal(formatCurrency(-0.5), '-0,50\u00a0€')
  assert.equal(formatCurrency(null), '0,00\u00a0€')
  assert.equal(formatCurrency('invalid'), '–')
})

test('English language keeps the product currency EUR', () => {
  document.documentElement.lang = 'en'
  assert.equal(displayLocale(), 'en-GB')
  assert.equal(formatCurrency(1234.56), '€1,234.56')
  document.documentElement.lang = 'de'
})

test('German visible dates retain partial-date information', () => {
  assert.equal(formatDate('2026-10-21'), '21.10.2026')
  assert.equal(formatDate('2026-10'), '10.2026')
  assert.equal(formatDate('2026'), '2026')
  assert.equal(formatDate(''), '')
  assert.equal(formatDate(null), '')
})

test('date inputs preserve local calendar days and machine ISO values', () => {
  assert.equal(localDateInput(new Date(2026, 0, 2, 0, 5)), '2026-01-02')
  assert.equal(localDateInput(new Date(2026, 9, 21, 23, 55)), '2026-10-21')
})

test('timestamps follow the selected product language', () => {
  assert.equal(formatTimestamp(Number.NaN), '')
  assert.match(formatTimestamp(new Date(2026, 9, 21, 15, 4).getTime()), /21\.10\.2026.*15:04/)
})
