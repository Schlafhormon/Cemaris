import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UserAdministrationPage } from './UserAdministrationPage'

describe('UserAdministrationPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('übermittelt die sechs optionalen Kontaktwerte ausschließlich über die administrative Kontenanlage', async () => {
    let body: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/admin/accounts') && !init?.method) return json([])
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf-contact' })
      if (path.endsWith('/api/admin/accounts') && init?.method === 'POST') {
        body = JSON.parse(String(init.body)) as Record<string, unknown>
        return json({ id: '70000000-0000-0000-0000-000000000001', ...body, isActive: true, mustChangePassword: true, lockoutEndUtc: null, lastLoginAtUtc: null, createdAtUtc: '2026-08-28T00:00:00Z', updatedAtUtc: '2026-08-28T00:00:00Z', version: 'AQAAAAAAAAA=' }, 201)
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<UserAdministrationPage />)
    await user.type(await screen.findByLabelText('Benutzername'), 'kontakt-test')
    await user.type(screen.getByLabelText('Anzeigename'), 'Synthetischer Kontakt')
    await user.type(screen.getByLabelText('Temporäres Passwort'), 'Synthetisch-2026')
    await user.type(screen.getByLabelText('Vorname'), 'Ada')
    await user.type(screen.getByLabelText('Nachname'), 'Synthetik')
    await user.type(screen.getByLabelText('Kontaktstelle'), 'Friedhofsverwaltung Test')
    await user.type(screen.getByLabelText('Zimmer'), 'SYN-1')
    await user.type(screen.getByLabelText('Telefon'), '+49 000 123')
    await user.type(screen.getByLabelText('E-Mail'), 'ada@example.invalid')
    await user.click(screen.getByRole('button', { name: 'Konto anlegen' }))

    expect(await screen.findByText(/Das Konto wurde angelegt/)).toBeInTheDocument()
    expect(body).toMatchObject({ firstName: 'Ada', lastName: 'Synthetik', contactPoint: 'Friedhofsverwaltung Test', room: 'SYN-1', phone: '+49 000 123', email: 'ada@example.invalid' })
  })
})

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
}
