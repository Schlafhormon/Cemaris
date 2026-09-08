import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersonUsageRightsPanel } from './PersonUsageRightsPanel'

describe('Responsive Struktur der Nutzungsrechtsaktionen', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('ordnet die drei Aktionen als einzelne Disclosure-Blöcke mit eigenen Formularrastern an', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input) => new Response(JSON.stringify(String(input).includes('/history?') ? { items: [], totalMatches: 0, page: 1, pageSize: 10, totalPages: 0 } : right), { headers: { 'Content-Type': 'application/json', ETag: '"1"' } })))
    render(<PersonUsageRightsPanel graveSiteId={right.graveSiteId} />)

    const actions = await screen.findByLabelText('Nutzungsrecht bearbeiten')
    expect(Array.from(actions.children)).toHaveLength(3)
    expect(Array.from(actions.children).every((element) => element.tagName === 'DETAILS')).toBe(true)
    expect(actions.querySelectorAll('.right-action-form')).toHaveLength(2)
    expect(actions.querySelectorAll('.right-action-form .compact-form-grid')).toHaveLength(2)
  })
})

const right = {
  id: '80000000-0000-0000-0000-000000000001', graveSiteId: '80000000-0000-0000-0000-000000000002',
  startDate: '2026-09-01', endDate: '2056-09-01', sourceReference: 'SYN-RESPONSIVE',
  usageRightStartRuleId: '80000000-0000-0000-0000-000000000003', startRuleCodeSnapshot: 'SYN-URKUNDE',
  startRuleDisplayNameSnapshot: 'Synthetische Urkundenübergabe', version: 1, holderPeriods: [], revisions: [],
}
