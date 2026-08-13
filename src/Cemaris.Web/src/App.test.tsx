import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { CaseEditPage } from './pages/CaseEditPage'
import { CaseDetailsPage } from './pages/CaseDetailsPage'
import { NewCasePage } from './pages/NewCasePage'
import type { CaseOverview } from './types/cases'

const emptySearch = {
  items: [],
  totalMatches: 0,
  limit: 10,
  isTruncated: false,
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

function caseOverview(overrides: Partial<CaseOverview> = {}): CaseOverview {
  return {
    id: '00000000-0000-0000-0000-000000009001',
    isSynthetic: true,
    version: 1,
    grave: {
      cemetery: 'Synthetischer UI-Testfriedhof',
      field: 'Testfeld UI',
      graveNumber: 'SYN-UI-1',
    },
    deceasedPersons: [],
    burials: [],
    usageRights: [],
    entitledPersons: [],
    notices: [],
    dataQualityNotes: ['Ausschließlich synthetische UI-Testdaten.'],
    lastChange: {
      actorDisplayName: 'Synthetische Development-Sachbearbeitung',
      changedAtUtc: '2026-08-13T07:30:00Z',
    },
    ...overrides,
  }
}

describe('Capability-Grenze', () => {
  it('zeigt Bearbeitung nur bei aktiver Server-Capability', async () => {
    window.history.replaceState(null, '', '/search')
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/api/system/info')) {
        return jsonResponse({
          name: 'Cemaris',
          subtitle: 'Test',
          status: 'Test',
          productionReady: false,
          caseEditingEnabled: false,
          version: '1.0.0',
        })
      }
      if (path.endsWith('/api/search')) {
        return jsonResponse(emptySearch)
      }
      return jsonResponse({ service: 'Cemaris.Api', status: 'Healthy' })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    await screen.findByText('Keine Treffer für die gesetzten Filter.')
    expect(screen.queryByRole('link', { name: 'Neue Fallakte' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Synthetische Fallakte anlegen' })).not.toBeInTheDocument()
  })

  it('zeigt Navigation und Anlageweg bei aktiver Server-Capability', async () => {
    window.history.replaceState(null, '', '/search')
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/api/system/info')) {
        return jsonResponse({
          name: 'Cemaris',
          subtitle: 'Test',
          status: 'Test',
          productionReady: false,
          caseEditingEnabled: true,
          version: '1.0.0',
        })
      }
      if (path.endsWith('/api/search')) {
        return jsonResponse(emptySearch)
      }
      return jsonResponse({ service: 'Cemaris.Api', status: 'Healthy' })
    }))

    render(<App />)

    expect(await screen.findByRole('link', { name: 'Neue Fallakte' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Synthetische Fallakte anlegen' })).toBeInTheDocument()
  })
})

describe('Schreibformulare', () => {
  it('legt eine Fallakte an und wechselt ohne Vollseitenneustart in die Bearbeitung', async () => {
    window.history.replaceState(null, '', '/cases/new')
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(
      caseOverview(),
      201,
      { ETag: '"1"', Location: '/api/cases/00000000-0000-0000-0000-000000009001' },
    )))

    render(<NewCasePage />)
    await user.type(screen.getByRole('textbox', { name: /Friedhof/ }), 'Synthetischer UI-Testfriedhof')
    await user.type(screen.getByRole('textbox', { name: 'Feld' }), 'Testfeld UI')
    await user.click(screen.getByRole('button', { name: 'Fallakte anlegen' }))

    await waitFor(() => expect(window.location.pathname).toBe(
      '/cases/00000000-0000-0000-0000-000000009001/edit',
    ))
  })

  it('zeigt Servervalidierung feldbezogen und fokussiert das erste Fehlerfeld', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      title: 'Die Fallaktendaten sind ungültig.',
      errors: { cemetery: ['Dieses Feld ist erforderlich.'] },
    }, 400)))

    render(<NewCasePage />)
    await user.click(screen.getByRole('button', { name: 'Fallakte anlegen' }))

    expect(await screen.findByText('Dieses Feld ist erforderlich.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Friedhof/ })).toHaveFocus()
  })

  it('erklärt einen Versionskonflikt und behält den lokalen Formularstand', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (!init?.method || init.method === 'GET') {
        return jsonResponse(caseOverview(), 200, { ETag: '"1"' })
      }
      return jsonResponse({ title: 'Die Fallakte wurde zwischenzeitlich geändert.' }, 412)
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<CaseEditPage caseId="00000000-0000-0000-0000-000000009001" />)
    const cemetery = await screen.findByRole('textbox', { name: /Friedhof/ })
    await user.clear(cemetery)
    await user.type(cemetery, 'Lokaler, noch nicht gespeicherter Stand')
    await user.click(screen.getByRole('button', { name: 'Grabstellenbezug speichern' }))

    expect(await screen.findByText('Die Fallakte wurde zwischenzeitlich geändert.')).toBeInTheDocument()
    expect(cemetery).toHaveValue('Lokaler, noch nicht gespeicherter Stand')
    expect(screen.getByRole('button', { name: 'Aktuellen Serverstand laden' })).toBeInTheDocument()
  })
})

describe('Letzte Änderungszuordnung', () => {
  it('zeigt Akteur und lokal formatierten Zeitpunkt in der Detailansicht', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(
      caseOverview(),
      200,
      { ETag: '"1"' },
    )))

    render(<CaseDetailsPage caseId="00000000-0000-0000-0000-000000009001" />)

    expect(await screen.findByText(
      /Zuletzt geändert durch Synthetische Development-Sachbearbeitung am/,
    )).toBeInTheDocument()
  })

  it('zeigt bei migrierten Altzeilen in der Bearbeitung einen neutralen Hinweis', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(
      caseOverview({ lastChange: null }),
      200,
      { ETag: '"1"' },
    )))

    render(<CaseEditPage caseId="00000000-0000-0000-0000-000000009001" />)

    expect(await screen.findByText(
      'Für diese Fallakte liegen noch keine Angaben zur letzten Änderung vor.',
    )).toBeInTheDocument()
  })
})
