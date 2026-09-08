import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UsageRightLifecycleForms, UsageRightHistory } from './UsageRightLifecycle'
import { PersonUsageRightsPanel } from './PersonUsageRightsPanel'
import { NoticeDraftPanel } from './NoticeDraftPanel'
import type { UsageRight, Versioned } from '../types/personUsageRights'

const right: UsageRight = { id: 'a', graveSiteId: 'site', startDate: '2020-01-01', endDate: '2050-01-01', sourceReference: 'SYN', usageRightStartRuleId: 'rule', startRuleCodeSnapshot: 'SYN', startRuleDisplayNameSnapshot: 'SYN', version: 2, status: 'Ended', termination: { terminationDate: '2026-09-02', kind: 'Returned', reason: 'SYN', sourceReference: 'SYN', manualReviewConfirmed: true }, holderPeriods: [], revisions: [] }
const versioned: Versioned<UsageRight> = { value: right, etag: '"2"' }
const rows = [right, { ...right, id: 'b', predecessorId: 'a' }, { ...right, id: 'c', predecessorId: 'b' }]
function json(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', ETag: '"3"' } }) }

describe('Manueller Nutzungsrechtslebenszyklus', () => {
  afterEach(() => vi.unstubAllGlobals())
  it.each(['termination-reversals', 'successors', 'sequence-corrections'])('bedient %s mit eigenen Pflichtangaben und vollständiger Bestätigung', async (action) => {
    let sent: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      if (String(url).endsWith('/csrf')) return json({ requestToken: 'csrf' })
      if (String(url).endsWith('/sequence')) return json(rows)
      expect(String(url)).toContain('/' + action)
      sent = JSON.parse(String(init.body))
      return json({ ...right, version: 3 })
    }))
    const changed = vi.fn()
    const user = userEvent.setup()
    render(<UsageRightLifecycleForms right={versioned} partyId="party" onChanged={changed} onError={vi.fn()} />)
    await user.click(screen.getByText('Manueller Nutzungsrechtslebenszyklus'))
    await user.selectOptions(screen.getByLabelText('Vorgang'), action)
    await user.type(screen.getByLabelText('Begründung'), 'SYN-Begründung')
    if (action === 'successors') {
      fireEvent.change(screen.getByLabelText('Neuer Beginn'), { target: { value: '2026-09-02' } })
      fireEvent.change(screen.getByLabelText('Neues Laufzeitende'), { target: { value: '2056-09-02' } })
      await user.type(screen.getByLabelText('Quellenreferenz'), 'SYN-Quelle')
      await user.click(screen.getByRole('checkbox', { name: /Voraussetzungen manuell/ }))
    }
    if (action === 'sequence-corrections') {
      expect(screen.getByRole('button', { name: 'Rechtefolge gemeinsam korrigieren' })).toBeDisabled()
      await user.click(screen.getByRole('button', { name: 'Betroffene Rechte laden' }))
      await user.click(await screen.findByRole('checkbox', { name: /gemeinsame Korrektur/ }))
    }
    await user.click(screen.getByRole('button', { name: action === 'successors' ? 'Neues Recht vergeben' : action === 'sequence-corrections' ? 'Rechtefolge gemeinsam korrigieren' : 'Beendigung zurücknehmen' }))
    await waitFor(() => expect(changed).toHaveBeenCalledOnce())
    expect(sent?.reason).toBe('SYN-Begründung')
    if (action === 'successors') expect(sent).toMatchObject({ holderPartyId: 'party', manualReviewConfirmed: true })
    if (action === 'sequence-corrections') expect(sent).toMatchObject({ confirmSequenceCorrection: true, members: rows.map((x) => ({ id: x.id, version: x.version })) })
    expect(screen.getByLabelText('Begründung')).toHaveValue('')
  })

  it('dokumentiert eine Beendigung und erhält Konflikteingaben beim Neuladen', async () => {
    let status = 412
    const onError = vi.fn()
    vi.stubGlobal('fetch', vi.fn(async (url) => String(url).endsWith('/csrf') ? json({ requestToken: 'csrf' }) : json(status === 412 ? { title: 'Konflikt' } : { ...right, version: 3 }, status)))
    const user = userEvent.setup()
    const open = { ...versioned, value: { ...right, status: 'Open' as const } }
    const props = { right: open, onChanged: vi.fn(), onError }
    const { rerender } = render(<UsageRightLifecycleForms {...props} />)
    await user.click(screen.getByText('Manueller Nutzungsrechtslebenszyklus'))
    fireEvent.change(screen.getByLabelText('Beendet ab (UTC-Kalendertag)'), { target: { value: '2024-02-29' } })
    await user.type(screen.getByLabelText('Quellenreferenz'), 'SYN-Quelle')
    await user.type(screen.getByLabelText('Begründung'), 'Eingabe bleibt')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Beendigung dokumentieren' }))
    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    rerender(<UsageRightLifecycleForms {...props} right={{ ...open, etag: '"3"' }} />)
    expect(screen.getByLabelText('Begründung')).toHaveValue('Eingabe bleibt')
    status = 200
    await user.click(screen.getByRole('button', { name: 'Beendigung dokumentieren' }))
    await waitFor(() => expect(props.onChanged).toHaveBeenCalledOnce())
  })

  it('lädt nur gewählte Rechtedetails und ignoriert verspätete Grabstellenantworten', async () => {
    let resolveFirst: (value: Response) => void = () => {}
    let firstSignal: AbortSignal | undefined
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      if (String(url).includes('/history?')) return json({ items: [], totalMatches: 0, page: 1, pageSize: 10, totalPages: 0 })
      if (String(url).includes('/first/')) { firstSignal = init.signal; return new Promise<Response>((resolve) => { resolveFirst = resolve }) }
      return json({ ...right, id: 'second', sourceReference: 'SYN-ZWEITE', status: 'Voided' })
    }))
    const { rerender } = render(<PersonUsageRightsPanel graveSiteId="first" lifecycleEnabled />)
    rerender(<PersonUsageRightsPanel graveSiteId="second" lifecycleEnabled />)
    await screen.findByText('SYN-ZWEITE')
    expect(firstSignal?.aborted).toBe(true)
    await act(async () => resolveFirst(json(right)))
    expect(screen.getByText('SYN-ZWEITE')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nutzungsrecht bearbeiten')).not.toBeInTheDocument()
    expect(screen.queryByText('Manueller Nutzungsrechtslebenszyklus')).not.toBeInTheDocument()
  })

  it('lässt eine frühe Historienauswahl nicht von der verspäteten Standardantwort überschreiben', async () => {
    let resolveInitial: (value: Response) => void = () => {}
    let initialSignal: AbortSignal | undefined
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      if (String(url).includes('/history?')) return json({ items: rows, totalMatches: 3, page: 1, pageSize: 10, totalPages: 1 })
      if (String(url).includes('/grave-sites/')) { initialSignal = init.signal; return new Promise<Response>((resolve) => { resolveInitial = resolve }) }
      return json({ ...right, id: 'b', sourceReference: 'SYN-AUSWAHL', status: 'Voided' })
    }))
    const user = userEvent.setup()
    render(<PersonUsageRightsPanel graveSiteId="site" lifecycleEnabled />)
    await user.click(await screen.findByRole('button', { name: /· b$/ }))
    await screen.findByText('SYN-AUSWAHL')
    expect(initialSignal?.aborted).toBe(true)
    await act(async () => resolveInitial(json(right)))
    expect(screen.getByText('SYN-AUSWAHL')).toBeInTheDocument()
  })

  it('macht Rechte über Pagination auswählbar und zeigt Ladefehler mit Wiederholung', async () => {
    let fail = true
    const select = vi.fn()
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (fail) return json({ title: 'SYN-Ladefehler' }, 500)
      const second = String(url).includes('page=2')
      return json({ items: [second ? rows[1] : rows[0]], totalMatches: 11, page: second ? 2 : 1, pageSize: 10, totalPages: 2 })
    }))
    const user = userEvent.setup()
    render(<UsageRightHistory graveSiteId="site" refresh={0} onSelect={select} />)
    await screen.findByText(/SYN-Ladefehler/)
    fail = false
    await user.click(screen.getByRole('button', { name: 'Verlauf erneut laden' }))
    await user.click(await screen.findByRole('button', { name: 'Nächste Rechteseite' }))
    await user.click(await screen.findByRole('button', { name: /· b$/ }))
    expect(select).toHaveBeenCalledWith('b')
  })

  it.each(['Ended', 'Voided'])('schlägt bei %s keinen historisch offenen Inhaber vor', async (status) => {
    const fetcher = vi.fn(async (url) => String(url).includes('/notice-drafts') ? json([]) : json({ ...right, status, holderPeriods: [{ partyId: 'historical', validUntilExclusive: null }] }))
    vi.stubGlobal('fetch', fetcher)
    render(<NoticeDraftPanel caseId="case" graveSiteId="site" />)
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    expect(fetcher.mock.calls.some(([url]) => String(url).includes('/parties/'))).toBe(false)
    expect(screen.queryByRole('button', { name: /Vorschlag/ })).not.toBeInTheDocument()
  })
})
