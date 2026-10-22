import { appUrl } from './paths'
/* Map, GPS and range-creator flows ported from Sunrise CMS.
 * Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
 * MIT notice: /THIRD-PARTY-NOTICES.txt. Leaflet retains its BSD-2-Clause notice. */
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { request } from './api'
import type { User } from './api'
import type { Translate } from './i18n'
import { ErrorMessage, Link, Modal } from './ui'

type Row = Record<string, unknown>
const str = (row: Row, key: string) => row[key] == null ? '' : String(row[key])
const rows = (row: Row, key: string): Row[] => Array.isArray(row[key]) ? row[key] as Row[] : []
const icon = new L.Icon({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] })
function tiles(map: L.Map) {
  new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map)
}

export function LocationMap({ id, latitude, longitude }: { id: string; latitude: number; longitude: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const map = new L.Map(ref.current!, { scrollWheelZoom: false }).setView([latitude, longitude], 15)
    tiles(map); new L.Marker([latitude, longitude], { icon }).addTo(map)
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(ref.current!)
    return () => { observer.disconnect(); map.remove() }
  }, [latitude, longitude])
  return <div ref={ref} id={id} className="geo-map" data-latitude={latitude} data-longitude={longitude} />
}

export function CoordinateSelector({ options, latitude, longitude, onSelect, t }: { options: Row; latitude: string; longitude: string; onSelect: (latitude: string, longitude: string) => void; t: Translate }) {
  const [open, setOpen] = useState(false)
  return <><button type="button" id="button--selectCoordinate" onClick={() => setOpen(true)}>{t('cemaris:geoSelectCoordinate')}</button>{open && <CoordinateModal options={options} latitude={latitude} longitude={longitude} onSelect={onSelect} t={t} onClose={() => setOpen(false)} />}</>
}
function CoordinateModal({ options, latitude, longitude, onSelect, t, onClose }: { options: Row; latitude: string; longitude: string; onSelect: (latitude: string, longitude: string) => void; t: Translate; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const marker = useRef<L.Marker | null>(null)
  const [selected, setSelected] = useState('')
  useEffect(() => {
    const lat = Number(latitude), lng = Number(longitude)
    const valid = !Number.isNaN(lat) && !Number.isNaN(lng)
    const map = new L.Map(ref.current!).setView(valid ? [lat, lng] : [(Number(options.latitudeMin) + Number(options.latitudeMax)) / 2, (Number(options.longitudeMin) + Number(options.longitudeMax)) / 2], valid ? 15 : 5)
    tiles(map)
    if (valid) marker.current = new L.Marker([lat, lng], { icon }).addTo(map)
    map.on('click', (event: L.LeafletMouseEvent) => {
      marker.current?.remove(); marker.current = new L.Marker(event.latlng, { icon }).addTo(map)
      setSelected(`${event.latlng.lat.toFixed(8)}, ${event.latlng.lng.toFixed(8)}`)
    })
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(ref.current!)
    return () => { observer.disconnect(); marker.current = null; map.remove() }
  }, [latitude, longitude, options])
  return <Modal title={t('cemaris:geoSelectCoordinate')} onClose={onClose}><p className="notification info">{t('cemaris:geoClickCoordinate')}</p><div ref={ref} className="geo-map leaflet-map" id="map--selectCoordinate" /><p role="status">{selected}</p><div className="actions"><button type="button" onClick={onClose}>{t('cancel')}</button><button type="button" className="success is-update-button" onClick={() => { if (marker.current) { const point = marker.current.getLatLng(); onSelect(point.lat.toFixed(8), point.lng.toFixed(8)) }; onClose() }}>{t('cemaris:geoUpdateCoordinate')}</button></div></Modal>
}

/** Same exact ID, then successively remove the final hyphen segment. */
function highlight(svg: SVGSVGElement, key: string) {
  let current = key
  while (current) {
    const element = Array.from(svg.querySelectorAll('[id]')).find((item) => item.id === current) as SVGElement | undefined
    if (element) {
      element.style.fill = ''; element.classList.add('geo-highlight')
      for (const path of element.querySelectorAll('path')) path.style.fill = ''
      return
    }
    if (!current.includes('-')) return
    current = current.slice(0, current.lastIndexOf('-'))
  }
}
export function CemeterySvg({ filename, svgId = '', id, t }: { filename: string; svgId?: string; id?: string; t: Translate }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setError(false); ref.current?.replaceChildren()
    fetch(appUrl(`/api/cemeteries/images/${encodeURIComponent(filename)}`), { signal: controller.signal, credentials: 'same-origin' }).then(async (response) => {
      if (!response.ok) throw new Error('SVG unavailable')
      const doc = new DOMParser().parseFromString(await response.text(), 'image/svg+xml')
      if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw new Error('Invalid SVG')
      // Customization images keep their geometry/IDs but cannot execute active
      // document content when inserted in the application document.
      doc.querySelectorAll('script,foreignObject,iframe,object,embed,set,animate,animateMotion,animateTransform').forEach((element) => element.remove())
      const hasExternalUrl = (value: string) => Array.from(value.matchAll(/url\(\s*([^)]+)\)/gi)).some((match) => !match[1].trim().replace(/^['"]|['"]$/g, '').startsWith('#'))
      for (const element of [doc.documentElement, ...doc.querySelectorAll('*')]) {
        for (const attribute of Array.from(element.attributes)) {
          if (/^on/i.test(attribute.name) || /^(?:href|xlink:href)$/i.test(attribute.name) && !attribute.value.startsWith('#') || /(?:javascript:|data:text\/html)/i.test(attribute.value) || hasExternalUrl(attribute.value)) element.removeAttribute(attribute.name)
        }
      }
      for (const style of doc.querySelectorAll('style')) if (/@import/i.test(style.textContent || '') || hasExternalUrl(style.textContent || '')) style.remove()
      const svg = document.importNode(doc.documentElement, true) as unknown as SVGSVGElement
      highlight(svg, svgId)
      if (!controller.signal.aborted) ref.current?.replaceChildren(svg)
    }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [filename, svgId])
  return <><div id={id} ref={ref} className="cemetery-svg" data-cemetery-svg-id={svgId} />{error && <p className="notification danger" role="alert">{t('cemaris:geoImageUnavailable')}</p>}<a className="small-text" href={appUrl(`/api/cemeteries/images/${encodeURIComponent(filename)}`)} target="_blank" rel="noreferrer">{t('cemeteries.image')} ↗</a></>
}

export function CemeteryGeography({ cemetery, t }: { cemetery: Row; t: Translate }) {
  const own = Boolean(cemetery.cemeteryLatitude && cemetery.cemeteryLongitude)
  const parent = Boolean(cemetery.parentCemeteryLatitude && cemetery.parentCemeteryLongitude)
  // The source falls back only if both own values are falsy, even when the
  // parent coordinates caused the containing map panel to be displayed.
  const useParent = !cemetery.cemeteryLatitude && !cemetery.cemeteryLongitude && parent
  const lat = useParent ? cemetery.parentCemeteryLatitude : cemetery.cemeteryLatitude
  const lng = useParent ? cemetery.parentCemeteryLongitude : cemetery.cemeteryLongitude
  return <><div className="two-columns"><section className="panel"><div className="panel-heading places-panel-heading"><h2>{t('cemeteries.geographicLocation')}</h2><Link className="button small" href={`/burialSites/map?cemeteryId=${cemetery.cemeteryId}`}>{t('cemeteries.burialSiteMap')}</Link></div><div className="panel-body">{parent && <p className="notification info">{t('cemeteries.childCoordinatesUnavailable')}<br />{t('cemeteries.parentCoordinatesShownInstead')}</p>}{own || parent ? <LocationMap id="cemetery--leaflet" latitude={Number(lat)} longitude={Number(lng)} /> : <p className="notification info">{t('cemeteries.noCoordinates')}</p>}</div></section><section className="panel"><h2 className="panel-heading">{t('cemeteries.image')}</h2><div className="panel-body">{str(cemetery, 'cemeterySvg') ? <CemeterySvg filename={str(cemetery, 'cemeterySvg')} t={t} /> : <p>{t('cemaris:geoNoCemeteryImage')}</p>}</div></section></div></>
}
export function BurialGeography({ site, t }: { site: Row; t: Translate }) {
  const own = Boolean(site.burialSiteLatitude && site.burialSiteLongitude)
  const cemetery = Boolean(site.cemeteryLatitude && site.cemeteryLongitude)
  return <div className="two-columns"><section className="panel"><h2 className="panel-heading">{t('cemeteries.geographicLocation')}</h2><div className="panel-body">{!own && cemetery && <p className="notification info">{t('cemaris:geoCemeteryCoordinates')}</p>}{own || cemetery ? <LocationMap id="burialSite--leaflet" latitude={Number(site[own ? 'burialSiteLatitude' : 'cemeteryLatitude'])} longitude={Number(site[own ? 'burialSiteLongitude' : 'cemeteryLongitude'])} /> : <p className="notification info">{t('cemaris:geoNoSiteCoordinates')}</p>}</div></section><section className="panel"><h2 className="panel-heading">{t('cemeteries.image')}</h2><div className="panel-body">{str(site, 'burialSiteImage') ? <img className="burial-site-image" src={appUrl(`/api/burialSites/images/${encodeURIComponent(str(site, 'burialSiteImage'))}`)} alt={str(site, 'burialSiteName')} /> : str(site, 'cemeterySvg') ? <CemeterySvg id="burialSite--cemeterySvg" filename={str(site, 'cemeterySvg')} svgId={str(site, 'cemeterySvgId')} t={t} /> : <p>{t('cemaris:geoNoSiteImage')}</p>}</div></section></div>
}

export function GeoTools({ page, options, user, t }: { page: string; options: Row; user: User; t: Translate }) {
  const title = t(page === 'map' ? 'cemeteries.burialSiteMap' : page === 'creator' ? 'cemeteries.burialSiteRangeCreator' : 'cemeteries.gpsCoordinateCapture')
  useEffect(() => { document.title = `${title}: Cemaris` }, [title])
  return <><nav className="breadcrumb"><Link href="/dashboard">{t('home')}</Link><span>›</span><Link href="/burialSites">{t('cemeteries.burialSites')}</Link><span>›</span><span>{title}</span></nav><div className="stack"><h1>{title}</h1><nav className="places-actions"><Link href="/burialSites">{t('cemeteries.burialSiteSearch')}</Link><Link href="/burialSites/map">{t('cemeteries.burialSiteMap')}</Link>{user.userProperties.canUpdateCemeteries && <><Link href="/burialSites/creator">{t('cemeteries.burialSiteRangeCreator')}</Link><Link href="/burialSites/gpsCapture">{t('cemeteries.gpsCoordinateCapture')}</Link></>}</nav>{page === 'map' ? <BurialMap options={options} t={t} /> : page === 'creator' ? <RangeCreator options={options} t={t} /> : <GpsCapture options={options} t={t} />}</div></>
}
function CemeterySelect({ options, value, onChange, id, required = false, t }: { options: Row; value: string; onChange: (value: string) => void; id: string; required?: boolean; t: Translate }) {
  return <div className="form-field"><label htmlFor={id}>{t('cemetery')}</label><select id={id} name="cemeteryId" required={required} value={value} onChange={(event) => onChange(event.target.value)}><option value="">({t('cemeteries.noCemeterySelected')})</option>{rows(options, 'cemeteries').map((row) => <option key={str(row, 'cemeteryId')} value={str(row, 'cemeteryId')}>{str(row, 'cemeteryName') || `(${t('cemeteries.noName')})`}</option>)}</select></div>
}
export function markerColor(contracts: Row[], today: number): 'green' | 'yellow' | 'red' {
  if (!contracts.length) return 'green'
  let pre = false, allFuture = true
  for (const contract of contracts) {
    if (Number(contract.contractStartDate) > today) continue
    allFuture = false
    if (!contract.isPreneed) return 'red'
    pre = true
  }
  return pre || allFuture ? 'yellow' : 'green'
}
function BurialMap({ options, t }: { options: Row; t: Translate }) {
  const [cemeteryId, setCemeteryId] = useState(new URLSearchParams(window.location.search).get('cemeteryId') || '')
  const [filter, setFilter] = useState('')
  const [debounced, setDebounced] = useState('')
  const [result, setResult] = useState<Row>({ burialSites: [], totalBurialSites: 0 })
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const fitCemetery = useRef(false)
  useEffect(() => {
    map.current = new L.Map(ref.current!, { scrollWheelZoom: true }).setView([(Number(options.latitudeMin) + Number(options.latitudeMax)) / 2, (Number(options.longitudeMin) + Number(options.longitudeMax)) / 2], 11)
    tiles(map.current); layer.current = new L.LayerGroup().addTo(map.current)
    const observer = new ResizeObserver(() => map.current?.invalidateSize())
    observer.observe(ref.current!)
    return () => { observer.disconnect(); layer.current = null; map.current?.remove(); map.current = null }
  }, [options])
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(filter.toLowerCase().trim()), 300)
    return () => window.clearTimeout(timer)
  }, [filter])
  useEffect(() => {
    const controller = new AbortController()
    setError(null); setResult({ burialSites: [], totalBurialSites: 0 }); setBusy(Boolean(cemeteryId))
    if (cemeteryId) request<Row>('/api/burialSites/doGetBurialSitesForMap', { cemeteryId }, controller.signal).then((response) => {
      if (!controller.signal.aborted) { fitCemetery.current = true; setResult(response); setBusy(false) }
    }).catch((reason: unknown) => { if (!controller.signal.aborted) { setError(reason); setBusy(false) } })
    return () => controller.abort()
  }, [cemeteryId])
  useEffect(() => {
    if (!map.current || !layer.current) return
    layer.current.clearLayers()
    const bounds: [number, number][] = []
    const now = new Date(), today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
    for (const site of rows(result, 'burialSites')) {
      const contracts = rows(site, 'contracts')
      if (debounced && !contracts.some((contract) => (contract.deceasedNames as string[] || []).some((name) => name.toLowerCase().includes(debounced)))) continue
      if (site.burialSiteLatitude == null || site.burialSiteLongitude == null) continue
      const coordinates: [number, number] = [Number(site.burialSiteLatitude), Number(site.burialSiteLongitude)]
      bounds.push(coordinates)
      const popup = document.createElement('div')
      const link = document.createElement('a'); link.href = appUrl(`/burialSites/${site.burialSiteId}`); link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = str(site, 'burialSiteName') || t('cemeteries.noName'); popup.append(link)
      const caption = document.createElement('p'); caption.textContent = t(contracts.length ? 'cemaris:geoActiveFuture' : 'cemaris:geoNoActiveContracts'); popup.append(caption)
      const list = document.createElement('ul')
      for (const contract of contracts) {
        const item = document.createElement('li'), contractLink = document.createElement('a'); contractLink.href = appUrl(`/contracts/${contract.contractId}`); contractLink.target = '_blank'; contractLink.rel = 'noreferrer'; contractLink.textContent = str(contract, 'contractNumber')
        item.append(contractLink, document.createTextNode(` - ${str(contract, 'contractType')}${(contract.deceasedNames as string[] || []).length ? ` - ${(contract.deceasedNames as string[]).join(', ')}` : ''}`)); list.append(item)
      }
      popup.append(list)
      new L.CircleMarker(coordinates, { color: '#000', fillColor: markerColor(contracts, today), fillOpacity: 0.7, opacity: 1, radius: 6, weight: 1 }).bindPopup(popup).addTo(layer.current)
    }
    if (bounds.length) map.current.fitBounds(bounds, { maxZoom: 16, padding: [50, 50] })
    else if (fitCemetery.current && result.cemeteryLatitude != null && result.cemeteryLongitude != null) map.current.setView([Number(result.cemeteryLatitude), Number(result.cemeteryLongitude)], 15)
    fitCemetery.current = false
  }, [result, debounced, t])
  return <>{error ? <ErrorMessage error={error} t={t} /> : null}{busy && <p role="status">{t('loading')}</p>}<div id="map--burialSites" ref={ref} className="geo-map geo-map-main" /><div className="box geo-map-toolbar"><CemeterySelect options={options} value={cemeteryId} onChange={setCemeteryId} id="filter--cemeteryId" t={t} /><div><label htmlFor="filter--deceasedName">{t('cemaris:geoDeceasedFilter')}</label><input id="filter--deceasedName" value={filter} onChange={(event) => setFilter(event.target.value)} /></div><p id="map--stats"><strong>{t('cemaris:geoSitesCoordinates')}</strong><br /><span id="stats--mapped">{rows(result, 'burialSites').length}</span> / <span id="stats--total">{Number(result.totalBurialSites || 0)}</span></p></div><p className="small-text geo-map-legend"><span className="geo-dot green" />{t('cemaris:geoNoActiveContracts')} <span className="geo-dot yellow" />{t('cemaris:geoPreneedFuture')} <span className="geo-dot red" />{t('cemaris:geoActiveContracts')}</p></>
}

function RangeCreator({ options, t }: { options: Row; t: Translate }) {
  const [tab, setTab] = useState('ranges')
  const [cemeteryId, setCemeteryId] = useState('')
  const [result, setResult] = useState<Row>({ burialSiteNames: [] })
  const [type, setType] = useState(''), [status, setStatus] = useState('')
  const [error, setError] = useState<unknown>(null), [busy, setBusy] = useState('')
  const [empty, setEmpty] = useState(false)
  const segments = options.burialSiteNameSegments as Row || {}, definitions = segments.segments as Record<string, Row> || {}
  const cemetery = rows(options, 'cemeteries').find((row) => str(row, 'cemeteryId') === cemeteryId) || {}
  async function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy('preview'); setError(null); setEmpty(false)
    const payload = Object.fromEntries(new FormData(event.currentTarget))
    try { const response = await request<Row>('/api/burialSites/doGetBurialSiteNamesByRange', payload); setResult(response); setEmpty(!rows(response, 'burialSiteNames').length); setTab('preview') } catch (reason) { setError(reason) } finally { setBusy('') }
  }
  async function create(site: Row) {
    if (!type || !status) { setError(new Error(t(!type ? 'cemaris:geoTypeRequired' : 'cemaris:geoStatusRequired'))); return }
    setBusy(str(site, 'burialSiteName')); setError(null)
    try {
      const response = await request<Row>('/api/burialSites/doCreateBurialSite', { ...site, cemeteryId: result.cemeteryId, burialSiteTypeId: type, burialSiteStatusId: status })
      setResult((current) => ({ ...current, burialSiteNames: rows(current, 'burialSiteNames').map((item) => item === site ? { ...item, burialSiteId: response.burialSiteId } : item) }))
    } catch (reason) { setError(reason) } finally { setBusy('') }
  }
  const candidates = rows(result, 'burialSiteNames')
  return <><div className="catalog-tabs" role="tablist"><button role="tab" aria-selected={tab === 'ranges'} onClick={() => setTab('ranges')}>1 · {t('cemaris:geoDefineRanges')}</button><button id="tab--burialSitePreview" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>2 · {t('cemaris:geoPreview')}</button></div>{error ? error instanceof Error && !(error as { kind?: string }).kind ? <p className="notification danger" role="alert">{error.message}</p> : <ErrorMessage error={error} t={t} /> : null}<div hidden={tab !== 'ranges'}><p className="notification info">{t('cemaris:geoRangeDescription')}</p><form id="form--burialSiteCreator" className="box places-editor" onSubmit={preview}><fieldset disabled={Boolean(busy)}><CemeterySelect options={options} value={cemeteryId} onChange={setCemeteryId} id="burialSiteCreator--cemeteryId" t={t} />{['from', 'to'].map((end) => <fieldset className="form-field" key={end}><legend>{t(end === 'from' ? 'cemaris:geoFromName' : 'cemaris:geoToName')}</legend><div className="places-name-segments">{Boolean(segments.includeCemeteryKey) && <span className="domain" id={`burialSiteCreator--cemeteryKey_${end}`}>{str(cemetery, 'cemeteryKey')}{str(segments, 'separator')}</span>}{[1, 2, 3, 4, 5].filter((index) => definitions[String(index)]?.isAvailable).map((index) => {
    const segment = definitions[String(index)], name = `burialSiteNameSegment${index}_${end}`
    return <div className="places-name-segment" key={index}>{index > 1 && <span>{str(segments, 'separator')}</span>}{str(segment, 'prefix') && <span>{str(segment, 'prefix')}</span>}<input id={`burialSiteCreator--${name}`} name={name} aria-label={`${str(segment, 'label')} ${t(end === 'from' ? 'cemaris:geoFrom' : 'cemaris:geoTo')}`} placeholder={str(segment, 'label')} minLength={Math.max(Math.min(Number(segment.minLength ?? 1), 20), 1)} maxLength={Math.max(Math.min(Number(segment.maxLength ?? 20), 20), 1)} />{str(segment, 'suffix') && <span>{str(segment, 'suffix')}</span>}</div>
  })}</div></fieldset>)}<div className="actions"><button id="burialSiteCreator--submit" className="primary" type="submit">{t('cemaris:geoPreview')}</button></div></fieldset></form></div><div hidden={tab !== 'preview'} className="two-columns"><div className="box places-editor">{[['burialSiteTypeId', 'burialSiteTypes', 'burialSiteType', type, setType], ['burialSiteStatusId', 'burialSiteStatuses', 'burialSiteStatus', status, setStatus]].map(([key, source, label, value, setter]) => <div className="form-field" key={String(key)}><label htmlFor={`burialSitePreview--${key}`}>{t(key === 'burialSiteTypeId' ? 'cemaris:geoSiteType' : 'status')}</label><select id={`burialSitePreview--${key}`} value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)}><option value="">({t('cemaris:geoSelect')})</option>{rows(options, source as string).map((row) => <option key={str(row, key as string)} value={str(row, key as string)}>{str(row, label as string)}</option>)}</select></div>)}</div><div className="stack">{empty && <p className="notification info">{t('cemaris:geoRangeEmpty')} {Number(result.burialSiteNameRangeLimit || 1000)}.</p>}{[true, false].map((existing) => <section className="panel" id={`panel--burialSitePreview_${existing ? 'existing' : 'new'}`} key={String(existing)}><h2 className="panel-heading">{t(existing ? 'cemaris:geoExistingSites' : 'cemaris:geoNewSites')} <span className="tag">{candidates.filter((site) => (site.burialSiteId != null) === existing).length}</span></h2>{candidates.filter((site) => (site.burialSiteId != null) === existing).map((site) => <div className="panel-body geo-range-row" data-burial-site-name={str(site, 'burialSiteName')} key={str(site, 'burialSiteName')}>{existing ? <Link className="button small primary" href={`/burialSites/${site.burialSiteId}`} target="_blank">{t('view')}</Link> : <button type="button" className="success small" disabled={Boolean(busy)} onClick={() => void create(site)}>{t('cemeteries.createBurialSite')}</button>}<span>{str(site, 'burialSiteName')}</span></div>)}</section>)}</div></div></>
}

function GpsCapture({ options, t }: { options: Row; t: Translate }) {
  const [position, setPosition] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null)
  const [gpsStatus, setGpsStatus] = useState('geoGpsRequesting')
  const [filters, setFilters] = useState({ cemeteryId: new URLSearchParams(window.location.search).get('cemeteryId') || '', burialSiteName: '', hasCoordinates: '' })
  const [sites, setSites] = useState<Row[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState('')
  const [captured, setCaptured] = useState<Record<string, number>>({})
  const [search, setSearch] = useState(0)
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('geoGpsUnsupported'); return }
    const watch = navigator.geolocation.watchPosition((point) => { setPosition({ latitude: point.coords.latitude, longitude: point.coords.longitude, accuracy: point.coords.accuracy }); setGpsStatus('geoGpsReady') }, (reason) => setGpsStatus(reason.code === 1 ? 'geoGpsDenied' : reason.code === 2 ? 'geoGpsUnavailable' : reason.code === 3 ? 'geoGpsTimeout' : 'geoGpsError'), { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 })
    return () => navigator.geolocation.clearWatch(watch)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setError(null); setSites(null)
    if (filters.cemeteryId) request<Row>('/api/burialSites/doSearchBurialSitesForGPS', filters, controller.signal).then((response) => { if (!controller.signal.aborted) setSites(rows(response, 'burialSites')) }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [filters, search])
  async function capture(site: Row) {
    if (!position) { setError(new Error(t('cemaris:geoGpsNotReady'))); return }
    const id = str(site, 'burialSiteId'), point = { ...position }
    setBusy(id); setError(null)
    try {
      await request('/api/burialSites/doUpdateBurialSiteLatitudeLongitude', { burialSiteId: id, burialSiteLatitude: point.latitude.toFixed(8), burialSiteLongitude: point.longitude.toFixed(8) })
      setSites((current) => current?.map((row) => row.burialSiteId === site.burialSiteId ? { ...row, burialSiteLatitude: point.latitude, burialSiteLongitude: point.longitude } : row) || [])
      setCaptured((current) => ({ ...current, [id]: point.accuracy }))
    } catch (reason) { setError(reason) } finally { setBusy('') }
  }
  return <><p>{t('cemaris:geoGpsDescription')}</p><div id="gps-status" className={`notification ${gpsStatus === 'geoGpsReady' ? 'success' : gpsStatus === 'geoGpsRequesting' ? 'warning' : 'danger'}`} role="status"><strong>GPS: </strong><span id="gps-status-text">{t(`cemaris:${gpsStatus}`)}</span>{position && <p id="gps-accuracy"><strong>{t('cemaris:geoAccuracy')}: </strong><span>{Math.round(position.accuracy)}</span> m</p>}</div><form id="form--filters" className="box places-editor" onSubmit={(event) => { event.preventDefault(); setSearch((value) => value + 1) }}><div className="geo-map-toolbar"><CemeterySelect options={options} value={filters.cemeteryId} onChange={(value) => setFilters((current) => ({ ...current, cemeteryId: value }))} id="filter--cemeteryId" required t={t} /><div><label htmlFor="filter--burialSiteName">{t('cemaris:geoSiteName')}</label><input id="filter--burialSiteName" name="burialSiteName" value={filters.burialSiteName} onChange={(event) => setFilters((current) => ({ ...current, burialSiteName: event.target.value }))} /></div><div><label htmlFor="filter--hasCoordinates">{t('cemaris:geoCoordinateStatus')}</label><select id="filter--hasCoordinates" name="hasCoordinates" value={filters.hasCoordinates} onChange={(event) => setFilters((current) => ({ ...current, hasCoordinates: event.target.value }))}><option value="">({t('cemaris:geoAllSites')})</option><option value="no">{t('cemaris:geoMissingCoordinates')}</option><option value="yes">{t('cemaris:geoHasCoordinates')}</option></select></div></div><div className="actions"><button type="submit" className="primary">{t('cemaris:geoSearchSites')}</button></div></form>{error ? error instanceof Error && !(error as { kind?: string }).kind ? <p className="notification danger" role="alert">{error.message}</p> : <ErrorMessage error={error} t={t} /> : null}<div id="container--burialSites">{!filters.cemeteryId ? <p className="notification info">{t('cemaris:geoSelectCemetery')}</p> : sites == null ? !error && <p role="status">{t('loading')}</p> : !sites.length ? <p className="notification info">{t('cemaris:geoNoMatches')}</p> : <div className="two-columns">{sites.map((site) => {
    const id = str(site, 'burialSiteId'), names = site.deceasedNames as string[] || [], has = site.burialSiteLatitude != null && site.burialSiteLongitude != null
    return <section className="panel" key={id}><h2 className="panel-heading"><Link href={`/burialSites/${id}`} target="_blank">{str(site, 'burialSiteName')}</Link></h2><div className="panel-body"><p className="geo-gps-subtitle">{str(site, 'cemeteryName') || t('cemeteries.noCemetery')} - {str(site, 'burialSiteType') || t('cemaris:geoNoType')}</p>{names.length > 0 && <p className="small-text">{names.slice(0, 3).join(', ')}{names.length > 3 ? ` +${names.length - 3}` : ''}</p>}<p id={`coords-${id}`} className="small-text">{has ? <>{t('cemeteries.latitude')}: {Number(site.burialSiteLatitude).toFixed(8)}<br />{t('cemeteries.longitude')}: {Number(site.burialSiteLongitude).toFixed(8)}</> : t('cemaris:geoNoSiteCoordinates')}{captured[id] != null && <><br /><span className="saved-message">{t('cemaris:geoJustCaptured')} (±{Math.round(captured[id])} m)</span></>}</p><button type="button" id={`capture-${id}`} className={captured[id] != null ? 'success fullwidth' : 'primary fullwidth'} disabled={busy === id} onClick={() => void capture(site)}>{t(captured[id] != null ? 'cemaris:geoCaptured' : has ? 'cemaris:geoUpdateGps' : 'cemaris:geoCaptureGps')}</button></div></section>
  })}</div>}</div></>
}
