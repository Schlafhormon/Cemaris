import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CemeteryMasterDataPage } from './CemeteryMasterDataPage'

describe('Friedhofsstammdaten', () => {
  it('startet mit leerem Grabartenkatalog und blendet physisches Löschen für Sachbearbeitung aus', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      cemeteries: [], areas: [], fields: [], rows: [], graveTypes: [], cemeteryGraveTypes: [], graveSites: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    render(<CemeteryMasterDataPage administrator={false} />)

    expect(await screen.findByRole('heading', { name: 'Grabarten' })).toBeInTheDocument()
    expect(screen.queryByText('Reihengrabstätten')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument()
    expect(screen.getByText(/Grabnummern werden ausschließlich manuell gepflegt/)).toBeInTheDocument()
  })

  it('zeigt vollständige Hierarchiepfade und begrenzt abhängige Grabstellen-Auswahlen auf den gewählten Friedhof', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      cemeteries: [
        cemetery('cemetery-north', 'Nordfriedhof'),
        cemetery('cemetery-south', 'Südfriedhof'),
        cemetery('cemetery-inactive', 'Alter Friedhof', false),
      ],
      areas: [
        level('area-north', 'cemetery-north', 'Allgemein'),
        level('area-south', 'cemetery-south', 'Allgemein'),
        level('area-inactive-parent', 'cemetery-inactive', 'Verdeckt'),
      ],
      fields: [
        level('field-north', 'area-north', 'Feld A'),
        level('field-south', 'area-south', 'Feld A'),
        level('field-inactive-parent', 'area-inactive-parent', 'Verdeckt'),
      ],
      rows: [
        level('row-north', 'field-north', 'Reihe 1'),
        level('row-south', 'field-south', 'Reihe 1'),
        level('row-inactive-parent', 'field-inactive-parent', 'Verdeckt'),
      ],
      graveTypes: [
        graveType('type-earth', 'Erdwahlgrab'),
        graveType('type-urn', 'Urnenwahlgrab'),
        graveType('type-unassigned', 'Nicht zugeordnet'),
      ],
      cemeteryGraveTypes: [
        assignment('assignment-north', 'cemetery-north', 'type-earth'),
        assignment('assignment-south', 'cemetery-south', 'type-urn'),
        assignment('assignment-inactive', 'cemetery-north', 'type-unassigned', false),
      ],
      graveSites: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    render(<CemeteryMasterDataPage administrator />)

    const fieldParent = await screen.findByRole('combobox', { name: 'Übergeordneter Bereich' })
    expect(within(fieldParent).getByRole('option', { name: 'Nordfriedhof / Allgemein' })).toBeInTheDocument()
    expect(within(fieldParent).getByRole('option', { name: 'Südfriedhof / Allgemein' })).toBeInTheDocument()
    expect(within(fieldParent).queryByRole('option', { name: /Verdeckt/ })).not.toBeInTheDocument()

    const rowParent = screen.getByRole('combobox', { name: 'Übergeordnetes Feld' })
    expect(within(rowParent).getByRole('option', { name: 'Nordfriedhof / Allgemein / Feld A' })).toBeInTheDocument()
    expect(within(rowParent).getByRole('option', { name: 'Südfriedhof / Allgemein / Feld A' })).toBeInTheDocument()

    const graveSiteSection = screen.getByRole('heading', { name: 'Grabstellen' }).closest('section')
    expect(graveSiteSection).not.toBeNull()
    const graveForm = within(graveSiteSection!)
    const cemeterySelect = graveForm.getByRole('combobox', { name: 'Friedhof' })
    const areaSelect = graveForm.getByRole('combobox', { name: 'Bereich (optional)' })
    const fieldSelect = graveForm.getByRole('combobox', { name: 'Feld (optional)' })
    const rowSelect = graveForm.getByRole('combobox', { name: 'Reihe (optional)' })
    const typeSelect = graveForm.getByRole('combobox', { name: 'Grabart' })

    expect(areaSelect).toBeDisabled()
    expect(fieldSelect).toBeDisabled()
    expect(rowSelect).toBeDisabled()
    expect(typeSelect).toBeDisabled()

    await user.selectOptions(cemeterySelect, 'cemetery-north')
    expect(within(areaSelect).getByRole('option', { name: 'Nordfriedhof / Allgemein' })).toBeInTheDocument()
    expect(within(areaSelect).queryByRole('option', { name: 'Südfriedhof / Allgemein' })).not.toBeInTheDocument()
    expect(within(typeSelect).getByRole('option', { name: 'Erdwahlgrab' })).toBeInTheDocument()
    expect(within(typeSelect).queryByRole('option', { name: 'Urnenwahlgrab' })).not.toBeInTheDocument()
    expect(within(typeSelect).queryByRole('option', { name: 'Nicht zugeordnet' })).not.toBeInTheDocument()

    await user.selectOptions(areaSelect, 'area-north')
    expect(within(fieldSelect).getByRole('option', { name: 'Nordfriedhof / Allgemein / Feld A' })).toBeInTheDocument()
    expect(within(fieldSelect).queryByRole('option', { name: 'Südfriedhof / Allgemein / Feld A' })).not.toBeInTheDocument()
    await user.selectOptions(fieldSelect, 'field-north')
    expect(within(rowSelect).getByRole('option', { name: 'Nordfriedhof / Allgemein / Feld A / Reihe 1' })).toBeInTheDocument()
    await user.selectOptions(rowSelect, 'row-north')
    await user.selectOptions(typeSelect, 'type-earth')

    await user.selectOptions(cemeterySelect, 'cemetery-south')
    expect(areaSelect).toHaveValue('')
    expect(fieldSelect).toHaveValue('')
    expect(fieldSelect).toBeDisabled()
    expect(rowSelect).toHaveValue('')
    expect(rowSelect).toBeDisabled()
    expect(typeSelect).toHaveValue('')
    expect(within(areaSelect).getByRole('option', { name: 'Südfriedhof / Allgemein' })).toBeInTheDocument()
    expect(within(areaSelect).queryByRole('option', { name: 'Nordfriedhof / Allgemein' })).not.toBeInTheDocument()
    expect(within(typeSelect).getByRole('option', { name: 'Urnenwahlgrab' })).toBeInTheDocument()
  })
})

function cemetery(id: string, name: string, isActive = true) {
  return { id, name, code: null, address: null, note: null, isActive, version: 1 }
}

function level(id: string, parentId: string, name: string, isActive = true) {
  return { id, parentId, name, code: null, note: null, isActive, version: 1 }
}

function graveType(id: string, name: string, isActive = true) {
  return { id, name, code: null, burialForm: 'EarthBurial', note: null, isActive, version: 1 }
}

function assignment(id: string, cemeteryId: string, graveTypeId: string, isActive = true) {
  return { id, cemeteryId, graveTypeId, isActive, version: 1 }
}
