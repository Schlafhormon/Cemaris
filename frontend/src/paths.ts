/** Public mount path shared by navigation, downloads, requests and assets. */
export const URL_PREFIX = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')
export const COOKIE_PATH = `${URL_PREFIX}/`

/** Keep external URLs/fragments intact and do not add the mount twice. */
export function appUrl(value: string, prefix = URL_PREFIX): string {
  if (!value.startsWith('/') || value.startsWith('//') || !prefix) return value
  if (value === prefix || value.startsWith(`${prefix}/`) || value.startsWith(`${prefix}?`) || value.startsWith(`${prefix}#`)) return value
  return prefix + value
}

/** The page components continue to use the source application's route names. */
export function internalPath(value: string, prefix = URL_PREFIX): string {
  if (!prefix) return value
  if (value === prefix) return '/'
  if (value.startsWith(`${prefix}/`)) return value.slice(prefix.length)
  if (value.startsWith(`${prefix}?`) || value.startsWith(`${prefix}#`)) return '/' + value.slice(prefix.length)
  return value
}

export function applicationLocation(): string {
  return internalPath(window.location.pathname) + window.location.search
}
