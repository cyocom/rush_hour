import { Link } from 'react-router-dom'
import { ConflictList } from '../../components/alerts/ConflictList'
import { UpcomingAlertsList } from '../../components/alerts/UpcomingAlertsList'
import { PageShell } from '../../components/layout/PageShell'
import { StatusCard } from '../../components/status/StatusCard'
import { MockStreamPanel } from '../../components/stream/MockStreamPanel'
import { loadMockMatchWindows } from '../../data/mock/matches'
import { deriveUpcomingAlerts } from '../../domain/services/alerts'
import { deriveMatchConflicts } from '../../domain/services/conflicts'
import { useWatchPreferences } from '../../app/watchPreferencesContext'

export function WatchPage() {
  const { trackedTeams } = useWatchPreferences()
  const alerts = deriveUpcomingAlerts(loadMockMatchWindows(), trackedTeams)
  const conflicts = deriveMatchConflicts(alerts)

  return (
    <PageShell
      title="Watch"
      subtitle="Track upcoming matches for your selected teams and catch overlap conflicts early."
    >
      <main className="space-y-4">
        <MockStreamPanel />

        {trackedTeams.length === 0 ? (
          <StatusCard
            title="No teams configured"
            body="Add your first team in Config to start getting upcoming watch alerts."
            action={<Link className="text-sm font-semibold text-[var(--rh-primary)]" to="/config">Go to Config</Link>}
          />
        ) : null}

        {trackedTeams.length > 0 && alerts.length === 0 ? (
          <StatusCard
            title="No upcoming tracked matches"
            body="Your tracked teams are set, but none of them appear in the upcoming mock schedule right now."
          />
        ) : null}

        {alerts.length > 0 ? <UpcomingAlertsList alerts={alerts} /> : null}
        {conflicts.length > 0 ? <ConflictList conflicts={conflicts} /> : null}
      </main>
    </PageShell>
  )
}
