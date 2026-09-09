import type { HealthResponse, SystemInformationResponse } from '../types/system'
import type { CaseFollowUp, CaseFollowUpAction, CaseFollowUpInput, CaseFollowUpPage } from '../types/caseFollowUps'
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
import type { Party, PartyDirectoryPage, PartySearchItem, StartRule, UsageRight, UsageRightListItem, UsageRightPage, Versioned } from '../types/personUsageRights'
import type { LegalBasisVersion, NoticeDraft, NoticeDraftListItem, NoticeGenerationFormat, NoticeNumberConfiguration } from '../types/noticeDrafts'

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

async function getVersioned<T>(path: string, signal?: AbortSignal): Promise<Versioned<T> | null> {
  const response = await fetch(`${apiBaseUrl}${path}`, { credentials: 'include', headers: { Accept: 'application/json' }, signal })
  if (response.status === 204) return null
  if (!response.ok) { notifySecurityStatus(response.status); throw new ApiError(response.status, await readProblem(response)) }
  const etag = response.headers.get('ETag')
  if (!etag) throw new Error('Die API-Antwort enthält keinen starken ETag.')
  return { value: await response.json() as T, etag }
}

async function sendVersioned<T>(path: string, method: string, body: unknown, etag?: string): Promise<Versioned<T>> {
  const token = await getAntiforgeryToken()
  const response = await fetch(`${apiBaseUrl}${path}`, { method, credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Cemaris-CSRF': token, ...(etag ? { 'If-Match': etag } : {}) }, body: JSON.stringify(body) })
  if (!response.ok) { notifySecurityStatus(response.status); throw new ApiError(response.status, await readProblem(response)) }
  const nextEtag = response.headers.get('ETag')
  if (!nextEtag) throw new Error('Die API-Antwort enthält keinen starken ETag.')
  return { value: await response.json() as T, etag: nextEtag }
}

export function searchParties(query: string, signal: AbortSignal) { return getJson<PartySearchItem[]>(`/api/parties?query=${encodeURIComponent(query)}`, signal) }
export function getPartyDirectory(query: string, page: number, pageSize: number, signal: AbortSignal) {
  const parameters = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  const normalizedQuery = query.trim()
  if (normalizedQuery) parameters.set('query', normalizedQuery)
  return getJson<PartyDirectoryPage>(`/api/parties/directory?${parameters.toString()}`, signal)
}
export function getParty(id: string, signal?: AbortSignal) { return getVersioned<Party>(`/api/parties/${encodeURIComponent(id)}`, signal) }
export function createParty(input: unknown) { return sendVersioned<Party>('/api/parties', 'POST', input) }
export function correctParty(id: string, etag: string, input: unknown) { return sendVersioned<Party>(`/api/parties/${encodeURIComponent(id)}/corrections`, 'POST', input, etag) }
export function addPartyAddress(id: string, etag: string, input: unknown) { return sendVersioned<Party>(`/api/parties/${encodeURIComponent(id)}/addresses`, 'POST', input, etag) }
export function correctPartyAddress(id: string, addressId: string, etag: string, input: unknown) { return sendVersioned<Party>(`/api/parties/${encodeURIComponent(id)}/addresses/${encodeURIComponent(addressId)}/corrections`, 'POST', input, etag) }
export function getUsageRightByGraveSite(id: string, signal?: AbortSignal) { return getVersioned<UsageRight>(`/api/grave-sites/${encodeURIComponent(id)}/usage-rights`, signal) }
export function createUsageRight(input: unknown) { return sendVersioned<UsageRight>('/api/usage-rights', 'POST', input) }
export function transferUsageRight(id: string, etag: string, input: unknown) { return sendVersioned<UsageRight>(`/api/usage-rights/${encodeURIComponent(id)}/transfers`, 'POST', input, etag) }
export function extendUsageRight(id: string, etag: string, input: unknown) { return sendVersioned<UsageRight>(`/api/usage-rights/${encodeURIComponent(id)}/extensions`, 'POST', input, etag) }
export function correctUsageRight(id: string, etag: string, input: unknown) { return sendVersioned<UsageRight>(`/api/usage-rights/${encodeURIComponent(id)}/corrections`, 'POST', input, etag) }
export function getUsageRightStartRules(signal: AbortSignal) { return getJson<StartRule[]>('/api/program-configuration/usage-right-start-rules', signal) }
export function createUsageRightStartRule(input: unknown) { return sendVersioned<StartRule>('/api/program-configuration/usage-right-start-rules', 'POST', input) }
export function updateUsageRightStartRule(id: string, etag: string, input: unknown) { return sendVersioned<StartRule>(`/api/program-configuration/usage-right-start-rules/${encodeURIComponent(id)}`, 'PUT', input, etag) }
export function getNoticeDrafts(caseId: string, signal: AbortSignal) { return getJson<NoticeDraftListItem[]>(`/api/cases/${encodeURIComponent(caseId)}/notice-drafts`, signal) }
export function getCaseFollowUps(caseId: string | undefined, query: URLSearchParams, signal: AbortSignal) {
  const path = caseId ? `/api/cases/${encodeURIComponent(caseId)}/follow-ups` : '/api/case-follow-ups'
  return getJson<CaseFollowUpPage>(`${path}?${query}`, signal)
}
export function getCaseFollowUp(caseId: string, id: string, signal: AbortSignal) {
  return getVersioned<CaseFollowUp>(`/api/case-follow-ups/${encodeURIComponent(id)}?caseId=${encodeURIComponent(caseId)}`, signal)
}
export function createCaseFollowUp(caseId: string, input: CaseFollowUpInput) {
  return sendVersioned<CaseFollowUp>(`/api/cases/${encodeURIComponent(caseId)}/follow-ups`, 'POST', input)
}
export function changeCaseFollowUp(caseId: string, id: string, etag: string, action: CaseFollowUpAction, input: CaseFollowUpInput & { reason: string }) {
  return sendVersioned<CaseFollowUp>(`/api/case-follow-ups/${encodeURIComponent(id)}${action === 'change' ? '' : `/${action}`}?caseId=${encodeURIComponent(caseId)}`,
    action === 'change' ? 'PUT' : 'POST', action === 'change' ? input : { reason: input.reason }, etag)
}
export function getNoticeDraft(id: string, signal?: AbortSignal) { return getVersioned<NoticeDraft>(`/api/notice-drafts/${encodeURIComponent(id)}`, signal) }
export function createNoticeDraft(caseId: string, input: unknown) { return sendVersioned<NoticeDraft>(`/api/cases/${encodeURIComponent(caseId)}/notice-drafts`, 'POST', input) }
export function correctNoticeDraft(id: string, etag: string, input: unknown) { return sendVersioned<NoticeDraft>(`/api/notice-drafts/${encodeURIComponent(id)}/corrections`, 'POST', input, etag) }
export function discardNoticeDraft(id: string, etag: string, reason: string) { return sendVersioned<NoticeDraft>(`/api/notice-drafts/${encodeURIComponent(id)}/discard`, 'POST', { reason }, etag) }
export function getNoticeNumberConfiguration(signal?: AbortSignal) { return getVersioned<NoticeNumberConfiguration>('/api/program-configuration/notice-number', signal) }
export function createNoticeNumberConfiguration(input: unknown) { return sendVersioned<NoticeNumberConfiguration>('/api/program-configuration/notice-number', 'POST', input) }
export function updateNoticeNumberConfiguration(id: string, etag: string, input: unknown) { return sendVersioned<NoticeNumberConfiguration>(`/api/program-configuration/notice-number/${encodeURIComponent(id)}`, 'PUT', input, etag) }
export function getLegalBasisVersions(activeOnly: boolean, signal?: AbortSignal) { return getJson<LegalBasisVersion[]>(`/api/master-data/legal-basis-versions?activeOnly=${activeOnly}`, signal ?? new AbortController().signal) }
export function createLegalBasisVersion(input: { name: string; versionDate: string }) { return sendVersioned<LegalBasisVersion>('/api/master-data/legal-basis-versions', 'POST', input) }
export function setLegalBasisVersionActive(value: LegalBasisVersion, active: boolean) { return sendVersioned<LegalBasisVersion>(`/api/master-data/legal-basis-versions/${encodeURIComponent(value.id)}/active`, 'PUT', { isActive: active }, `"${value.version}"`) }

export async function generateNoticeDraft(id: string, etag: string, burialId: string, legalBasisVersionId: string, format: NoticeGenerationFormat, signal?: AbortSignal) {
  const token = await getAntiforgeryToken()
  const response = await fetch(`${apiBaseUrl}/api/notice-drafts/${encodeURIComponent(id)}/generate`, {
    signal,
    method: 'POST', credentials: 'include', headers: { Accept: format === 'Pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Type': 'application/json', 'X-Cemaris-CSRF': token, 'If-Match': etag },
    body: JSON.stringify({ burialId, legalBasisVersionId, format }),
  })
  if (!response.ok) { notifySecurityStatus(response.status); throw new ApiError(response.status, await readProblem(response)) }
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const matched = /filename="?([A-Za-z0-9_.-]+)"?/u.exec(disposition)
  return { blob: await response.blob(), fileName: matched?.[1] ?? `Gebuehrenbescheidentwurf.${format === 'Pdf' ? 'pdf' : 'docx'}` }
}

export function getCurrentAccount(signal: AbortSignal) {
  return getJson<CurrentAccount>('/api/auth/me', signal)
}

export async function login(username: string, password: string) {
  antiforgeryToken = undefined
  const account = await sendJson<CurrentAccount>(
    '/api/auth/login',
    'POST',
    { username, password },
  ) as CurrentAccount
  antiforgeryToken = undefined
  return account
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

export function searchCases(filters: SearchFilters, pagination: { page: number; pageSize: number }, signal: AbortSignal) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    const normalizedValue = value.trim()
    if (normalizedValue) {
      query.set(key, normalizedValue)
    }
  }
  query.set('page', String(pagination.page))
  query.set('pageSize', String(pagination.pageSize))

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

export function getUsageRight(id: string, signal?: AbortSignal) { return getVersioned<UsageRight>(`/api/usage-rights/${encodeURIComponent(id)}`, signal) }
export function getUsageRightHistory(id: string, page: number, signal: AbortSignal) { return getJson<UsageRightPage>(`/api/grave-sites/${encodeURIComponent(id)}/usage-rights/history?page=${page}&pageSize=10`, signal) }
export function getUsageRightSequence(id: string, signal: AbortSignal) { return getJson<UsageRightListItem[]>(`/api/usage-rights/${encodeURIComponent(id)}/sequence`, signal) }
export function changeUsageRightLifecycle(id: string, etag: string, action: string, input: unknown) { return sendVersioned<UsageRight>(`/api/usage-rights/${encodeURIComponent(id)}/${action}`, 'POST', input, etag) }

export function createNoticeDraftLineItems(caseId: string, input: unknown) { return sendVersioned<NoticeDraft>(`/api/cases/${encodeURIComponent(caseId)}/notice-drafts/line-items`, 'POST', input) }
export function saveNoticeDraftLineItems(id: string, etag: string, input: unknown, convert: boolean) { return sendVersioned<NoticeDraft>(`/api/notice-drafts/${encodeURIComponent(id)}/${convert ? 'line-item-conversion' : 'line-item-corrections'}`, 'POST', input, etag) }
