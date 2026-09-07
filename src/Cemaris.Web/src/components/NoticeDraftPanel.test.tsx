import { render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NoticeDraftPanel } from './NoticeDraftPanel'

const caseId = '60000000-0000-0000-0000-000000000001'
const partyId = '60000000-0000-0000-0000-000000000002'
const draftId = '60000000-0000-0000-0000-000000000003'
const graveSiteId = '60000000-0000-0000-0000-000000000006'

describe('NoticeDraftPanel', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('meldet abgebrochene Entwurfs- und Satzungsabrufe im StrictMode nicht als Fehler', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      await new Promise(resolve => setTimeout(resolve, 0))
      init?.signal?.throwIfAborted()
      const path = String(input)
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`)) return json([listItem()])
      if (path.endsWith(`/api/notice-drafts/${draftId}`)) return json(draft(), 200, { ETag: '"1"' })
      if (path.includes('/api/master-data/legal-basis-versions')) return json([{ id: graveSiteId, name: 'Synthetische Browser-Satzung', versionDate: '2026-01-01', isActive: true, version: 1 }])
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<StrictMode><NoticeDraftPanel caseId={caseId} noticeGenerationEnabled /></StrictMode>)
    const open = await screen.findByRole('button', { name: 'Öffnen' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.click(open)
    expect(await screen.findByRole('option', { name: /Synthetische Browser-Satzung/ })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

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
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText('Gesamtbetrag in EUR')[1]).toHaveValue(null)
    expect(confirmation).not.toBeChecked()
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

  it('zeigt die capability-geschützte Erzeugung nur am aktiven Entwurf und widerruft den Blob sofort', async () => {
    let generationHeaders: Headers | undefined
    let generationBody: Record<string, unknown> | undefined
    const createObjectURL = vi.fn(() => 'blob:synthetischer-entwurf')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`)) return json([listItem()])
      if (path.endsWith(`/api/notice-drafts/${draftId}`) && !path.endsWith('/generate')) return json(draft(), 200, { ETag: '"1"' })
      if (path.includes('/api/master-data/legal-basis-versions?activeOnly=true')) return json([{ id: '60000000-0000-0000-0000-000000000020', name: 'Synthetische Satzung', versionDate: '2026-01-01', isActive: true, version: 2, createdAtUtc: '2026-01-01T00:00:00Z', updatedAtUtc: '2026-01-01T00:00:00Z' }])
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf-generation' })
      if (path.endsWith(`/api/notice-drafts/${draftId}/generate`)) {
        generationHeaders = new Headers(init?.headers)
        generationBody = JSON.parse(String(init?.body)) as Record<string, unknown>
        return new Response(new Blob(['%PDF-synthetic']), { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="SYNFP.2026000001.pdf"' } })
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<NoticeDraftPanel caseId={caseId} noticeGenerationEnabled burials={[{ id: '60000000-0000-0000-0000-000000000030', deceasedPersonId: '60000000-0000-0000-0000-000000000031', burialDate: '2026-08-20', graveSiteId, status: 'Performed', planningDate: null }]} />)
    await user.click(await screen.findByRole('button', { name: 'Öffnen' }))
    expect(await screen.findByText(/Keine Freigabe, Signatur, Zustellung oder Archivierung/)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Beisetzung'), '60000000-0000-0000-0000-000000000030')
    await user.selectOptions(screen.getByLabelText('Satzungsversion'), '60000000-0000-0000-0000-000000000020')
    await user.selectOptions(screen.getByLabelText('Format'), 'Pdf')
    await user.click(screen.getByRole('button', { name: 'Rechtlich wirkungslosen Entwurf herunterladen' }))
    expect(await screen.findByText(/Zum Drucken öffnen Sie die lokale Datei bewusst/)).toBeInTheDocument()
    expect(generationHeaders?.get('If-Match')).toBe('"1"')
    expect(generationHeaders?.get('X-Cemaris-CSRF')).toBe('csrf')
    expect(generationBody).toEqual({ burialId: '60000000-0000-0000-0000-000000000030', legalBasisVersionId: '60000000-0000-0000-0000-000000000020', format: 'Pdf' })
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:synthetischer-entwurf')
    expect(screen.queryByText(/Empfängeranrede/i)).not.toBeInTheDocument()
  })

  it('zeigt Kontakt-, Satzungs-, Vorlagen-, Konvertierungs- und ETag-Fehler ohne Downloadinhalt', async () => {
    const errors = [
      [409, 'Das aktive Benutzerkontaktprofil ist für die Dokumenterzeugung nicht vollständig.'],
      [409, 'Die ausgewählte Satzungsversion ist nicht aktiv.'],
      [500, 'Die konfigurierte Dokumentvorlage konnte nicht sicher verarbeitet werden.'],
      [503, 'Die PDF-Konvertierung ist fehlgeschlagen.'],
      [428, 'If-Match mit einer starken aktuellen Version ist erforderlich.'],
    ] as const
    let attempt = 0
    const createObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() })
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith(`/api/cases/${caseId}/notice-drafts`)) return json([listItem()])
      if (path.endsWith(`/api/notice-drafts/${draftId}`) && !path.endsWith('/generate')) return json(draft(), 200, { ETag: '"1"' })
      if (path.includes('/api/master-data/legal-basis-versions?activeOnly=true')) return json([{ id: '60000000-0000-0000-0000-000000000020', name: 'Synthetische Satzung', versionDate: '2026-01-01', isActive: true, version: 2, createdAtUtc: '2026-01-01T00:00:00Z', updatedAtUtc: '2026-01-01T00:00:00Z' }])
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf-generation-errors' })
      if (path.endsWith(`/api/notice-drafts/${draftId}/generate`)) {
        const [status, title] = errors[attempt++]
        return json({ status, title, code: `synthetic-error-${attempt}` }, status)
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<NoticeDraftPanel caseId={caseId} noticeGenerationEnabled burials={[{ id: '60000000-0000-0000-0000-000000000030', deceasedPersonId: '60000000-0000-0000-0000-000000000031', burialDate: '2026-08-20', graveSiteId, status: 'Performed', planningDate: null }]} />)
    await user.click(await screen.findByRole('button', { name: 'Öffnen' }))
    await user.selectOptions(screen.getByLabelText('Beisetzung'), '60000000-0000-0000-0000-000000000030')
    await user.selectOptions(screen.getByLabelText('Satzungsversion'), '60000000-0000-0000-0000-000000000020')

    const button = screen.getByRole('button', { name: 'Rechtlich wirkungslosen Entwurf herunterladen' })
    for (const [, title] of errors) {
      await user.click(button)
      expect(await screen.findByText(title)).toBeInTheDocument()
    }
    expect(createObjectURL).not.toHaveBeenCalled()
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
