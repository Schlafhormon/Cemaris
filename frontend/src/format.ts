/** User-facing formats for the German municipal product. API values remain ISO/numeric. */
export function displayLocale(): string {
  return document.documentElement.lang === 'en' ? 'en-GB' : 'de-DE'
}

export function formatCurrency(value: unknown, locale = displayLocale()): string {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount)
    : '–'
}

export function formatTimestamp(value: unknown): string {
  const date = new Date(Number(value))
  return Number.isFinite(date.getTime())
    ? date.toLocaleString(displayLocale(), { dateStyle: 'medium', timeStyle: 'short' })
    : ''
}

/** Keep empty and partial legacy dates readable without inventing missing days. */
export function formatDate(value: unknown, locale = displayLocale()): string {
  const text = String(value ?? '')
  if (locale !== 'de-DE') return text
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(text)
  return match ? match[3] ? `${match[3]}.${match[2]}.${match[1]}` : `${match[2]}.${match[1]}` : text
}

export function localDateInput(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatDirection(value: unknown, locale = displayLocale()): string {
  const text = String(value ?? '')
  const german: Record<string, string> = { N: 'Nord', NE: 'Nordost', E: 'Ost', SE: 'Südost', S: 'Süd', SW: 'Südwest', W: 'West', NW: 'Nordwest' }
  return locale === 'de-DE' ? german[text] ?? text : text
}
