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
      <div className="login-shell">
        <section className="login-intro" aria-label="Cemaris">
          <a className="login-brand" href="/" aria-label="Cemaris Startseite"><span className="brand-mark" aria-hidden="true">C</span><span><strong>Cemaris</strong><small>Friedhofsverwaltung</small></span></a>
          <div><p className="eyebrow">Open Source · Kommunal</p><h2>Verlässlich arbeiten.<br />Nachvollziehbar entscheiden.</h2><p>Die browserbasierte Arbeitsoberfläche für eine moderne kommunale Friedhofsverwaltung.</p></div>
          <p className="login-development-note"><span aria-hidden="true">i</span><span><strong>Development-Umgebung</strong> Ausschließlich für synthetische Testdaten.</span></p>
        </section>
        <section className="login-card" aria-labelledby="login-heading">
          <div className="login-card-heading"><span className="login-lock" aria-hidden="true">●</span><div><p className="eyebrow">Lokales Cemaris-Konto</p><h1 id="login-heading">Willkommen zurück</h1><p>Bitte melden Sie sich mit Ihrem Benutzernamen und Passwort an.</p></div></div>
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
          <p className="login-security-note">Geschützte Sitzung · Automatische Abmeldung bei Inaktivität</p>
        </section>
      </div>
    </main>
  )
}
