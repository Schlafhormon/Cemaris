import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError, addPartyAddress, createParty, createUsageRight, correctUsageRight, extendUsageRight, getParty, getUsageRightByGraveSite, searchParties, transferUsageRight } from '../api/cemarisApi'
import type { Party, PartySearchItem, PartyType, UsageRight, Versioned } from '../types/personUsageRights'

export function PersonUsageRightsPanel({ graveSiteId }: { graveSiteId: string }) {
  const [right, setRight] = useState<Versioned<UsageRight> | null>()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PartySearchItem[]>([])
  const [party, setParty] = useState<Versioned<Party> | null>()
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success')
  const [conflict, setConflict] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)

  const reload = () => getUsageRightByGraveSite(graveSiteId).then(setRight).catch(handleError)
  useEffect(() => {
    getUsageRightByGraveSite(graveSiteId).then(setRight).catch((error: unknown) => {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Das kanonische Nutzungsrecht konnte nicht geladen werden.')
    })
  }, [graveSiteId])
  useEffect(() => { if (conflict) alertRef.current?.focus() }, [conflict])

  function handleError(error: unknown) {
    setMessageTone('error')
    if (error instanceof ApiError && error.status === 412) { setConflict(true); setMessage('Der Datensatz wurde zwischenzeitlich geändert. Bitte neu laden; Ihre Eingaben wurden nicht überschrieben.') }
    else { setConflict(false); setMessage(error instanceof Error ? error.message : 'Die Aktion konnte nicht ausgeführt werden.') }
  }

  async function find(event: FormEvent) {
    event.preventDefault(); const controller = new AbortController()
    try { setResults(await searchParties(query, controller.signal)); setMessage('') } catch (error) { handleError(error) }
  }

  async function selectParty(id: string) {
    try { setParty(await getParty(id)); setMessage('') } catch (error) { handleError(error) }
  }

  return (
    <section className="detail-section detail-section--wide usage-right-workspace" aria-labelledby="canonical-right-heading">
      <header className="usage-right-header">
        <div>
          <p className="section-kicker">Beteiligte und Nutzungsrecht</p>
          <h2 id="canonical-right-heading">Kanonisches Nutzungsrecht</h2>
          <p>Manuell erfasster, historisierter 5b-Kern. Es werden keine Laufzeit, kein Status und keine Wiedervorlage berechnet.</p>
        </div>
        <span className="scope-badge">Manueller Nachweis</span>
      </header>

      {message && <div ref={alertRef} tabIndex={-1} className={`workspace-message${messageTone === 'error' ? ' workspace-message--error' : ''}`} role={messageTone === 'error' ? 'alert' : 'status'}><span>{message}</span>{conflict && <button className="button" type="button" onClick={() => { setConflict(false); setMessage(''); reload() }}>Aktuellen Stand neu laden</button>}</div>}

      <div className="usage-right-layout">
        <div className="usage-right-main">
          <section className="workspace-card" aria-labelledby="right-status-heading">
            <div className="workspace-card-heading">
              <div><span className="step-number" aria-hidden="true">1</span><div><h3 id="right-status-heading">Nutzungsrecht</h3><p>Aktueller manueller Stand und unveränderliche Fachhistorie</p></div></div>
              {right && <span className="status-chip status-chip--active">Offen · Version {right.value.version}</span>}
            </div>
            {right === undefined ? <p className="workspace-empty" role="status">Recht wird geladen …</p> : right ? <RightDetails right={right} party={party} onChanged={(value) => { setRight(value); setMessage('Änderung gespeichert.'); setMessageTone('success'); setConflict(false) }} onError={handleError} /> : <div className="workspace-empty"><strong>Noch kein Nutzungsrecht erfasst</strong><span>Wählen oder erfassen Sie zuerst einen Beteiligten. Anschließend kann das Recht angelegt werden.</span></div>}
          </section>

          <section className="workspace-card" aria-labelledby="party-selection-heading">
            <div className="workspace-card-heading">
              <div><span className="step-number" aria-hidden="true">2</span><div><h3 id="party-selection-heading">Beteiligten auswählen</h3><p>Fallübergreifende Identität suchen oder neu erfassen</p></div></div>
              {party && <span className="status-chip">Ausgewählt</span>}
            </div>
            <form className="party-search-form" onSubmit={(event) => void find(event)}>
              <label htmlFor="party-search">Name des Beteiligten</label>
              <div className="search-control">
                <input id="party-search" value={query} onChange={(event) => setQuery(event.target.value)} minLength={2} placeholder="Mindestens zwei Zeichen" required />
                <button className="button button--primary" type="submit">Suchen</button>
              </div>
            </form>
            {results.length > 0 && <div className="party-results" role="region" aria-label="Gefundene Beteiligte"><p>{results.length} {results.length === 1 ? 'Treffer' : 'Treffer'}</p><ul>{results.map((item) => <li key={item.id}><button type="button" onClick={() => void selectParty(item.id)}><span><strong>{item.displayName}</strong><small>{item.partyType === 'NaturalPerson' ? 'Natürliche Person' : 'Organisation'}{item.currentPrimaryAddress && ` · ${item.currentPrimaryAddress}`}</small></span><span aria-hidden="true">Auswählen →</span></button></li>)}</ul></div>}
            {party && <PartyDetails party={party} onChanged={setParty} onError={handleError} />}
          </section>

          {!right && party && <section className="workspace-card workspace-card--accent" aria-labelledby="right-create-heading"><div className="workspace-card-heading"><div><span className="step-number" aria-hidden="true">3</span><div><h3 id="right-create-heading">Nutzungsrecht anlegen</h3><p>Manuellen Zeitraum und Quelle verbindlich erfassen</p></div></div></div><RightCreateForm graveSiteId={graveSiteId} partyId={party.value.id} onCreated={(value) => { setRight(value); setMessage('Nutzungsrecht angelegt.'); setMessageTone('success') }} onError={handleError} /></section>}
        </div>

        <aside className="usage-right-sidebar" aria-label="Neue beteiligte Identität">
          <PartyCreateForm onCreated={(value) => { setParty(value); setResults([]); setMessage('Beteiligte Identität angelegt.'); setMessageTone('success') }} onError={handleError} />
        </aside>
      </div>
    </section>
  )
}

function PartyCreateForm({ onCreated, onError }: { onCreated: (value: Versioned<Party>) => void; onError: (error: unknown) => void }) {
  const [type, setType] = useState<PartyType>('NaturalPerson')
  const [duplicate, setDuplicate] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  async function submit(event: FormEvent, confirm = false) {
    event.preventDefault(); const data = new FormData(formRef.current!); const address = { street: data.get('street'), houseNumber: data.get('houseNumber'), postalCode: data.get('postalCode'), city: data.get('city'), additionalInformation: data.get('additionalInformation') || null, validFromInclusive: data.get('validFromInclusive'), validUntilExclusive: data.get('validUntilExclusive') || null, isCurrentPrimary: data.get('isCurrentPrimary') === 'on' }
    try { const value = await createParty({ partyType: type, firstName: type === 'NaturalPerson' ? data.get('firstName') : null, lastName: type === 'NaturalPerson' ? data.get('lastName') : null, organizationName: type === 'Organization' ? data.get('organizationName') : null, addresses: [address], confirmPossibleDuplicate: confirm }); setDuplicate(false); onCreated(value); formRef.current?.reset() }
    catch (error) { if (error instanceof ApiError && error.code === 'possible-party-duplicate') setDuplicate(true); else onError(error) }
  }
  return <form ref={formRef} className="compact-form party-create-card" onSubmit={(event) => void submit(event)}>
    <div className="sidebar-heading"><p className="section-kicker">Nicht gefunden?</p><h3>Neue Identität erfassen</h3><p>Diese Identität steht anschließend fallübergreifend zur Verfügung.</p></div>
    <fieldset className="form-section"><legend>Namensangaben</legend><div className="compact-form-grid">
      <label className="field--wide">Art<select value={type} onChange={(event) => setType(event.target.value as PartyType)}><option value="NaturalPerson">Natürliche Person</option><option value="Organization">Organisation</option></select></label>
      {type === 'NaturalPerson' ? <><label>Vorname<input name="firstName" autoComplete="given-name" required /></label><label>Nachname<input name="lastName" autoComplete="family-name" required /></label></> : <label className="field--wide">Organisationsname<input name="organizationName" autoComplete="organization" required /></label>}
    </div></fieldset>
    <fieldset className="form-section"><legend>Erste Anschrift</legend><div className="compact-form-grid">
      <label className="field--wide">Straße<input name="street" autoComplete="street-address" required /></label><label>Hausnummer<input name="houseNumber" required /></label><label>Postleitzahl<input name="postalCode" autoComplete="postal-code" required /></label><label>Ort<input name="city" autoComplete="address-level2" required /></label><label className="field--wide">Adresszusatz <span className="optional-label">optional</span><input name="additionalInformation" /></label>
      <label>Gültig ab<input name="validFromInclusive" type="date" required /></label><label>Gültig bis <span className="optional-label">exklusiv, optional</span><input name="validUntilExclusive" type="date" /></label><label className="checkbox-field field--wide"><input name="isCurrentPrimary" type="checkbox" /><span>Als aktuelle Hauptanschrift kennzeichnen</span></label>
    </div></fieldset>
    {duplicate && <div className="duplicate-warning" role="alert"><strong>Mögliche Dublette erkannt</strong><p>Prüfen Sie zuerst die Suchtreffer. Eine weitere Identität wird nur nach Ihrer ausdrücklichen Bestätigung angelegt.</p><button className="button" type="button" onClick={(event) => void submit(event, true)}>Bewusst trotzdem anlegen</button></div>}
    <button className="button button--primary button--full" type="submit">Beteiligte Identität anlegen</button>
  </form>
}

function PartyDetails({ party, onChanged, onError }: { party: Versioned<Party>; onChanged: (value: Versioned<Party>) => void; onError: (error: unknown) => void }) {
  const value = party.value
  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    try { onChanged(await addPartyAddress(value.id, party.etag, { address: { street: data.get('street'), houseNumber: data.get('houseNumber'), postalCode: data.get('postalCode'), city: data.get('city'), additionalInformation: null, validFromInclusive: data.get('validFromInclusive'), validUntilExclusive: data.get('validUntilExclusive') || null, isCurrentPrimary: data.get('isCurrentPrimary') === 'on' }, reason: data.get('reason') })) } catch (error) { onError(error) }
  }
  return <article className="selected-party"><header><span className="party-avatar" aria-hidden="true">{value.partyType === 'Organization' ? 'O' : 'P'}</span><div><p>Ausgewählte Identität</p><h4>{value.organizationName ?? `${value.firstName} ${value.lastName}`}</h4></div><span className="version-chip">Version {value.version}</span></header>
    <div className="address-cards">{value.addresses.map((address) => <div className={address.isCurrentPrimary ? 'address-card address-card--primary' : 'address-card'} key={address.id}><div><strong>{address.street} {address.houseNumber}</strong><span>{address.postalCode} {address.city}</span></div><small>Gültig ab {address.validFromInclusive}{address.validUntilExclusive ? ` bis ${address.validUntilExclusive} (exklusiv)` : ''}</small>{address.isCurrentPrimary && <span className="status-chip status-chip--active">Hauptanschrift</span>}</div>)}</div>
    <details className="action-disclosure"><summary>Adresszeitraum hinzufügen <span aria-hidden="true">＋</span></summary><form className="compact-form compact-form--inset" onSubmit={(event) => void addAddress(event)}><div className="compact-form-grid"><label className="field--wide">Straße<input name="street" required /></label><label>Hausnummer<input name="houseNumber" required /></label><label>Postleitzahl<input name="postalCode" required /></label><label>Ort<input name="city" required /></label><label>Gültig ab<input name="validFromInclusive" type="date" required /></label><label>Gültig bis <span className="optional-label">exklusiv, optional</span><input name="validUntilExclusive" type="date" /></label><label className="checkbox-field field--wide"><input name="isCurrentPrimary" type="checkbox" /><span>Aktuelle Hauptanschrift</span></label><label className="field--wide">Begründung<input name="reason" required /></label></div><button className="button button--primary" type="submit">Adresse historisiert ergänzen</button></form></details>
    <details className="history-disclosure"><summary>Fachrevisionen <span>{value.revisions.length}</span></summary><ol className="revision-list">{value.revisions.map((revision) => <li key={revision.id}><strong>Version {revision.resultingVersion} · {revision.mutationType}</strong><span>{revision.reason ?? 'Anlage'} · {new Date(revision.occurredAtUtc).toLocaleString('de-DE')}</span></li>)}</ol></details>
  </article>
}

function RightCreateForm({ graveSiteId, partyId, onCreated, onError }: { graveSiteId: string; partyId: string; onCreated: (value: Versioned<UsageRight>) => void; onError: (error: unknown) => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); try { onCreated(await createUsageRight({ graveSiteId, holderPartyId: partyId, startDate: data.get('startDate'), endDate: data.get('endDate'), sourceReference: data.get('sourceReference') })) } catch (error) { onError(error) } }
  return <form className="compact-form" onSubmit={(event) => void submit(event)}><div className="compact-form-grid compact-form-grid--three"><label>Beginn<input name="startDate" type="date" required /></label><label>Manuell erfasstes Ende<input name="endDate" type="date" required /></label><label>Quellenreferenz<input name="sourceReference" required /></label></div><div className="form-submit-row"><p>Der aktuell ausgewählte Beteiligte wird als erster Inhaber eingetragen.</p><button className="button button--primary" type="submit">Nutzungsrecht anlegen</button></div></form>
}

function RightDetails({ right, party, onChanged, onError }: { right: Versioned<UsageRight>; party: Versioned<Party> | null | undefined; onChanged: (value: Versioned<UsageRight>) => void; onError: (error: unknown) => void }) {
  const value = right.value
  async function mutate(event: FormEvent<HTMLFormElement>, kind: 'transfer' | 'extend' | 'correct') { event.preventDefault(); const data = new FormData(event.currentTarget); try { const next = kind === 'transfer' ? await transferUsageRight(value.id, right.etag, { newHolderPartyId: party?.value.id, validFromInclusive: data.get('validFromInclusive'), reason: data.get('reason') }) : kind === 'extend' ? await extendUsageRight(value.id, right.etag, { newEndDate: data.get('newEndDate'), reason: data.get('reason') }) : await correctUsageRight(value.id, right.etag, { graveSiteId: value.graveSiteId, startDate: data.get('startDate'), endDate: data.get('endDate'), sourceReference: data.get('sourceReference'), usageRightStartRuleId: value.usageRightStartRuleId, reason: data.get('reason') }); onChanged(next) } catch (error) { onError(error) } }
  return <article className="right-details"><dl className="right-facts"><div><dt>Manueller Zeitraum</dt><dd><strong>{value.startDate}</strong><span aria-hidden="true">→</span><strong>{value.endDate}</strong></dd></div><div><dt>Quellenreferenz</dt><dd>{value.sourceReference}</dd></div><div><dt>Startregel-Snapshot</dt><dd><strong>{value.startRuleCodeSnapshot}</strong><span>{value.startRuleDisplayNameSnapshot}</span></dd></div></dl>
    <div className="holder-history"><h4>Inhaberzeiträume</h4><ol>{value.holderPeriods.map((holder) => <li key={holder.id}><span className="timeline-marker" aria-hidden="true" /><div><strong>{holder.validUntilExclusive ? 'Früherer Inhaber' : 'Aktueller Inhaber'}</strong><code>{holder.partyId}</code><small>Ab {holder.validFromInclusive}{holder.validUntilExclusive ? ` bis ${holder.validUntilExclusive} (exklusiv)` : ' · aktuell'}</small></div></li>)}</ol></div>
    <div className="right-actions" aria-label="Nutzungsrecht bearbeiten">
      <details className="action-disclosure"><summary>Übertragen <span aria-hidden="true">＋</span></summary>{party ? <form className="compact-form compact-form--inset" onSubmit={(event) => void mutate(event, 'transfer')}><p className="selection-notice">Neuer Inhaber: <strong>{party.value.organizationName ?? `${party.value.firstName} ${party.value.lastName}`}</strong></p><div className="compact-form-grid"><label>Wirksam ab<input name="validFromInclusive" type="date" required /></label><label>Begründung<input name="reason" required /></label></div><button className="button button--primary" type="submit">Historisiert übertragen</button></form> : <p className="workspace-empty">Zuerst unten einen neuen Inhaber suchen und auswählen.</p>}</details>
      <details className="action-disclosure"><summary>Verlängern <span aria-hidden="true">＋</span></summary><form className="compact-form compact-form--inset" onSubmit={(event) => void mutate(event, 'extend')}><div className="compact-form-grid"><label>Neues manuelles Ende<input name="newEndDate" type="date" required /></label><label>Begründung<input name="reason" required /></label></div><button className="button button--primary" type="submit">Verlängern</button></form></details>
      <details className="action-disclosure"><summary>Fakten korrigieren <span aria-hidden="true">＋</span></summary><form className="compact-form compact-form--inset" onSubmit={(event) => void mutate(event, 'correct')}><div className="compact-form-grid compact-form-grid--three"><label>Beginn<input name="startDate" type="date" defaultValue={value.startDate} required /></label><label>Ende<input name="endDate" type="date" defaultValue={value.endDate} required /></label><label>Quellenreferenz<input name="sourceReference" defaultValue={value.sourceReference} required /></label><label className="field--wide">Begründung<input name="reason" required /></label></div><button className="button button--primary" type="submit">Fakten korrigieren</button></form></details>
    </div>
    <details className="history-disclosure"><summary>Vollständige Fachrevisionen <span>{value.revisions.length}</span></summary><ol className="revision-list">{value.revisions.map((revision) => <li key={revision.id}><strong>Version {revision.resultingVersion} · {revision.mutationType}</strong><span>{revision.reason ?? 'Anlage'} · Zeitraum {revision.startDate}–{revision.endDate} · {revision.startRuleCodeSnapshot}</span></li>)}</ol></details>
  </article>
}
