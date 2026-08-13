import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, createMasterData, deleteMasterData, getCemeteryMasterData, updateMasterData } from '../api/cemarisApi'
import type { Cemetery, CemeteryLevel, CemeteryMasterData, GraveSite, GraveType } from '../types/cemeteries'

interface OptionItem {
  id: string
  name: string
}

type Execute = (action: () => Promise<unknown>, success: string) => Promise<void>

export function CemeteryMasterDataPage({ administrator }: { administrator: boolean }) {
  const [data, setData] = useState<CemeteryMasterData>()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setData(await getCemeteryMasterData(signal ?? new AbortController().signal))
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        setError('Die Stammdaten konnten nicht geladen werden.')
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  async function execute(action: () => Promise<unknown>, success: string) {
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(success)
      await load()
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Die Änderung konnte nicht gespeichert werden.')
    }
  }

  function submit(route: string, map: (form: FormData) => unknown, success: string) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const form = event.currentTarget
      void execute(async () => {
        await createMasterData(route, map(new FormData(form)))
        form.reset()
      }, success)
    }
  }

  if (!data) {
    return <div className="state-message detail-state">{error || 'Friedhofsstammdaten werden geladen …'}</div>
  }

  const activeCemeteries = data.cemeteries.filter(cemetery => cemetery.isActive)
  const activeCemeteryIds = new Set(activeCemeteries.map(cemetery => cemetery.id))
  const activeAreas = data.areas.filter(area => area.isActive && activeCemeteryIds.has(area.parentId))
  const activeAreaIds = new Set(activeAreas.map(area => area.id))
  const activeFields = data.fields.filter(field => field.isActive && activeAreaIds.has(field.parentId))
  const activeTypes = data.graveTypes.filter(graveType => graveType.isActive)

  const cemeteryOption = (cemetery: OptionItem) => withCode(cemetery, data.cemeteries)
  const areaOption = (area: OptionItem) => areaPath(data, area.id)
  const fieldOption = (field: OptionItem) => fieldPath(data, field.id)

  return <div className="work-page form-page">
    <div className="work-page-heading">
      <div>
        <p className="eyebrow">Nur Development · synthetische Daten</p>
        <h1>Friedhofsstruktur und Grabstellen</h1>
        <p>Die Zwischenebenen sind optional. Grabnummern werden ausschließlich manuell gepflegt.</p>
      </div>
    </div>
    {message && <p className="form-message" role="status">{message}</p>}
    {error && <p className="form-message form-message--error" role="alert">{error}</p>}

    <MasterSection
      title="Friedhöfe"
      form={<form className="editor-grid" onSubmit={submit('cemeteries', form => ({
        name: value(form, 'name'),
        code: optional(form, 'code'),
        address: optional(form, 'address'),
        note: optional(form, 'note'),
        isActive: true,
      }), 'Friedhof angelegt.')}>
        <Text name="name" label="Name" required />
        <Text name="code" label="Code" />
        <Text name="address" label="Anschrift" />
        <Text name="note" label="Bemerkung" />
        <Save />
      </form>}
    >
      {data.cemeteries.map(cemetery => <Row
        key={cemetery.id}
        label={cemeteryOption(cemetery)}
        active={cemetery.isActive}
        administrator={administrator}
        onRename={() => rename('cemeteries', cemetery, cemeteryInput, execute)}
        onToggle={() => execute(
          () => updateMasterData('cemeteries', cemetery.id, cemetery.version, cemeteryInput(cemetery, !cemetery.isActive)),
          'Aktivstatus geändert.',
        )}
        onDelete={() => remove('Cemetery', cemetery, execute)}
      />)}
    </MasterSection>

    <LevelSection
      title="Bereiche"
      singular="Bereich"
      route="areas"
      parentLabel="Übergeordneter Friedhof"
      parents={activeCemeteries}
      parentOption={cemeteryOption}
      items={data.areas}
      itemLabel={item => areaPath(data, item.id)}
      administrator={administrator}
      execute={execute}
    />
    <LevelSection
      title="Felder"
      singular="Feld"
      route="fields"
      parentLabel="Übergeordneter Bereich"
      parents={activeAreas}
      parentOption={areaOption}
      items={data.fields}
      itemLabel={item => fieldPath(data, item.id)}
      administrator={administrator}
      execute={execute}
    />
    <LevelSection
      title="Reihen"
      singular="Reihe"
      route="rows"
      parentLabel="Übergeordnetes Feld"
      parents={activeFields}
      parentOption={fieldOption}
      items={data.rows}
      itemLabel={item => rowPath(data, item.id)}
      administrator={administrator}
      execute={execute}
    />

    <MasterSection
      title="Grabarten"
      form={<form className="editor-grid" onSubmit={submit('grave-types', form => ({
        name: value(form, 'name'),
        code: optional(form, 'code'),
        burialForm: value(form, 'burialForm'),
        note: optional(form, 'note'),
        isActive: true,
      }), 'Grabart angelegt.')}>
        <Text name="name" label="Name" required />
        <Text name="code" label="Code" />
        <label>Beisetzungsform<select name="burialForm"><option value="EarthBurial">Erdbestattung</option><option value="UrnBurial">Urnenbeisetzung</option><option value="Mixed">Gemischt</option></select></label>
        <Text name="note" label="Bemerkung" />
        <Save />
      </form>}
    >
      {data.graveTypes.map(graveType => <Row
        key={graveType.id}
        label={`${withCode(graveType, data.graveTypes)} · ${burialFormLabel(graveType.burialForm)}`}
        active={graveType.isActive}
        administrator={administrator}
        onRename={() => rename('grave-types', graveType, graveTypeInput, execute)}
        onToggle={() => execute(
          () => updateMasterData('grave-types', graveType.id, graveType.version, graveTypeInput(graveType, !graveType.isActive)),
          'Aktivstatus geändert.',
        )}
        onDelete={() => remove('GraveType', graveType, execute)}
      />)}
    </MasterSection>

    <MasterSection
      title="Grabarten je Friedhof"
      form={<form className="editor-grid" onSubmit={submit('cemetery-grave-types', form => ({
        cemeteryId: value(form, 'cemeteryId'),
        graveTypeId: value(form, 'graveTypeId'),
        isActive: true,
      }), 'Grabart zugeordnet.')}>
        <Select name="cemeteryId" label="Friedhof" items={activeCemeteries} optionLabel={cemeteryOption} />
        <Select name="graveTypeId" label="Grabart" items={activeTypes} optionLabel={item => withCode(item, data.graveTypes)} />
        <Save disabled={activeCemeteries.length === 0 || activeTypes.length === 0} />
      </form>}
    >
      {data.cemeteryGraveTypes.map(assignment => <Row
        key={assignment.id}
        label={`${cemeteryPath(data, assignment.cemeteryId)} · ${withCodeById(data.graveTypes, assignment.graveTypeId)}`}
        active={assignment.isActive}
        administrator={administrator}
        onToggle={() => execute(
          () => updateMasterData('cemetery-grave-types', assignment.id, assignment.version, {
            cemeteryId: assignment.cemeteryId,
            graveTypeId: assignment.graveTypeId,
            isActive: !assignment.isActive,
          }),
          'Aktivstatus geändert.',
        )}
        onDelete={() => remove('CemeteryGraveType', assignment, execute)}
      />)}
    </MasterSection>

    <MasterSection
      title="Grabstellen"
      form={<GraveSiteCreateForm data={data} execute={execute} />}
    >
      {data.graveSites.map(graveSite => <Row
        key={graveSite.id}
        label={`${graveSitePath(graveSite)} · ${graveSite.graveTypeName} · ${statusLabel(graveSite)}`}
        active={graveSite.isActive}
        administrator={administrator}
        onToggle={() => execute(
          () => updateMasterData('grave-sites', graveSite.id, graveSite.version, graveSiteInput(graveSite, !graveSite.isActive)),
          'Aktivstatus geändert.',
        )}
        onDelete={() => remove('GraveSite', graveSite, execute)}
      />)}
    </MasterSection>
  </div>
}

function GraveSiteCreateForm({ data, execute }: { data: CemeteryMasterData; execute: Execute }) {
  const [cemeteryId, setCemeteryId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [fieldId, setFieldId] = useState('')
  const [rowId, setRowId] = useState('')
  const [graveTypeId, setGraveTypeId] = useState('')

  const cemeteries = data.cemeteries.filter(cemetery => cemetery.isActive)
  const areas = data.areas.filter(area => area.isActive && area.parentId === cemeteryId)
  const fields = data.fields.filter(field => field.isActive && field.parentId === areaId)
  const rows = data.rows.filter(row => row.isActive && row.parentId === fieldId)
  const assignedTypeIds = new Set(data.cemeteryGraveTypes
    .filter(assignment => assignment.isActive && assignment.cemeteryId === cemeteryId)
    .map(assignment => assignment.graveTypeId))
  const graveTypes = data.graveTypes.filter(graveType => graveType.isActive && assignedTypeIds.has(graveType.id))

  useEffect(() => {
    if (cemeteryId && !data.cemeteries.some(cemetery => cemetery.id === cemeteryId && cemetery.isActive)) {
      changeCemetery('')
      return
    }
    if (areaId && !data.areas.some(area => area.id === areaId && area.parentId === cemeteryId && area.isActive)) {
      changeArea('')
      return
    }
    if (fieldId && !data.fields.some(field => field.id === fieldId && field.parentId === areaId && field.isActive)) {
      changeField('')
      return
    }
    if (rowId && !data.rows.some(row => row.id === rowId && row.parentId === fieldId && row.isActive)) {
      setRowId('')
    }
    if (graveTypeId && (
      !data.graveTypes.some(graveType => graveType.id === graveTypeId && graveType.isActive)
      || !data.cemeteryGraveTypes.some(assignment => assignment.cemeteryId === cemeteryId && assignment.graveTypeId === graveTypeId && assignment.isActive)
    )) {
      setGraveTypeId('')
    }
  }, [areaId, cemeteryId, data, fieldId, graveTypeId, rowId])

  function changeCemetery(nextId: string) {
    setCemeteryId(nextId)
    setAreaId('')
    setFieldId('')
    setRowId('')
    setGraveTypeId('')
  }

  function changeArea(nextId: string) {
    setAreaId(nextId)
    setFieldId('')
    setRowId('')
  }

  function changeField(nextId: string) {
    setFieldId(nextId)
    setRowId('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    void execute(async () => {
      await createMasterData('grave-sites', {
        cemeteryId,
        areaId: areaId || null,
        fieldId: fieldId || null,
        rowId: rowId || null,
        graveTypeId,
        graveNumber: value(formData, 'graveNumber'),
        status: value(formData, 'status'),
        isBlocked: formData.get('isBlocked') === 'on',
        blockNote: optional(formData, 'blockNote'),
        targetCapacity: optionalNumber(formData, 'targetCapacity'),
        note: optional(formData, 'note'),
        isActive: true,
      })
      form.reset()
      changeCemetery('')
    }, 'Grabstelle angelegt.')
  }

  return <form className="editor-grid" onSubmit={submit}>
    <Select
      name="cemeteryId"
      label="Friedhof"
      items={cemeteries}
      value={cemeteryId}
      onChange={changeCemetery}
      optionLabel={item => withCode(item, data.cemeteries)}
    />
    <Select
      name="areaId"
      label="Bereich (optional)"
      items={areas}
      value={areaId}
      onChange={changeArea}
      optionLabel={item => areaPath(data, item.id)}
      optional
      disabled={!cemeteryId}
    />
    <Select
      name="fieldId"
      label="Feld (optional)"
      items={fields}
      value={fieldId}
      onChange={changeField}
      optionLabel={item => fieldPath(data, item.id)}
      optional
      disabled={!areaId}
    />
    <Select
      name="rowId"
      label="Reihe (optional)"
      items={rows}
      value={rowId}
      onChange={setRowId}
      optionLabel={item => rowPath(data, item.id)}
      optional
      disabled={!fieldId}
    />
    <Select
      name="graveTypeId"
      label="Grabart"
      items={graveTypes}
      value={graveTypeId}
      onChange={setGraveTypeId}
      optionLabel={item => withCode(item, data.graveTypes)}
      disabled={!cemeteryId}
    />
    {cemeteryId && graveTypes.length === 0 && <p className="field-hint" role="status">Diesem Friedhof ist noch keine aktive Grabart zugeordnet.</p>}
    <Text name="graveNumber" label="Grabnummer" required />
    <label>Status<select name="status"><option value="Available">Frei</option><option value="Reserved">Reserviert</option><option value="Occupied">Belegt</option></select></label>
    <label><input type="checkbox" name="isBlocked" /> Gesperrt</label>
    <Text name="blockNote" label="Sperrbemerkung" />
    <label>Soll-Kapazität<input name="targetCapacity" type="number" min="1" /></label>
    <Text name="note" label="Bemerkung" />
    <Save disabled={!cemeteryId || !graveTypeId} />
  </form>
}

function MasterSection({ title, form, children }: { title: string; form: React.ReactNode; children: React.ReactNode }) {
  return <section className="editor-card"><h2>{title}</h2>{form}<div className="master-list">{children}</div></section>
}

interface LevelSectionProps {
  title: string
  singular: string
  route: string
  parentLabel: string
  parents: OptionItem[]
  parentOption: (item: OptionItem) => string
  items: CemeteryLevel[]
  itemLabel: (item: CemeteryLevel) => string
  administrator: boolean
  execute: Execute
}

function LevelSection({ title, singular, route, parentLabel, parents, parentOption, items, itemLabel, administrator, execute }: LevelSectionProps) {
  return <MasterSection
    title={title}
    form={<form className="editor-grid" onSubmit={event => {
      event.preventDefault()
      const form = event.currentTarget
      const formData = new FormData(form)
      void execute(async () => {
        await createMasterData(route, {
          parentId: value(formData, 'parentId'),
          name: value(formData, 'name'),
          code: optional(formData, 'code'),
          note: optional(formData, 'note'),
          isActive: true,
        })
        form.reset()
      }, `${singular} angelegt.`)
    }}>
      <Select name="parentId" label={parentLabel} items={parents} optionLabel={parentOption} />
      <Text name="name" label="Bezeichnung" required />
      <Text name="code" label="Code" />
      <Text name="note" label="Bemerkung" />
      <Save disabled={parents.length === 0} />
    </form>}
  >
    {items.map(item => <Row
      key={item.id}
      label={itemLabel(item)}
      active={item.isActive}
      administrator={administrator}
      onRename={() => rename(route, item, levelInput, execute)}
      onToggle={() => execute(
        () => updateMasterData(route, item.id, item.version, levelInput(item, !item.isActive)),
        'Aktivstatus geändert.',
      )}
      onDelete={() => remove(route === 'areas' ? 'Area' : route === 'fields' ? 'Field' : 'Row', item, execute)}
    />)}
  </MasterSection>
}

function Text({ name, label, required = false }: { name: string; label: string; required?: boolean }) {
  return <label>{label}<input name={name} required={required} /></label>
}

interface SelectProps {
  name: string
  label: string
  items: OptionItem[]
  optionLabel?: (item: OptionItem) => string
  optional?: boolean
  disabled?: boolean
  value?: string
  onChange?: (value: string) => void
}

function Select({ name, label, items, optionLabel = item => item.name, optional = false, disabled = false, value, onChange }: SelectProps) {
  const controlled = value !== undefined
  return <label>{label}<select
    name={name}
    required={!optional}
    disabled={disabled || items.length === 0}
    {...(controlled ? { value, onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onChange?.(event.target.value) } : {})}
  >
    <option value="">{optional ? 'Keine' : 'Bitte auswählen'}</option>
    {items.map(item => <option key={item.id} value={item.id}>{optionLabel(item)}</option>)}
  </select></label>
}

function Save({ disabled = false }: { disabled?: boolean }) {
  return <button className="button button--primary" type="submit" disabled={disabled}>Anlegen</button>
}

interface RowProps {
  label: string
  active: boolean
  administrator: boolean
  onRename?: () => void
  onToggle: () => void
  onDelete: () => void
}

function Row({ label, active, administrator, onRename, onToggle, onDelete }: RowProps) {
  return <div className="master-row">
    <span>{label} <small>{active ? 'Aktiv' : 'Deaktiviert'}</small></span>
    <span>
      {onRename && <button type="button" onClick={onRename}>Umbenennen</button>}
      <button type="button" onClick={onToggle}>{active ? 'Deaktivieren' : 'Aktivieren'}</button>
      {administrator && <button type="button" onClick={onDelete}>Löschen</button>}
    </span>
  </div>
}

function value(form: FormData, name: string) {
  return String(form.get(name) ?? '').trim()
}

function optional(form: FormData, name: string) {
  return value(form, name) || null
}

function optionalNumber(form: FormData, name: string) {
  const current = value(form, name)
  return current ? Number(current) : null
}

function cemeteryPath(data: CemeteryMasterData, cemeteryId: string) {
  return withCodeById(data.cemeteries, cemeteryId)
}

function areaPath(data: CemeteryMasterData, areaId: string) {
  const area = data.areas.find(item => item.id === areaId)
  return area ? `${cemeteryPath(data, area.parentId)} / ${withCode(area, data.areas)}` : 'Unbekannter Bereich'
}

function fieldPath(data: CemeteryMasterData, fieldId: string) {
  const field = data.fields.find(item => item.id === fieldId)
  return field ? `${areaPath(data, field.parentId)} / ${withCode(field, data.fields)}` : 'Unbekanntes Feld'
}

function rowPath(data: CemeteryMasterData, rowId: string) {
  const row = data.rows.find(item => item.id === rowId)
  return row ? `${fieldPath(data, row.parentId)} / ${withCode(row, data.rows)}` : 'Unbekannte Reihe'
}

function withCode(item: OptionItem, source: Array<OptionItem & { code?: string | null }>) {
  const code = source.find(candidate => candidate.id === item.id)?.code
  return `${item.name}${code ? ` · ${code}` : ''}`
}

function withCodeById(source: Array<OptionItem & { code?: string | null }>, id: string) {
  const item = source.find(candidate => candidate.id === id)
  return item ? withCode(item, source) : 'Unbekannt'
}

function graveSitePath(graveSite: GraveSite) {
  return `${graveSite.cemeteryName} · ${[graveSite.areaName, graveSite.fieldName, graveSite.rowName, graveSite.graveNumber].filter(Boolean).join(' / ')}`
}

function cemeteryInput(item: Cemetery, isActive = item.isActive) {
  return { name: item.name, code: item.code, address: item.address, note: item.note, isActive }
}

function levelInput(item: CemeteryLevel, isActive = item.isActive) {
  return { parentId: item.parentId, name: item.name, code: item.code, note: item.note, isActive }
}

function graveTypeInput(item: GraveType, isActive = item.isActive) {
  return { name: item.name, code: item.code, burialForm: item.burialForm, note: item.note, isActive }
}

function graveSiteInput(item: GraveSite, isActive = item.isActive) {
  return {
    cemeteryId: item.cemeteryId,
    areaId: item.areaId,
    fieldId: item.fieldId,
    rowId: item.rowId,
    graveTypeId: item.graveTypeId,
    graveNumber: item.graveNumber,
    status: item.status,
    isBlocked: item.isBlocked,
    blockNote: item.blockNote,
    targetCapacity: item.targetCapacity,
    note: item.note,
    isActive,
  }
}

function burialFormLabel(value: string) {
  return value === 'EarthBurial' ? 'Erdbestattung' : value === 'UrnBurial' ? 'Urnenbeisetzung' : 'Gemischt'
}

function statusLabel(item: GraveSite) {
  const status = item.status === 'Available' ? 'Frei' : item.status === 'Reserved' ? 'Reserviert' : 'Belegt'
  return `${status}${item.isBlocked ? ' · gesperrt' : ''}`
}

function rename<T extends { id: string; name: string; version: number }>(route: string, item: T, input: (current: T) => unknown, execute: Execute) {
  const name = window.prompt('Neue Bezeichnung', item.name)?.trim()
  if (name) {
    void execute(() => updateMasterData(route, item.id, item.version, { ...(input(item) as object), name }), 'Bezeichnung geändert.')
  }
}

function remove(kind: string, item: { id: string; version: number }, execute: Execute) {
  if (window.confirm('Diesen vollständig unbenutzten Datensatz endgültig löschen?')) {
    void execute(() => deleteMasterData(kind, item.id, item.version), 'Datensatz gelöscht.')
  }
}
