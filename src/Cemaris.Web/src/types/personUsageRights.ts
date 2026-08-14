export type PartyType = 'NaturalPerson' | 'Organization'

export interface PartyAddress {
  id: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  additionalInformation: string | null
  validFromInclusive: string
  validUntilExclusive: string | null
  isCurrentPrimary: boolean
}

export interface PartyRevision {
  id: string
  resultingVersion: number
  mutationType: string
  reason: string | null
  occurredAtUtc: string
  actorDisplayName: string
  addresses: PartyAddress[]
}

export interface Party {
  id: string
  partyType: PartyType
  firstName: string | null
  lastName: string | null
  organizationName: string | null
  currentPrimaryAddressId: string | null
  version: number
  addresses: PartyAddress[]
  revisions: PartyRevision[]
}

export interface PartySearchItem {
  id: string
  partyType: PartyType
  displayName: string
  currentPrimaryAddress: string | null
}

export interface HolderPeriod {
  id: string
  partyId: string
  validFromInclusive: string
  validUntilExclusive: string | null
}

export interface UsageRightRevision {
  id: string
  resultingVersion: number
  mutationType: string
  reason: string | null
  occurredAtUtc: string
  actorDisplayName: string
  startDate: string
  endDate: string
  sourceReference: string
  startRuleCodeSnapshot: string
  startRuleDisplayNameSnapshot: string
  holderPeriods: HolderPeriod[]
}

export interface UsageRight {
  id: string
  graveSiteId: string
  startDate: string
  endDate: string
  sourceReference: string
  usageRightStartRuleId: string
  startRuleCodeSnapshot: string
  startRuleDisplayNameSnapshot: string
  version: number
  holderPeriods: HolderPeriod[]
  revisions: UsageRightRevision[]
}

export interface StartRuleRevision {
  id: string
  resultingVersion: number
  mutationType: string
  reason: string | null
  occurredAtUtc: string
  actorDisplayName: string
  code: string
  displayName: string
}

export interface StartRule {
  id: string
  cemeteryId: string
  code: string
  displayName: string
  version: number
  revisions: StartRuleRevision[]
}

export interface Versioned<T> { value: T; etag: string }
