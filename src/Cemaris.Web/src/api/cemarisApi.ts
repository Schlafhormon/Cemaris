import type { HealthResponse, SystemInformationResponse } from '../types/system'
import type {
  BurialInput,
  CaseOverview,
  CaseWithEtag,
  DeceasedPersonInput,
  GraveInput,
  SearchFilters,
  SearchResponse,
} from '../types/cases'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const apiBaseUrl = configuredBaseUrl.replace(/\/$/, '')

interface ProblemDetails {
  title?: string
  errors?: Record<string, string[]>
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
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response))
  }

  return response.json() as Promise<T>
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>

  constructor(status: number, problem?: ProblemDetails) {
    super(problem?.title ?? `API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = problem?.errors ?? {}
  }
}

export function getHealth(signal: AbortSignal) {
  return getJson<HealthResponse>('/health', signal)
}

export function getSystemInformation(signal: AbortSignal) {
  return getJson<SystemInformationResponse>('/api/system/info', signal)
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

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
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
  signal?: AbortSignal,
) {
  return requestCase(`/api/cases/${encodeURIComponent(caseId)}/deceased-persons`, {
    method: 'POST',
    headers: mutationHeaders(etag),
    body: JSON.stringify(input),
    signal,
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
