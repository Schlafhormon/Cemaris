import { SystemStatusCard } from '../features/system/SystemStatusCard'

const foundations = [
  {
    title: 'Browserbasiert',
    text: 'Zentrale Bereitstellung für moderne kommunale Arbeitsplätze.',
  },
  {
    title: 'Modularer Monolith',
    text: 'Klare Grenzen ohne verfrühte Microservice-Komplexität.',
  },
  {
    title: 'SQL Server',
    text: 'Vorbereitet für bestehende kommunale Infrastrukturen.',
  },
  {
    title: 'Offene Adapter',
    text: 'DMS und Identität bleiben austauschbare Integrationen.',
  },
]

export function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Open Source · On-Premises · Kommunal</p>
          <h1 id="page-title">Cemaris</h1>
          <p className="hero-subtitle">
            Open-Source-Friedhofsverwaltung für Kommunen
          </p>

          <div className="phase-notice" role="note">
            <span className="phase-notice-icon" aria-hidden="true">
              i
            </span>
            <p>
              <strong>Frühe Projektphase.</strong> Cemaris befindet sich derzeit
              in der Konzeptions- und Anforderungsanalyse. Funktionen und
              Datenmodell sind noch nicht für den Produktivbetrieb freigegeben.
            </p>
          </div>
        </div>

        <SystemStatusCard />
      </section>

      <section className="foundations" aria-labelledby="foundations-heading">
        <div className="section-heading">
          <h2 id="foundations-heading">Technische Grundlage</h2>
          <p>
            Eine belastbare Basis für die fachliche Arbeit – bewusst noch ohne
            erfundene Friedhofsprozesse.
          </p>
        </div>

        <div className="foundation-grid">
          {foundations.map((foundation, index) => (
            <article className="foundation-card" key={foundation.title}>
              <span className="foundation-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{foundation.title}</h3>
              <p>{foundation.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="next-step" aria-labelledby="next-step-heading">
        <p className="next-step-label">Nächster Schritt</p>
        <div>
          <h2 id="next-step-heading">
            EDWAL-Bestandsaufnahme und fachliche Bedarfsanalyse
          </h2>
          <p>
            Erst wenn Prozesse, Daten und Anforderungen verstanden sind, werden
            Fachmodell und Kernfunktionen definiert.
          </p>
        </div>
      </section>
    </>
  )
}
