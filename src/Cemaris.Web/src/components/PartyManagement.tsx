import { useRef, useState, type FormEvent } from 'react'
import {
  ApiError,
  addPartyAddress,
  correctParty,
  correctPartyAddress,
  createParty,
  getParty,
  searchParties,
} from '../api/cemarisApi'
import type { Party, PartyAddress, PartySearchItem, PartyType, Versioned } from '../types/personUsageRights'
import { FormErrorSummary } from './FormErrorSummary'
import { partyDisplayName } from './partyDisplayName'
import { useFormFeedback } from './useFormFeedback'

interface PartySelectionProps {
  party: Versioned<Party> | null | undefined
  onPartyChanged: (party: Versioned<Party>) => void
  onError: (error: unknown) => void
  onSuccess: (message: string) => void
}

interface PartyMutationProps {
  party: Versioned<Party>
  onChanged: (party: Versioned<Party>) => void
  onError: (error: unknown) => void
  onSuccess: (message: string) => void
}

export function PartySearchAndDetails({ party, onPartyChanged, onError, onSuccess }: PartySelectionProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PartySearchItem[]>([])

  async function find(event: FormEvent) {
    event.preventDefault()
    const controller = new AbortController()
    try {
      setResults(await searchParties(query, controller.signal))
    } catch (error) {
      onError(error)
    }
  }

  async function selectParty(id: string) {
    try {
      const selected = await getParty(id)
      if (selected) onPartyChanged(selected)
    } catch (error) {
      onError(error)
    }
  }

  return (
    <>
      <form className="party-search-form" onSubmit={(event) => void find(event)}>
        <label htmlFor="party-search">Name des Beteiligten</label>
        <div className="search-control">
          <input id="party-search" value={query} onChange={(event) => setQuery(event.target.value)} minLength={2} placeholder="Mindestens zwei Zeichen" required />
          <button className="button button--primary" type="submit">Suchen</button>
        </div>
      </form>
      {results.length > 0 && (
        <div className="party-results" role="region" aria-label="Gefundene Beteiligte">
          <p>{results.length} {results.length === 1 ? 'Treffer' : 'Treffer'}</p>
          <ul>
            {results.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => void selectParty(item.id)}>
                  <span>
                    <strong>{item.displayName}</strong>
                    <small>{item.partyType === 'NaturalPerson' ? 'Natürliche Person' : 'Organisation'}{item.currentPrimaryAddress && ` · ${item.currentPrimaryAddress}`}</small>
                  </span>
                  <span aria-hidden="true">Auswählen →</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {party && <PartyDetails party={party} onChanged={onPartyChanged} onError={onError} onSuccess={onSuccess} />}
    </>
  )
}

export function PartyCreateForm({ onCreated, onError }: {
  onCreated: (value: Versioned<Party>) => void
  onError: (error: unknown) => void
}) {
  const [type, setType] = useState<PartyType>('NaturalPerson')
  const [duplicate, setDuplicate] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, {
    partyType: 'partyType', firstName: 'firstName', lastName: 'lastName', organizationName: 'organizationName',
    street: 'street', houseNumber: 'houseNumber', postalCode: 'postalCode', city: 'city',
    validFromInclusive: 'validFromInclusive', validUntilExclusive: 'validUntilExclusive', addresses: null, address: null,
  }, onError)

  async function submit(confirm = false) {
    const data = new FormData(formRef.current!)
    feedback.clear()
    try {
      const value = await createParty({
        partyType: type,
        firstName: type === 'NaturalPerson' ? data.get('firstName') : null,
        lastName: type === 'NaturalPerson' ? data.get('lastName') : null,
        organizationName: type === 'Organization' ? data.get('organizationName') : null,
        addresses: [addressInput(data)],
        confirmPossibleDuplicate: confirm,
      })
      setDuplicate(false)
      onCreated(value)
      formRef.current?.reset()
      setType('NaturalPerson')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'possible-party-duplicate') setDuplicate(true)
      else feedback.report(error)
    }
  }

  return (
    <form ref={formRef} className="compact-form party-create-card" onSubmit={(event) => { event.preventDefault(); void submit() }}>
      <div className="sidebar-heading">
        <p className="section-kicker">Nicht gefunden?</p>
        <h3>Neue Identität erfassen</h3>
        <p>Diese Identität steht anschließend fallübergreifend zur Verfügung.</p>
      </div>
      <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
      <fieldset className="form-section">
        <legend>Namensangaben</legend>
        <div className="compact-form-grid">
          <label className="field--wide">Art
            <select name="partyType" value={type} onChange={(event) => setType(event.target.value as PartyType)} {...feedback.fieldProps('partyType')}>
              <option value="NaturalPerson">Natürliche Person</option>
              <option value="Organization">Organisation</option>
            </select>
            {feedback.fieldErrors('partyType')}
          </label>
          {type === 'NaturalPerson' ? (
            <>
              <label>Vorname<input name="firstName" autoComplete="given-name" required {...feedback.fieldProps('firstName')} />{feedback.fieldErrors('firstName')}</label>
              <label>Nachname<input name="lastName" autoComplete="family-name" required {...feedback.fieldProps('lastName')} />{feedback.fieldErrors('lastName')}</label>
            </>
          ) : (
            <label className="field--wide">Organisationsname<input name="organizationName" autoComplete="organization" required {...feedback.fieldProps('organizationName')} />{feedback.fieldErrors('organizationName')}</label>
          )}
        </div>
      </fieldset>
      <fieldset className="form-section">
        <legend>Erste Anschrift</legend>
        <AddressFields feedback={feedback} />
      </fieldset>
      {duplicate && (
        <div className="duplicate-warning" role="alert">
          <strong>Mögliche Dublette erkannt</strong>
          <p>Prüfen Sie zuerst die Suchtreffer. Eine weitere Identität wird nur nach Ihrer ausdrücklichen Bestätigung angelegt.</p>
          <div className="button-row">
            <button className="button" type="button" onClick={() => setDuplicate(false)}>Anlage abbrechen</button>
            <button className="button button--primary" type="button" onClick={() => void submit(true)}>Bewusst trotzdem anlegen</button>
          </div>
        </div>
      )}
      <button className="button button--primary button--full" type="submit">Beteiligte Identität anlegen</button>
    </form>
  )
}

function PartyDetails({ party, onChanged, onError, onSuccess }: PartyMutationProps) {
  const value = party.value
  return (
    <article className="selected-party">
      <header>
        <span className="party-avatar" aria-hidden="true">{value.partyType === 'Organization' ? 'O' : 'P'}</span>
        <div><p>Ausgewählte Identität · {value.partyType === 'NaturalPerson' ? 'Natürliche Person' : 'Organisation'}</p><h4>{partyDisplayName(value)}</h4></div>
        <span className="version-chip">Version {value.version}</span>
      </header>
      <div className="address-cards">
        {value.addresses.map((address) => <AddressCard key={address.id} address={address} />)}
      </div>
      <PartyCorrectionForm party={party} onChanged={onChanged} onError={onError} onSuccess={onSuccess} />
      <AddressAddForm party={party} onChanged={onChanged} onError={onError} onSuccess={onSuccess} />
      {value.addresses.map((address) => (
        <AddressCorrectionForm key={address.id} party={party} address={address} onChanged={onChanged} onError={onError} onSuccess={onSuccess} />
      ))}
      <details className="history-disclosure">
        <summary>Fachrevisionen <span>{value.revisions.length}</span></summary>
        <ol className="revision-list">
          {value.revisions.map((revision) => <li key={revision.id}><strong>Version {revision.resultingVersion} · {revision.mutationType}</strong><span>{revision.reason ?? 'Anlage'} · {new Date(revision.occurredAtUtc).toLocaleString('de-DE')}</span></li>)}
        </ol>
      </details>
    </article>
  )
}

function PartyCorrectionForm({ party, onChanged, onError, onSuccess }: PartyMutationProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, { firstName: 'firstName', lastName: 'lastName', organizationName: 'organizationName', reason: 'reason' }, onError)
  const value = party.value
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    feedback.clear()
    try {
      onChanged(await correctParty(value.id, party.etag, {
        firstName: value.partyType === 'NaturalPerson' ? data.get('firstName') : null,
        lastName: value.partyType === 'NaturalPerson' ? data.get('lastName') : null,
        organizationName: value.partyType === 'Organization' ? data.get('organizationName') : null,
        reason: data.get('reason'),
      }))
      onSuccess('Namenskorrektur gespeichert.')
    } catch (error) { feedback.report(error) }
  }
  return (
    <details className="action-disclosure">
      <summary>Namensangaben korrigieren <span aria-hidden="true">＋</span></summary>
      <form ref={formRef} className="compact-form compact-form--inset" onSubmit={(event) => void submit(event)}>
        <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
        <div className="compact-form-grid">
          {value.partyType === 'NaturalPerson' ? (
            <>
              <label>Vorname<input name="firstName" defaultValue={value.firstName ?? ''} required {...feedback.fieldProps('firstName')} />{feedback.fieldErrors('firstName')}</label>
              <label>Nachname<input name="lastName" defaultValue={value.lastName ?? ''} required {...feedback.fieldProps('lastName')} />{feedback.fieldErrors('lastName')}</label>
            </>
          ) : <label className="field--wide">Organisationsname<input name="organizationName" defaultValue={value.organizationName ?? ''} required {...feedback.fieldProps('organizationName')} />{feedback.fieldErrors('organizationName')}</label>}
          <label className="field--wide">Begründung<input name="reason" required {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label>
        </div>
        <button className="button button--primary" type="submit">Namen historisiert korrigieren</button>
      </form>
    </details>
  )
}

function AddressAddForm({ party, onChanged, onError, onSuccess }: PartyMutationProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, addressFieldMap, onError)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    feedback.clear()
    try {
      onChanged(await addPartyAddress(party.value.id, party.etag, { address: addressInput(data), reason: data.get('reason') }))
      onSuccess('Adresse historisiert ergänzt.')
    } catch (error) { feedback.report(error) }
  }
  return (
    <details className="action-disclosure">
      <summary>Adresszeitraum hinzufügen <span aria-hidden="true">＋</span></summary>
      <form ref={formRef} className="compact-form compact-form--inset" onSubmit={(event) => void submit(event)}>
        <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
        <AddressFields feedback={feedback} includeReason />
        <button className="button button--primary" type="submit">Adresse historisiert ergänzen</button>
      </form>
    </details>
  )
}

function AddressCorrectionForm({ party, address, onChanged, onError, onSuccess }: PartyMutationProps & { address: PartyAddress }) {
  const formRef = useRef<HTMLFormElement>(null)
  const feedback = useFormFeedback(formRef, addressFieldMap, onError)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    feedback.clear()
    try {
      onChanged(await correctPartyAddress(party.value.id, address.id, party.etag, { address: addressInput(data), reason: data.get('reason') }))
      onSuccess('Adresskorrektur gespeichert.')
    } catch (error) { feedback.report(error) }
  }
  return (
    <details className="action-disclosure">
      <summary>Adresse {address.street} {address.houseNumber} korrigieren <span aria-hidden="true">＋</span></summary>
      <form ref={formRef} className="compact-form compact-form--inset" onSubmit={(event) => void submit(event)}>
        <FormErrorSummary feedback={feedback.feedback} summaryRef={feedback.summaryRef} />
        <AddressFields feedback={feedback} initial={address} includeReason />
        <button className="button button--primary" type="submit">Adresse historisiert korrigieren</button>
      </form>
    </details>
  )
}

const addressFieldMap = {
  street: 'street', houseNumber: 'houseNumber', postalCode: 'postalCode', city: 'city', additionalInformation: 'additionalInformation',
  validFromInclusive: 'validFromInclusive', validUntilExclusive: 'validUntilExclusive', reason: 'reason', address: null, reference: null,
}

type Feedback = ReturnType<typeof useFormFeedback>

function AddressFields({ feedback, initial, includeReason = false }: { feedback: Feedback; initial?: PartyAddress; includeReason?: boolean }) {
  return (
    <div className="compact-form-grid">
      <label className="field--wide">Straße<input name="street" autoComplete="street-address" defaultValue={initial?.street} required {...feedback.fieldProps('street')} />{feedback.fieldErrors('street')}</label>
      <label>Hausnummer<input name="houseNumber" defaultValue={initial?.houseNumber} required {...feedback.fieldProps('houseNumber')} />{feedback.fieldErrors('houseNumber')}</label>
      <label>Postleitzahl<input name="postalCode" autoComplete="postal-code" defaultValue={initial?.postalCode} required {...feedback.fieldProps('postalCode')} />{feedback.fieldErrors('postalCode')}</label>
      <label>Ort<input name="city" autoComplete="address-level2" defaultValue={initial?.city} required {...feedback.fieldProps('city')} />{feedback.fieldErrors('city')}</label>
      <label className="field--wide">Adresszusatz <span className="optional-label">optional</span><input name="additionalInformation" defaultValue={initial?.additionalInformation ?? ''} {...feedback.fieldProps('additionalInformation')} />{feedback.fieldErrors('additionalInformation')}</label>
      <label>Gültig ab<input name="validFromInclusive" type="date" defaultValue={initial?.validFromInclusive} required {...feedback.fieldProps('validFromInclusive')} />{feedback.fieldErrors('validFromInclusive')}</label>
      <label>Gültig bis <span className="optional-label">exklusiv, optional</span><input name="validUntilExclusive" type="date" defaultValue={initial?.validUntilExclusive ?? ''} {...feedback.fieldProps('validUntilExclusive')} />{feedback.fieldErrors('validUntilExclusive')}</label>
      <label className="checkbox-field field--wide"><input name="isCurrentPrimary" type="checkbox" defaultChecked={initial?.isCurrentPrimary} /><span>Als aktuelle Hauptanschrift kennzeichnen</span></label>
      {includeReason && <label className="field--wide">Begründung<input name="reason" required {...feedback.fieldProps('reason')} />{feedback.fieldErrors('reason')}</label>}
    </div>
  )
}

function AddressCard({ address }: { address: PartyAddress }) {
  return (
    <div className={address.isCurrentPrimary ? 'address-card address-card--primary' : 'address-card'}>
      <div><strong>{address.street} {address.houseNumber}</strong><span>{address.postalCode} {address.city}</span></div>
      <small>Gültig ab {address.validFromInclusive}{address.validUntilExclusive ? ` bis ${address.validUntilExclusive} (exklusiv)` : ''}</small>
      {address.isCurrentPrimary && <span className="status-chip status-chip--active">Hauptanschrift</span>}
    </div>
  )
}

function addressInput(data: FormData) {
  return {
    street: data.get('street'), houseNumber: data.get('houseNumber'), postalCode: data.get('postalCode'), city: data.get('city'),
    additionalInformation: data.get('additionalInformation') || null, validFromInclusive: data.get('validFromInclusive'),
    validUntilExclusive: data.get('validUntilExclusive') || null, isCurrentPrimary: data.get('isCurrentPrimary') === 'on',
  }
}
