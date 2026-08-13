import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react'
import {
  addBurial,
  addDeceasedPerson,
  ApiError,
  changeBurial,
  changeDeceasedPerson,
  changeGrave,
  getCaseDetails,
  getCemeteryMasterData,
} from '../api/cemarisApi'
import type { GraveSite } from '../types/cemeteries'
import { LastChangeNotice } from '../components/LastChangeNotice'
import type {
  BurialDetails,
  BurialInput,
  CaseOverview,
  CaseWithEtag,
  DeceasedDetails,
  DeceasedPersonInput,
  GraveInput,
} from '../types/cases'

interface CaseEditPageProps {
  caseId: string
  cemeteryMasterDataEditingEnabled?: boolean
}

type FieldErrors = Record<string, string[]>
type InputRefs = Record<string, RefObject<HTMLInputElement | HTMLSelectElement | null>>

export function CaseEditPage({ caseId, cemeteryMasterDataEditingEnabled = false }: CaseEditPageProps) {
  const detailUrl = caseDetailUrl(caseId)
  const [caseOverview, setCaseOverview] = useState<CaseOverview>()
  const [etag, setEtag] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [unexpectedError, setUnexpectedError] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setNotFound(false)
    setUnexpectedError(false)

    getCaseDetails(caseId, controller.signal)
      .then((result) => {
        setCaseOverview(result.caseOverview)
        setEtag(result.etag)
        setConflict(false)
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setNotFound(error instanceof ApiError && error.status === 404)
        setUnexpectedError(!(error instanceof ApiError && error.status === 404))
        setLoading(false)
      })

    return () => controller.abort()
  }, [caseId, requestKey])

  const acceptSaved = useCallback((result: CaseWithEtag) => {
    setCaseOverview(result.caseOverview)
    setEtag(result.etag)
    setConflict(false)
    setUnexpectedError(false)
    setSavedMessage(`Änderung gespeichert. Fallversion ${result.caseOverview.version}.`)
  }, [])

  const reportConflict = useCallback(() => {
    setConflict(true)
    setSavedMessage('')
  }, [])

  const reportUnexpected = useCallback(() => {
    setUnexpectedError(true)
    setSavedMessage('')
  }, [])

  if (loading) {
    return <div className="state-message detail-state">Fallakte wird geladen …</div>
  }

  if (notFound) {
    return <div className="state-message detail-state">Die Fallakte wurde nicht gefunden.</div>
  }

  if (!caseOverview || !etag) {
    return (
      <div className="state-message state-message--error detail-state" role="alert">
        Die Fallakte konnte nicht geladen werden.
      </div>
    )
  }

  if (!caseOverview.isSynthetic) {
    return (
      <div className="state-message detail-state" role="status">
        Diese Development-Funktion bearbeitet ausschließlich synthetische Fallakten.
      </div>
    )
  }

  return (
    <div className="work-page form-page">
      <a className="back-link" href={detailUrl}>
        ← Zur lesenden Detailansicht
      </a>
      <div className="work-page-heading">
        <div>
          <p className="eyebrow">Nur Development · synthetische Daten</p>
          <h1>Fallakte bearbeiten</h1>
          <p className="technical-id">
            Technische Fall-ID: {caseOverview.id} · Fallversion {caseOverview.version}
          </p>
        </div>
        <div className="synthetic-badge" role="note">Ausschließlich synthetische Daten</div>
      </div>

      <LastChangeNotice lastChange={caseOverview.lastChange} />

      {conflict && (
        <div className="conflict-message" role="alert">
          <div>
            <strong>Die Fallakte wurde zwischenzeitlich geändert.</strong>
            <p>Ihre Eingaben wurden nicht gespeichert und nicht automatisch überschrieben.</p>
          </div>
          <button className="button" type="button" onClick={() => setRequestKey((value) => value + 1)}>
            Aktuellen Serverstand laden
          </button>
        </div>
      )}
      {unexpectedError && (
        <p className="form-message form-message--error" role="alert">
          Die Änderung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.
        </p>
      )}
      <p className="save-announcement" aria-live="polite">{savedMessage}</p>

      <div className="editor-sections">
        <GraveEditor
          caseId={caseId}
          etag={etag}
          grave={caseOverview.grave}
          cemeteryMasterDataEditingEnabled={cemeteryMasterDataEditingEnabled}
          onSaved={acceptSaved}
          onConflict={reportConflict}
          onUnexpected={reportUnexpected}
        />

        <section className="editor-card" aria-labelledby="deceased-editor-heading">
          <h2 id="deceased-editor-heading">Verstorbene Personen</h2>
          {caseOverview.deceasedPersons.map((person) => (
            <DeceasedEditor
              key={person.id}
              caseId={caseId}
              etag={etag}
              person={person}
              onSaved={acceptSaved}
              onConflict={reportConflict}
              onUnexpected={reportUnexpected}
            />
          ))}
          <DeceasedEditor
            key="new-deceased-person"
            caseId={caseId}
            etag={etag}
            onSaved={acceptSaved}
            onConflict={reportConflict}
            onUnexpected={reportUnexpected}
          />
        </section>

        <section className="editor-card" aria-labelledby="burial-editor-heading">
          <h2 id="burial-editor-heading">Beisetzungen</h2>
          {caseOverview.burials.map((burial) => (
            <BurialEditor
              key={burial.id}
              caseId={caseId}
              etag={etag}
              burial={burial}
              deceasedPersons={caseOverview.deceasedPersons}
              onSaved={acceptSaved}
              onConflict={reportConflict}
              onUnexpected={reportUnexpected}
            />
          ))}
          <BurialEditor
            key="new-burial"
            caseId={caseId}
            etag={etag}
            deceasedPersons={caseOverview.deceasedPersons}
            onSaved={acceptSaved}
            onConflict={reportConflict}
            onUnexpected={reportUnexpected}
          />
        </section>
      </div>
    </div>
  )
}

interface EditorCallbacks {
  onSaved: (result: CaseWithEtag) => void
  onConflict: () => void
  onUnexpected: () => void
}

interface GraveEditorProps extends EditorCallbacks {
  caseId: string
  etag: string
  grave: CaseOverview['grave']
  cemeteryMasterDataEditingEnabled: boolean
}

function GraveEditor({ caseId, etag, grave, cemeteryMasterDataEditingEnabled, ...callbacks }: GraveEditorProps) {
  const [input, setInput] = useState<GraveInput>(toGraveInput(grave))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [graveSites, setGraveSites] = useState<GraveSite[]>([])
  const cemeteryRef = useRef<HTMLInputElement>(null)
  const fieldRef = useRef<HTMLInputElement>(null)
  const graveNumberRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => setInput(toGraveInput(grave)), [grave])
  useEffect(() => {
    if (!cemeteryMasterDataEditingEnabled) return
    const controller = new AbortController()
    getCemeteryMasterData(controller.signal, false)
      .then(data => setGraveSites(data.graveSites.filter(site => !site.isBlocked)))
      .catch(callbacks.onUnexpected)
    return () => controller.abort()
  }, [callbacks.onUnexpected, cemeteryMasterDataEditingEnabled])

  function selectGraveSite(id: string) {
    const site = graveSites.find(item => item.id === id)
    if (site) setInput({ cemetery: site.cemeteryName, field: site.fieldName ?? '', graveNumber: site.graveNumber, graveSiteId: site.id })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      callbacks.onSaved(await changeGrave(caseId, etag, input))
    } catch (error) {
      handleSaveError(error, setErrors, {
        cemetery: cemeteryRef,
        field: fieldRef,
        graveNumber: graveNumberRef,
      }, callbacks)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="editor-card" aria-labelledby="grave-editor-heading">
      <h2 id="grave-editor-heading">Grabstellenbezug</h2>
      <form onSubmit={submit} aria-busy={saving} noValidate>
        <div className="editor-grid">
          {cemeteryMasterDataEditingEnabled && <label>Kanonische Grabstelle<select value={input.graveSiteId ?? ''} onChange={event => selectGraveSite(event.target.value)}><option value="">Bestehender Altbezug</option>{graveSites.map(site => <option key={site.id} value={site.id}>{site.cemeteryName} · {[site.areaName, site.fieldName, site.rowName, site.graveNumber].filter(Boolean).join(' / ')}</option>)}</select></label>}
          <EditorInput label="Friedhof" name="cemetery" required maxLength={200} value={input.cemetery} errors={errors} inputRef={cemeteryRef} onChange={(value) => setInput({ ...input, cemetery: value })} />
          <EditorInput label="Feld" name="field" maxLength={100} value={input.field} errors={errors} inputRef={fieldRef} onChange={(value) => setInput({ ...input, field: value })} />
          <EditorInput label="Grabnummer" name="graveNumber" maxLength={100} value={input.graveNumber} errors={errors} inputRef={graveNumberRef} onChange={(value) => setInput({ ...input, graveNumber: value })} />
        </div>
        <SaveButton saving={saving} label="Grabstellenbezug speichern" />
      </form>
    </section>
  )
}

interface DeceasedEditorProps extends EditorCallbacks {
  caseId: string
  etag: string
  person?: DeceasedDetails
}

function DeceasedEditor({ caseId, etag, person, ...callbacks }: DeceasedEditorProps) {
  const [input, setInput] = useState<DeceasedPersonInput>(toDeceasedInput(person))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const firstNameRef = useRef<HTMLInputElement>(null)
  const lastNameRef = useRef<HTMLInputElement>(null)
  const birthDateRef = useRef<HTMLInputElement>(null)
  const deathDateRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => setInput(toDeceasedInput(person)), [person])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const result = person
        ? await changeDeceasedPerson(caseId, person.id, etag, input)
        : await addDeceasedPerson(caseId, etag, input)
      callbacks.onSaved(result)
      if (!person) {
        setInput(toDeceasedInput())
      }
    } catch (error) {
      handleSaveError(error, setErrors, {
        firstName: firstNameRef,
        lastName: lastNameRef,
        birthDate: birthDateRef,
        deathDate: deathDateRef,
      }, callbacks)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="editor-record" onSubmit={submit} aria-busy={saving} noValidate>
      <h3>{person ? formatPersonName(person) : 'Person hinzufügen'}</h3>
      <div className="editor-grid editor-grid--four">
        <EditorInput label="Vorname" name="firstName" maxLength={200} value={input.firstName} errors={errors} inputRef={firstNameRef} onChange={(value) => setInput({ ...input, firstName: value })} />
        <EditorInput label="Name" name="lastName" maxLength={200} value={input.lastName} errors={errors} inputRef={lastNameRef} onChange={(value) => setInput({ ...input, lastName: value })} />
        <EditorInput label="Geburtsdatum" name="birthDate" type="date" value={input.birthDate} errors={errors} inputRef={birthDateRef} onChange={(value) => setInput({ ...input, birthDate: value })} />
        <EditorInput label="Sterbedatum" name="deathDate" type="date" value={input.deathDate} errors={errors} inputRef={deathDateRef} onChange={(value) => setInput({ ...input, deathDate: value })} />
      </div>
      <SaveButton saving={saving} label={person ? 'Person speichern' : 'Person hinzufügen'} />
    </form>
  )
}

interface BurialEditorProps extends EditorCallbacks {
  caseId: string
  etag: string
  burial?: BurialDetails
  deceasedPersons: DeceasedDetails[]
}

function BurialEditor({ caseId, etag, burial, deceasedPersons, ...callbacks }: BurialEditorProps) {
  const [input, setInput] = useState<BurialInput>(toBurialInput(burial))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const deceasedPersonRef = useRef<HTMLSelectElement>(null)
  const burialDateRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => setInput(toBurialInput(burial)), [burial])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const result = burial
        ? await changeBurial(caseId, burial.id, etag, input)
        : await addBurial(caseId, etag, input)
      callbacks.onSaved(result)
      if (!burial) {
        setInput(toBurialInput())
      }
    } catch (error) {
      handleSaveError(error, setErrors, {
        deceasedPersonId: deceasedPersonRef,
        burialDate: burialDateRef,
      }, callbacks)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="editor-record" onSubmit={submit} aria-busy={saving} noValidate>
      <h3>{burial ? `Beisetzung ${burial.burialDate ?? ''}` : 'Beisetzung hinzufügen'}</h3>
      <div className="editor-grid">
        <label>
          Zugeordnete verstorbene Person
          <select
            ref={deceasedPersonRef}
            value={input.deceasedPersonId}
            aria-invalid={Boolean(errors.deceasedPersonId)}
            onChange={(event) => setInput({ ...input, deceasedPersonId: event.target.value })}
          >
            <option value="">Keine Zuordnung</option>
            {deceasedPersons.map((person) => (
              <option key={person.id} value={person.id}>{formatPersonName(person)}</option>
            ))}
          </select>
          <FieldErrors messages={errors.deceasedPersonId} />
        </label>
        <EditorInput label="Beisetzungsdatum" name="burialDate" type="date" required value={input.burialDate} errors={errors} inputRef={burialDateRef} onChange={(value) => setInput({ ...input, burialDate: value })} />
      </div>
      <SaveButton saving={saving} label={burial ? 'Beisetzung speichern' : 'Beisetzung hinzufügen'} />
    </form>
  )
}

interface EditorInputProps {
  label: string
  name: string
  value: string
  errors: FieldErrors
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  type?: string
  maxLength?: number
  required?: boolean
}

function EditorInput({ label, name, value, errors, inputRef, onChange, type = 'text', maxLength, required = false }: EditorInputProps) {
  const errorId = `${useId()}-${name}-error`
  return (
    <label>
      {label} {required && <span aria-hidden="true">*</span>}
      <input
        ref={inputRef}
        type={type}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldErrors id={errorId} messages={errors[name]} />
    </label>
  )
}

function FieldErrors({ id, messages }: { id?: string; messages?: string[] }) {
  return messages ? <span id={id} className="field-error">{messages.join(' ')}</span> : null
}

function SaveButton({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button className="button button--primary" type="submit" disabled={saving}>
      {saving ? 'Wird gespeichert …' : label}
    </button>
  )
}

function handleSaveError(
  error: unknown,
  setErrors: (errors: FieldErrors) => void,
  refs: InputRefs,
  callbacks: Pick<EditorCallbacks, 'onConflict' | 'onUnexpected'>,
) {
  if (error instanceof ApiError && error.status === 412) {
    callbacks.onConflict()
    return
  }

  if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
    setErrors(error.fieldErrors)
    const firstField = Object.keys(error.fieldErrors)[0]
    refs[firstField]?.current?.focus()
    return
  }

  callbacks.onUnexpected()
}

function toGraveInput(grave: CaseOverview['grave']): GraveInput {
  return {
    cemetery: grave.cemetery ?? '',
    field: grave.field ?? '',
    graveNumber: grave.graveNumber ?? '',
    graveSiteId: grave.graveSiteId ?? '',
  }
}

function toDeceasedInput(person?: DeceasedDetails): DeceasedPersonInput {
  return {
    firstName: person?.firstName ?? '',
    lastName: person?.lastName ?? '',
    birthDate: person?.birthDate ?? '',
    deathDate: person?.deathDate ?? '',
  }
}

function toBurialInput(burial?: BurialDetails): BurialInput {
  return {
    deceasedPersonId: burial?.deceasedPersonId ?? '',
    burialDate: burial?.burialDate ?? '',
  }
}

function formatPersonName(person: DeceasedDetails) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Nicht angegeben'
}

function caseDetailUrl(caseId: string) {
  const returnTo = new URLSearchParams(window.location.search).get('returnTo')
  if (!returnTo) {
    return `/cases/${encodeURIComponent(caseId)}`
  }

  try {
    const url = new URL(returnTo, window.location.origin)
    const safeReturnTo = url.origin === window.location.origin && url.pathname === '/search'
      ? `${url.pathname}${url.search}`
      : '/search'
    return `/cases/${encodeURIComponent(caseId)}?returnTo=${encodeURIComponent(safeReturnTo)}`
  } catch {
    return `/cases/${encodeURIComponent(caseId)}`
  }
}
