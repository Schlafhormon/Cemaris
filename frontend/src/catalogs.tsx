/* Functional port of Sunrise CMS admin catalog views, browser handlers and dialogs.
 * Copyright (c) 2026 The Corporation of the City of Sault Ste. Marie.
 * MIT notice: /THIRD-PARTY-NOTICES.txt. */
import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { formatCurrency } from './format'
import { request } from './api'
import type { Language, Translate } from './i18n'
import { ErrorMessage, Link, Modal } from './ui'

type Row = Record<string, unknown>
interface CatalogConfig {
  feeFunctions?: Record<string, string> | string[]
  contractTypePrintTitles?: Record<string, string>
  bodyCapacityMaxDefault?: number | null
  crematedCapacityMaxDefault?: number | null
  taxPercentageDefault?: number | null
}
interface CatalogData { [key: string]: unknown; config: CatalogConfig }
interface Editor { resource: string; action: 'add' | 'update' | 'updateAmount'; row: Row; parent?: Row }
type Mutate = (resource: string, action: string, payload: Row) => Promise<CatalogData | null>
const value = (row: Row, key: string) => row[key] === null || row[key] === undefined ? '' : String(row[key])
const records = (row: Row, key: string): Row[] => Array.isArray(row[key]) ? row[key] as Row[] : []
const singular = (resource: string) => resource.endsWith('Statuses') ? resource.slice(0, -2) : resource.endsWith('ies') ? `${resource.slice(0, -3)}y` : resource.slice(0, -1)
const labelPairs: Record<string, [string, string]> = {
  burialSiteType: ['Burial Site Type', 'Grabstättenart'], contractType: ['Contract Type', 'Vertragsart'],
  burialSiteStatus: ['Burial Site Status', 'Grabstättenstatus'], committalType: ['Committal Type', 'Beisetzungsart'],
  intermentContainerType: ['Interment Container Type', 'Behälterart'], intermentDepth: ['Interment Depth', 'Beisetzungstiefe'],
  serviceType: ['Service Type', 'Dienstleistungsart'], workOrderType: ['Work Order Type', 'Arbeitsauftragsart'],
  workOrderStatus: ['Work Order Status', 'Arbeitsauftragsstatus'], workOrderMilestoneType: ['Work Order Milestone Type', 'Meilensteinart'],
  burialSiteTypes: ['Burial Site Types', 'Grabstättenarten'], contractTypes: ['Contract Types', 'Vertragsarten'],
  burialSiteStatuses: ['Burial Site Statuses', 'Grabstättenstatus'], committalTypes: ['Committal Types', 'Beisetzungsarten'],
  intermentContainerTypes: ['Interment Container Types', 'Behälterarten'], intermentDepths: ['Interment Depths', 'Beisetzungstiefen'],
  serviceTypes: ['Service Types', 'Dienstleistungsarten'], workOrderTypes: ['Work Order Types', 'Arbeitsauftragsarten'],
  workOrderStatuses: ['Work Order Statuses', 'Arbeitsauftragsstatus'], workOrderMilestoneTypes: ['Work Order Milestone Types', 'Meilensteinarten'],
  feeCategory: ['Fee Category', 'Gebührenkategorie'], feeCategories: ['Fee Categories', 'Gebührenkategorien'], fees: ['Fees', 'Gebühren'],
  feeName: ['Fee Name', 'Gebührenname'], feeAccount: ['Fee Account', 'Gebührenkonto'], feeDescription: ['Fee Description', 'Gebührenbeschreibung'],
  fieldName: ['Field Name', 'Feldname'], fieldType: ['Field Type', 'Feldtyp'], fieldValues: ['Field Values', 'Feldwerte'],
  text: ['Text Field', 'Textfeld'], date: ['Date Selector', 'Datumsauswahl'], select: ['Select List', 'Auswahlliste'],
  minLength: ['Minimum Length', 'Mindestlänge'], maxLength: ['Maximum Length', 'Maximallänge'], pattern: ['Regular Expression', 'Regulärer Ausdruck'],
  isRequired: ['Required', 'Erforderlich'], isCremationType: ['Is Cremated', 'Kremiert'],
  isPreneed: ['Contract Type is Preneed', 'Vertragsart ist Vorsorge'], bodyCapacityMax: ['Maximum Body Capacity', 'Maximale Sargkapazität'],
  crematedCapacityMax: ['Maximum Cremated Capacity', 'Maximale Urnenkapazität'],
  add: ['Add', 'Hinzufügen'], edit: ['Edit', 'Bearbeiten'], addField: ['Add Field', 'Feld hinzufügen'], addPrint: ['Add Print', 'Druck hinzufügen'],
  typesFields: ['Types and Fields', 'Arten und Felder'], prints: ['Prints', 'Drucke'], allTypes: ['(All Contract Types)', '(Alle Vertragsarten)'],
  allFilters: ['(All Types)', '(Alle Arten)'], availablePrints: ['Available Prints', 'Verfügbare Drucke'], allPrints: ['(All Available Prints)', '(Alle verfügbaren Drucke)'],
  selectPrint: ['(Select a Print)', '(Druck auswählen)'], noFields: ['There are no additional fields.', 'Es gibt keine Zusatzfelder.'],
  noRecords: ['There are no active records.', 'Es gibt keine aktiven Einträge.'], noPrints: ['There are no prints associated with this record.', 'Diesem Eintrag sind keine Drucke zugeordnet.'],
  deleteConfirm: ['Are you sure you want to delete this record?', 'Möchten Sie diesen Eintrag löschen?'],
  fieldDeleteConfirm: ['Delete this field? Historical records that use the field will not be affected.', 'Dieses Feld löschen? Historische Datensätze, die es verwenden, bleiben erhalten.'],
  order: ['Order', 'Reihenfolge'], up: ['Move Up', 'Nach oben'], down: ['Move Down', 'Nach unten'],
  orderHelp: ['Hold Shift while moving to move directly to the beginning or end.', 'Mit gedrückter Umschalttaste direkt an den Anfang oder ans Ende verschieben.'],
  tableWarning: ['Never change the meaning of existing table values. When in doubt, create a new value.', 'Ändern Sie niemals die Bedeutung vorhandener Tabellenwerte. Legen Sie im Zweifel einen neuen Wert an.'],
  fieldValuesHelp: ['Place each item on a separate line. Only those values can be used to complete a select field.', 'Jeden Eintrag in eine eigene Zeile schreiben. In einem Auswahlfeld sind nur diese Werte zulässig.'],
  preneedHelp: ['Interments associated with this contract will be considered reserved, not occupied.', 'Beisetzungen dieses Vertrags gelten als reserviert, statt als belegt.'],
  isGroupedFee: ['Treat Category as a Group of Fees', 'Kategorie als Gebührengruppe behandeln'], group: ['Group of Fees', 'Gebührengruppe'],
  feeAmount: ['Fee Amount', 'Gebührenbetrag'], feeFunction: ['Fee Function', 'Gebührenfunktion'], taxAmount: ['Tax Amount', 'Steuerbetrag'], taxPercentage: ['Tax Percentage', 'Steuersatz'],
  tax: ['Tax', 'Steuer'], includeQuantity: ['Include Quantity', 'Menge verwenden'], quantityUnit: ['Quantity Unit', 'Mengeneinheit'],
  feeRequired: ['Fee Is Required', 'Gebühr ist erforderlich'], noFunction: ['(No Function Selected)', '(Keine Funktion ausgewählt)'],
  openFee: ['Open Fee', 'Offener Betrag'], filters: ['Filters', 'Filter'], contractTypeId: ['Contract Type Filter', 'Vertragsartfilter'], burialSiteTypeId: ['Burial Site Type Filter', 'Grabstättenartfilter'],
  feeHelp: ['Fees may be flat amounts or use a configured function. When both are set, the function takes precedence.', 'Gebühren können feste Beträge oder konfigurierte Funktionen verwenden. Sind beide gesetzt, hat die Funktion Vorrang.'],
  taxHelp: ['Taxes may be flat amounts or percentages. When both are set, the percentage takes precedence.', 'Steuern können feste Beträge oder Prozentsätze sein. Sind beide gesetzt, hat der Prozentsatz Vorrang.'],
  filterHelp: ['Filters control which fees are available for the selected contract and burial site types.', 'Filter bestimmen die verfügbaren Gebühren für die gewählte Vertrags- und Grabstättenart.'],
  saved: ['Changes saved successfully.', 'Änderungen erfolgreich gespeichert.'],
  unlimited: ['unlimited', 'unbegrenzt'], none: ['none', 'keine'],
}
type Labels = (key: string) => string

export function CatalogManagement({ t, language, page }: { t: Translate; language: Language; page: string }) {
  const [data, setData] = useState<CatalogData | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [tab, setTab] = useState('types')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const l: Labels = (key) => labelPairs[key]?.[language === 'de' ? 1 : 0] ?? t(key)
  const titleKey = page === 'burialsitetypes' ? 'burialSiteTypeManagement' : page === 'contracttypes' ? 'contractTypeManagement' : page === 'fees' ? 'feeManagement' : 'configTableManagement'
  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    request<CatalogData>('/api/admin/catalogs', undefined, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result) })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason) })
    return () => controller.abort()
  }, [attempt])

  const mutate: Mutate = async (resource, action, payload) => {
    setBusy(true); setError(null); setSaved(false)
    try {
      const result = await request<CatalogData>(`/api/admin/catalogs/${resource}/${action}`, payload)
      setData(result); setSaved(true)
      return result
    } catch (reason) { setError(reason); return null } finally { setBusy(false) }
  }
  function edit(resource: string, row: Row = {}, parent?: Row, action: Editor['action'] = Object.keys(row).length ? 'update' : 'add') {
    setError(null); setSaved(false); setEditor({ resource, row, parent, action })
  }
  const toggle = (key: string) => setExpanded((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next })
  const remove = (resource: string, row: Row, payload?: Row) => {
    if (window.confirm(l(resource.endsWith('Fields') ? 'fieldDeleteConfirm' : 'deleteConfirm'))) void mutate(resource, 'delete', payload ?? { [`${singular(resource)}Id`]: row[`${singular(resource)}Id`] })
  }
  function moves(resource: string, row: Row, payload?: Row): ReactNode {
    return <span className="catalog-moves" aria-label={l('order')}>{['Up', 'Down'].map((direction) => <button type="button" className="small" key={direction} disabled={busy} title={`${l(direction.toLowerCase())}. ${l('orderHelp')}`} aria-label={l(direction.toLowerCase())} onClick={(event) => void mutate(resource, `move${direction}`, { ...(payload ?? { [`${singular(resource)}Id`]: row[`${singular(resource)}Id`] }), moveToEnd: event.shiftKey ? '1' : '0' })}>{direction === 'Up' ? '↑' : '↓'}</button>)}</span>
  }
  function fieldRows(resource: string, rows: Row[], parent?: Row) {
    const fieldName = singular(resource)
    return <div className="catalog-fields">{rows.length === 0 ? <p className="notification info">{l('noFields')}</p> : rows.map((field) => <div className="catalog-row" key={value(field, `${fieldName}Id`)} data-field-id={value(field, `${fieldName}Id`)}><button className="text-button" onClick={() => edit(resource, field, parent)}>{value(field, fieldName)}</button><span className="tag">{l(value(field, 'fieldType'))}</span>{Boolean(field.isRequired) && <span className="tag warning">{l('isRequired')}</span>}<span className="catalog-spacer" />{moves(resource, field)}</div>)}</div>
  }
  function typePanels(resource: string) {
    const name = singular(resource)
    return <div className="stack" id={`container--${resource}`}>{resource === 'contractTypes' && <section className="panel" data-catalog-global="true"><div className="panel-heading catalog-row"><h2>{l('allTypes')}</h2><button className="small success" onClick={() => edit('contractTypeFields', {}, {}, 'add')}>{l('addField')}</button></div>{fieldRows('contractTypeFields', records(data!, 'allContractTypeFields'))}</section>}{records(data!, resource).length === 0 && <p className="notification warning">{l('noRecords')}</p>}{records(data!, resource).map((row) => {
      const key = `${resource}-${value(row, `${name}Id`)}`
      return <section className="panel" key={key} data-catalog-id={value(row, `${name}Id`)}><div className="panel-heading catalog-row"><button className="small" aria-expanded={expanded.has(key)} aria-label={`${l('fieldName')}: ${value(row, name)}`} onClick={() => toggle(key)}>{expanded.has(key) ? '⌄' : '›'}</button><button className="text-button catalog-name" onClick={() => edit(resource, row)}>{value(row, name)}</button>{Boolean(row.isPreneed) && <span className="tag warning">{l('isPreneed')}</span>}<span className="catalog-spacer" /><button className="small success" onClick={() => { setExpanded((current) => new Set(current).add(key)); edit(`${name}Fields`, {}, row, 'add') }}>{l('addField')}</button>{moves(resource, row)}<button className="small danger" disabled={busy} aria-label={`${t('delete')}: ${value(row, name)}`} onClick={() => remove(resource, row)}>{t('delete')}</button></div>{resource === 'burialSiteTypes' && <p className="catalog-capacity">{l('bodyCapacityMax')}: {row.bodyCapacityMax === null ? l('unlimited') : Number(row.bodyCapacityMax) === 0 ? l('none') : value(row, 'bodyCapacityMax')} · {l('crematedCapacityMax')}: {row.crematedCapacityMax === null ? l('unlimited') : Number(row.crematedCapacityMax) === 0 ? l('none') : value(row, 'crematedCapacityMax')}</p>}{expanded.has(key) && fieldRows(`${name}Fields`, records(row, `${name}Fields`), row)}</section>
    })}</div>
  }
  return <><nav className="breadcrumb" aria-label={t('cemaris:breadcrumb')}><Link href="/dashboard">{t('home')}</Link><span>/</span><span>{t('admin:adminTools')}</span><span>/</span><span aria-current="page">{t(`admin:${titleKey}`)}</span></nav><div className="page-heading"><h1>{t(`admin:${titleKey}`)}</h1>{page !== 'tables' && <button className="success" disabled={!data || busy} id={`button--add${page === 'fees' ? 'FeeCategory' : page === 'contracttypes' ? 'ContractType' : 'BurialSiteType'}`} onClick={() => edit(page === 'fees' ? 'feeCategories' : page === 'contracttypes' ? 'contractTypes' : 'burialSiteTypes')}>{l('add')} · {l(page === 'fees' ? 'feeCategory' : page === 'contracttypes' ? 'contractType' : 'burialSiteType')}</button>}</div>{Boolean(error) && !editor && <ErrorMessage error={error} t={t} />}{Boolean(error) && !data && <button onClick={() => setAttempt((current) => current + 1)}>{t('cemaris:retry')}</button>}{saved && !editor && <p className="notification success" role="status">{l('saved')}</p>}{!data && !error && <p role="status">{t('loading')}</p>}{data && <><p className="help-text">{l('orderHelp')}</p>{page === 'burialsitetypes' && typePanels('burialSiteTypes')}{page === 'contracttypes' && <><div className="catalog-tabs" role="tablist" aria-label={l('contractTypes')}><button role="tab" aria-selected={tab === 'types'} aria-controls="catalog-types" id="tab-types" onClick={() => setTab('types')}>{l('typesFields')}</button><button role="tab" aria-selected={tab === 'prints'} aria-controls="catalog-prints" id="tab-prints" onClick={() => setTab('prints')}>{l('prints')}</button></div><div role="tabpanel" id="catalog-types" aria-labelledby="tab-types" hidden={tab !== 'types'}>{typePanels('contractTypes')}</div><div role="tabpanel" id="catalog-prints" aria-labelledby="tab-prints" hidden={tab !== 'prints'}><div className="catalog-print-layout"><div className="stack">{records(data, 'contractTypes').map((row) => <section className="panel" key={value(row, 'contractTypeId')} data-catalog-id={value(row, 'contractTypeId')}><div className="panel-heading catalog-row"><h2>{value(row, 'contractType')}</h2><button className="small success" onClick={() => edit('contractTypePrints', {}, row, 'add')}>{l('addPrint')}</button></div>{(row.contractTypePrints as string[] ?? []).map((print) => <div className="catalog-row catalog-print" key={print} data-print={print}><span>{print === '*' ? l('allPrints') : data.config.contractTypePrintTitles?.[print] || print}</span><span className="catalog-spacer" />{moves('contractTypePrints', row, { contractTypeId: row.contractTypeId, printEJS: print })}<button className="small danger" disabled={busy} onClick={() => remove('contractTypePrints', row, { contractTypeId: row.contractTypeId, printEJS: print })}>{t('delete')}</button></div>)}{!(row.contractTypePrints as string[] ?? []).length && <p className="notification info">{l('noPrints')}</p>}</section>)}</div><aside className="panel"><h2 className="panel-heading">{l('availablePrints')}</h2><ul>{Object.entries(data.config.contractTypePrintTitles ?? {}).map(([key, title]) => <li key={key}>{title}</li>)}</ul></aside></div></div></>}{page === 'tables' && <><p className="notification warning">{l('tableWarning')}</p><div className="stack">{['workOrderTypes', 'workOrderStatuses', 'workOrderMilestoneTypes', 'committalTypes', 'serviceTypes', 'intermentContainerTypes', 'intermentDepths', 'burialSiteStatuses'].map((resource) => <SimpleTable key={resource} resource={resource} rows={records(data, resource)} l={l} t={t} busy={busy} mutate={mutate} moves={moves} remove={remove} />)}</div></>}{page === 'fees' && <div className="stack" id="container--feeCategories">{records(data, 'feeCategories').length === 0 && <p className="notification info">{l('noRecords')}</p>}{records(data, 'feeCategories').map((category) => <section className="panel" key={value(category, 'feeCategoryId')} data-category-id={value(category, 'feeCategoryId')}><div className="panel-heading catalog-row"><button className="text-button catalog-name" onClick={() => edit('feeCategories', category)}>{value(category, 'feeCategory')}</button>{Boolean(category.isGroupedFee) && <span className="tag">{l('group')}</span>}<span className="catalog-spacer" /><button className="small success" onClick={() => edit('fees', {}, category, 'add')}>{l('add')} · {l('fees')}</button>{moves('feeCategories', category)}{records(category, 'fees').length === 0 && <button className="small danger" disabled={busy} onClick={() => remove('feeCategories', category)}>{t('delete')}</button>}</div>{records(category, 'fees').length === 0 && <p className="notification info">{l('noRecords')}</p>}{records(category, 'fees').map((fee) => <div className="catalog-fee" key={value(fee, 'feeId')} data-fee-id={value(fee, 'feeId')}><div><button className="text-button catalog-name" onClick={() => edit('fees', fee, category)}>{value(fee, 'feeName')}</button><p className="small-text preserve-lines">{value(fee, 'feeDescription')}</p><div className="catalog-tags">{Boolean(fee.isRequired) && <span className="tag warning">{l('isRequired')}</span>}{['contractType', 'burialSiteType'].map((type) => Number(fee[`${type}Id`] ?? -1) > -1 && <span className="tag" key={type} title={l(`${type}Id`)}>{value(fee, type) || value(fee, `${type}Id`)}</span>)}</div></div><div className="catalog-fee-values"><div>{fee.feeFunction ? <><span>{value(fee, 'feeFunction')}</span><small>{l('feeFunction')}</small></> : fee.feeAmount === null ? l('openFee') : <button className="text-button" aria-label={`${l('feeAmount')}: ${value(fee, 'feeName')}`} onClick={() => edit('fees', fee, category, 'updateAmount')}>{formatCurrency(fee.feeAmount)}</button>}</div><div>{fee.taxPercentage === null ? formatCurrency(fee.taxAmount) : `${value(fee, 'taxPercentage')}%`}<small>{l('tax')}</small></div>{Boolean(fee.includeQuantity) && <div>{value(fee, 'quantityUnit')}<small>{l('includeQuantity')}</small></div>}</div>{moves('fees', fee)}</div>)}</section>)}</div>}</>}{editor && data && <CatalogEditor key={`${editor.resource}-${editor.action}-${value(editor.row, `${singular(editor.resource)}Id`)}`} editor={editor} data={data} t={t} l={l} busy={busy} error={error} mutate={mutate} onClose={() => { if (!busy) { setEditor(null); setError(null) } }} onEdit={setEditor} />}</>
}

function SimpleTable({ resource, rows, l, t, busy, mutate, moves, remove }: { resource: string; rows: Row[]; l: Labels; t: Translate; busy: boolean; mutate: Mutate; moves: (resource: string, row: Row) => ReactNode; remove: (resource: string, row: Row) => void }) {
  const name = singular(resource)
  const [open, setOpen] = useState(false)
  return <section className="panel" data-table={resource}><div className="panel-heading"><h2><button type="button" className="text-button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '⌄' : '›'} {l(resource)} <span className="tag">{rows.length}</span></button></h2></div>{open && <div className="panel-body"><form id={`form--add${name[0].toUpperCase()}${name.slice(1)}`} className="catalog-add-form" onSubmit={async (event) => { event.preventDefault(); const form = event.currentTarget; if (await mutate(resource, 'add', Object.fromEntries(new FormData(form)))) { form.reset(); form.querySelector('input')?.focus() } }}><label className="sr-only" htmlFor={`add-${name}`}>{l(name)}</label><input id={`add-${name}`} name={name} required maxLength={100} placeholder={`${l('add')} · ${l(name)}`} />{name === 'intermentContainerType' && <label className="catalog-inline-label">{l('isCremationType')}<select name="isCremationType"><option value="0">{t('no')}</option><option value="1">{t('yes')}</option></select></label>}<button className="success" disabled={busy} type="submit">{l('add')}</button></form><div className="catalog-simple-rows">{rows.length === 0 && <p className="notification info">{l('noRecords')}</p>}{rows.map((row) => <form key={`${value(row, `${name}Id`)}-${value(row, name)}-${value(row, 'isCremationType')}`} className="catalog-simple-row" data-record-id={value(row, `${name}Id`)} onSubmit={(event) => { event.preventDefault(); void mutate(resource, 'update', Object.fromEntries(new FormData(event.currentTarget))) }}><input type="hidden" name={`${name}Id`} value={value(row, `${name}Id`)} /><label className="sr-only" htmlFor={`${name}-${value(row, `${name}Id`)}`}>{l(name)}</label><input id={`${name}-${value(row, `${name}Id`)}`} name={name} defaultValue={value(row, name)} required maxLength={100} />{name === 'intermentContainerType' && <label className="catalog-inline-label">{l('isCremationType')}<select name="isCremationType" defaultValue={row.isCremationType ? '1' : '0'}><option value="0">{t('no')}</option><option value="1">{t('yes')}</option></select></label>}<div className="catalog-row-buttons"><button className="small success" type="submit" disabled={busy}>{t('save')}</button>{moves(resource, row)}<button className="small danger" type="button" disabled={busy} aria-label={`${t('delete')}: ${value(row, name)}`} onClick={() => remove(resource, row)}>{t('delete')}</button></div></form>)}</div></div>}</section>
}

function CatalogEditor({ editor, data, t, l, busy, error, mutate, onClose, onEdit }: { editor: Editor; data: CatalogData; t: Translate; l: Labels; busy: boolean; error: unknown; mutate: Mutate; onClose: () => void; onEdit: (editor: Editor) => void }) {
  const { resource, action, row, parent = {} } = editor
  const name = singular(resource)
  const isField = resource.endsWith('Fields')
  const isAdd = action === 'add'
  const [fieldType, setFieldType] = useState(value(row, 'fieldType') || 'text')
  const [minLength, setMinLength] = useState(value(row, 'minLength'))
  const [feeFunction, setFeeFunction] = useState(value(row, 'feeFunction'))
  const [taxPercentage, setTaxPercentage] = useState(isAdd ? String(data.config.taxPercentageDefault ?? 0) : value(row, 'taxPercentage'))
  const [quantity, setQuantity] = useState(Boolean(row.includeQuantity))
  useEffect(() => {
    // Source field-edit dialogs enable cityssm's navigation blocker until close.
    if (!isField || isAdd) return
    const block = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', block)
    return () => window.removeEventListener('beforeunload', block)
  }, [isField, isAdd])
  const title = action === 'updateAmount' ? l('feeAmount') : resource === 'contractTypePrints' ? l('addPrint') : `${l(isAdd ? 'add' : 'edit')} · ${l(isField ? 'fieldName' : resource === 'fees' ? 'fees' : name)}`
  const input = (key: string, options: { type?: string; maxLength?: number; min?: number | string; max?: number; step?: string; required?: boolean; disabled?: boolean; initial?: string; label?: string } = {}) => <div className="form-field"><label htmlFor={`catalog-${key}`}>{options.label || l(key)}</label><input id={`catalog-${key}`} name={key} type={options.type || 'text'} defaultValue={options.initial ?? value(row, key)} maxLength={options.maxLength} min={options.min} max={options.max} step={options.step} required={options.required} disabled={options.disabled} autoFocus={key === name || key === 'feeName' || key === 'feeAmount' || key === `${name}`} /></div>
  const booleanSelect = (key: string, initial = Boolean(row[key]), label?: string) => <div className="form-field"><label htmlFor={`catalog-${key}`}>{label || l(key)}</label><select id={`catalog-${key}`} name={key} defaultValue={initial ? '1' : key === 'isRequired' && resource === 'fees' ? '' : '0'}><option value={key === 'isRequired' && resource === 'fees' ? '' : '0'}>{t('no')}</option><option value="1">{t('yes')}</option></select></div>
  const entitySelect = (key: string, source: string, selected?: unknown, emptyLabel?: string) => <div className="form-field"><label htmlFor={`catalog-${key}`}>{l(key === 'feeCategoryId' ? 'feeCategory' : key)}</label><select id={`catalog-${key}`} name={key} defaultValue={selected === null || selected === undefined || selected === -1 ? '' : String(selected)} required={key === 'feeCategoryId'}>{key !== 'feeCategoryId' && <option value="">{emptyLabel || l('allFilters')}</option>}{records(data, source).map((option) => <option key={value(option, `${singular(source)}Id`)} value={value(option, `${singular(source)}Id`)}>{value(option, singular(source))}</option>)}</select></div>
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget)) as Row
    // The source FormData drops this disabled control for text/date and its
    // node:sqlite UPDATE then throws. Send its existing string explicitly so
    // these field types remain editable; this source anomaly is documented.
    if (isField && !isAdd) payload.fieldValues = (event.currentTarget.elements.namedItem('fieldValues') as HTMLTextAreaElement).value
    const result = await mutate(resource, action, payload)
    if (!result) return
    if (isField && isAdd) {
      const newId = result[`${name}Id`]
      const type = singular(resource.replace('Fields', 's'))
      const parentId = parent[`${type}Id`]
      const addedParent = records(result, `${type}s`).find((item) => item[`${type}Id`] === parentId)
      const candidates = addedParent ? records(addedParent, resource) : records(result, 'allContractTypeFields')
      const added = candidates.find((item) => item[`${name}Id`] === newId)
      if (added) { onEdit({ resource, action: 'update', row: added, parent }); return }
    }
    onClose()
  }
  return <Modal title={title} onClose={onClose}><form className="catalog-editor" id="catalog-editor" onSubmit={submit} autoComplete="off"><input type="hidden" name={`${name}Id`} value={value(row, `${name}Id`)} />{isField && <input type="hidden" name={resource === 'contractTypeFields' ? 'contractTypeId' : 'burialSiteTypeId'} value={value(parent, resource === 'contractTypeFields' ? 'contractTypeId' : 'burialSiteTypeId')} />}{resource === 'contractTypePrints' ? <><input type="hidden" name="contractTypeId" value={value(parent, 'contractTypeId')} /><div className="form-field"><label htmlFor="catalog-printEJS">{l('prints')}</label><select name="printEJS" id="catalog-printEJS" required autoFocus defaultValue=""><option value="">{l('selectPrint')}</option><option value="*">{l('allPrints')}</option>{Object.entries(data.config.contractTypePrintTitles ?? {}).map(([key, printTitle]) => <option key={key} value={key}>{printTitle}</option>)}</select></div></> : action === 'updateAmount' ? <><p className="notification info">{value(row, 'feeName')}</p>{input('feeAmount', { type: 'number', min: 0, max: 999999.99, step: '0.01', required: true })}</> : isField ? <>{input(name, { label: l('fieldName'), maxLength: 100, required: true })}{!isAdd && <><div className="two-columns">{booleanSelect('isRequired')}<div className="form-field"><label htmlFor="catalog-fieldType">{l('fieldType')}</label><select id="catalog-fieldType" name="fieldType" value={fieldType} onChange={(event) => setFieldType(event.target.value)}>{['text', 'date', 'select'].map((type) => <option key={type} value={type}>{l(type)}</option>)}</select></div></div><div className="two-columns"><div className="form-field"><label htmlFor="catalog-minLength">{l('minLength')}</label><input id="catalog-minLength" name="minLength" type="number" min={0} max={32767} step="1" value={minLength} onChange={(event) => setMinLength(event.target.value)} disabled={fieldType !== 'text'} /></div>{input('maxLength', { type: 'number', min: minLength || 0, max: 32767, step: '1', disabled: fieldType !== 'text' })}</div>{input('pattern', { maxLength: 100, disabled: fieldType !== 'text' })}<div className="form-field"><label htmlFor="catalog-fieldValues">{l('fieldValues')}</label><textarea id="catalog-fieldValues" name="fieldValues" defaultValue={value(row, 'fieldValues')} disabled={fieldType !== 'select'} rows={6} /><p className="help-text">{l('fieldValuesHelp')}</p></div></>}</> : resource === 'fees' ? <>{entitySelect('feeCategoryId', 'feeCategories', row.feeCategoryId ?? parent.feeCategoryId)}<div className="two-columns">{input('feeName', { required: true, maxLength: 100 })}{input('feeAccount', { maxLength: 20 })}</div><div className="form-field"><label htmlFor="catalog-feeDescription">{l('feeDescription')}</label><textarea id="catalog-feeDescription" name="feeDescription" defaultValue={value(row, 'feeDescription')} rows={3} /></div><p className="notification info small-text">{l('filterHelp')}</p><div className="two-columns">{entitySelect('contractTypeId', 'contractTypes', row.contractTypeId)}{entitySelect('burialSiteTypeId', 'burialSiteTypes', row.burialSiteTypeId)}</div><p className="notification info small-text">{l('feeHelp')}</p><div className="two-columns">{input('feeAmount', { type: 'number', min: 0, max: 999999.99, step: '0.01', disabled: feeFunction !== '' })}<div className="form-field"><label htmlFor="catalog-feeFunction">{l('feeFunction')}</label><select id="catalog-feeFunction" name="feeFunction" value={feeFunction} onChange={(event) => setFeeFunction(event.target.value)}><option value="">{l('noFunction')}</option>{(Array.isArray(data.config.feeFunctions) ? data.config.feeFunctions.map((key) => [key, key]) : Object.entries(data.config.feeFunctions ?? {})).map(([key, functionTitle]) => <option key={key} value={key}>{functionTitle}</option>)}{feeFunction && !(Array.isArray(data.config.feeFunctions) ? data.config.feeFunctions.includes(feeFunction) : Object.hasOwn(data.config.feeFunctions ?? {}, feeFunction)) && <option value={feeFunction}>{feeFunction}</option>}</select></div></div><p className="notification info small-text">{l('taxHelp')}</p><div className="two-columns">{input('taxAmount', { type: 'number', min: 0, max: 9999.99, step: '0.01', disabled: taxPercentage !== '' })}<div className="form-field"><label htmlFor="catalog-taxPercentage">{l('taxPercentage')}</label><input id="catalog-taxPercentage" name="taxPercentage" type="number" min={0} max={100} step="0.01" value={taxPercentage} onChange={(event) => setTaxPercentage(event.target.value)} /></div></div><div className="two-columns"><div className="form-field"><label htmlFor="catalog-includeQuantity">{l('includeQuantity')}</label><select id="catalog-includeQuantity" name="includeQuantity" value={quantity ? '1' : ''} onChange={(event) => setQuantity(event.target.value !== '')}><option value="">{t('no')}</option><option value="1">{t('yes')}</option></select></div>{input('quantityUnit', { maxLength: 30, disabled: !quantity, required: true })}</div>{booleanSelect('isRequired', Boolean(row.isRequired), l('feeRequired'))}</> : <>{input(name, { maxLength: 100, required: true })}{resource === 'burialSiteTypes' && <div className="two-columns">{input('bodyCapacityMax', { type: 'number', min: 0, max: 100, step: '1', initial: isAdd ? String(data.config.bodyCapacityMaxDefault ?? '') : undefined })}{input('crematedCapacityMax', { type: 'number', min: 0, max: 100, step: '1', initial: isAdd ? String(data.config.crematedCapacityMaxDefault ?? '') : undefined })}</div>}{resource === 'contractTypes' && <><label className="checkbox"><input type="checkbox" name="isPreneed" value="1" defaultChecked={Boolean(row.isPreneed)} />{l('isPreneed')}</label><p className="help-text">{l('preneedHelp')}</p></>}{resource === 'feeCategories' && <label className="checkbox"><input type="checkbox" name="isGroupedFee" value="1" defaultChecked={Boolean(row.isGroupedFee)} />{l('isGroupedFee')}</label>}</>}{Boolean(error) && <ErrorMessage error={error} t={t} />}<div className="actions">{!isAdd && (isField || resource === 'fees') && action !== 'updateAmount' && <button className="danger" type="button" disabled={busy} onClick={async () => { if (window.confirm(l(isField ? 'fieldDeleteConfirm' : 'deleteConfirm')) && await mutate(resource, 'delete', { [`${name}Id`]: row[`${name}Id`] })) onClose() }}>{t('delete')}</button>}<button className="success" type="submit" disabled={busy}>{isAdd ? l('add') : t('save')}</button><button type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button></div></form></Modal>
}
