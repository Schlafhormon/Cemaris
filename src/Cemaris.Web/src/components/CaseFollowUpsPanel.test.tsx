import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { StrictMode } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CaseFollowUpsPanel } from './CaseFollowUpsPanel'
import type { CaseFollowUp, CaseFollowUpStatus } from '../types/caseFollowUps'
import App from '../App'
import { AuthProvider } from '../auth/AuthContext'

const caseId = '00000000-0000-0000-0000-000000000001'
const id = '00000000-0000-0000-0000-000000000101'
function initial(status: CaseFollowUpStatus = 'Open'): CaseFollowUp {
  const state = { id, caseId, title: 'Synthetische Aufgabe', description: 'Synthetische Beschreibung', dueDate: '2024-02-29', status, version: 1, createdAtUtc: '2026-09-08T08:00:00Z', updatedAtUtc: '2026-09-08T08:00:00Z' }
  return { state, revisions: [{ id: 'revision-1', state, operation: 'Created', reason: null, actorId: 'synthetic', actorDisplayName: 'Synthetische Bearbeitung', occurredAtUtc: state.createdAtUtc }] }
}
function json(value: unknown, status = 200, version?: number) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', ...(version ? { ETag: `"${version}"` } : {}) } }) }
function page(value: CaseFollowUp, total = 1, currentPage = 1) { return { items: [{ ...value.state, grave: { cemetery: 'Synthetischer Friedhof', field: null, graveNumber: 'SYN-1' } }], totalMatches: total, page: currentPage, pageSize: 10, totalPages: Math.ceil(total / 10) } }
function server(start = initial()) {
  let current = start
  const mutations: { path: string; body: Record<string, string>; headers: Headers }[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input)
    if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'synthetic-csrf' })
    if (init?.method) {
      const body = JSON.parse(String(init.body)) as Record<string, string>
      mutations.push({ path, body, headers: new Headers(init.headers) })
      if (new Headers(init.headers).get('If-Match') && new Headers(init.headers).get('If-Match') !== `"${current.state.version}"`) return json({ title: 'Konflikt' }, 412)
      const status: CaseFollowUpStatus = path.includes('/complete?') ? 'Completed' : path.includes('/cancel?') ? 'Cancelled' : 'Open'
      const operation = path.includes('/complete?') ? 'Completed' : path.includes('/cancel?') ? 'Cancelled' : path.includes('/reopen?') ? 'Reopened' : init.method === 'PUT' ? 'Changed' : 'Created'
      const state = { ...current.state, ...(body.title ? { title: body.title, description: body.description, dueDate: body.dueDate } : {}), status, version: current.state.version + 1 }
      current = { state, revisions: [...current.revisions, { id: `revision-${state.version}`, state, operation, reason: body.reason ?? null, actorId: 'synthetic', actorDisplayName: 'Synthetische Bearbeitung', occurredAtUtc: state.updatedAtUtc }] }
      return json(current, 200, state.version)
    }
    if (path.includes(`/api/case-follow-ups/${id}?`)) return json(current, 200, current.state.version)
    if (path.includes('follow-ups?')) return json(page(current))
    throw new Error(`Unerwarteter synthetischer Request: ${path}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return { mutations, fetchMock, replace: (value: CaseFollowUp) => { current = value } }
}
async function open() { await userEvent.setup().click(await screen.findByRole('button', { name: 'Synthetische Aufgabe öffnen' })); return within(await screen.findByRole('form', { name: 'Wiedervorlage bearbeiten' })) }

describe('Manuelle Wiedervorlagen', () => {
  beforeEach(() => window.history.replaceState(null, '', `/cases/${caseId}`))
  afterEach(() => vi.unstubAllGlobals())

  it('legt manuell an, verwendet CSRF und leert das Anlageformular', async () => {
    const api = server(); const user = userEvent.setup()
    render(<CaseFollowUpsPanel caseId={caseId} />)
    const form = within(screen.getByRole('form', { name: 'Wiedervorlage anlegen' }))
    await user.type(form.getByLabelText('Titel'), 'Neue Aufgabe')
    fireEvent.change(form.getByLabelText('Wiedervorlagedatum'), { target: { value: '2024-02-29' } })
    await user.type(form.getByLabelText('Beschreibung (optional)'), '<b>Nur Text</b>')
    await user.click(form.getByRole('button', { name: 'Wiedervorlage anlegen' }))
    expect(await screen.findByText(/Wiedervorlage angelegt/)).toBeInTheDocument()
    expect(form.getByLabelText('Titel')).toHaveValue('')
    expect(form.getByLabelText('Wiedervorlagedatum')).toHaveValue('')
    expect(form.getByLabelText('Beschreibung (optional)')).toHaveValue('')
    expect(api.mutations[0].body).toMatchObject({ title: 'Neue Aufgabe', dueDate: '2024-02-29', description: '<b>Nur Text</b>' })
    expect(api.mutations[0].headers.get('X-Cemaris-CSRF')).toBeTruthy()
    expect(api.mutations[0].headers.has('If-Match')).toBe(false)
    expect(document.querySelector('.follow-up-text b')).toBeNull()
  })

  it.each([
    ['Open', 'Erledigen', 'complete', 'Erledigt'], ['Open', 'Abbrechen', 'cancel', 'Abgebrochen'],
    ['Completed', 'Wieder öffnen', 'reopen', 'Offen'], ['Cancelled', 'Wieder öffnen', 'reopen', 'Offen'],
  ] as const)('bearbeitet %s durch %s mit Grund und starker Version', async (status, label, action, result) => {
    const api = server(initial(status)); const user = userEvent.setup()
    render(<CaseFollowUpsPanel caseId={caseId} />)
    const form = await open()
    expect(form.getByLabelText('Begründung')).toBeRequired()
    await user.click(form.getByRole('button', { name: label }))
    expect(api.mutations).toHaveLength(0)
    await user.type(form.getByLabelText('Begründung'), 'Synthetischer Grund')
    await user.click(form.getByRole('button', { name: label }))
    expect(await screen.findByText(`${result} · Version 2`)).toBeInTheDocument()
    expect(api.mutations[0].path).toContain(`/${action}?caseId=${caseId}`)
    expect(api.mutations[0].body).toEqual({ reason: 'Synthetischer Grund' })
    expect(api.mutations[0].headers.get('If-Match')).toBe('"1"')
    await user.click(screen.getByText('Fachhistorie (2)'))
    expect(screen.getByText('Begründung: Synthetischer Grund')).toBeInTheDocument()
  })

  it('verschiebt ausdrücklich und erhält lokale Eingaben bei Konflikt und bewusstem Neuladen', async () => {
    const api = server(); const user = userEvent.setup()
    render(<CaseFollowUpsPanel caseId={caseId} />)
    const form = await open()
    await user.clear(form.getByLabelText('Titel')); await user.type(form.getByLabelText('Titel'), 'Lokaler Titel')
    fireEvent.change(form.getByLabelText('Wiedervorlagedatum'), { target: { value: '2026-09-20' } })
    await user.type(form.getByLabelText('Begründung'), 'Lokale Begründung')
    api.replace({ ...initial(), state: { ...initial().state, title: 'Fremde Änderung', version: 2 } })
    await user.click(form.getByRole('button', { name: 'Änderung speichern' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/zwischenzeitlich geändert/)
    await user.click(screen.getByRole('button', { name: 'Aktuellen Stand laden' }))
    expect(await screen.findByText('Offen · Version 2')).toBeInTheDocument()
    expect(form.getByLabelText('Titel')).toHaveValue('Lokaler Titel')
    expect(form.getByLabelText('Begründung')).toHaveValue('Lokale Begründung')
    expect(form.getByLabelText('Wiedervorlagedatum')).toHaveValue('2026-09-20')
    await user.click(form.getByRole('button', { name: 'Änderung speichern' }))
    expect(await screen.findByText('Offen · Version 3')).toBeInTheDocument()
    expect(api.mutations[1].headers.get('If-Match')).toBe('"2"')
    expect(api.mutations[1].body.dueDate).toBe('2026-09-20')
  })

  it('hält Filter, Seitennavigation und Rücksprung in der URL', async () => {
    window.history.replaceState(null, '', '/case-follow-ups?followUpStatus=All&followUpDueUntil=2026-09-10&followUpPage=2')
    const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => { calls.push(String(input)); return json(page(initial(), 21, 2)) }))
    const user = userEvent.setup(); render(<CaseFollowUpsPanel />)
    expect(await screen.findByText('21 Wiedervorlagen · Seite 2 von 3')).toBeInTheDocument()
    expect(calls[0]).toContain('status=All&page=2&pageSize=10&dueUntil=2026-09-10')
    expect(screen.getByLabelText('Fällig bis')).toHaveValue('2026-09-10')
    expect(screen.getByText('29.02.2024')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Synthetischer Friedhof/ }).getAttribute('href')).toContain('returnTo=')
    await user.click(screen.getByRole('button', { name: 'Nächste Seite' }))
    expect(window.location.search).toContain('followUpPage=3')
    await user.selectOptions(screen.getByLabelText('Status'), 'Cancelled')
    await user.click(screen.getByRole('button', { name: 'Filter anwenden' }))
    expect(window.location.search).toContain('followUpStatus=Cancelled')
    expect(window.location.search).toContain('followUpPage=1')
  })

  it('ignoriert verspätete Filterantworten und bricht den vorherigen Abruf ab', async () => {
    const pending: { signal: AbortSignal; finish: (value: Response) => void }[] = []
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>(finish => pending.push({ signal: init!.signal!, finish }))))
    const user = userEvent.setup(); render(<CaseFollowUpsPanel />)
    await user.selectOptions(screen.getByLabelText('Status'), 'Cancelled'); await user.click(screen.getByRole('button', { name: 'Filter anwenden' }))
    expect(pending[0].signal.aborted).toBe(true)
    await act(async () => pending[1].finish(json(page({ ...initial('Cancelled'), state: { ...initial('Cancelled').state, title: 'Aktuelle Liste' } }))))
    await act(async () => pending[0].finish(json(page(initial()))))
    expect(screen.getByText('Aktuelle Liste')).toBeInTheDocument()
    expect(screen.queryByText('Synthetische Aufgabe')).not.toBeInTheDocument()
  })

  it('zeigt echte Ladefehler und ermöglicht erneuten Abruf', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json({ title: 'Synthetischer Ladefehler' }, 503)).mockResolvedValue(json(page(initial()))))
    render(<CaseFollowUpsPanel />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Synthetischer Ladefehler')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Liste erneut laden' }))
    expect(await screen.findByText('Synthetische Aufgabe')).toBeInTheDocument()
  })

  it('zeigt erwartete Abbrüche im StrictMode nicht als Fehler', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      await new Promise(resolve => setTimeout(resolve, 0)); init?.signal?.throwIfAborted(); return json(page(initial()))
    }))
    render(<StrictMode><CaseFollowUpsPanel /></StrictMode>)
    expect(await screen.findByText('Synthetische Aufgabe')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([false, undefined])('bleibt bei Capability %s ohne Navigation, Bearbeitung und Abruf', async enabled => {
    window.history.replaceState(null, '', '/case-follow-ups')
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => String(input).includes('/auth/me')
      ? json({ id: 'synthetic', username: 'synthetic', displayName: 'Synthetische Person', role: 'Sachbearbeitung', mustChangePassword: false })
      : json({ caseFollowUpsEnabled: enabled }))
    vi.stubGlobal('fetch', fetchMock)
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByText('Wiedervorlagen sind in dieser Umgebung nicht aktiviert.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Wiedervorlagen' })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([path]) => String(path).includes('/api/case-follow-ups'))).toBe(false)
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('trennt Fallwechsel und verwirft verspätete Detailantworten', async () => {
    const pending: { signal: AbortSignal; finish: (value: Response) => void }[] = []
    window.history.replaceState(null, '', `/cases/${caseId}?followUpId=${id}`)
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => String(input).includes(`/case-follow-ups/${id}?`)
      ? new Promise<Response>(finish => pending.push({ signal: init!.signal!, finish })) : json(page(initial()))))
    const view = render(<CaseFollowUpsPanel key={caseId} caseId={caseId} />)
    await waitFor(() => expect(pending).toHaveLength(1))
    view.rerender(<CaseFollowUpsPanel key="anderer-fall" caseId="anderer-fall" />)
    await waitFor(() => expect(pending).toHaveLength(2))
    expect(pending[0].signal.aborted).toBe(true)
    await act(async () => pending[1].finish(json({ ...initial(), state: { ...initial().state, title: 'Anderer Fall', caseId: 'anderer-fall' } }, 200, 1)))
    await act(async () => pending[0].finish(json(initial(), 200, 1)))
    expect(screen.getByRole('heading', { name: 'Anderer Fall' })).toBeInTheDocument()
  })
})
