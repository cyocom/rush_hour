import type { UpcomingMatchAlert } from '../../domain/models/watch'

interface UpcomingAlertsListProps {
  alerts: UpcomingMatchAlert[]
}

export function UpcomingAlertsList({ alerts }: UpcomingAlertsListProps) {
  return (
    <section className="rounded-panel border border-[var(--rh-border)] bg-white p-4 shadow-panel">
      <h2 className="text-lg font-semibold">Upcoming tracked matches</h2>
      <ul data-testid="watch-alert-list" className="mt-3 space-y-2">
        {alerts.map((alert) => (
          <li key={alert.alertId} className="rounded-md border border-[var(--rh-border)] bg-[var(--rh-surface)] p-3">
            <p className="font-semibold">{alert.label}</p>
            <p className="text-sm text-[var(--rh-muted)]">Teams: {alert.trackedTeamsInMatch.join(', ')}</p>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--rh-primary)]">{alert.urgency}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
