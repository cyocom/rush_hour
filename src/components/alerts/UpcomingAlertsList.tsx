import type { UpcomingMatchAlert } from '../../domain/models/watch'

interface UpcomingAlertsListProps {
  alerts: UpcomingMatchAlert[]
}

export function UpcomingAlertsList({ alerts }: UpcomingAlertsListProps) {
  return (
    <section className="rh-panel p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="rh-kicker">Timeline</p>
          <h2 className="rh-section-heading mt-2">Upcoming tracked matches</h2>
        </div>
        <div className="rh-chip">{alerts.length} queued</div>
      </div>
      <ul data-testid="watch-alert-list" className="mt-5 space-y-3">
        {alerts.map((alert) => (
          <li key={alert.alertId} className="rounded-[1.25rem] border border-[color:var(--rh-border)] bg-[color:var(--rh-surface)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-bold tracking-[-0.03em]">{alert.label}</p>
                <p className="mt-1 text-sm text-[color:var(--rh-muted)]">Teams: {alert.trackedTeamsInMatch.join(', ')}</p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--rh-primary)]">
                {alert.urgency}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--rh-muted-soft)]">
              <span className="rounded-full bg-white px-3 py-1">{alert.matchId}</span>
              <span className="rounded-full bg-white px-3 py-1">Priority {alert.priorityScore}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
