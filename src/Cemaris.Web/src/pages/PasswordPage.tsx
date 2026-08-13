import { useState, type FormEvent } from 'react'
import { ApiError, changeOwnPassword } from '../api/cemarisApi'
import { useAuth } from '../auth/useAuth'

export function PasswordPage({ required = false }: { required?: boolean }) {
  const { markAnonymous } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword !== confirmation) {
      setMessage('Die neuen Passwörter stimmen nicht überein.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await changeOwnPassword(currentPassword, newPassword)
      markAnonymous()
    } catch (error) {
      setMessage(error instanceof ApiError
        ? error.message
        : 'Das Passwort konnte nicht geändert werden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="work-page form-page compact-form-page">
      <p className="eyebrow">Kontosicherheit</p>
      <h1>{required ? 'Passwortwechsel erforderlich' : 'Eigenes Passwort ändern'}</h1>
      <p>
        {required
          ? 'Das temporäre Passwort muss vor der Nutzung der Fachfunktionen geändert werden.'
          : 'Nach dem Passwortwechsel werden alle Sitzungen beendet. Melden Sie sich anschließend erneut an.'}
      </p>
      <form className="editor-card account-form" onSubmit={submit} aria-busy={saving}>
        <label>Aktuelles Passwort<input type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
        <label>Neues Passwort<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
        <label>Neues Passwort wiederholen<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
        {message && <p className="form-message form-message--error" role="alert">{message}</p>}
        <button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Wird geändert …' : 'Passwort ändern'}</button>
      </form>
    </div>
  )
}
