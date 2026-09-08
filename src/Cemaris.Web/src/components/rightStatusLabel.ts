import type { UsageRightStatus } from '../types/personUsageRights'

export function rightStatusLabel(status?: UsageRightStatus) {
  return status === 'Voided' ? 'Irrtümlich angelegt' : status === 'Ended' ? 'Beendet' : 'Offen'
}

