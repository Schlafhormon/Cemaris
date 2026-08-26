import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  changeOwnPassword,
  createCase,
  createMasterData,
  createNoticeDraft,
  createParty,
  createUsageRight,
  login,
  logout,
  setUnauthorizedHandler,
} from './cemarisApi'

type ConfirmedRole = 'Sachbearbeitung' | 'Administration'

const roles: ConfirmedRole[] = ['Sachbearbeitung', 'Administration']
const mutationScenarios = [
  ['Beteiligte', () => createParty({ partyType: 'Organization', organizationName: 'Synthetische CSRF-Testorganisation' })],
  ['Fallbearbeitung', () => createCase(graveInput('Synthetischer CSRF-Testfriedhof'))],
  ['Friedhofsstammdaten', () => createMasterData('cemeteries', { name: 'Synthetischer CSRF-Testfriedhof' })],
  ['Nutzungsrechte', () => createUsageRight({ sourceReference: 'SYN-CSRF-TEST' })],
  ['Bescheidentwürfe', () => createNoticeDraft('70000000-0000-0000-0000-000000000010', { payerSelectionConfirmed: true })],
] as const

describe('CSRF-Tokenlebenszyklus bei Identitätswechseln', () => {
  afterEach(() => {
    setUnauthorizedHandler(undefined)
    vi.unstubAllGlobals()
  })

  it.each(roles.flatMap(role => mutationScenarios.map(([area, mutate]) => [role, area, mutate] as const)))(
    'ruft für %s vor der ersten %s-Mutation nach dem Login einen frischen Nachweis ab',
    async (role, _area, mutate) => {
      const calls = installSuccessfulSessionFetch(role)

      await login(`synthetic-${role.toLowerCase()}`, 'Synthetisches-Testpasswort-2026')
      await mutate()

      expect(calls.csrfTokens).toEqual(['synthetic-csrf-1', 'synthetic-csrf-2'])
      expect(calls.loginToken).toBe('synthetic-csrf-1')
      expect(calls.mutationToken).toBe('synthetic-csrf-2')
    },
  )

  it('behält nach einem fehlgeschlagenen Login den anonymen Zustand und die 401-Behandlung bei', async () => {
    const unauthorized = vi.fn()
    setUnauthorizedHandler(unauthorized)
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'synthetic-anonymous-csrf' })
      if (path.endsWith('/api/auth/login')) return json({ title: 'Die Anmeldung ist fehlgeschlagen.' }, 401)
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))

    await expect(login('synthetic-unknown', 'Synthetisches-Falschpasswort-2026'))
      .rejects.toMatchObject({ status: 401 })
    expect(unauthorized).toHaveBeenCalledOnce()
  })

  it('verwirft den authentifizierten Nachweis nach erfolgreichem Logout', async () => {
    const calls = installIdentityChangeFetch('/api/auth/logout')

    await login('synthetic-logout', 'Synthetisches-Testpasswort-2026')
    await createCase(graveInput('Synthetischer CSRF-Testfriedhof'))
    await logout()
    await createCase(graveInput('Synthetischer CSRF-Testfriedhof nach Logout'))

    expect(calls.csrfTokens).toEqual(['synthetic-csrf-1', 'synthetic-csrf-2', 'synthetic-csrf-3'])
    expect(calls.identityChangeToken).toBe('synthetic-csrf-2')
    expect(calls.lastMutationToken).toBe('synthetic-csrf-3')
  })

  it('verwirft den authentifizierten Nachweis nach erfolgreichem eigenen Passwortwechsel', async () => {
    const calls = installIdentityChangeFetch('/api/auth/change-password')

    await login('synthetic-password', 'Synthetisches-Testpasswort-2026')
    await createCase(graveInput('Synthetischer CSRF-Testfriedhof'))
    await changeOwnPassword('Synthetisches-Testpasswort-2026', 'Synthetisches-Neupasswort-2026')
    await createCase(graveInput('Synthetischer CSRF-Testfriedhof nach Passwortwechsel'))

    expect(calls.csrfTokens).toEqual(['synthetic-csrf-1', 'synthetic-csrf-2', 'synthetic-csrf-3'])
    expect(calls.identityChangeToken).toBe('synthetic-csrf-2')
    expect(calls.lastMutationToken).toBe('synthetic-csrf-3')
  })

  it('meldet 403 weiterhin getrennt von einer abgelaufenen Sitzung', async () => {
    const unauthorized = vi.fn()
    const forbidden = vi.fn()
    setUnauthorizedHandler(unauthorized)
    window.addEventListener('cemaris-forbidden', forbidden, { once: true })
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input)
      if (path.endsWith('/api/auth/csrf')) return json({ requestToken: 'synthetic-forbidden-csrf' })
      if (path.endsWith('/api/master-data/cemeteries')) return json({ title: 'Nicht erlaubt.' }, 403)
      throw new Error(`Unerwarteter Testaufruf: ${path}`)
    }))

    await expect(createMasterData('cemeteries', { name: 'Synthetischer Sperrtest' }))
      .rejects.toMatchObject({ status: 403 })
    expect(forbidden).toHaveBeenCalledOnce()
    expect(unauthorized).not.toHaveBeenCalled()
  })
})

function installSuccessfulSessionFetch(role: ConfirmedRole) {
  const calls = { csrfTokens: [] as string[], loginToken: '', mutationToken: '' }
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input)
    if (path.endsWith('/api/auth/csrf')) {
      const token = `synthetic-csrf-${calls.csrfTokens.length + 1}`
      calls.csrfTokens.push(token)
      return json({ requestToken: token })
    }
    if (path.endsWith('/api/auth/login')) {
      calls.loginToken = requestToken(init)
      return json(currentAccount(role))
    }
    calls.mutationToken = requestToken(init)
    return json({}, 201, { ETag: '"1"', Location: '/api/cases/70000000-0000-0000-0000-000000000001' })
  }))
  return calls
}

function installIdentityChangeFetch(identityChangePath: string) {
  const calls = { csrfTokens: [] as string[], identityChangeToken: '', lastMutationToken: '' }
  let mutationCount = 0
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input)
    if (path.endsWith('/api/auth/csrf')) {
      const token = `synthetic-csrf-${calls.csrfTokens.length + 1}`
      calls.csrfTokens.push(token)
      return json({ requestToken: token })
    }
    if (path.endsWith('/api/auth/login')) return json(currentAccount('Sachbearbeitung'))
    if (path.endsWith(identityChangePath)) {
      calls.identityChangeToken = requestToken(init)
      return new Response(null, { status: 204 })
    }
    mutationCount += 1
    if (mutationCount === 2) calls.lastMutationToken = requestToken(init)
    return json({}, 201, { ETag: '"1"' })
  }))
  return calls
}

function currentAccount(role: ConfirmedRole) {
  return {
    id: role === 'Administration'
      ? '70000000-0000-0000-0000-000000000001'
      : '70000000-0000-0000-0000-000000000002',
    username: `synthetic-${role.toLowerCase()}`,
    displayName: `Synthetische ${role}`,
    role,
    mustChangePassword: false,
  }
}

function requestToken(init?: RequestInit) {
  return new Headers(init?.headers).get('X-Cemaris-CSRF') ?? ''
}

function graveInput(cemetery: string) {
  return { cemetery, field: 'Synthetisches CSRF-Testfeld', graveNumber: 'SYN-CSRF-1' }
}

function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}
