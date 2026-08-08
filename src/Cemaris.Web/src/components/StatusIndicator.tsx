import type { ConnectionState } from '../types/system'

const labels: Record<ConnectionState, string> = {
  loading: 'Wird geprüft',
  online: 'Verbunden',
  offline: 'Nicht erreichbar',
}

interface StatusIndicatorProps {
  state: ConnectionState
}

export function StatusIndicator({ state }: StatusIndicatorProps) {
  return (
    <span
      className={`status-indicator status-indicator--${state}`}
      aria-live="polite"
    >
      {labels[state]}
    </span>
  )
}
