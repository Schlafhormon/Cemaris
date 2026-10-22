/* Functional port of Sunrise CMS admin/users, admin/settings, dashboard/userSettings
 * and their browser handlers. Copyright (c) 2026 The Corporation of the City
 * of Sault Ste. Marie. MIT notice: /THIRD-PARTY-NOTICES.txt. */
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { request } from './api'
import type { Language, Translate } from './i18n'
import { ErrorMessage, Link, Modal } from './ui'

function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    request<T>(path, undefined, controller.signal).then((value) => { if (!controller.signal.aborted) setData(value) })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [path, attempt])
  return { data, setData, error, reload: () => setAttempt((value) => value + 1) }
}

type Permission = 'isActive' | 'canUpdateCemeteries' | 'canUpdateContracts' | 'canUpdateWorkOrders' | 'isAdmin'
type DatabaseUser = Record<Permission, boolean> & { username: string }
interface UsersData { users: DatabaseUser[]; domain: string; hasConfigUsers: boolean; configUsers: Record<string, string[]> }
const permissions: Permission[] = ['isActive', 'canUpdateCemeteries', 'canUpdateContracts', 'canUpdateWorkOrders', 'isAdmin']
const permissionLabel = (permission: Permission) => `admin:${permission === 'isActive' ? 'canLogin' : permission}`

export function UserManagement({ t }: { t: Translate }) {
  const resource = useResource<UsersData>('/api/admin/users')
  const [modal, setModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [message, setMessage] = useState('')
  const data = resource.data

  async function mutate(action: string, payload: object): Promise<boolean> {
    setBusy(true); setError(null); setMessage('')
    try {
      const result = await request<{ users: DatabaseUser[] }>(`/api/admin/users/${action}`, payload)
      resource.setData((current) => current ? { ...current, users: result.users } : current)
      if (action === 'delete') setMessage(t('admin:userDeletedMessage'))
      return true
    } catch (reason) { setError(reason); return false } finally { setBusy(false) }
  }
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload: Record<string, string | boolean> = { username: String(form.get('username')) }
    for (const permission of permissions.slice(1)) payload[permission] = form.has(permission)
    if (await mutate('add', payload)) setModal(false)
  }
  return <><Breadcrumb t={t} title="admin:userManagement" /><div className="page-heading"><h1>{t('admin:userManagement')}</h1><button className="success" id="button--addUser" onClick={() => { setError(null); setModal(true) }}>{t('admin:addUser')}</button></div>{Boolean(error || resource.error) && <ErrorMessage error={error || resource.error} t={t} />}{message && <p className="notification success" role="status">{message}</p>}{!data && !resource.error && <p role="status">{t('loading')}</p>}{Boolean(resource.error) && <button onClick={resource.reload}>{t('cemaris:retry')}</button>}{data && <>{data.hasConfigUsers && <div className="notification warning"><strong>{t('note')}:</strong><p>{t('admin:someUsersAreConfiguredInTheConfigFile')}</p><p>{t('admin:usersDefinedInConfig')}:</p><ul>{[...new Set(Object.values(data.configUsers).flat())].map((name) => <li key={name}>{name}</li>)}</ul></div>}{data.users.length ? <div className="table-scroll"><table id="users-table"><thead><tr><th>{t('admin:username')}</th>{permissions.map((permission) => <th key={permission}>{t(permissionLabel(permission))}</th>)}<th><span className="sr-only">{t('delete')}</span></th></tr></thead><tbody>{data.users.map((user) => <tr key={user.username} data-username={user.username}><th scope="row">{user.username}</th>{permissions.map((permission) => <td key={permission}><button disabled={busy} className={`small ${user[permission] ? 'success' : 'light'}`} aria-label={`${user.username}: ${t(permissionLabel(permission))}`} aria-pressed={Boolean(user[permission])} onClick={() => void mutate('toggle', { username: user.username, permissionField: permission })}>{t(user[permission] ? 'yes' : 'no')}</button></td>)}<td><button className="small danger" disabled={busy} aria-label={`${t('admin:deleteUser')}: ${user.username}`} onClick={() => { if (window.confirm(t('admin:deleteUserConfirmation', { username: user.username }))) void mutate('delete', { username: user.username }) }}>{t('delete')}</button></td></tr>)}</tbody></table></div> : <p>{t('cemaris:noUsers')}</p>}</>}{modal && <Modal title={t('admin:addUser')} onClose={() => { if (!busy) setModal(false) }}><form onSubmit={add} id="form--addUser" autoComplete="off"><div className="two-columns"><div><label htmlFor="username">{t('admin:username')}</label><div className="input-addons">{data?.domain && <span className="domain">{data.domain}&#92;</span>}<input id="username" name="username" autoFocus required /></div></div><fieldset><legend>{t('cemaris:permissions')}</legend>{permissions.slice(1).map((permission) => <label className="checkbox" key={permission}><input name={permission} type="checkbox" value="1" />{t(permissionLabel(permission))}</label>)}</fieldset></div>{Boolean(error) && <ErrorMessage error={error} t={t} />}<div className="actions"><button type="submit" className="success" disabled={busy}>{t('admin:addUser')}</button><button type="button" disabled={busy} onClick={() => setModal(false)}>{t('cancel')}</button></div></form></Modal>}</>
}

interface Setting { settingKey: string; settingName: string; description?: string; type: string; defaultValue: string | boolean | number; settingValue: string | null; isUserConfigurable: boolean }
export function AppSettings({ t }: { t: Translate }) {
  const resource = useResource<{ settings: Setting[] }>('/api/admin/settings')
  const [filter, setFilter] = useState('')
  return <><Breadcrumb t={t} title="admin:settingsManagement" /><div className="page-heading"><h1>{t('admin:settingsManagement')}</h1><input id="settingsFilter" type="search" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label={t('filter')} placeholder={t('filter')} /></div>{Boolean(resource.error) && <><ErrorMessage error={resource.error} t={t} /><button onClick={resource.reload}>{t('cemaris:retry')}</button></>}{!resource.data && !resource.error && <p role="status">{t('loading')}</p>}{resource.data && <div className="table-scroll"><table className="settings-table"><thead><tr><th>{t('cemaris:setting')}</th><th>{t('cemaris:value')}</th></tr></thead><tbody>{resource.data.settings.filter((setting) => setting.isUserConfigurable).map((setting) => <SettingRow key={setting.settingKey} setting={setting} t={t} hidden={!`${setting.settingKey} ${setting.settingName.toLowerCase()} ${setting.description?.toLowerCase() || ''}`.includes(filter.toLowerCase())} />)}</tbody></table></div>}</>
}

function SettingRow({ setting, t, hidden }: { setting: Setting; t: Translate; hidden: boolean }) {
  const [value, setValue] = useState(setting.settingValue ?? '')
  const [savedValue, setSavedValue] = useState(value)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)
  return <tr hidden={hidden}><td><label htmlFor={`setting-${setting.settingKey}`}>{setting.settingName}</label><p className="muted">{setting.description || t('cemaris:noDescription')}</p><small>{setting.settingKey}</small></td><td><form className="settingForm" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setSaved(false); setError(null); try { await request('/api/admin/settings', { settingKey: setting.settingKey, settingValue: value }); setSavedValue(value); setSaved(true) } catch (reason) { setError(reason) } finally { setBusy(false) } }}><div className="input-addons">{setting.type === 'boolean' ? <select id={`setting-${setting.settingKey}`} value={value} className={value !== savedValue ? 'changed' : ''} onChange={(event) => { setValue(event.target.value); setSaved(false) }}><option value="">{t('cemaris:default')}: {t(setting.defaultValue ? 'yes' : 'no')}</option><option value="true">{t('yes')}</option><option value="false">{t('no')}</option></select> : <input id={`setting-${setting.settingKey}`} value={value} className={value !== savedValue ? 'changed' : ''} onChange={(event) => { setValue(event.target.value); setSaved(false) }} placeholder={`${t('cemaris:default')}: ${setting.defaultValue}`} />}<button type="submit" className="success" disabled={busy}>{t('save')}</button></div>{Boolean(error) && <ErrorMessage error={error} t={t} />}{saved && <p className="saved-message" role="status">{t('cemaris:saved')}</p>}</form></td></tr>
}

interface Preferences { userSettings: Record<string, string> }
export function UserSettings({ t, language, onLanguage }: { t: Translate; language: Language; onLanguage: (language: string) => void }) {
  const resource = useResource<Preferences>('/api/user-settings')
  const [error, setError] = useState<unknown>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const data = resource.data
  return <><Breadcrumb t={t} title="dashboard.userSettings" /><h1>{t('dashboard.userSettings')}</h1>{Boolean(resource.error || error) && <ErrorMessage t={t} error={resource.error || error} />}{Boolean(resource.error) && <button onClick={resource.reload}>{t('cemaris:retry')}</button>}{message && <p className="notification success" role="status">{message}</p>}<div className="two-columns"><section className="panel"><h2 className="panel-heading">{t('dashboard.userSettingsLanguage')}</h2><div className="panel-body two-columns"><div><button className={`fullwidth ${language === 'de' ? 'primary' : ''}`} onClick={() => onLanguage('de')} lang="de">Deutsch</button></div><div><button className={`fullwidth ${language === 'en' ? 'primary' : ''}`} onClick={() => onLanguage('en')} lang="en">English</button></div></div></section><section className="panel"><h2 className="panel-heading">{t('dashboard.userSettingsApiKeyReset')}</h2><div className="panel-body"><div className="notification warning small-text"><p>{t('dashboard.userSettingsApiKeyDescription1')}</p><p>{t('dashboard.userSettingsApiKeyDescription2')}</p></div><div className="actions"><button className="warning" disabled={busy || !data} id="button--resetApiKey" onClick={async () => { if (!window.confirm(t('cemaris:resetConfirm'))) return; setBusy(true); setError(null); setMessage(''); try { await request('/api/user-settings/reset-api-key', {}); setMessage(t('cemaris:resetSuccess')) } catch (reason) { setError(reason) } finally { setBusy(false) } }}>{t('dashboard.userSettingsResetApiKey')}</button></div></div></section></div>{!data && !resource.error && <p role="status">{t('loading')}</p>}</>
}

function Breadcrumb({ t, title }: { t: Translate; title: string }) {
  return <nav className="breadcrumb" aria-label={t('cemaris:breadcrumb')}><Link href="/dashboard">{t('home')}</Link><span aria-hidden="true">/</span>{title.startsWith('admin:') && <><span>{t('admin:adminTools')}</span><span aria-hidden="true">/</span></>}<span aria-current="page">{t(title)}</span></nav>
}
