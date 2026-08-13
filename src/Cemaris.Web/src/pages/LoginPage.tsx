import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFailed(false)
    try {
      await login(username, password)
    } catch {
      setFailed(true)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <p className="eyebrow">Lokales Cemaris-Konto</p>
        <h1 id="login-heading">Anmelden</h1>
        <p>Bitte melden Sie sich mit Ihrem lokalen Benutzernamen und Passwort an.</p>
        <form onSubmit={submit} aria-busy={submitting}>
          <label>
            Benutzername
            <input
              autoComplete="username"
              autoFocus
              required
              maxLength={100}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            Passwort
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {failed && (
            <p className="form-message form-message--error" role="alert">
              Die Anmeldung ist fehlgeschlagen. Prüfen Sie Ihre Angaben oder versuchen Sie es später erneut.
            </p>
          )}
          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting ? 'Anmeldung läuft …' : 'Anmelden'}
          </button>
        </form>
      </section>
    </main>
  )
}
