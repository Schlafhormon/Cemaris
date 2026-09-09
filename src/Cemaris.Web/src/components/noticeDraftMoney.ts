export interface LineInput { key: string; id: string | null; description: string; amount: string }
export const emptyLine = (): LineInput => ({ key: crypto.randomUUID(), id: null, description: '', amount: '' })
const maximumCents = 999999999999999999n

export function amountCents(value: string): bigint | null {
  if (!/^[0-9]{1,16}([.,][0-9]{1,2})?$/.test(value)) return null
  const [whole, fraction = ''] = value.replace(',', '.').split('.')
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
  return cents > 0n && cents <= maximumCents ? cents : null
}

export function exactAmount(value: string): string {
  const cents = amountCents(value)
  if (cents === null) throw new Error('Ein positiver EUR-Betrag mit höchstens zwei Nachkommastellen ist erforderlich.')
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`
}

export function formatExactAmount(value: string): string {
  const [whole, fraction = '00'] = value.split('.')
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction.padEnd(2, '0')} EUR`
}

export function lineTotal(lines: LineInput[]): string | null {
  if (lines.length < 1 || lines.length > 100) return null
  let total = 0n
  for (const line of lines) {
    const cents = amountCents(line.amount)
    if (cents === null || !line.description.trim() || line.description.trim().length > 500) return null
    total += cents
    if (total > maximumCents) return null
  }
  return `${total / 100n}.${String(total % 100n).padStart(2, '0')}`
}
