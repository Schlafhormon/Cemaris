import { useEffect, useState, type ReactNode } from 'react'
import { ApiError, getCaseDetails } from '../api/cemarisApi'
import { LastChangeNotice } from '../components/LastChangeNotice'
import { PersonUsageRightsPanel } from '../components/PersonUsageRightsPanel'
import type {
  AddressDetails,
  CaseOverview,
  EntitledPersonDetails,
} from '../types/cases'

interface CaseDetailsPageProps {
  caseId: string
  caseEditingEnabled?: boolean
  burialProcessEditingEnabled?: boolean
  personUsageRightsEditingEnabled?: boolean
}

function displayValue(value: ReactNode) {
  return value === null || value === undefined || value === '' ? (
    <span className="missing-value">Nicht angegeben</span>
  ) : (
    value
  )
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('de-DE').format(new Date(`${value}T00:00:00`))
    : null
}

function formatName(person: {
  firstName: string | null
  lastName: string | null
  organizationName?: string | null
}) {
  return (
    [person.firstName, person.lastName].filter(Boolean).join(' ') ||
    person.organizationName ||
    null
  )
}

function formatAddress(address: AddressDetails) {
  const street = [address.street, address.houseNumber].filter(Boolean).join(' ')
  const city = [address.postalCode, address.city].filter(Boolean).join(' ')
  return [street, city, address.additionalInformation].filter(Boolean).join(', ')
}

function formatAmount(amount: number | null, currencyCode: string | null) {
  if (amount === null) {
    return null
  }

  if (!currencyCode) {
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(amount)
  }

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount)
}

function DetailsList({ children }: { children: ReactNode }) {
  return <dl className="detail-list">{children}</dl>
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{displayValue(children)}</dd>
    </div>
  )
}

function entitledName(person: EntitledPersonDetails | undefined) {
  return person ? formatName(person) : null
}

function searchReturnUrl() {
  const returnTo = new URLSearchParams(window.location.search).get('returnTo')
  if (!returnTo) {
    return '/search'
  }

  try {
    const url = new URL(returnTo, window.location.origin)
    return url.origin === window.location.origin && url.pathname === '/search'
      ? `${url.pathname}${url.search}`
      : '/search'
  } catch {
    return '/search'
  }
}

export function CaseDetailsPage({ caseId, caseEditingEnabled = false, burialProcessEditingEnabled = false, personUsageRightsEditingEnabled = false }: CaseDetailsPageProps) {
  const returnTo = searchReturnUrl()
  const [caseOverview, setCaseOverview] = useState<CaseOverview>()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setNotFound(false)
    setError(false)

    getCaseDetails(caseId, controller.signal)
      .then((response) => {
        setCaseOverview(response.caseOverview)
        setLoading(false)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return
        }

        setNotFound(requestError instanceof ApiError && requestError.status === 404)
        setError(!(requestError instanceof ApiError && requestError.status === 404))
        setLoading(false)
      })

    return () => controller.abort()
  }, [caseId])

  if (loading) {
    return <div className="state-message detail-state">Detailansicht wird geladen …</div>
  }

  if (notFound) {
    return (
      <div className="state-message detail-state">
        Der angeforderte Fall wurde nicht gefunden. <a href={returnTo}>Zur Suche</a>
      </div>
    )
  }

  if (error || !caseOverview) {
    return (
      <div className="state-message state-message--error detail-state" role="alert">
        Die Detailansicht konnte nicht geladen werden. <a href={returnTo}>Zur Suche</a>
      </div>
    )
  }

  const deceasedById = new Map(
    caseOverview.deceasedPersons.map((person) => [person.id, person]),
  )
  const entitledById = new Map(
    caseOverview.entitledPersons.map((person) => [person.id, person]),
  )

  return (
    <div className="work-page detail-page">
      <nav className="work-page-toolbar" aria-label="Seitennavigation"><a className="button button--back" href={returnTo}><span aria-hidden="true">←</span> Zurück zur Suche</a></nav>
      <div className="work-page-heading">
        <div>
          <p className="eyebrow">Lesende Detailansicht</p>
          <h1>
            {caseOverview.grave.cemetery ?? 'Friedhof fehlt'} ·{' '}
            {caseOverview.grave.field ?? 'Feld fehlt'} ·{' '}
            {caseOverview.grave.graveNumber ?? 'Grabnummer fehlt'}
          </h1>
          <p className="technical-id">Technische Fall-ID: {caseOverview.id}</p>
        </div>
        {caseOverview.isSynthetic && (
          <div className="synthetic-badge" role="note">
            Ausschließlich synthetische Daten
          </div>
        )}
      </div>

      {(caseEditingEnabled || burialProcessEditingEnabled) && caseOverview.isSynthetic && (
        <div className="detail-actions">
          <a
            className="button button--primary"
            href={`/cases/${encodeURIComponent(caseId)}/edit?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Fallakte bearbeiten
          </a>
        </div>
      )}

      <LastChangeNotice lastChange={caseOverview.lastChange} />

      {caseOverview.dataQualityNotes.length > 0 && (
        <aside className="data-quality-notes" aria-labelledby="quality-heading">
          <h2 id="quality-heading">Hinweise zu Daten und Beziehungen</h2>
          <ul>
            {caseOverview.dataQualityNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </aside>
      )}

      <div className="detail-sections">
        {personUsageRightsEditingEnabled && caseOverview.grave.graveSiteId && <PersonUsageRightsPanel graveSiteId={caseOverview.grave.graveSiteId} />}
        <section className="detail-section">
          <h2>Grabstelle</h2>
          <DetailsList>
            <DetailField label="Friedhof">{caseOverview.grave.cemetery}</DetailField>
            <DetailField label="Feld">{caseOverview.grave.field}</DetailField>
            <DetailField label="Grabnummer">{caseOverview.grave.graveNumber}</DetailField>
          </DetailsList>
        </section>

        <section className="detail-section">
          <h2>Verstorbene</h2>
          {caseOverview.deceasedPersons.length === 0 ? (
            <p className="missing-value">Keine verstorbene Person zugeordnet.</p>
          ) : (
            caseOverview.deceasedPersons.map((person) => (
              <article className="detail-record" key={person.id}>
                <h3>{displayValue(formatName(person))}</h3>
                <DetailsList>
                  <DetailField label="Technische ID">{person.id}</DetailField>
                  <DetailField label="Vorname">{person.firstName}</DetailField>
                  <DetailField label="Name">{person.lastName}</DetailField>
                  <DetailField label="Geburtsdatum">{formatDate(person.birthDate)}</DetailField>
                  <DetailField label="Sterbedatum">{formatDate(person.deathDate)}</DetailField>
                </DetailsList>
              </article>
            ))
          )}
        </section>

        <section className="detail-section">
          <h2>Beisetzungen</h2>
          {caseOverview.burials.length === 0 ? (
            <p className="missing-value">Keine Beisetzung vorhanden.</p>
          ) : (
            caseOverview.burials.map((burial) => {
              const deceased = burial.deceasedPersonId
                ? deceasedById.get(burial.deceasedPersonId)
                : undefined

              return (
                <article className="detail-record" key={burial.id}>
                  <DetailsList>
                    <DetailField label="Technische ID">{burial.id}</DetailField>
                    <DetailField label="Beisetzungsdatum">
                      {formatDate(burial.burialDate)}
                    </DetailField>
                    <DetailField label="Prozessstatus">{burial.status ? processStatusLabel(burial.status) : 'Altbestand – nicht übernommen'}</DetailField>
                    <DetailField label="Planungstag">{formatDate(burial.planningDate)}</DetailField>
                    <DetailField label="Kanonische Grabstelle">{burial.graveSiteId}</DetailField>
                    <DetailField label="Zugeordnete verstorbene Person">
                      {deceased ? formatName(deceased) : null}
                    </DetailField>
                  </DetailsList>
                  {!deceased && (
                    <p className="relationship-warning">Beziehung nicht vollständig.</p>
                  )}
                </article>
              )
            })
          )}
        </section>

        <section className="detail-section">
          <h2>Vorläufige Altprojektion: Nutzungsrechte / Laufzeiten</h2>
          {caseOverview.usageRights.length === 0 ? (
            <p className="missing-value">Keine Nutzungsrechte vorhanden.</p>
          ) : (
            caseOverview.usageRights.map((usageRight) => {
              const holders = usageRight.entitledPersonIds.map((id) => entitledById.get(id))
              const hasMissingHolder = holders.some((holder) => !holder)

              return (
                <article className="detail-record" key={usageRight.id}>
                  <DetailsList>
                    <DetailField label="Technische ID">{usageRight.id}</DetailField>
                    <DetailField label="Technische Referenz">{usageRight.reference}</DetailField>
                    <DetailField label="Gültig ab">{formatDate(usageRight.validFrom)}</DetailField>
                    <DetailField label="Gültig bis">{formatDate(usageRight.validUntil)}</DetailField>
                    <DetailField label="Zugeordnete Berechtigte">
                      {holders.map(entitledName).filter(Boolean).join(', ') || null}
                    </DetailField>
                  </DetailsList>
                  {hasMissingHolder && (
                    <p className="relationship-warning">
                      Mindestens ein Berechtigtenbezug ist nicht auflösbar.
                    </p>
                  )}
                </article>
              )
            })
          )}
        </section>

        <section className="detail-section detail-section--wide">
          <h2>Vorläufige Altprojektion: Berechtigte / Adressen</h2>
          {caseOverview.entitledPersons.length === 0 ? (
            <p className="missing-value">Keine berechtigte Person zugeordnet.</p>
          ) : (
            caseOverview.entitledPersons.map((person) => (
              <article className="detail-record" key={person.id}>
                <h3>{displayValue(formatName(person))}</h3>
                <DetailsList>
                  <DetailField label="Technische ID">{person.id}</DetailField>
                  <DetailField label="Vorname">{person.firstName}</DetailField>
                  <DetailField label="Name">{person.lastName}</DetailField>
                  <DetailField label="Organisation">{person.organizationName}</DetailField>
                </DetailsList>
                <h4>Anschriften</h4>
                {person.addresses.length > 0 ? (
                  <ul className="address-list">
                    {person.addresses.map((address) => (
                      <li key={address.id}>{displayValue(formatAddress(address))}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="missing-value">Keine Anschrift vorhanden.</p>
                )}
              </article>
            ))
          )}
        </section>

        <section className="detail-section detail-section--wide">
          <h2>Bescheide / Gebühreninformationen</h2>
          {caseOverview.notices.length === 0 ? (
            <p className="missing-value">Keine Bescheidinformationen vorhanden.</p>
          ) : (
            caseOverview.notices.map((notice) => (
              <article className="detail-record" key={notice.id}>
                <DetailsList>
                  <DetailField label="Technische ID">{notice.id}</DetailField>
                  <DetailField label="Bescheidnummer">{notice.noticeNumber}</DetailField>
                  <DetailField label="Bescheiddatum">{formatDate(notice.noticeDate)}</DetailField>
                  <DetailField label="Fälligkeit">{formatDate(notice.dueDate)}</DetailField>
                  <DetailField label="Festgesetzter Betrag">
                    {formatAmount(notice.assessedAmount, notice.currencyCode)}
                  </DetailField>
                </DetailsList>
                <h4>Gebührenpositionen</h4>
                {notice.feeItems.length > 0 ? (
                  <table className="fee-table">
                    <thead>
                      <tr>
                        <th>Bezeichnung</th>
                        <th>Betrag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notice.feeItems.map((feeItem) => (
                        <tr key={feeItem.id}>
                          <td>{displayValue(feeItem.description)}</td>
                          <td>{displayValue(formatAmount(feeItem.amount, feeItem.currencyCode))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="missing-value">Keine Gebührenpositionen vorhanden.</p>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  )
}

function processStatusLabel(status: string) {
  return ({ Draft: 'Entwurf', Planned: 'Geplant', Confirmed: 'Bestätigt', Performed: 'Durchgeführt', Completed: 'Abgeschlossen' } as Record<string, string>)[status] ?? status
}
