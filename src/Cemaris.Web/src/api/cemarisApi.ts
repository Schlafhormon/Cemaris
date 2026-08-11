import type { HealthResponse, SystemInformationResponse } from '../types/system'
import type {
  CaseOverview,
  SearchFilters,
  SearchResponse,
} from '../types/cases'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const apiBaseUrl = configuredBaseUrl.replace(/\/$/, '')

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new ApiError(response.status)
  }

  return response.json() as Promise<T>
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
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
  return getJson<CaseOverview>(`/api/cases/${encodeURIComponent(id)}`, signal)
}
