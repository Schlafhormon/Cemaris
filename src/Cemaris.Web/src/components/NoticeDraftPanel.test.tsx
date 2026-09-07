import { act, render, screen, waitFor, within } from '@testing-library/react'
import { StrictMode } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BurialDetails, DeceasedDetails } from '../types/cases'
import type { CemeteryMasterData, GraveSite } from '../types/cemeteries'
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
      if (path.endsWith('/api/burial-process/master-data')) return json(masterData())
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
      if (path.endsWith('/api/burial-process/master-data')) return json(masterData())
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
    render(<NoticeDraftPanel caseId={caseId} noticeGenerationEnabled burials={burials} deceasedPersons={deceasedPersons} />)
    await user.click(await screen.findByRole('button', { name: 'Öffnen' }))
    expect(await screen.findByText(/Keine Freigabe, Signatur, Zustellung oder Archivierung/)).toBeInTheDocument()
    expect(await screen.findByRole('option', { name: '20.8.2026 · Emil Synthetik · Testfriedhof / Feld A / SYN-001' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '20.8.2026 · Ida Synthetik · Testfriedhof / Bereich B / Feld B / Reihe 2 / SYN-002' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Beisetzung'), '60000000-0000-0000-0000-000000000032')
    await user.selectOptions(screen.getByLabelText('Satzungsversion'), '60000000-0000-0000-0000-000000000020')
    await user.selectOptions(screen.getByLabelText('Format'), 'Pdf')
    await user.click(screen.getByRole('button', { name: 'Rechtlich wirkungslosen Entwurf herunterladen' }))
    expect(await screen.findByText(/Zum Drucken öffnen Sie die lokale Datei bewusst/)).toBeInTheDocument()
    expect(generationHeaders?.get('If-Match')).toBe('"1"')
    expect(generationHeaders?.get('X-Cemaris-CSRF')).toBe('csrf')
    expect(generationBody).toEqual({ burialId: '60000000-0000-0000-0000-000000000032', legalBasisVersionId: '60000000-0000-0000-0000-000000000020', format: 'Pdf' })
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
      if (path.endsWith('/api/burial-process/master-data')) return json(masterData())
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

  it('kennzeichnet fehlende Namen und Referenzen, lässt leere Grabebenen weg und unterscheidet nur identische Beschriftungen durch IDs', async () => {
    const examples = [
      burials[0], { ...burials[0], id: 'gleich' }, burials[1],
      { ...burials[0], id: 'ohne-name', deceasedPersonId: 'namenlos' },
      { ...burials[0], id: 'unaufgeloest', deceasedPersonId: 'fehlende-person', graveSiteId: 'fehlendes-grab' },
      { ...burials[0], id: 'teilname', deceasedPersonId: 'teilname', graveSiteId: 'direktes-grab' },
      { ...burials[0], id: 'ohne-datum', burialDate: null },
      { ...burials[0], id: 'ohne-person', deceasedPersonId: null },
      { ...burials[0], id: 'ohne-grab', graveSiteId: null },
    ]
    const data = masterData()
    data.graveSites.push({ ...grave('direktes-grab', 'SYN-003'), fieldName: ' ', areaName: null, rowName: '' })
    generationFetch(() => Promise.resolve(json(data)))
    render(<NoticeDraftPanel caseId={caseId} noticeGenerationEnabled burials={examples} deceasedPersons={[
      ...deceasedPersons,
      { id: 'namenlos', firstName: ' ', lastName: null, birthDate: null, deathDate: null },
      { id: 'teilname', firstName: null, lastName: ' Einzelname ', birthDate: null, deathDate: null },
    ]} />)
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Öffnen' }))
    const options = within(screen.getByLabelText('Beisetzung'))
    expect(await options.findByRole('option', { name: `20.8.2026 · Emil Synthetik · Testfriedhof / Feld A / SYN-001 · Beisetzungs-ID: ${burials[0].id}` })).toBeInTheDocument()
    expect(options.getByRole('option', { name: /Beisetzungs-ID: gleich$/ })).toHaveValue('gleich')
    expect(options.getByRole('option', { name: '20.8.2026 · Ida Synthetik · Testfriedhof / Bereich B / Feld B / Reihe 2 / SYN-002' })).toHaveValue(burials[1].id)
    expect(options.getByRole('option', { name: /Name nicht angegeben/ })).toHaveValue('ohne-name')
    expect(options.getByRole('option', { name: '20.8.2026 · Person nicht aufgelöst (fehlende-person) · Grabstelle nicht aufgelöst (fehlendes-grab)' })).toHaveValue('unaufgeloest')
    expect(options.getByRole('option', { name: '20.8.2026 · Einzelname · Testfriedhof / SYN-003' })).toHaveValue('teilname')
    expect(options.getAllByRole('option')).toHaveLength(7)
    expect(screen.getByLabelText('Beisetzung')).toHaveValue('')
    expect(screen.getByLabelText('Beisetzung')).toBeRequired()
  })

  it('erhält eine manuelle Auswahl beim echten Stammdatenfehler und führt keinen Abruf je Option aus', async () => {
    let finish!: (value: Response) => void
    const read = vi.fn(() => new Promise<Response>(resolve => { finish = resolve }))
    generationFetch(read)
    const user = userEvent.setup()
    render(<NoticeDraftPanel caseId={caseId} noticeGenerationEnabled burials={burials} deceasedPersons={deceasedPersons} />)
    await user.click(await screen.findByRole('button', { name: 'Öffnen' }))
    expect(await screen.findByText(/Grabbezeichnungen werden geladen/)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Beisetzung'), burials[1].id)
    await act(async () => finish(json({ title: 'Stammdaten nicht verfügbar' }, 503)))
    expect(await screen.findByRole('alert')).toHaveTextContent('Die Grabbezeichnungen konnten nicht geladen werden.')
    expect(screen.getByLabelText('Beisetzung')).toHaveValue(burials[1].id)
    expect(screen.getByRole('option', { name: /Ida Synthetik · Grabstelle nicht aufgelöst \(grave-2\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechtlich wirkungslosen Entwurf herunterladen' })).toBeEnabled()
    expect(read).toHaveBeenCalledOnce()
  })

  it('behält beim erfolgreichen Nachladen die gewählte Beisetzungs-ID', async () => {
    let finish!: (value: Response) => void
    generationFetch(() => new Promise<Response>(resolve => { finish = resolve }))
    const user = userEvent.setup()
    render(<NoticeDraftPanel caseId={caseId} noticeGenerationEnabled burials={burials} deceasedPersons={deceasedPersons} />)
    await user.click(await screen.findByRole('button', { name: 'Öffnen' }))
    await user.selectOptions(screen.getByLabelText('Beisetzung'), burials[1].id)
    await act(async () => finish(json(masterData())))
    expect(screen.getByLabelText('Beisetzung')).toHaveValue(burials[1].id)
    expect(screen.getByRole('option', { name: /Ida Synthetik · Testfriedhof/ })).toBeInTheDocument()
    expect(screen.queryByText(/Grabbezeichnungen werden geladen/)).not.toBeInTheDocument()
  })

  it('bricht den Stammdatenabruf beim Deaktivieren ab und ignoriert auch verspätete erfolgreiche Antworten', async () => {
    const pending: { signal: AbortSignal; finish: (value: Response) => void }[] = []
    generationFetch(signal => new Promise<Response>(finish => pending.push({ signal: signal!, finish })))
    const user = userEvent.setup()
    const props = { caseId, burials, deceasedPersons }
    const view = render(<NoticeDraftPanel {...props} noticeGenerationEnabled />)
    await user.click(await screen.findByRole('button', { name: 'Öffnen' }))
    await waitFor(() => expect(pending).toHaveLength(1))
    view.rerender(<NoticeDraftPanel {...props} />)
    expect(pending[0].signal.aborted).toBe(true)
    expect(screen.queryByLabelText('Beisetzung')).not.toBeInTheDocument()
    view.rerender(<NoticeDraftPanel {...props} noticeGenerationEnabled />)
    await waitFor(() => expect(pending).toHaveLength(2))
    await act(async () => pending[1].finish(json(masterData())))
    await act(async () => pending[0].finish(json({ ...masterData(), graveSites: [] })))
    expect(screen.getByRole('option', { name: /Ida Synthetik · Testfriedhof/ })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('ruft bei ausgeschalteter Capability keine Beschriftungsdaten ab und zeigt keine Erzeugung', async () => {
    const read = vi.fn(() => Promise.resolve(json(masterData())))
    generationFetch(read)
    render(<NoticeDraftPanel caseId={caseId} burials={burials} deceasedPersons={deceasedPersons} />)
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Öffnen' }))
    expect(screen.getByText('Entwurf · Version 1')).toBeInTheDocument()
    expect(screen.queryByLabelText('Beisetzung')).not.toBeInTheDocument()
    expect(read).not.toHaveBeenCalled()
  })
})

function generationFetch(read: (signal?: AbortSignal | null) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input)
    if (path.endsWith(`/api/cases/${caseId}/notice-drafts`)) return json([listItem()])
    if (path.endsWith(`/api/notice-drafts/${draftId}`)) return json(draft(), 200, { ETag: '"1"' })
    if (path.endsWith('/api/burial-process/master-data')) return read(init?.signal)
    if (path.includes('/api/master-data/legal-basis-versions')) return json([{ id: 'satzung', name: 'Synthetische Satzung', versionDate: '2026-01-01', isActive: true, version: 1 }])
    throw new Error(`Unerwarteter Testaufruf: ${path}`)
  }))
}

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

const burials: BurialDetails[] = [
  { id: '60000000-0000-0000-0000-000000000030', deceasedPersonId: 'person-1', burialDate: '2026-08-20', graveSiteId, status: 'Performed', planningDate: null },
  { id: '60000000-0000-0000-0000-000000000032', deceasedPersonId: 'person-2', burialDate: '2026-08-20', graveSiteId: 'grave-2', status: 'Completed', planningDate: null },
]
const deceasedPersons: DeceasedDetails[] = [
  { id: 'person-2', firstName: ' Ida ', lastName: ' Synthetik ', birthDate: null, deathDate: null },
  { id: 'person-1', firstName: ' Emil ', lastName: ' Synthetik ', birthDate: null, deathDate: null },
]
function grave(id: string, graveNumber: string): GraveSite {
  return { id, cemeteryId: 'cemetery', areaId: null, fieldId: 'field', rowId: null, graveTypeId: 'type', graveNumber, status: 'Occupied', isBlocked: true, blockNote: null, targetCapacity: null, note: null, isActive: false, version: 1, cemeteryName: ' Testfriedhof ', areaName: null, fieldName: ' Feld A ', rowName: null, graveTypeName: 'Testgrab' }
}
function masterData(): CemeteryMasterData {
  return { cemeteries: [], areas: [], fields: [], rows: [], graveTypes: [], cemeteryGraveTypes: [], graveSites: [
    { ...grave('grave-2', 'SYN-002'), areaName: 'Bereich B', fieldName: 'Feld B', rowName: 'Reihe 2' },
    grave(graveSiteId, 'SYN-001'),
  ] }
}
