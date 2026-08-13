import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { CaseEditPage } from './pages/CaseEditPage'
import { CaseDetailsPage } from './pages/CaseDetailsPage'
import { NewCasePage } from './pages/NewCasePage'
import type { CaseOverview } from './types/cases'
import { AuthProvider } from './auth/AuthContext'

const emptySearch = {
  items: [],
  totalMatches: 0,
  limit: 10,
  isTruncated: false,
}

const emptyMasterData = { cemeteries: [], areas: [], fields: [], rows: [], graveTypes: [], cemeteryGraveTypes: [], graveSites: [] }
const masterData = {
  ...emptyMasterData,
  graveSites: [{ id: '00000000-0000-0000-0000-000000009101', cemeteryId: 'c', areaId: null, fieldId: null, rowId: null, graveTypeId: 'g', graveNumber: 'SYN-UI-1', status: 'Available', isBlocked: false, blockNote: null, targetCapacity: null, note: null, isActive: true, version: 1, cemeteryName: 'Synthetischer UI-Testfriedhof', areaName: null, fieldName: null, rowName: null, graveTypeName: 'Synthetische UI-Grabart' }],
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

const currentAccount = {
  id: '10000000-0000-0000-0000-000000000001',
  username: 'test-admin',
  displayName: 'Synthetische Testadministration',
  role: 'Administration',
  mustChangePassword: false,
}

describe('Lokale Anmeldung und Sitzung', () => {
  it('führt anonyme Benutzer über CSRF-geschützte Anmeldung in die Anwendung', async () => {
    window.history.replaceState(null, '', '/')
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/auth/me')) {
        return jsonResponse({ title: 'Nicht angemeldet' }, 401)
      }
      if (path.endsWith('/api/auth/csrf')) {
        return jsonResponse({ requestToken: 'csrf-login-token', headerName: 'X-Cemaris-CSRF' })
      }
      if (path.endsWith('/api/auth/login')) {
        return jsonResponse(currentAccount)
      }
      if (path.endsWith('/api/system/info')) {
        return jsonResponse({ caseEditingEnabled: false })
      }
      return jsonResponse({ service: 'Cemaris.Api', status: 'Healthy' })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><App /></AuthProvider>)
    await user.type(await screen.findByRole('textbox', { name: 'Benutzername' }), 'test-admin')
    await user.type(screen.getByLabelText('Passwort'), 'Synthetisch-Admin-2026')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(await screen.findByText('Synthetische Testadministration')).toBeInTheDocument()
    const loginCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith('/api/auth/login'))
    expect(loginCall?.[1]).toMatchObject({ credentials: 'include' })
    expect(new Headers(loginCall?.[1]?.headers).get('X-Cemaris-CSRF')).toBe('csrf-login-token')
  })

  it('sperrt Fachnavigation bis zum erzwungenen Passwortwechsel', async () => {
    window.history.replaceState(null, '', '/search')
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/api/auth/me')) {
        return jsonResponse({ ...currentAccount, mustChangePassword: true })
      }
      if (path.endsWith('/api/system/info')) {
        return jsonResponse({ caseEditingEnabled: true })
      }
      return jsonResponse({ service: 'Cemaris.Api', status: 'Healthy' })
    }))

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('heading', { name: 'Passwortwechsel erforderlich' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Fall- und Grabstellensuche' })).not.toBeInTheDocument()
  })
})

describe('Capability-Grenze', () => {
  it('zeigt Bearbeitung nur bei aktiver Server-Capability', async () => {
    window.history.replaceState(null, '', '/search')
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/api/auth/me')) {
        return jsonResponse(currentAccount)
      }
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

    render(<AuthProvider><App /></AuthProvider>)

    await screen.findByText('Keine Treffer für die gesetzten Filter.')
    expect(screen.queryByRole('link', { name: 'Neue Fallakte' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Synthetische Fallakte anlegen' })).not.toBeInTheDocument()
  })

  it('zeigt Navigation und Anlageweg bei aktiver Server-Capability', async () => {
    window.history.replaceState(null, '', '/search')
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/api/auth/me')) {
        return jsonResponse(currentAccount)
      }
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

    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('link', { name: 'Neue Fallakte' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Synthetische Fallakte anlegen' })).toBeInTheDocument()
  })
})

describe('Schreibformulare', () => {
  it('legt eine Fallakte an und wechselt ohne Vollseitenneustart in die Bearbeitung', async () => {
    window.history.replaceState(null, '', '/cases/new')
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.includes('/api/master-data/cemeteries')) return jsonResponse(masterData)
      if (path.endsWith('/api/auth/csrf')) return jsonResponse({ requestToken: 'csrf-test-token', headerName: 'X-Cemaris-CSRF' })
      return jsonResponse(caseOverview(), 201, { ETag: '"1"', Location: '/api/cases/00000000-0000-0000-0000-000000009001' })
    }))

    render(<NewCasePage cemeteryMasterDataEditingEnabled />)
    await user.selectOptions(await screen.findByRole('combobox', { name: /Kanonische Grabstelle/ }), '00000000-0000-0000-0000-000000009101')
    await user.click(screen.getByRole('button', { name: 'Fallakte anlegen' }))

    await waitFor(() => expect(window.location.pathname).toBe(
      '/cases/00000000-0000-0000-0000-000000009001/edit',
    ))
  })

  it('zeigt Servervalidierung feldbezogen und fokussiert das erste Fehlerfeld', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.includes('/api/master-data/cemeteries')) return jsonResponse(masterData)
      if (path.endsWith('/api/auth/csrf')) return jsonResponse({ requestToken: 'csrf-test-token', headerName: 'X-Cemaris-CSRF' })
      return jsonResponse({ title: 'Die Fallaktendaten sind ungültig.', errors: { cemetery: ['Dieses Feld ist erforderlich.'] } }, 400)
    }))

    render(<NewCasePage cemeteryMasterDataEditingEnabled />)
    await user.selectOptions(await screen.findByRole('combobox', { name: /Kanonische Grabstelle/ }), '00000000-0000-0000-0000-000000009101')
    await user.click(screen.getByRole('button', { name: 'Fallakte anlegen' }))

    expect(await screen.findByText('Dieses Feld ist erforderlich.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Friedhof/ })).toHaveFocus()
  })

  it('erklärt einen Versionskonflikt und behält den lokalen Formularstand', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (String(_input).endsWith('/api/auth/csrf')) {
        return jsonResponse({ requestToken: 'csrf-test-token', headerName: 'X-Cemaris-CSRF' })
      }
      if (String(_input).includes('/api/master-data/cemeteries')) return jsonResponse(emptyMasterData)
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

  it('führt einen Beisetzungsentwurf über den primären Prozessschritt weiter', async () => {
    const user = userEvent.setup()
    const personId = '00000000-0000-0000-0000-000000009201'
    const burialId = '00000000-0000-0000-0000-000000009301'
    const siteId = '00000000-0000-0000-0000-000000009101'
    const processData = {
      cemeteries: [{ id: 'c', name: 'Synthetischer UI-Testfriedhof', code: null, address: null, note: null, isActive: true, version: 1 }],
      areas: [], fields: [], rows: [],
      graveTypes: [{ id: 'g', name: 'Synthetische UI-Grabart', code: null, burialForm: 'Mixed', note: null, isActive: true, version: 1 }],
      cemeteryGraveTypes: [{ id: 'a', cemeteryId: 'c', graveTypeId: 'g', isActive: true, version: 1 }],
      graveSites: masterData.graveSites,
    }
    const draftCase = caseOverview({
      deceasedPersons: [{ id: personId, firstName: 'Synthetische', lastName: 'Prozessperson', birthDate: '1950-01-01', deathDate: '2026-01-01' }],
      burials: [{ id: burialId, deceasedPersonId: personId, burialDate: null, graveSiteId: siteId, status: 'Draft', planningDate: null }],
    })
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return jsonResponse({ requestToken: 'csrf-process-token', headerName: 'X-Cemaris-CSRF' })
      if (path.endsWith('/api/burial-process/master-data')) return jsonResponse(processData)
      if (path.endsWith('/transitions') && init?.method === 'POST') {
        return jsonResponse({ ...draftCase, version: 2, burials: [{ ...draftCase.burials[0], status: 'Planned', planningDate: '2026-08-14' }] }, 200, { ETag: '"2"' })
      }
      return jsonResponse(draftCase, 200, { ETag: '"1"' })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<CaseEditPage caseId={draftCase.id} caseEditingEnabled={false} burialProcessEditingEnabled />)
    const planningDate = (await screen.findAllByLabelText(/Planungstag/))[0]
    await user.type(planningDate, '2026-08-14')
    await user.click(screen.getByRole('button', { name: 'Weiter zu Geplant' }))

    expect(await screen.findByText('Änderung gespeichert. Fallversion 2.')).toBeInTheDocument()
    const transitionCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith('/transitions'))
    expect(JSON.parse(String(transitionCall?.[1]?.body))).toMatchObject({ targetStatus: 'Planned', planningDate: '2026-08-14' })
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
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).includes('/api/master-data/cemeteries')
      ? jsonResponse(emptyMasterData)
      : jsonResponse(caseOverview({ lastChange: null }), 200, { ETag: '"1"' })))

    render(<CaseEditPage caseId="00000000-0000-0000-0000-000000009001" />)

    expect(await screen.findByText(
      'Für diese Fallakte liegen noch keine Angaben zur letzten Änderung vor.',
    )).toBeInTheDocument()
  })
})
