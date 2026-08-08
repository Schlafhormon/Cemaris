import type { HealthResponse, SystemInformationResponse } from '../types/system'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const apiBaseUrl = configuredBaseUrl.replace(/\/$/, '')

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function getHealth(signal: AbortSignal) {
  return getJson<HealthResponse>('/health', signal)
}

export function getSystemInformation(signal: AbortSignal) {
  return getJson<SystemInformationResponse>('/api/system/info', signal)
}
