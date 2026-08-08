export interface HealthResponse {
  service: string
  status: string
}

export interface SystemInformationResponse {
  name: string
  productionReady: boolean
  status: string
  subtitle: string
  version: string
}

export type ConnectionState = 'loading' | 'online' | 'offline'
