import { useCallback, useEffect, useState } from 'react'
import { getHealth, getSystemInformation } from '../api/cemarisApi'
import type {
  ConnectionState,
  HealthResponse,
  SystemInformationResponse,
} from '../types/system'

interface SystemStatus {
  connection: ConnectionState
  health?: HealthResponse
  information?: SystemInformationResponse
}

export function useSystemStatus() {
  const [requestKey, setRequestKey] = useState(0)
  const [status, setStatus] = useState<SystemStatus>({ connection: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    setStatus({ connection: 'loading' })

    Promise.all([
      getHealth(controller.signal),
      getSystemInformation(controller.signal),
    ])
      .then(([health, information]) => {
        setStatus({
          connection: health.status === 'Healthy' ? 'online' : 'offline',
          health,
          information,
        })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setStatus({ connection: 'offline' })
      })

    return () => controller.abort()
  }, [requestKey])

  const retry = useCallback(() => {
    setRequestKey((current) => current + 1)
  }, [])

  return { ...status, retry }
}
