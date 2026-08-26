import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NoticeNumberConfigurationPage } from './NoticeNumberConfigurationPage'

describe('NoticeNumberConfigurationPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('erklärt den prospektiven Entwurfskern und legt die fehlende Singleton-Konfiguration an', async () => {
    let body: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/program-configuration/notice-number') && !init?.method) return new Response(null, { status: 204 })
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf' })
      if (path.endsWith('/api/program-configuration/notice-number') && init?.method === 'POST') {
        body = JSON.parse(String(init.body)) as Record<string, unknown>
        return json(configuration(), 201, { ETag: '"1"' })
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<NoticeNumberConfigurationPage />)

    expect(await screen.findByText(/Rechtlich wirkungsloser Entwurfskern/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Finanzprodukt'), 'SYNFP')
    await user.clear(screen.getByLabelText('Stellenzahl der laufenden Nummer'))
    await user.type(screen.getByLabelText('Stellenzahl der laufenden Nummer'), '6')
    await user.click(screen.getByRole('button', { name: 'Nummernkonfiguration anlegen' }))

    expect(await screen.findByText('Nummernkonfiguration angelegt.')).toBeInTheDocument()
    expect(body).toEqual({ financialProduct: 'SYNFP', runningNumberWidth: 6 })
    expect(screen.getByText('Version 1')).toBeInTheDocument()
  })

  it('behält administrative Eingaben bei einem ETag-Konflikt', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/program-configuration/notice-number') && !init?.method) return json(configuration(), 200, { ETag: '"1"' })
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf' })
      if (path.includes('/api/program-configuration/notice-number/') && init?.method === 'PUT') return json({ title: 'Konflikt' }, 412)
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<NoticeNumberConfigurationPage />)
    const product = await screen.findByLabelText('Finanzprodukt')
    await user.clear(product)
    await user.type(product, 'LOKALER-STAND')
    const reason = screen.getByLabelText('Begründung der Änderung')
    await user.type(reason, 'Lokale Eingabe bleibt erhalten')
    await user.click(screen.getByRole('button', { name: 'Prospektiv versioniert ändern' }))

    expect(await screen.findByText(/zwischenzeitlich geändert/)).toBeInTheDocument()
    expect(product).toHaveValue('LOKALER-STAND')
    expect(reason).toHaveValue('Lokale Eingabe bleibt erhalten')
    expect(screen.getByRole('button', { name: 'Aktuellen Stand laden' })).toBeInTheDocument()
  })
})

function configuration() {
  return { id: '62000000-0000-0000-0000-000000000001', financialProduct: 'SYNFP', runningNumberWidth: 6, version: 1, createdAtUtc: '2026-08-26T10:00:00Z', updatedAtUtc: '2026-08-26T10:00:00Z', revisions: [{ id: '62000000-0000-0000-0000-000000000002', resultingVersion: 1, mutationType: 'Created', reason: null, occurredAtUtc: '2026-08-26T10:00:00Z', actorId: 'actor', actorDisplayName: 'Synthetische Administration', financialProduct: 'SYNFP', runningNumberWidth: 6 }] }
}

function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}
