import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CaseOverview } from '../types/cases'
import { CaseDetailsPage } from './CaseDetailsPage'

describe('Trennung der Nutzungsrechtsprojektionen', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('erklärt bei sichtbarem kanonischem Recht den begrenzten Leerzustand der Altprojektion', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.includes('/api/cases/')) return json(caseOverview(), { ETag: '"1"' })
      if (path.includes('/api/grave-sites/')) return json(right, { ETag: '"1"' })
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))

    render(<CaseDetailsPage caseId="70000000-0000-0000-0000-000000000001" personUsageRightsEditingEnabled />)

    expect(await screen.findByRole('heading', { name: 'Kanonisches Nutzungsrecht' })).toBeInTheDocument()
    expect(screen.getByText(/Dieser Abschnitt zeigt ausschließlich die nullable Altprojektion/)).toBeInTheDocument()
    expect(screen.getByText(/Nur in der vorläufigen Altprojektion ist kein Nutzungsrechtseintrag vorhanden/)).toBeInTheDocument()
    expect(screen.queryByText('Keine Nutzungsrechte vorhanden.')).not.toBeInTheDocument()
  })
})

describe('Trennung der Bescheidentwurfsprojektionen', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('zeigt den kanonischen Entwurfskern vor der ausdrücklich benannten Altprojektion', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/notice-drafts')) return json([], {})
      if (path.includes('/api/cases/')) return json(caseOverview(), { ETag: '"1"' })
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))

    render(<CaseDetailsPage caseId="70000000-0000-0000-0000-000000000001" noticeDraftEditingEnabled />)

    expect(await screen.findByRole('heading', { name: 'Kanonische Bescheidentwürfe' })).toBeInTheDocument()
    expect(screen.getByText('Rechtlich wirkungslos')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vorläufige Altprojektion: Bescheide / Gebühreninformationen' })).toBeInTheDocument()
    expect(screen.getByText(/keine Rückinterpretation oder Zusammenführung/)).toBeInTheDocument()
  })

  it('übergibt Personen über ihre Referenzen und verwendet auch bei abweichendem Fallgrab den jeweiligen Beisetzungsgrabbezug', async () => {
    const data = generationCase()
    stubGenerationPage(data, () => Promise.resolve(json(generationMasterData, {})))
    render(<CaseDetailsPage caseId={data.id} noticeDraftEditingEnabled noticeGenerationEnabled />)
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Öffnen' }))
    expect(await screen.findByRole('option', { name: '20.8.2026 · Emil Synthetik · Friedhof eins / SYN-001' })).toHaveValue('beisetzung-1')
    expect(screen.getByRole('option', { name: '20.8.2026 · Ida Synthetik · Friedhof zwei / SYN-002' })).toHaveValue('beisetzung-2')
    expect(screen.getByLabelText('Beisetzung')).toHaveValue('')
  })

  it('bricht die Beschriftungsanfrage beim Fallwechsel ab und übernimmt keine verspäteten Daten in den neuen Fall', async () => {
    const data = generationCase()
    let finish!: (response: Response) => void
    let signal: AbortSignal | null | undefined
    stubGenerationPage(data, value => {
      signal = value
      return new Promise(resolve => { finish = resolve })
    })
    const view = render(<CaseDetailsPage caseId={data.id} noticeDraftEditingEnabled noticeGenerationEnabled />)
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Öffnen' }))
    await screen.findByText(/Grabbezeichnungen werden geladen/)
    view.rerender(<CaseDetailsPage caseId="anderer-fall" noticeDraftEditingEnabled noticeGenerationEnabled />)
    await waitFor(() => expect(signal?.aborted).toBe(true))
    await act(async () => finish(json(generationMasterData, {})))
    expect(await screen.findByText('Noch kein kanonischer Entwurf')).toBeInTheDocument()
    expect(screen.queryByLabelText('Beisetzung')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

function generationCase(): CaseOverview {
  return { ...caseOverview(), deceasedPersons: [
    { id: 'person-2', firstName: 'Ida', lastName: 'Synthetik', birthDate: null, deathDate: null },
    { id: 'person-1', firstName: 'Emil', lastName: 'Synthetik', birthDate: null, deathDate: null },
  ], burials: [
    { id: 'beisetzung-1', deceasedPersonId: 'person-1', burialDate: '2026-08-20', graveSiteId: 'grab-1', status: 'Performed', planningDate: null },
    { id: 'beisetzung-2', deceasedPersonId: 'person-2', burialDate: '2026-08-20', graveSiteId: 'grab-2', status: 'Performed', planningDate: null },
  ] }
}

const generationMasterData = { graveSites: [
  { id: 'grab-2', cemeteryName: 'Friedhof zwei', graveNumber: 'SYN-002', areaName: null, fieldName: null, rowName: null, isActive: false, status: 'Occupied' },
  { id: 'grab-1', cemeteryName: 'Friedhof eins', graveNumber: 'SYN-001', areaName: null, fieldName: null, rowName: null },
] }

function stubGenerationPage(data: CaseOverview, read: (signal?: AbortSignal | null) => Promise<Response>) {
  const draft = { id: 'entwurf', caseId: data.id, noticeNumber: 'SYN.2026000001', totalAmount: 125.50, currency: 'EUR', noticeDate: '2026-08-28', dueDate: '2026-09-28', status: 'Draft', version: 1, revisions: [] }
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input)
    if (path.endsWith('/api/cases/anderer-fall/notice-drafts')) return json([], {})
    if (path.endsWith('/api/cases/anderer-fall')) return json({ ...caseOverview(), id: 'anderer-fall' }, { ETag: '"1"' })
    if (path.endsWith('/notice-drafts')) return json([draft], {})
    if (path.endsWith('/api/notice-drafts/entwurf')) return json(draft, { ETag: '"1"' })
    if (path.endsWith(`/api/cases/${data.id}`)) return json(data, { ETag: '"1"' })
    if (path.endsWith('/api/burial-process/master-data')) return read(init?.signal)
    if (path.includes('/api/master-data/legal-basis-versions')) return json([], {})
    throw new Error(`Unerwarteter Testaufruf: ${path}`)
  }))
}

function caseOverview(): CaseOverview {
  return {
    id: '70000000-0000-0000-0000-000000000001', isSynthetic: true, version: 1,
    grave: { cemetery: 'Synthetischer Friedhof', field: 'Testfeld', graveNumber: 'SYN-1', graveSiteId: right.graveSiteId },
    deceasedPersons: [], burials: [], usageRights: [], entitledPersons: [], notices: [], dataQualityNotes: [], lastChange: null,
  }
}

const right = {
  id: '70000000-0000-0000-0000-000000000010', graveSiteId: '70000000-0000-0000-0000-000000000011',
  startDate: '2026-09-01', endDate: '2056-09-01', sourceReference: 'SYN-REF', usageRightStartRuleId: '70000000-0000-0000-0000-000000000012',
  startRuleCodeSnapshot: 'SYN-URKUNDE', startRuleDisplayNameSnapshot: 'Synthetische Urkundenübergabe', version: 1,
  holderPeriods: [], revisions: [],
}

function json(value: unknown, headers: Record<string, string>) {
  return new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json', ...headers } })
}
