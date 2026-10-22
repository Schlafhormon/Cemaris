/* Redirect/permission rules ported from Sunrise CMS.
 * Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
 * MIT notice: /THIRD-PARTY-NOTICES.txt. */
import { useEffect, useRef } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { ApiError } from './api'
import type { User } from './api'
import type { Translate } from './i18n'
import { appUrl, internalPath } from './paths'

export function navigate(url: string, replace = false): void {
  if (replace) window.history.replaceState(null, '', appUrl(url))
  else window.history.pushState(null, '', appUrl(url))
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

// Same allowlist/patterns as Sunrise helpers/authentication.helpers.ts. The
// source deliberately compares the record pattern with a lowercased value.
const safeRedirects = new Set([
  '/admin/burialsitetypes', '/admin/cleanup', '/admin/contracttypes', '/admin/fees', '/admin/settings', '/admin/tables',
  '/burialsites', '/burialsites/new', '/cemeteries', '/cemeteries/new', '/contracts', '/contracts/new', '/dashboard',
  '/dashboard/updatelog', '/reports', '/workorders', '/workorders/milestonecalendar', '/workorders/new', '/workorders/outlook', '/workorders/workday',
])
export function safeRedirect(value: string | null): string {
  if (value) value = internalPath(value)
  if (value && (safeRedirects.has(value.toLowerCase()) || /^\/(?:cemeteries|burialsites|contracts|funeralHomes|workorders)\/\d+(?:\/edit)?$/.test(value.toLowerCase()) || /^\/print\/(?:pdf|screen)\/[\d/=?A-Za-z-]+$/.test(value))) return value
  return '/dashboard/'
}

// GET permissions from handlers/permissions.ts and the five source routers.
// Later feature pages use this guard before they acquire their own views.
export function pageAllowed(path: string, user: User): boolean {
  const value = path.toLowerCase()
  if (/^\/admin(?:\/|$)/.test(value)) return user.userProperties.isAdmin
  if (/^\/(?:cemeteries|burialsites)\/(?:new|[^/]+\/edit)$/.test(value) || /^\/burialsites\/(?:creator|gpscapture)$/.test(value)) return user.userProperties.canUpdateCemeteries
  if (/^\/(?:contracts|funeralhomes)\/(?:new|[^/]+\/edit)$/.test(value)) return user.userProperties.canUpdateContracts
  if (/^\/workorders\/(?:new|[^/]+\/edit)$/.test(value)) return user.userProperties.canUpdateWorkOrders
  return true
}

export function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} href={props.href ? appUrl(props.href) : props.href} onClick={(event) => {
    props.onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || props.target) return
    if (!props.href?.startsWith('/') || props.href.startsWith('//')) return
    event.preventDefault()
    const menu = event.currentTarget.closest('details')
    if (menu) menu.open = false
    navigate(props.href)
  }} />
}

export function ErrorMessage({ error, t, login = false }: { error: unknown; t: Translate; login?: boolean }) {
  const api = error instanceof ApiError ? error : undefined
  const detailKey = api?.detail && ({
    'authentication required': 'authenticationRequired', 'not found': 'recordNotFound',
    'contract not found': 'contractNotFound', 'funeral home not found': 'funeralHomeNotFound',
    'cemetery not found': 'cemeteryNotFound', 'burial site not found': 'burialSiteNotFound',
    'attachment not found': 'attachmentNotFound', 'attachment file not found': 'attachmentNotFound',
    'no file uploaded': 'noFileUploaded', 'audit logging is disabled': 'auditDisabled',
    'request validation failed': 'validationFailed', 'internal server error': 'serverError',
  } as Record<string, string>)[api.detail.trim().replace(/\.$/, '').toLowerCase()]
  const message = login && api?.status === 401 ? t('login:invalidCredentials')
    : api?.status === 429 || (login && api?.status === 403 && api.detail?.toLowerCase().includes('too many')) ? t('login:tooManyAttempts')
    : api?.status === 403 ? t('errors:forbiddenMessage')
    : api?.kind === 'invalid' ? t('cemaris:invalid')
    : detailKey ? t(`cemaris:${detailKey}`)
    : api?.detail || (error instanceof DOMException && error.name === 'AbortError' ? t('cemaris:timeout') : t('cemaris:unavailable'))
  return <div className="notification danger" role="alert"><p>{message}</p>{api?.code && <small>{api.code}{api.requestId && ` · ${api.requestId}`}</small>}</div>
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }} aria-labelledby="modal-title"><div className="modal-card"><div className="modal-heading"><h2 id="modal-title">{title}</h2><button type="button" onClick={onClose} aria-label={document.documentElement.lang === 'en' ? 'Close' : 'Schließen'}>×</button></div>{children}</div></dialog>
}
