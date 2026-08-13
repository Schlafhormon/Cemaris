export type BurialForm = 'EarthBurial' | 'UrnBurial' | 'Mixed'
export type GraveSiteStatus = 'Available' | 'Reserved' | 'Occupied'

export interface Cemetery { id: string; name: string; code: string | null; address: string | null; note: string | null; isActive: boolean; version: number }
export interface CemeteryLevel { id: string; parentId: string; name: string; code: string | null; note: string | null; isActive: boolean; version: number }
export interface GraveType { id: string; name: string; code: string | null; burialForm: BurialForm; note: string | null; isActive: boolean; version: number }
export interface CemeteryGraveType { id: string; cemeteryId: string; graveTypeId: string; isActive: boolean; version: number }
export interface GraveSite {
  id: string; cemeteryId: string; areaId: string | null; fieldId: string | null; rowId: string | null; graveTypeId: string
  graveNumber: string; status: GraveSiteStatus; isBlocked: boolean; blockNote: string | null; targetCapacity: number | null
  note: string | null; isActive: boolean; version: number; cemeteryName: string; areaName: string | null
  fieldName: string | null; rowName: string | null; graveTypeName: string
}
export interface CemeteryMasterData {
  cemeteries: Cemetery[]; areas: CemeteryLevel[]; fields: CemeteryLevel[]; rows: CemeteryLevel[]
  graveTypes: GraveType[]; cemeteryGraveTypes: CemeteryGraveType[]; graveSites: GraveSite[]
}
