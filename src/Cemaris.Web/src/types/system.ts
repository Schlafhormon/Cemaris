export interface HealthResponse {
  service: string
  status: string
}

export interface SystemInformationResponse {
  name: string
  caseEditingEnabled: boolean
  cemeteryMasterDataEditingEnabled: boolean
  burialProcessEditingEnabled: boolean
  personUsageRightsEditingEnabled: boolean
  noticeDraftEditingEnabled: boolean
  noticeGenerationEnabled: boolean
  usageRightLifecycleEnabled?: boolean
  caseFollowUpsEnabled?: boolean
  productionReady: boolean
  status: string
  subtitle: string
  version: string
}

export type ConnectionState = 'loading' | 'online' | 'offline'
