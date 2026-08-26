import { render, screen } from '@testing-library/react'
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
})

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
