export interface SearchFilters {
  name: string
  firstName: string
  birthDate: string
  deathDate: string
  cemetery: string
  field: string
  graveNumber: string
  burialDate: string
  entitledPerson: string
  address: string
  noticeNumber: string
}

export interface SearchDeceasedPerson {
  id: string
  firstName: string | null
  lastName: string | null
  birthDate: string | null
  deathDate: string | null
}

export interface SearchEntitledPerson {
  id: string
  displayName: string
  addresses: string[]
}

export interface SearchRecord {
  caseId: string
  isSynthetic: boolean
  cemetery: string | null
  field: string | null
  graveNumber: string | null
  deceasedPersons: SearchDeceasedPerson[]
  burialDates: string[]
  entitledPersons: SearchEntitledPerson[]
  noticeNumbers: string[]
}

export interface SearchResponse {
  items: SearchRecord[]
  totalMatches: number
  limit: number
  isTruncated: boolean
}

export interface GraveDetails {
  cemetery: string | null
  field: string | null
  graveNumber: string | null
  graveSiteId?: string | null
}

export interface DeceasedDetails {
  id: string
  firstName: string | null
  lastName: string | null
  birthDate: string | null
  deathDate: string | null
}

export interface BurialDetails {
  id: string
  deceasedPersonId: string | null
  burialDate: string | null
  graveSiteId: string | null
  status: BurialProcessStatus | null
  planningDate: string | null
}

export type BurialProcessStatus = 'Draft' | 'Planned' | 'Confirmed' | 'Performed' | 'Completed'

export interface UsageRightDetails {
  id: string
  reference: string | null
  validFrom: string | null
  validUntil: string | null
  entitledPersonIds: string[]
}

export interface AddressDetails {
  id: string
  street: string | null
  houseNumber: string | null
  postalCode: string | null
  city: string | null
  additionalInformation: string | null
}

export interface EntitledPersonDetails {
  id: string
  firstName: string | null
  lastName: string | null
  organizationName: string | null
  addresses: AddressDetails[]
}

export interface FeeItemDetails {
  id: string
  description: string | null
  amount: number | null
  currencyCode: string | null
}

export interface NoticeDetails {
  id: string
  noticeNumber: string | null
  noticeDate: string | null
  dueDate: string | null
  assessedAmount: number | null
  currencyCode: string | null
  feeItems: FeeItemDetails[]
}

export interface CaseOverview {
  id: string
  isSynthetic: boolean
  version: number
  grave: GraveDetails
  deceasedPersons: DeceasedDetails[]
  burials: BurialDetails[]
  usageRights: UsageRightDetails[]
  entitledPersons: EntitledPersonDetails[]
  notices: NoticeDetails[]
  dataQualityNotes: string[]
  lastChange: LastCaseChangeDetails | null
}

export interface LastCaseChangeDetails {
  actorDisplayName: string
  changedAtUtc: string
}

export interface CaseWithEtag {
  caseOverview: CaseOverview
  etag: string
  location?: string
}

export interface GraveInput {
  cemetery: string
  field: string
  graveNumber: string
  graveSiteId?: string
}

export interface DeceasedPersonInput {
  firstName: string
  lastName: string
  birthDate: string
  deathDate: string
}

export interface BurialInput {
  deceasedPersonId: string
  burialDate: string
}

export interface BurialProcessInput {
  deceasedPersonId: string
  graveSiteId: string
  planningDate: string
  actualBurialDate: string
}
