import { useEffect, useState, type FormEvent } from 'react'
import {
  ApiError,
  createAccount,
  listAccounts,
  resetAccountPassword,
  setAccountActive,
  updateAccount,
} from '../api/cemarisApi'
import type {
  CreateAccountInput,
  LocalAccount,
  SystemRole,
} from '../types/identity'

const initialAccount: CreateAccountInput = {
  username: '',
  displayName: '',
  role: 'Sachbearbeitung',
  password: '',
}

export function UserAdministrationPage() {
  const [accounts, setAccounts] = useState<LocalAccount[]>([])
  const [draft, setDraft] = useState(initialAccount)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    listAccounts(controller.signal)
      .then((items) => {
        setAccounts(items)
        setLoading(false)
      })
      .catch(() => {
        setMessage('Die Benutzerkonten konnten nicht geladen werden.')
        setLoading(false)
      })
    return () => controller.abort()
  }, [])

  function replace(account: LocalAccount) {
    setAccounts((current) => current.map((item) => item.id === account.id ? account : item))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    try {
      const account = await createAccount(draft)
      setAccounts((current) => [...current, account].sort((a, b) => a.username.localeCompare(b.username, 'de')))
      setDraft(initialAccount)
      setMessage('Das Konto wurde angelegt. Das temporäre Passwort muss beim nächsten Login geändert werden.')
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  return (
    <div className="work-page form-page">
      <div className="work-page-heading"><div><p className="eyebrow">Nur Administration</p><h1>Benutzerverwaltung</h1><p>Lokale Konten werden deaktiviert, nicht gelöscht. Passwörter und Hashes sind niemals einsehbar.</p></div></div>
      <form className="editor-card account-create-form" onSubmit={submit}>
        <h2>Konto anlegen</h2>
        <div className="editor-grid editor-grid--four">
          <label>Benutzername<input required maxLength={100} autoComplete="off" value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} /></label>
          <label>Anzeigename<input required maxLength={200} value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} /></label>
          <RoleSelect value={draft.role} onChange={(role) => setDraft({ ...draft, role })} />
          <label>Temporäres Passwort<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} /></label>
        </div>
        <button className="button button--primary" type="submit">Konto anlegen</button>
      </form>
      {message && <p className="form-message" role="status">{message}</p>}
      {loading ? <div className="state-message">Konten werden geladen …</div> : (
        <div className="account-list">
          {accounts.map((account) => <AccountEditor key={account.id} account={account} onChanged={replace} />)}
        </div>
      )}
    </div>
  )
}

function AccountEditor({ account, onChanged }: { account: LocalAccount; onChanged: (account: LocalAccount) => void }) {
  const [username, setUsername] = useState(account.username)
  const [displayName, setDisplayName] = useState(account.displayName)
  const [role, setRole] = useState<SystemRole>(account.role)
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [message, setMessage] = useState('')

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const changed = await updateAccount(account.id, { username, displayName, role, version: account.version })
      onChanged(changed)
      setMessage('Kontodaten gespeichert.')
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  async function toggleActive() {
    try {
      onChanged(await setAccountActive(account, !account.isActive))
      setMessage(account.isActive ? 'Konto deaktiviert.' : 'Konto aktiviert.')
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      onChanged(await resetAccountPassword(account, temporaryPassword))
      setTemporaryPassword('')
      setMessage('Temporäres Passwort gesetzt; beim nächsten Login ist ein Wechsel erforderlich.')
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  return (
    <article className="editor-card account-card">
      <header><div><h2>{account.displayName}</h2><p className="technical-id">{account.id}</p></div><span className={account.isActive ? 'account-status account-status--active' : 'account-status'}>{account.isActive ? 'Aktiv' : 'Deaktiviert'}</span></header>
      <form onSubmit={save}>
        <div className="editor-grid">
          <label>Benutzername<input required maxLength={100} value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>Anzeigename<input required maxLength={200} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
          <RoleSelect value={role} onChange={setRole} />
        </div>
        <div className="form-actions"><button className="button button--primary" type="submit">Kontodaten speichern</button><button className="button" type="button" onClick={toggleActive}>{account.isActive ? 'Deaktivieren' : 'Aktivieren'}</button></div>
      </form>
      <form className="password-reset-form" onSubmit={resetPassword}>
        <label>Neues temporäres Passwort<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} /></label>
        <button className="button" type="submit">Passwort zurücksetzen</button>
      </form>
      {message && <p className="form-message" role="status">{message}</p>}
    </article>
  )
}

function RoleSelect({ value, onChange }: { value: SystemRole; onChange: (role: SystemRole) => void }) {
  return <label>Rolle<select value={value} onChange={(event) => onChange(event.target.value as SystemRole)}><option value="Sachbearbeitung">Sachbearbeitung</option><option value="Administration">Administration</option></select></label>
}

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Die Kontoänderung konnte nicht ausgeführt werden.'
}
