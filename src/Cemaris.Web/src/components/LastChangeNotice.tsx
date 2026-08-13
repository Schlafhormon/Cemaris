import type { LastCaseChangeDetails } from '../types/cases'

interface LastChangeNoticeProps {
  lastChange: LastCaseChangeDetails | null
}

function formatChangedAt(value: string) {
  const changedAt = new Date(value)
  if (Number.isNaN(changedAt.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(changedAt)
}

export function LastChangeNotice({ lastChange }: LastChangeNoticeProps) {
  const formattedChangedAt = lastChange ? formatChangedAt(lastChange.changedAtUtc) : null
  if (!lastChange || !formattedChangedAt) {
    return (
      <p className="last-change-notice last-change-notice--unknown">
        Für diese Fallakte liegen noch keine Angaben zur letzten Änderung vor.
      </p>
    )
  }

  return (
    <p className="last-change-notice">
      Zuletzt geändert durch {lastChange.actorDisplayName} am {formattedChangedAt} Uhr
    </p>
  )
}
