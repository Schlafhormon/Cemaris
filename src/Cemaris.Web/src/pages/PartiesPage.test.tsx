import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Party } from '../types/personUsageRights'
import { PartiesPage } from './PartiesPage'

const partyId = '60000000-0000-0000-0000-000000000001'
const addressId = '60000000-0000-0000-0000-000000000002'

describe('Fallunabhängige Beteiligtenpflege', () => {
  beforeEach(() => window.history.replaceState(null, '', '/parties'))
  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.replaceState(null, '', '/parties')
  })

  it('lädt den Initialbestand und hält Filter, Seite und Seitengröße in der URL', async () => {
    window.history.replaceState(null, '', '/parties?query=Start&page=2&pageSize=25')
    const requests: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      requests.push(path)
      const parameters = new URL(path, 'http://localhost').searchParams
      const page = Number(parameters.get('page'))
      const pageSize = Number(parameters.get('pageSize'))
      const query = parameters.get('query') ?? ''
      return json(directory([
        { id: partyId, partyType: 'NaturalPerson', displayName: `${query || 'Alle'} Seite ${page}`, currentPrimaryAddress: null },
      ], 50, page, pageSize))
    }))
    const user = userEvent.setup()
    render(<PartiesPage />)

    expect(await screen.findByRole('button', { name: /Start Seite 2/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Beteiligtenbestand nach Name filtern')).toHaveValue('Start')
    expect(window.location.search).toBe('?page=2&pageSize=25&query=Start')

    await user.click(screen.getByRole('button', { name: 'Vorherige Beteiligtenseite' }))
    expect(await screen.findByRole('button', { name: /Start Seite 1/ })).toBeInTheDocument()
    expect(window.location.search).toContain('page=1')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Einträge pro Beteiligtenseite' }), '50')
    await waitFor(() => expect(requests.at(-1)).toContain('pageSize=50'))
    expect(window.location.search).toContain('pageSize=50')

    const filter = screen.getByLabelText('Beteiligtenbestand nach Name filtern')
    await user.clear(filter)
    await user.type(filter, 'Neu')
    expect(requests.at(-1)).not.toContain('query=Neu')
    await user.click(screen.getByRole('button', { name: 'Filter anwenden' }))
    expect(await screen.findByRole('button', { name: /Neu Seite 1/ })).toBeInTheDocument()
    expect(window.location.search).toContain('query=Neu')

    await user.click(screen.getByRole('button', { name: 'Filter löschen' }))
    expect(await screen.findByRole('button', { name: /Alle Seite 1/ })).toBeInTheDocument()
    expect(window.location.search).not.toContain('query=')
  })

  it('unterscheidet leeren Gesamtbestand, leeren Filter und Ladefehler', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(directory([], 0, 1, 10))))
    const user = userEvent.setup()
    const first = render(<PartiesPage />)
    expect(await screen.findByText('Noch keine Beteiligten vorhanden.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Beteiligtenbestand nach Name filtern'), 'Leer')
    await user.click(screen.getByRole('button', { name: 'Filter anwenden' }))
    expect(await screen.findByText('Keine Beteiligten für den angewendeten Namensfilter.')).toBeInTheDocument()
    first.unmount()

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Synthetischer Ladefehler') }))
    render(<PartiesPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Beteiligtenbestand konnte nicht geladen werden')
  })

  it('bricht veraltete Verzeichnisrequests ab und lässt keine ältere Antwort gewinnen', async () => {
    let firstSignal: AbortSignal | undefined
    let resolveFirst: ((response: Response) => void) | undefined
    let directoryCalls = 0
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (!path.includes('/api/parties/directory?')) throw new Error(`Unerwarteter Testaufruf: ${path}`)
      directoryCalls += 1
      if (directoryCalls === 1) {
        firstSignal = init?.signal ?? undefined
        return new Promise<Response>((resolve) => { resolveFirst = resolve })
      }
      return Promise.resolve(json(directory([{ id: partyId, partyType: 'NaturalPerson', displayName: 'Neuer Bestand', currentPrimaryAddress: null }], 1)))
    }))
    const user = userEvent.setup()
    render(<PartiesPage />)
    await user.type(screen.getByLabelText('Beteiligtenbestand nach Name filtern'), 'Neu')
    await user.click(screen.getByRole('button', { name: 'Filter anwenden' }))

    expect(await screen.findByRole('button', { name: /Neuer Bestand/ })).toBeInTheDocument()
    expect(firstSignal?.aborted).toBe(true)
    resolveFirst?.(json(directory([{ id: '60000000-0000-0000-0000-000000000099', partyType: 'Organization', displayName: 'Veralteter Bestand', currentPrimaryAddress: null }], 1)))
    await waitFor(() => expect(screen.queryByText('Veralteter Bestand')).not.toBeInTheDocument())
  })

  it('sucht und zeigt Details sowie Anlagen für natürliche Person und Organisation', async () => {
    const createdTypes: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf', headerName: 'X-Cemaris-CSRF' })
      if (path.includes('/api/parties/directory?')) return json(directory([{ id: partyId, partyType: 'NaturalPerson', displayName: 'Synthetik Bestand', currentPrimaryAddress: 'Testweg 1' }], 1))
      if (path.endsWith(`/api/parties/${partyId}`)) return json(party(), 200, { ETag: '"1"' })
      if (path.endsWith('/api/parties') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body))
        createdTypes.push(body.partyType)
        return json(body.partyType === 'Organization'
          ? party({ id: '60000000-0000-0000-0000-000000000004', partyType: 'Organization', firstName: null, lastName: null, organizationName: 'Synthetik Organisation' })
          : party({ id: '60000000-0000-0000-0000-000000000003', firstName: 'Neue', lastName: 'Person' }), 201, { ETag: '"1"' })
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<PartiesPage />)

    await user.click(await screen.findByRole('button', { name: /Synthetik Bestand/ }))
    expect(await screen.findByRole('heading', { name: 'Synthetik Bestand', level: 4 })).toBeInTheDocument()
    expect(screen.getAllByText(/Natürliche Person/).length).toBeGreaterThan(0)
    expect(screen.getByText('Version 1')).toBeInTheDocument()

    const createForm = screen.getByRole('button', { name: 'Beteiligte Identität anlegen' }).closest('form')!
    await fillAddress(user, createForm)
    await user.type(within(createForm).getByLabelText('Vorname'), 'Neue')
    await user.type(within(createForm).getByLabelText('Nachname'), 'Person')
    await user.click(within(createForm).getByRole('button', { name: 'Beteiligte Identität anlegen' }))
    expect(await screen.findByText('Beteiligte Identität angelegt.')).toBeInTheDocument()

    await waitFor(() => expect(createdTypes).toEqual(['NaturalPerson']))
  })

  it('legt eine Organisation mit typgerechtem Namen an', async () => {
    let requestBody: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf', headerName: 'X-Cemaris-CSRF' })
      if (path.includes('/api/parties/directory?')) return json(directory([], 0))
      if (path.endsWith('/api/parties') && init?.method === 'POST') {
        requestBody = JSON.parse(String(init.body))
        return json(party({ partyType: 'Organization', firstName: null, lastName: null, organizationName: 'Synthetik Organisation' }), 201, { ETag: '"1"' })
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<PartiesPage />)
    const form = screen.getByRole('button', { name: 'Beteiligte Identität anlegen' }).closest('form')!
    await user.selectOptions(within(form).getByLabelText('Art'), 'Organization')
    await user.type(within(form).getByLabelText('Organisationsname'), 'Synthetik Organisation')
    await fillAddress(user, form)
    await user.click(within(form).getByRole('button', { name: 'Beteiligte Identität anlegen' }))

    await waitFor(() => expect(requestBody).toMatchObject({ partyType: 'Organization', firstName: null, lastName: null, organizationName: 'Synthetik Organisation' }))
  })

  it('bricht eine Dublettenanlage ohne Datenverlust ab und wiederholt sie erst nach Bestätigung', async () => {
    let attempts = 0
    const bodies: Array<Record<string, unknown>> = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf', headerName: 'X-Cemaris-CSRF' })
      if (path.includes('/api/parties/directory?')) return json(directory([], 0))
      if (path.endsWith('/api/parties') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body))
        bodies.push(body)
        attempts += 1
        if (!body.confirmPossibleDuplicate) return json({ title: 'Mögliche Dublette', code: 'possible-party-duplicate' }, 409)
        return json(party({ firstName: 'Doppelte', lastName: 'Person' }), 201, { ETag: '"1"' })
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<PartiesPage />)
    const form = screen.getByRole('button', { name: 'Beteiligte Identität anlegen' }).closest('form')!
    await user.type(within(form).getByLabelText('Vorname'), 'Doppelte')
    await user.type(within(form).getByLabelText('Nachname'), 'Person')
    await fillAddress(user, form)
    await user.click(within(form).getByRole('button', { name: 'Beteiligte Identität anlegen' }))
    expect(await within(form).findByText('Mögliche Dublette erkannt')).toBeInTheDocument()
    await user.click(within(form).getByRole('button', { name: 'Anlage abbrechen' }))
    expect(within(form).getByLabelText('Vorname')).toHaveValue('Doppelte')
    expect(attempts).toBe(1)

    await user.click(within(form).getByRole('button', { name: 'Beteiligte Identität anlegen' }))
    await user.click(await within(form).findByRole('button', { name: 'Bewusst trotzdem anlegen' }))
    await waitFor(() => expect(attempts).toBe(3))
    expect(bodies[2].confirmPossibleDuplicate).toBe(true)
  })

  it('normalisiert eine nach Korrektur ungültige Seite und erhält Auswahl sowie Detail', async () => {
    window.history.replaceState(null, '', '/parties?page=2&pageSize=10')
    let corrected = false
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf', headerName: 'X-Cemaris-CSRF' })
      if (path.includes('/api/parties/directory?')) {
        const requestedPage = Number(new URL(path, 'http://localhost').searchParams.get('page'))
        if (corrected && requestedPage === 2) return json(directory([], 9, 2, 10))
        return json(directory([{ id: partyId, partyType: 'NaturalPerson', displayName: corrected ? 'Synthetik Neu' : 'Synthetik Bestand', currentPrimaryAddress: null }], corrected ? 9 : 11, requestedPage, 10))
      }
      if (path.endsWith(`/api/parties/${partyId}`) && !init?.method) return json(party(), 200, { ETag: '"1"' })
      if (path.endsWith(`/api/parties/${partyId}/corrections`) && init?.method === 'POST') {
        corrected = true
        return json(party({ lastName: 'Neu', version: 2 }), 200, { ETag: '"2"' })
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<PartiesPage />)
    await user.click(await screen.findByRole('button', { name: /Synthetik Bestand/ }))
    await user.click(screen.getByText('Namensangaben korrigieren'))
    const form = screen.getByRole('button', { name: 'Namen historisiert korrigieren' }).closest('form')!
    await user.clear(within(form).getByLabelText('Nachname'))
    await user.type(within(form).getByLabelText('Nachname'), 'Neu')
    await user.type(within(form).getByLabelText('Begründung'), 'Synthetische Seitennormalisierung')
    await user.click(within(form).getByRole('button', { name: 'Namen historisiert korrigieren' }))

    await waitFor(() => expect(window.location.search).toContain('page=1'))
    expect(await screen.findByRole('button', { name: /Synthetik Neu/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Synthetik Neu', level: 4 })).toBeInTheDocument()
  })

  it('schreibt Namenskorrektur, Adressanlage und Adresskorrektur mit fortgeschriebenem ETag', async () => {
    const mutationEtags: string[] = []
    let directoryLoads = 0
    const secondAddress = { ...party().addresses[0], id: '60000000-0000-0000-0000-000000000003', street: 'Neuweg', houseNumber: '2', isCurrentPrimary: false }
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'csrf', headerName: 'X-Cemaris-CSRF' })
      if (path.includes('/api/parties/directory?')) { directoryLoads += 1; return json(directory([{ id: partyId, partyType: 'NaturalPerson', displayName: 'Synthetik Bestand', currentPrimaryAddress: 'Testweg 1' }], 1)) }
      if (path.endsWith(`/api/parties/${partyId}`) && !init?.method) return json(party(), 200, { ETag: '"1"' })
      if (init?.method === 'POST') {
        mutationEtags.push(new Headers(init.headers).get('If-Match') ?? '')
        if (path.endsWith('/corrections') && !path.includes('/addresses/')) return json(party({ lastName: 'Korrigiert', version: 2 }), 200, { ETag: '"2"' })
        if (path.endsWith('/addresses')) return json(party({ lastName: 'Korrigiert', version: 3, addresses: [party().addresses[0], secondAddress] }), 200, { ETag: '"3"' })
        if (path.includes(`/addresses/${addressId}/corrections`)) return json(party({ lastName: 'Korrigiert', version: 4, addresses: [{ ...party().addresses[0], houseNumber: '1a' }, secondAddress] }), 200, { ETag: '"4"' })
      }
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))
    const user = userEvent.setup()
    render(<PartiesPage />)
    await selectExistingParty(user)

    await user.click(screen.getByText('Namensangaben korrigieren'))
    const nameForm = screen.getByRole('button', { name: 'Namen historisiert korrigieren' }).closest('form')!
    await user.clear(within(nameForm).getByLabelText('Nachname'))
    await user.type(within(nameForm).getByLabelText('Nachname'), 'Korrigiert')
    await user.type(within(nameForm).getByLabelText('Begründung'), 'Synthetische Korrektur')
    await user.click(within(nameForm).getByRole('button', { name: 'Namen historisiert korrigieren' }))
    expect(await screen.findByText('Version 2')).toBeInTheDocument()

    await user.click(screen.getByText('Adresszeitraum hinzufügen'))
    const addForm = screen.getByRole('button', { name: 'Adresse historisiert ergänzen' }).closest('form')!
    await fillAddress(user, addForm, 'Neuweg', '2')
    await user.type(within(addForm).getByLabelText('Begründung'), 'Synthetischer Umzug')
    await user.click(within(addForm).getByRole('button', { name: 'Adresse historisiert ergänzen' }))
    expect(await screen.findByText('Version 3')).toBeInTheDocument()

    const correctionDisclosure = screen.getByText('Adresse Testweg 1 korrigieren').closest('details')!
    await user.click(within(correctionDisclosure).getByText('Adresse Testweg 1 korrigieren'))
    const correctionForm = within(correctionDisclosure).getByRole('button', { name: 'Adresse historisiert korrigieren' }).closest('form')!
    await user.clear(within(correctionForm).getByLabelText('Hausnummer'))
    await user.type(within(correctionForm).getByLabelText('Hausnummer'), '1a')
    await user.type(within(correctionForm).getByLabelText('Begründung'), 'Synthetischer Erfassungsfehler')
    await user.click(within(correctionForm).getByRole('button', { name: 'Adresse historisiert korrigieren' }))

    await waitFor(() => expect(mutationEtags).toEqual(['"1"', '"2"', '"3"']))
    expect(await screen.findByText('Version 4')).toBeInTheDocument()
    await waitFor(() => expect(directoryLoads).toBeGreaterThanOrEqual(4))
  })
})

async function selectExistingParty(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Synthetik Bestand/ }))
  await screen.findByRole('heading', { name: 'Synthetik Bestand', level: 4 })
}

async function fillAddress(user: ReturnType<typeof userEvent.setup>, form: HTMLElement, street = 'Testweg', houseNumber = '1') {
  await user.type(within(form).getByLabelText('Straße'), street)
  await user.type(within(form).getByLabelText('Hausnummer'), houseNumber)
  await user.type(within(form).getByLabelText('Postleitzahl'), '00000')
  await user.type(within(form).getByLabelText('Ort'), 'Teststadt')
  await user.type(within(form).getByLabelText('Gültig ab'), '2020-01-01')
}

function party(overrides: Partial<Party> = {}): Party {
  return {
    id: partyId,
    partyType: 'NaturalPerson',
    firstName: 'Synthetik',
    lastName: 'Bestand',
    organizationName: null,
    currentPrimaryAddressId: addressId,
    version: 1,
    addresses: [{ id: addressId, street: 'Testweg', houseNumber: '1', postalCode: '00000', city: 'Teststadt', additionalInformation: null, validFromInclusive: '2020-01-01', validUntilExclusive: null, isCurrentPrimary: true }],
    revisions: [{ id: '60000000-0000-0000-0000-000000000009', resultingVersion: 1, mutationType: 'Created', reason: null, occurredAtUtc: '2026-08-18T08:00:00Z', actorDisplayName: 'Synthetische Sachbearbeitung', addresses: [] }],
    ...overrides,
  }
}

function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}

function directory(items: unknown[], totalMatches: number, page = 1, pageSize = 10) {
  return { items, totalMatches, page, pageSize, totalPages: totalMatches === 0 ? 0 : Math.ceil(totalMatches / pageSize) }
}
