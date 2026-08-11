import { useEffect, useState, type FormEvent } from 'react'
import { searchCases } from '../api/cemarisApi'
import type {
  SearchDeceasedPerson,
  SearchFilters,
  SearchResponse,
} from '../types/cases'

const emptyFilters: SearchFilters = {
  name: '',
  firstName: '',
  birthDate: '',
  deathDate: '',
  cemetery: '',
  field: '',
  graveNumber: '',
  burialDate: '',
  entitledPerson: '',
  address: '',
  noticeNumber: '',
}

function filtersFromLocation(): SearchFilters {
  const query = new URLSearchParams(window.location.search)
  return Object.fromEntries(
    Object.keys(emptyFilters).map((key) => [key, query.get(key) ?? '']),
  ) as unknown as SearchFilters
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Nicht angegeben'
  }

  return new Intl.DateTimeFormat('de-DE').format(new Date(`${value}T00:00:00`))
}

function personName(person: SearchDeceasedPerson) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Nicht angegeben'
}

function updateLocation(filters: SearchFilters) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value.trim()) {
      query.set(key, value.trim())
    }
  }

  const queryString = query.toString()
  window.history.replaceState(null, '', `/search${queryString ? `?${queryString}` : ''}`)
}

function caseDetailsUrl(caseId: string) {
  const returnTo = `/search${window.location.search}`
  return `/cases/${encodeURIComponent(caseId)}?returnTo=${encodeURIComponent(returnTo)}`
}

export function SearchPage() {
  const initialFilters = filtersFromLocation()
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [submittedFilters, setSubmittedFilters] = useState(initialFilters)
  const [result, setResult] = useState<SearchResponse>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)

    searchCases(submittedFilters, controller.signal)
      .then((response) => {
        setResult(response)
        setLoading(false)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return
        }

        setError(true)
        setLoading(false)
      })

    return () => controller.abort()
  }, [submittedFilters])

  function setFilter(name: keyof SearchFilters, value: string) {
    setDraftFilters((current) => ({ ...current, [name]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateLocation(draftFilters)
    setSubmittedFilters({ ...draftFilters })
  }

  function reset() {
    const filters = { ...emptyFilters }
    setDraftFilters(filters)
    setSubmittedFilters(filters)
    updateLocation(filters)
  }

  return (
    <div className="work-page">
      <div className="work-page-heading">
        <div>
          <p className="eyebrow">Version 1 · Nur lesen</p>
          <h1>Fall- und Grabstellensuche</h1>
          <p>
            Filter werden mit UND verknüpft. Textwerte suchen exakt oder als
            Teiltreffer; eine unscharfe Suche findet nicht statt.
          </p>
        </div>
        <div className="synthetic-badge" role="note">
          Synthetischer Demonstrationsbestand
        </div>
      </div>

      <form className="search-form" onSubmit={submit} aria-label="Suchfilter">
        <div className="filter-grid">
          <label>
            Name
            <input
              value={draftFilters.name}
              minLength={2}
              onChange={(event) => setFilter('name', event.target.value)}
            />
          </label>
          <label>
            Vorname
            <input
              value={draftFilters.firstName}
              minLength={2}
              onChange={(event) => setFilter('firstName', event.target.value)}
            />
          </label>
          <label>
            Geburtsdatum
            <input
              type="date"
              value={draftFilters.birthDate}
              onChange={(event) => setFilter('birthDate', event.target.value)}
            />
          </label>
          <label>
            Sterbedatum
            <input
              type="date"
              value={draftFilters.deathDate}
              onChange={(event) => setFilter('deathDate', event.target.value)}
            />
          </label>
          <label>
            Friedhof
            <input
              value={draftFilters.cemetery}
              minLength={2}
              onChange={(event) => setFilter('cemetery', event.target.value)}
            />
          </label>
          <label>
            Feld
            <input
              value={draftFilters.field}
              minLength={2}
              onChange={(event) => setFilter('field', event.target.value)}
            />
          </label>
          <label>
            Grabnummer
            <input
              value={draftFilters.graveNumber}
              onChange={(event) => setFilter('graveNumber', event.target.value)}
            />
          </label>
          <label>
            Beisetzungsdatum
            <input
              type="date"
              value={draftFilters.burialDate}
              onChange={(event) => setFilter('burialDate', event.target.value)}
            />
          </label>
          <label>
            Nutzungsberechtigte
            <input
              value={draftFilters.entitledPerson}
              minLength={2}
              onChange={(event) => setFilter('entitledPerson', event.target.value)}
            />
          </label>
          <label>
            Anschrift
            <input
              value={draftFilters.address}
              minLength={2}
              onChange={(event) => setFilter('address', event.target.value)}
            />
          </label>
          <label>
            Bescheidnummer
            <input
              value={draftFilters.noticeNumber}
              onChange={(event) => setFilter('noticeNumber', event.target.value)}
            />
          </label>
        </div>

        <div className="form-actions">
          <button className="button button--primary" type="submit">
            Suchen
          </button>
          <button className="button" type="button" onClick={reset}>
            Filter zurücksetzen
          </button>
          <span>Textfilter: mindestens 2 Zeichen</span>
        </div>
      </form>

      <section className="results-panel" aria-labelledby="results-heading" aria-busy={loading}>
        <div className="results-heading">
          <h2 id="results-heading">Treffer</h2>
          {result && !loading && !error && (
            <span>
              {result.items.length} von {result.totalMatches} angezeigt
              {result.isTruncated ? ` · begrenzt auf ${result.limit}` : ''}
            </span>
          )}
        </div>

        {loading && <div className="state-message">Suche wird ausgeführt …</div>}
        {error && (
          <div className="state-message state-message--error" role="alert">
            Die Suchdaten konnten nicht geladen werden. Prüfen Sie die API-Verbindung
            und versuchen Sie es erneut.
          </div>
        )}
        {!loading && !error && result?.items.length === 0 && (
          <div className="state-message">Keine Treffer für die gesetzten Filter.</div>
        )}

        {!loading && !error && result && result.items.length > 0 && (
          <div className="result-table-wrapper">
            <table className="result-table">
              <thead>
                <tr>
                  <th>Verstorbene Person</th>
                  <th>Geburtsdatum</th>
                  <th>Sterbedatum</th>
                  <th>Friedhof</th>
                  <th>Feld</th>
                  <th>Grabnummer</th>
                  <th>Beisetzung</th>
                  <th>Nutzungsberechtigte / Anschriften</th>
                  <th>Bescheidnummer</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.caseId}>
                    <td>
                      <ul className="cell-list">
                        {item.deceasedPersons.map((person) => (
                          <li key={person.id}>{personName(person)}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul className="cell-list">
                        {item.deceasedPersons.map((person) => (
                          <li key={person.id}>{formatDate(person.birthDate)}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul className="cell-list">
                        {item.deceasedPersons.map((person) => (
                          <li key={person.id}>{formatDate(person.deathDate)}</li>
                        ))}
                      </ul>
                    </td>
                    <td>{item.cemetery ?? 'Nicht angegeben'}</td>
                    <td>{item.field ?? 'Nicht angegeben'}</td>
                    <td>
                      <a className="case-link" href={caseDetailsUrl(item.caseId)}>
                        {item.graveNumber ?? 'Nicht angegeben'}
                      </a>
                    </td>
                    <td>
                      {item.burialDates.length > 0
                        ? item.burialDates.map(formatDate).join(', ')
                        : 'Nicht angegeben'}
                    </td>
                    <td>
                      {item.entitledPersons.length > 0 ? (
                        <ul className="cell-list">
                          {item.entitledPersons.map((person) => (
                            <li key={person.id}>
                              <strong>{person.displayName}</strong>
                              {person.addresses.map((address) => (
                                <small key={address}>{address || 'Nicht angegeben'}</small>
                              ))}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        'Nicht angegeben'
                      )}
                    </td>
                    <td>
                      {item.noticeNumbers.length > 0
                        ? item.noticeNumbers.join(', ')
                        : 'Nicht angegeben'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
