import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NoticeDraftPanel } from './NoticeDraftPanel'

const caseId = '60000000-0000-0000-0000-000000000001'
const partyId = '60000000-0000-0000-0000-000000000002'
const draftId = '60000000-0000-0000-0000-000000000003'
const graveSiteId = '60000000-0000-0000-0000-000000000006'

describe('NoticeDraftPanel', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('kennzeichnet die Rechtswirkungslosigkeit und verlangt die aktive Zahlungspflichtigenbestätigung', async () => {
    let sentBody: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`) && !init?.method) return json([])
      if (path.includes('/api/parties?query=')) return json([{ id: partyId, partyType: 'NaturalPerson', displayName: 'Synthetik Zahlend', currentPrimaryAddress: null }])
      if (path.endsWith(`/api/parties/${partyId}`)) return json(party(), 200, { ETag: '"1"' })
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf' })
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`) && init?.method === 'POST') {
        sentBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return json(draft(), 201, { ETag: '"1"' })
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<NoticeDraftPanel caseId={caseId} />)

    expect(await screen.findByRole('heading', { name: 'Kanonische Bescheidentwürfe' })).toBeInTheDocument()
    expect(screen.getByText('Rechtlich wirkungslos')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Name des Beteiligten'), 'Zahlend')
    await user.click(screen.getByRole('button', { name: 'Suchen' }))
    await user.click(await screen.findByRole('button', { name: /Synthetik Zahlend/ }))
    await user.type(await screen.findByLabelText('Gesamtbetrag in EUR'), '100.25')
    await user.type(screen.getByLabelText('Bescheiddatum'), '2026-08-26')
    await user.type(screen.getByLabelText('Fälligkeit'), '2026-09-26')
    await user.type(screen.getByLabelText('Kontierung'), 'SYN-KONTO')
    await user.type(screen.getByLabelText('Gebührengrund oder Quelle'), 'Synthetische Gebührenquelle')
    const confirmation = screen.getByRole('checkbox', { name: /konkreten Zahlungspflichtigen/ })
    expect(confirmation).toBeRequired()
    await user.click(confirmation)
    await user.click(screen.getByRole('button', { name: 'Rechtlich wirkungslosen Entwurf anlegen' }))

    expect(await screen.findByText('Rechtlich wirkungsloser Bescheidentwurf angelegt.')).toBeInTheDocument()
    expect(sentBody).toMatchObject({ payerPartyId: partyId, payerSelectionConfirmed: true, totalAmount: 100.25 })
    expect(screen.getAllByText('SYNFP.2026000001')).toHaveLength(2)
  })

  it.each([
    { status: 400, problem: { title: 'Die Angaben sind ungültig.', errors: { accountAssignment: ['Kontierung fachlich ungültig.'] } } },
    { status: 403, problem: { title: 'Diese Entwurfsoperation ist nicht erlaubt.' } },
    { status: 409, problem: { title: 'Die Nummernkonfiguration fehlt.', code: 'notice-number-configuration-missing' } },
  ])('erhält Anlageeingaben bei API-Fehler $status', async ({ status, problem }) => {
    let createRequests = 0
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`) && !init?.method) return json([])
      if (path.includes('/api/parties?query=')) return json([{ id: partyId, partyType: 'NaturalPerson', displayName: 'Synthetik Zahlend', currentPrimaryAddress: null }])
      if (path.endsWith(`/api/parties/${partyId}`)) return json(party(), 200, { ETag: '"1"' })
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf' })
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`) && init?.method === 'POST') {
        createRequests++
        return json(problem, status)
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<NoticeDraftPanel caseId={caseId} />)

    await user.type(await screen.findByLabelText('Name des Beteiligten'), 'Zahlend')
    await user.click(screen.getByRole('button', { name: 'Suchen' }))
    await user.click(await screen.findByRole('button', { name: /Synthetik Zahlend/ }))
    await user.type(await screen.findByLabelText('Gesamtbetrag in EUR'), '100.25')
    await user.type(screen.getByLabelText('Bescheiddatum'), '2026-08-26')
    await user.type(screen.getByLabelText('Fälligkeit'), '2026-09-26')
    const accountAssignment = screen.getByLabelText('Kontierung')
    await user.type(accountAssignment, 'SYN-KONTO-BLEIBT')
    await user.type(screen.getByLabelText('Gebührengrund oder Quelle'), 'Synthetische Gebührenquelle')
    await user.click(screen.getByRole('checkbox', { name: /konkreten Zahlungspflichtigen/ }))
    await user.click(screen.getByRole('button', { name: 'Rechtlich wirkungslosen Entwurf anlegen' }))

    expect(await screen.findByText(problem.title)).toBeInTheDocument()
    expect(accountAssignment).toHaveValue('SYN-KONTO-BLEIBT')
    expect(createRequests).toBe(1)
  })

  it('erhält Korrektureingaben bei einem ETag-Konflikt und bietet gezieltes Neuladen an', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`)) return json([listItem()])
      if (path.endsWith(`/api/notice-drafts/${draftId}`)) return json(draft(), 200, { ETag: '"1"' })
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf' })
      if (path.endsWith(`/api/notice-drafts/${draftId}/corrections`) && init?.method === 'POST') return json({ title: 'Konflikt' }, 412)
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<NoticeDraftPanel caseId={caseId} />)
    await user.click(await screen.findByRole('button', { name: 'Öffnen' }))
    const correction = (await screen.findByText('Fakten korrigieren')).closest('details')!
    await user.click(within(correction).getByText('Fakten korrigieren'))
    const reason = within(correction).getByLabelText('Begründung')
    await user.type(reason, 'Lokale Korrektur bleibt erhalten')
    await user.click(within(correction).getByRole('button', { name: 'Fakten historisiert korrigieren' }))

    expect(await screen.findByText(/zwischenzeitlich geändert/)).toBeInTheDocument()
    expect(reason).toHaveValue('Lokale Korrektur bleibt erhalten')
    expect(screen.getByRole('button', { name: 'Aktuellen Entwurfsstand laden' })).toBeInTheDocument()
  })

  it('zeigt den aktuellen Inhaber nur als Vorschlag und speichert ihn nicht ohne aktive Bestätigung', async () => {
    let createRequests = 0
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`) && !init?.method) return json([])
      if (path.endsWith(`/api/grave-sites/${graveSiteId}/usage-rights`)) return json({
        id: '60000000-0000-0000-0000-000000000007', graveSiteId, startDate: '2020-01-01', endDate: '2030-01-01',
        sourceReference: 'SYN-RECHT', usageRightStartRuleId: '60000000-0000-0000-0000-000000000008',
        startRuleCodeSnapshot: 'SYN', startRuleDisplayNameSnapshot: 'Synthetisch', version: 1,
        holderPeriods: [{ id: '60000000-0000-0000-0000-000000000009', partyId, validFromInclusive: '2020-01-01', validUntilExclusive: null }], revisions: [],
      }, 200, { ETag: '"1"' })
      if (path.endsWith(`/api/parties/${partyId}`)) return json(party(), 200, { ETag: '"1"' })
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf' })
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`) && init?.method === 'POST') {
        createRequests++
        return json(draft(), 201, { ETag: '"1"' })
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<NoticeDraftPanel caseId={caseId} graveSiteId={graveSiteId} />)

    expect(await screen.findByText(/Aktueller Nutzungsberechtigter als unverbindlicher Vorschlag/)).toHaveTextContent('Synthetik Zahlend')
    expect(screen.queryByRole('checkbox', { name: /konkreten Zahlungspflichtigen/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Vorschlag auswählen' }))
    const confirmation = await screen.findByRole('checkbox', { name: /konkreten Zahlungspflichtigen/ })
    await user.type(screen.getByLabelText('Gesamtbetrag in EUR'), '100.25')
    await user.type(screen.getByLabelText('Bescheiddatum'), '2026-08-26')
    await user.type(screen.getByLabelText('Fälligkeit'), '2026-09-26')
    await user.type(screen.getByLabelText('Kontierung'), 'SYN-KONTO')
    await user.type(screen.getByLabelText('Gebührengrund oder Quelle'), 'Synthetische Gebührenquelle')
    await user.click(screen.getByRole('button', { name: 'Rechtlich wirkungslosen Entwurf anlegen' }))
    expect(createRequests).toBe(0)
    expect(confirmation).not.toBeChecked()
    await user.click(confirmation)
    await user.click(screen.getByRole('button', { name: 'Rechtlich wirkungslosen Entwurf anlegen' }))
    expect(await screen.findByText('Rechtlich wirkungsloser Bescheidentwurf angelegt.')).toBeInTheDocument()
    expect(createRequests).toBe(1)
  })

  it('zeigt mehrere Entwürfe und hält einen verworfenen Entwurf vollständig read-only', async () => {
    const discarded = { ...draft(), id: '60000000-0000-0000-0000-000000000099', noticeNumber: 'SYNFP.2026000002', status: 'Discarded', version: 2 }
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`)) return json([listItem(), { ...listItem(), id: discarded.id, noticeNumber: discarded.noticeNumber, status: 'Discarded', version: 2 }])
      if (path.endsWith(`/api/notice-drafts/${discarded.id}`)) return json(discarded, 200, { ETag: '"2"' })
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<NoticeDraftPanel caseId={caseId} />)

    const openButtons = await screen.findAllByRole('button', { name: 'Öffnen' })
    expect(openButtons).toHaveLength(2)
    await user.click(openButtons[1])
    expect(await screen.findByText('Verworfen · Version 2')).toBeInTheDocument()
    expect(screen.queryByText('Fakten korrigieren')).not.toBeInTheDocument()
    expect(screen.queryByText('Entwurf verwerfen')).not.toBeInTheDocument()
  })
})

function draft() {
  return {
    ...listItem(), assignmentYear: 2026, runningNumber: 1,
    noticeNumberConfigurationId: '60000000-0000-0000-0000-000000000004',
    noticeNumberConfigurationVersion: 1, financialProductSnapshot: 'SYNFP', runningNumberWidthSnapshot: 6,
    revisions: [{ id: '60000000-0000-0000-0000-000000000005', resultingVersion: 1, mutationType: 'Created', reason: null, occurredAtUtc: '2026-08-26T10:00:00Z', actorId: 'actor', actorDisplayName: 'Synthetische Sachbearbeitung', caseId, payerPartyId: partyId, payerDisplayNameSnapshot: 'Synthetik Zahlend', noticeNumber: 'SYNFP.2026000001', assignmentYear: 2026, runningNumber: 1, noticeNumberConfigurationId: '60000000-0000-0000-0000-000000000004', noticeNumberConfigurationVersion: 1, financialProductSnapshot: 'SYNFP', runningNumberWidthSnapshot: 6, totalAmount: 100.25, currency: 'EUR', noticeDate: '2026-08-26', dueDate: '2026-09-26', accountAssignment: 'SYN-KONTO', feeReasonOrSource: 'Synthetische Gebührenquelle', status: 'Draft', createdAtUtc: '2026-08-26T10:00:00Z', updatedAtUtc: '2026-08-26T10:00:00Z' }],
  }
}

function listItem() {
  return { id: draftId, caseId, payerPartyId: partyId, payerDisplayNameSnapshot: 'Synthetik Zahlend', noticeNumber: 'SYNFP.2026000001', totalAmount: 100.25, currency: 'EUR', noticeDate: '2026-08-26', dueDate: '2026-09-26', accountAssignment: 'SYN-KONTO', feeReasonOrSource: 'Synthetische Gebührenquelle', status: 'Draft', version: 1, createdAtUtc: '2026-08-26T10:00:00Z', updatedAtUtc: '2026-08-26T10:00:00Z' }
}

function party() {
  return { id: partyId, partyType: 'NaturalPerson', firstName: 'Synthetik', lastName: 'Zahlend', organizationName: null, currentPrimaryAddressId: null, version: 1, addresses: [], revisions: [] }
}

function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return status === 204
    ? new Response(null, { status, headers })
    : new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}
