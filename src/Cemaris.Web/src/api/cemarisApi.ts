import type { HealthResponse, SystemInformationResponse } from '../types/system'
import type {
  BurialInput,
  BurialProcessInput,
  BurialProcessStatus,
  CaseOverview,
  CaseWithEtag,
  DeceasedPersonInput,
  GraveInput,
  SearchFilters,
  SearchResponse,
} from '../types/cases'
import type {
  CreateAccountInput,
  CurrentAccount,
  LocalAccount,
  UpdateAccountInput,
} from '../types/identity'
import type { CemeteryMasterData } from '../types/cemeteries'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const apiBaseUrl = configuredBaseUrl.replace(/\/$/, '')
let antiforgeryToken: string | undefined
let unauthorizedHandler: (() => void) | undefined

interface ProblemDetails {
  title?: string
  errors?: Record<string, string[]>
  code?: string
  candidates?: PossibleDeceasedDuplicate[]
}

export interface PossibleDeceasedDuplicate {
  id: string
  displayName: string
  birthDate: string | null
  deathDate: string | null
}

async function readProblem(response: Response): Promise<ProblemDetails | undefined> {
  if (!response.headers.get('content-type')?.includes('json')) {
    return undefined
  }

  try {
    return (await response.json()) as ProblemDetails
  } catch {
    return undefined
  }
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    notifySecurityStatus(response.status)
    throw new ApiError(response.status, await readProblem(response))
  }

  return response.json() as Promise<T>
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>
  readonly code?: string
  readonly duplicateCandidates: PossibleDeceasedDuplicate[]

  constructor(status: number, problem?: ProblemDetails) {
    super(problem?.title ?? `API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = problem?.errors ?? {}
    this.code = problem?.code
    this.duplicateCandidates = problem?.candidates ?? []
  }
}

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  unauthorizedHandler = handler
}

function notifySecurityStatus(status: number) {
  if (status === 401) {
    unauthorizedHandler?.()
  } else if (status === 403) {
    window.dispatchEvent(new CustomEvent('cemaris-forbidden'))
  }
}

async function getAntiforgeryToken(): Promise<string> {
  if (antiforgeryToken) {
    return antiforgeryToken
  }

  const response = await fetch(`${apiBaseUrl}/api/auth/csrf`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response))
  }
  const token = (await response.json()) as { requestToken: string }
  antiforgeryToken = token.requestToken
  return antiforgeryToken
}

async function sendJson<T>(path: string, method: string, body?: unknown, etag?: string): Promise<T | undefined> {
  const token = await getAntiforgeryToken()
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Cemaris-CSRF': token,
      ...(etag ? { 'If-Match': etag } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    notifySecurityStatus(response.status)
    throw new ApiError(response.status, await readProblem(response))
  }
  return response.status === 204 ? undefined : response.json() as Promise<T>
}

export function getCurrentAccount(signal: AbortSignal) {
  return getJson<CurrentAccount>('/api/auth/me', signal)
}

export async function login(username: string, password: string) {
  antiforgeryToken = undefined
  return await sendJson<CurrentAccount>(
    '/api/auth/login',
    'POST',
    { username, password },
  ) as CurrentAccount
}

export async function logout() {
  await sendJson('/api/auth/logout', 'POST')
  antiforgeryToken = undefined
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  await sendJson('/api/auth/change-password', 'POST', { currentPassword, newPassword })
  antiforgeryToken = undefined
}

export function listAccounts(signal: AbortSignal) {
  return getJson<LocalAccount[]>('/api/admin/accounts', signal)
}

export async function createAccount(input: CreateAccountInput) {
  return await sendJson<LocalAccount>('/api/admin/accounts', 'POST', input) as LocalAccount
}

export async function updateAccount(id: string, input: UpdateAccountInput) {
  return await sendJson<LocalAccount>(
    `/api/admin/accounts/${encodeURIComponent(id)}`,
    'PUT',
    input,
  ) as LocalAccount
}

export async function setAccountActive(account: LocalAccount, isActive: boolean) {
  return await sendJson<LocalAccount>(
    `/api/admin/accounts/${encodeURIComponent(account.id)}/active`,
    'PUT',
    { isActive, version: account.version },
  ) as LocalAccount
}

export async function resetAccountPassword(account: LocalAccount, temporaryPassword: string) {
  return await sendJson<LocalAccount>(
    `/api/admin/accounts/${encodeURIComponent(account.id)}/reset-password`,
    'POST',
    { temporaryPassword, version: account.version },
  ) as LocalAccount
}

export function getHealth(signal: AbortSignal) {
  return getJson<HealthResponse>('/health', signal)
}

export function getSystemInformation(signal: AbortSignal) {
  return getJson<SystemInformationResponse>('/api/system/info', signal)
}

export function getCemeteryMasterData(signal: AbortSignal, includeInactive = true) {
  return getJson<CemeteryMasterData>(`/api/master-data/cemeteries?includeInactive=${includeInactive}`, signal)
}

export function getBurialProcessMasterData(signal: AbortSignal) {
  return getJson<CemeteryMasterData>('/api/burial-process/master-data', signal)
}

export async function createMasterData<T>(route: string, input: unknown) {
  return await sendJson<T>(`/api/master-data/${route}`, 'POST', input) as T
}

export async function updateMasterData<T>(route: string, id: string, version: number, input: unknown) {
  return await sendJson<T>(`/api/master-data/${route}/${encodeURIComponent(id)}`, 'PUT', input, `"${version}"`) as T
}

export async function deleteMasterData(kind: string, id: string, version: number) {
  await sendJson(`/api/master-data/${kind}/${encodeURIComponent(id)}`, 'DELETE', undefined, `"${version}"`)
}

export function searchCases(filters: SearchFilters, signal: AbortSignal) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    const normalizedValue = value.trim()
    if (normalizedValue) {
      query.set(key, normalizedValue)
    }
  }

  const queryString = query.toString()
  return getJson<SearchResponse>(
    `/api/search${queryString ? `?${queryString}` : ''}`,
    signal,
  )
}

export function getCaseDetails(id: string, signal: AbortSignal) {
  return requestCase(`/api/cases/${encodeURIComponent(id)}`, { signal })
}

async function requestCase(path: string, init: RequestInit): Promise<CaseWithEtag> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (init.method && init.method !== 'GET') {
    headers.set('X-Cemaris-CSRF', await getAntiforgeryToken())
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    notifySecurityStatus(response.status)
    throw new ApiError(response.status, await readProblem(response))
  }

  const etag = response.headers.get('ETag')
  if (!etag) {
    throw new Error('Die API-Antwort enthält keinen Fallversions-ETag.')
  }

  return {
    caseOverview: (await response.json()) as CaseOverview,
    etag,
    location: response.headers.get('Location') ?? undefined,
  }
}

function mutationHeaders(etag: string) {
  return { 'If-Match': etag }
}

export function createCase(input: GraveInput, signal?: AbortSignal) {
  return requestCase('/api/cases', {
    method: 'POST',
    body: JSON.stringify(input),
    signal,
  })
}

export function changeGrave(
  caseId: string,
  etag: string,
  input: GraveInput,
  signal?: AbortSignal,
) {
  return requestCase(`/api/cases/${encodeURIComponent(caseId)}/grave`, {
    method: 'PUT',
    headers: mutationHeaders(etag),
    body: JSON.stringify(input),
    signal,
  })
}

export function addDeceasedPerson(
  caseId: string,
  etag: string,
  input: DeceasedPersonInput,
  confirmPossibleDuplicate = false,
  signal?: AbortSignal,
) {
  return requestCase(`/api/cases/${encodeURIComponent(caseId)}/deceased-persons`, {
    method: 'POST',
    headers: mutationHeaders(etag),
    body: JSON.stringify({ ...input, confirmPossibleDuplicate }),
    signal,
  })
}

export function createBurialProcess(caseId: string, etag: string, input: BurialProcessInput) {
  return requestCase(`/api/cases/${encodeURIComponent(caseId)}/burials`, {
    method: 'POST', headers: mutationHeaders(etag),
    body: JSON.stringify({ deceasedPersonId: input.deceasedPersonId, graveSiteId: input.graveSiteId, planningDate: input.planningDate || null }),
  })
}

export function changeBurialProcess(caseId: string, burialId: string, etag: string, input: BurialProcessInput) {
  return requestCase(`/api/cases/${encodeURIComponent(caseId)}/burials/${encodeURIComponent(burialId)}`, {
    method: 'PUT', headers: mutationHeaders(etag),
    body: JSON.stringify({ ...input, planningDate: input.planningDate || null, actualBurialDate: input.actualBurialDate || null }),
  })
}

export function transitionBurialProcess(caseId: string, burialId: string, etag: string, targetStatus: BurialProcessStatus, input: BurialProcessInput) {
  return requestCase(`/api/cases/${encodeURIComponent(caseId)}/burials/${encodeURIComponent(burialId)}/transitions`, {
    method: 'POST', headers: mutationHeaders(etag),
    body: JSON.stringify({ targetStatus, planningDate: input.planningDate || null, actualBurialDate: input.actualBurialDate || null }),
  })
}

export function adoptLegacyBurial(caseId: string, burialId: string, etag: string, input: BurialProcessInput, targetStatus: BurialProcessStatus) {
  return requestCase(`/api/cases/${encodeURIComponent(caseId)}/burials/${encodeURIComponent(burialId)}/adopt`, {
    method: 'POST', headers: mutationHeaders(etag),
    body: JSON.stringify({ ...input, targetStatus, planningDate: input.planningDate || null, actualBurialDate: input.actualBurialDate || null }),
  })
}

export function changeDeceasedPerson(
  caseId: string,
  personId: string,
  etag: string,
  input: DeceasedPersonInput,
  signal?: AbortSignal,
) {
  return requestCase(
    `/api/cases/${encodeURIComponent(caseId)}/deceased-persons/${encodeURIComponent(personId)}`,
    {
      method: 'PUT',
      headers: mutationHeaders(etag),
      body: JSON.stringify(input),
      signal,
    },
  )
}

export function addBurial(
  caseId: string,
  etag: string,
  input: BurialInput,
  signal?: AbortSignal,
) {
  return requestCase(`/api/cases/${encodeURIComponent(caseId)}/burials`, {
    method: 'POST',
    headers: mutationHeaders(etag),
    body: JSON.stringify({
      deceasedPersonId: input.deceasedPersonId || null,
      burialDate: input.burialDate || null,
    }),
    signal,
  })
}

export function changeBurial(
  caseId: string,
  burialId: string,
  etag: string,
  input: BurialInput,
  signal?: AbortSignal,
) {
  return requestCase(
    `/api/cases/${encodeURIComponent(caseId)}/burials/${encodeURIComponent(burialId)}`,
    {
      method: 'PUT',
      headers: mutationHeaders(etag),
      body: JSON.stringify({
        deceasedPersonId: input.deceasedPersonId || null,
        burialDate: input.burialDate || null,
      }),
      signal,
    },
  )
}
