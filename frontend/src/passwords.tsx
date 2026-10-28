import { useState } from 'react'
import type { FormEvent } from 'react'
import { request } from './api'
import type { User } from './api'
import type { Translate } from './i18n'
import { ErrorMessage } from './ui'

export function PasswordForm({ t, required = false, onChanged }: { t: Translate; required?: boolean; onChanged: (user: User) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [message, setMessage] = useState('')
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setError(null); setMessage(''); setBusy(true)
    try {
      const result = await request<{ user: User }>('/api/password/change', Object.fromEntries(data))
      form.reset()
      setMessage(t('cemaris:passwordSaved'))
      onChanged(result.user)
    } catch (reason) { setError(reason) } finally { setBusy(false) }
  }
  return <section className="panel"><h2 className="panel-heading">{t(required ? 'cemaris:passwordSet' : 'cemaris:passwordChange')}</h2><div className="panel-body">
    {required && <p className="notification warning">{t('cemaris:passwordFirstLogin')}</p>}
    <p id="password-rules">{t('cemaris:passwordRules')}</p>
    <form onSubmit={save} id="form--changePassword">
      <label htmlFor="current-password">{t('cemaris:passwordCurrent')}</label><input id="current-password" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required />
      <label htmlFor="new-password">{t('cemaris:passwordNew')}</label><input id="new-password" name="newPassword" type="password" autoComplete="new-password" aria-describedby="password-rules" minLength={12} maxLength={128} required />
      <label htmlFor="confirm-password">{t('cemaris:passwordConfirm')}</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      {Boolean(error) && <ErrorMessage error={error} t={t} />}{message && <p className="notification success" role="status">{message}</p>}
      <button type="submit" className="primary" disabled={busy}>{t(required ? 'cemaris:passwordSet' : 'cemaris:passwordChange')}</button>
    </form>
  </div></section>
}
