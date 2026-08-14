import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { ApiError, createCase, getCemeteryMasterData } from '../api/cemarisApi'
import { navigateTo } from '../navigation'
import type { GraveInput } from '../types/cases'
import type { GraveSite } from '../types/cemeteries'

const initialInput: GraveInput = { cemetery: '', field: '', graveNumber: '', graveSiteId: '' }

export function NewCasePage({ cemeteryMasterDataEditingEnabled = false }: { cemeteryMasterDataEditingEnabled?: boolean }) {
  const [input, setInput] = useState(initialInput)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [unexpectedError, setUnexpectedError] = useState(false)
  const [graveSites, setGraveSites] = useState<GraveSite[]>([])
  const cemeteryRef = useRef<HTMLInputElement>(null)
  const fieldRef = useRef<HTMLInputElement>(null)
  const graveNumberRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!cemeteryMasterDataEditingEnabled) return
    const controller = new AbortController()
    getCemeteryMasterData(controller.signal, false)
      .then(data => setGraveSites(data.graveSites.filter(site => !site.isBlocked)))
      .catch(() => setUnexpectedError(true))
    return () => controller.abort()
  }, [cemeteryMasterDataEditingEnabled])

  function selectGraveSite(id: string) {
    const site = graveSites.find(item => item.id === id)
    setInput(site ? { cemetery: site.cemeteryName, field: site.fieldName ?? '', graveNumber: site.graveNumber, graveSiteId: site.id } : initialInput)
  }

  function setField(name: keyof GraveInput, value: string) {
    setInput((current) => ({ ...current, [name]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFieldErrors({})
    setUnexpectedError(false)

    try {
      const result = await createCase(input)
      navigateTo(`/cases/${encodeURIComponent(result.caseOverview.id)}/edit`)
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors)
        const firstField = Object.keys(error.fieldErrors)[0]
        const refs: Record<string, RefObject<HTMLInputElement | null>> = {
          cemetery: cemeteryRef,
          field: fieldRef,
          graveNumber: graveNumberRef,
        }
        refs[firstField]?.current?.focus()
      } else {
        setUnexpectedError(true)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="work-page form-page new-case-page">
      <nav className="work-page-toolbar" aria-label="Seitennavigation"><a className="button button--back" href="/search"><span aria-hidden="true">←</span> Zurück zur Suche</a></nav>
      <div className="work-page-heading">
        <div>
          <p className="eyebrow">Nur Development · synthetische Daten</p>
          <h1>Fallakte anlegen</h1>
          <p>Erfasst wird ausschließlich ein technischer Grabstellenbezug.</p>
        </div>
      </div>

      <form className="editor-card creation-card" onSubmit={submit} aria-busy={saving} noValidate>
        <header className="card-heading"><span className="card-heading-icon" aria-hidden="true">01</span><div><h2>Grabstellenbezug</h2><p>Wählen Sie die kanonische Grabstelle für die neue synthetische Fallakte.</p></div></header>
        <div className="editor-grid">
          {cemeteryMasterDataEditingEnabled && <label>
            Kanonische Grabstelle <span aria-hidden="true">*</span>
            <select required value={input.graveSiteId} onChange={event => selectGraveSite(event.target.value)}>
              <option value="">Bitte auswählen</option>
              {graveSites.map(site => <option key={site.id} value={site.id}>{site.cemeteryName} · {[site.areaName, site.fieldName, site.rowName, site.graveNumber].filter(Boolean).join(' / ')}</option>)}
            </select>
          </label>}
          <label>
            Friedhof <span aria-hidden="true">*</span>
            <input
              ref={cemeteryRef}
              value={input.cemetery}
              required
              readOnly={cemeteryMasterDataEditingEnabled}
              maxLength={200}
              aria-invalid={Boolean(fieldErrors.cemetery)}
              aria-describedby={fieldErrors.cemetery ? 'cemetery-error' : undefined}
              onChange={(event) => setField('cemetery', event.target.value)}
            />
            {fieldErrors.cemetery && <FieldError id="cemetery-error" messages={fieldErrors.cemetery} />}
          </label>
          <label>
            Feld
            <input
              ref={fieldRef}
              value={input.field}
              maxLength={100}
              readOnly={cemeteryMasterDataEditingEnabled}
              aria-invalid={Boolean(fieldErrors.field)}
              onChange={(event) => setField('field', event.target.value)}
            />
            {fieldErrors.field && <FieldError messages={fieldErrors.field} />}
          </label>
          <label>
            Grabnummer
            <input
              ref={graveNumberRef}
              value={input.graveNumber}
              maxLength={100}
              readOnly={cemeteryMasterDataEditingEnabled}
              aria-invalid={Boolean(fieldErrors.graveNumber)}
              onChange={(event) => setField('graveNumber', event.target.value)}
            />
            {fieldErrors.graveNumber && <FieldError messages={fieldErrors.graveNumber} />}
          </label>
        </div>

        {unexpectedError && (
          <p className="form-message form-message--error" role="alert">
            Die Fallakte konnte nicht angelegt werden. Bitte versuchen Sie es erneut.
          </p>
        )}
        <button className="button button--primary" type="submit" disabled={saving}>
          {saving ? 'Wird angelegt …' : 'Fallakte anlegen'}
        </button>
      </form>
    </div>
  )
}

function FieldError({ id, messages }: { id?: string; messages: string[] }) {
  return <span id={id} className="field-error">{messages.join(' ')}</span>
}
