import { isLanguage } from './i18n'
import type { Language } from './i18n'
import { appUrl } from './paths'

interface ApplicationConfig {
  application: 'Cemaris'
  version: string
  supported_languages: Language[]
}

interface ApplicationHealth {
  status: 'ok'
  application: 'Cemaris'
  version: string
}

export interface ApplicationConnection {
  config: ApplicationConfig
  health: ApplicationHealth
}

export class ApiError extends Error {
  constructor(
    public readonly kind: 'unavailable' | 'invalid',
    public readonly code?: string,
    public readonly requestId?: string,
    public readonly status?: number,
    public readonly detail?: string,
  ) {
    super(kind)
  }
}

export interface User {
  username: string
  userProperties: { canUpdateCemeteries: boolean; canUpdateContracts: boolean; canUpdateWorkOrders: boolean; isAdmin: boolean }
  userSettings: Record<string, string>
}
export interface Session {
  user: User | null
  csrfToken: string
  language: Language
  auth: { type: string; domain: string; maxAgeMillis: number; doKeepAlive: boolean; useTestDatabases?: boolean }
}
let csrfToken = ''
export function setCsrfToken(value: string): void { csrfToken = value }

export async function request<T>(path: string, data?: unknown, signal?: AbortSignal, timeoutMillis?: number, options?: { acceptBusinessFailure?: boolean }): Promise<T> {
  const controller = new AbortController()
  const multipart = data instanceof FormData
  const timeout = window.setTimeout(() => controller.abort(), timeoutMillis ?? (multipart ? 60000 : 5000))
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  if (signal?.aborted) controller.abort()
  const queryLanguage = new URLSearchParams(window.location.search).get('lng')
  const url = path + (queryLanguage ? `${path.includes('?') ? '&' : '?'}lng=${encodeURIComponent(queryLanguage)}` : '')
  try {
    const response = await fetch(appUrl(url), {
      method: data === undefined ? 'GET' : 'POST',
      headers: { Accept: 'application/json', ...(data === undefined ? {} : { ...(!multipart && { 'Content-Type': 'application/json' }), 'X-CSRF-Token': csrfToken }) },
      body: data === undefined ? undefined : multipart ? data : JSON.stringify(data),
      credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
    })
    let body: unknown
    try { body = await response.json() } catch { throw new ApiError('invalid', undefined, undefined, response.status) }
    if (!response.ok || (!options?.acceptBusinessFailure && isObject(body) && body.success === false)) {
      const error = isObject(body) && isObject(body.error) ? body.error : undefined
      if (response.status === 401 && path !== '/api/login') window.dispatchEvent(new Event('cemaris-session-expired'))
      throw new ApiError('unavailable', typeof error?.code === 'string' ? error.code : isObject(body) && typeof body.code === 'string' ? body.code : undefined,
        typeof error?.request_id === 'string' ? error.request_id : undefined, response.status,
        typeof error?.message === 'string' ? error.message : isObject(body) && typeof body.errorMessage === 'string' ? body.errorMessage : isObject(body) && typeof body.message === 'string' ? body.message : undefined)
    }
    if (path === '/api/session' && (!isObject(body) || typeof body.csrfToken !== 'string' || !isLanguage(String(body.language)) ||
      !isObject(body.auth) || typeof body.auth.domain !== 'string' || typeof body.auth.maxAgeMillis !== 'number' || typeof body.auth.doKeepAlive !== 'boolean' ||
      (body.user !== null && (!isObject(body.user) || typeof body.user.username !== 'string' || !isObject(body.user.userProperties) || !isObject(body.user.userSettings))))) {
      throw new ApiError('invalid')
    }
    if (isObject(body) && typeof body.csrfToken === 'string') setCsrfToken(body.csrfToken)
    return body as T
  } finally {
    window.clearTimeout(timeout)
    signal?.removeEventListener('abort', onAbort)
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(appUrl(path), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  })

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiError('invalid')
  }

  if (!response.ok) {
    const error = isObject(body) && isObject(body.error) ? body.error : undefined
    throw new ApiError(
      'unavailable',
      typeof error?.code === 'string' ? error.code : undefined,
      typeof error?.request_id === 'string' ? error.request_id : undefined,
    )
  }
  return body
}

export async function checkApplication(signal: AbortSignal): Promise<ApplicationConnection> {
  const [config, health] = await Promise.all([
    getJson('/api/config', signal),
    getJson('/api/health', signal),
  ])

  if (
    !isObject(config) ||
    config.application !== 'Cemaris' ||
    typeof config.version !== 'string' ||
    config.version.length === 0 ||
    !Array.isArray(config.supported_languages) ||
    config.supported_languages.length === 0 ||
    !config.supported_languages.every((value: unknown) => typeof value === 'string' && isLanguage(value)) ||
    !isObject(health) ||
    health.status !== 'ok' ||
    health.application !== 'Cemaris' ||
    health.version !== config.version
  ) {
    throw new ApiError('invalid')
  }

  return {
    config: config as unknown as ApplicationConfig,
    health: health as unknown as ApplicationHealth,
  }
}
