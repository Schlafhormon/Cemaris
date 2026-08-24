import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersonUsageRightsPanel } from './PersonUsageRightsPanel'

const right = {
  id: '50000000-0000-0000-0000-000000000001',
  graveSiteId: '50000000-0000-0000-0000-000000000002',
  startDate: '2026-09-01', endDate: '2056-09-01', sourceReference: 'SYN-REF-UI',
  usageRightStartRuleId: '50000000-0000-0000-0000-000000000003',
  startRuleCodeSnapshot: 'SYN-URKUNDE', startRuleDisplayNameSnapshot: 'Synthetische Urkundenübergabe', version: 1,
  holderPeriods: [{ id: '50000000-0000-0000-0000-000000000004', partyId: '50000000-0000-0000-0000-000000000005', validFromInclusive: '2026-09-01', validUntilExclusive: null }],
  revisions: [{ id: '50000000-0000-0000-0000-000000000006', resultingVersion: 1, mutationType: 'Created', reason: null, occurredAtUtc: '2026-08-14T08:00:00Z', actorDisplayName: 'Synthetische Sachbearbeitung', startDate: '2026-09-01', endDate: '2056-09-01', sourceReference: 'SYN-REF-UI', startRuleCodeSnapshot: 'SYN-URKUNDE', startRuleDisplayNameSnapshot: 'Synthetische Urkundenübergabe', holderPeriods: [] }],
}

describe('PersonUsageRightsPanel', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('zeigt Historie und erhält Eingaben bei einem ETag-Konflikt', async () => {
    let rightLoads = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf', headerName: 'X-Cemaris-CSRF' })
      if (path.includes('/extensions')) return json({ title: 'Konflikt' }, 412)
      if (path.includes('/grave-sites/')) rightLoads += 1
      return json(right, 200, { ETag: '"1"' })
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<PersonUsageRightsPanel graveSiteId={right.graveSiteId} />)

    expect((await screen.findAllByText(/SYN-URKUNDE/)).length).toBeGreaterThan(0)
    expect(screen.getByText(/Vollständige Fachrevisionen/)).toBeInTheDocument()
    const extension = screen.getAllByText('Verlängern')[0].closest('details')!
    await user.click(within(extension).getAllByText('Verlängern')[0])
    const end = within(extension).getByLabelText('Neues manuelles Ende')
    await user.type(end, '2057-09-01')
    await user.type(within(extension).getByLabelText('Begründung'), 'Synthetische Verlängerung')
    await user.click(within(extension).getByRole('button', { name: 'Verlängern' }))
    expect(await screen.findByText(/Nutzungsrecht wurde zwischenzeitlich geändert/)).toBeInTheDocument()
    expect(end).toHaveValue('2057-09-01')
    await user.click(screen.getByRole('button', { name: 'Aktuellen Stand neu laden' }))
    await screen.findByText(/Aktueller Nutzungsrechtstand geladen/)
    expect(rightLoads).toBe(2)
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/parties/'))).toBe(false)
  })

  it('ordnet Serverfehler Feldern zu, erhält Eingaben und zeigt unbekannte Felder in der Zusammenfassung', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf', headerName: 'X-Cemaris-CSRF' })
      if (path.includes('/extensions')) return json({ title: 'Die Angaben sind ungültig.', errors: { newEndDate: ['Das neue Ende muss später liegen.'], reason: ['Eine Begründung ist erforderlich.'], serverOnly: ['Unbekannter Serverhinweis.'] } }, 400)
      return json(right, 200, { ETag: '"1"' })
    }))
    const user = userEvent.setup()
    render(<PersonUsageRightsPanel graveSiteId={right.graveSiteId} />)
    expect((await screen.findAllByText(/SYN-URKUNDE/)).length).toBeGreaterThan(0)
    const extension = screen.getAllByText('Verlängern')[0].closest('details')!
    await user.click(within(extension).getAllByText('Verlängern')[0])
    const end = within(extension).getByLabelText('Neues manuelles Ende')
    const reason = within(extension).getByLabelText('Begründung')
    await user.type(end, '2056-01-01')
    await user.type(reason, 'Bleibt als Eingabe erhalten')
    await user.click(within(extension).getByRole('button', { name: 'Verlängern' }))

    expect(await within(extension).findByText('Das neue Ende muss später liegen.')).toBeInTheDocument()
    expect(within(extension).getByText('Eine Begründung ist erforderlich.')).toBeInTheDocument()
    expect(within(extension).getByText(/serverOnly: Unbekannter Serverhinweis/)).toBeInTheDocument()
    expect(end).toHaveValue('2056-01-01')
    expect(reason).toHaveValue('Bleibt als Eingabe erhalten')
    expect(end).toHaveFocus()
  })

  it('lädt bei einem Party-Konflikt nur die ausgewählte Party neu', async () => {
    const partyId = '50000000-0000-0000-0000-000000000050'
    let rightLoads = 0
    let partyLoads = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf', headerName: 'X-Cemaris-CSRF' })
      if (path.includes('/grave-sites/')) { rightLoads += 1; return json(right, 200, { ETag: '"1"' }) }
      if (path.includes('/api/parties?query=')) return json([{ id: partyId, partyType: 'NaturalPerson', displayName: 'Synthetik Konflikt', currentPrimaryAddress: null }])
      if (path.endsWith(`/api/parties/${partyId}`) && !init?.method) { partyLoads += 1; return json(party(partyId), 200, { ETag: partyLoads === 1 ? '"1"' : '"2"' }) }
      if (path.endsWith(`/api/parties/${partyId}/corrections`)) return json({ title: 'Konflikt' }, 412)
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<PersonUsageRightsPanel graveSiteId={right.graveSiteId} />)
    await user.type(await screen.findByLabelText('Name des Beteiligten'), 'Konflikt')
    await user.click(screen.getByRole('button', { name: 'Suchen' }))
    await user.click(await screen.findByRole('button', { name: /Synthetik Konflikt/ }))
    await user.click(await screen.findByText('Namensangaben korrigieren'))
    const form = screen.getByRole('button', { name: 'Namen historisiert korrigieren' }).closest('form')!
    await user.type(within(form).getByLabelText('Begründung'), 'Lokale Konflikteingabe')
    await user.click(within(form).getByRole('button', { name: 'Namen historisiert korrigieren' }))
    expect(await screen.findByText(/beteiligte Identität wurde zwischenzeitlich geändert/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Aktuellen Stand neu laden' }))
    await screen.findByText(/Aktueller Beteiligtenstand geladen/)

    expect(partyLoads).toBe(2)
    expect(rightLoads).toBe(1)
    expect(within(form).getByLabelText('Begründung')).toHaveValue('Lokale Konflikteingabe')
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/parties?query='))).toBe(true)
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/parties/directory'))).toBe(false)
  })
})

function party(id: string) {
  return {
    id,
    partyType: 'NaturalPerson', firstName: 'Synthetik', lastName: 'Konflikt', organizationName: null,
    currentPrimaryAddressId: null, version: 1, addresses: [], revisions: [],
  }
}

function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}
