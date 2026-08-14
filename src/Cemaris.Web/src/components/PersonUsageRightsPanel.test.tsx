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
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf', headerName: 'X-Cemaris-CSRF' })
      if (path.includes('/extensions')) return json({ title: 'Konflikt' }, 412)
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
    expect(await screen.findByText(/zwischenzeitlich geändert/)).toBeInTheDocument()
    expect(end).toHaveValue('2057-09-01')
  })
})

function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}
