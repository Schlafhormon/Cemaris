import type { Party } from '../types/personUsageRights'

export function partyDisplayName(party: Party) {
  return party.organizationName ?? `${party.firstName} ${party.lastName}`
}
