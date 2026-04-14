import type { UpcomingMatchAlert } from '../../domain/models/watch'

interface UpcomingAlertsListProps {
  alerts: UpcomingMatchAlert[]
  referenceTime?: Date
  selectedMatchId?: string | null
  onSelectMatch?: (matchId: string) => void
}

function formatTimeUntil(startTime: string, referenceTime: Date): string {
  const diffMs = new Date(startTime).getTime() - referenceTime.getTime()
  const totalMinutes = Math.max(0, Math.ceil(diffMs / 60000))

  if (totalMinutes <= 0) return 'now'
  if (totalMinutes < 60) return `in ${totalMinutes}m`

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `in ${hours}h` : `in ${hours}h ${minutes}m`
}

function normalizeTeamNumber(teamKeyOrId: string): string {
  return teamKeyOrId.replace(/^frc/i, '')
}

export function UpcomingAlertsList({
  alerts,
  referenceTime = new Date(),
  selectedMatchId = null,
  onSelectMatch,
}: UpcomingAlertsListProps) {
  const displayedAlerts = alerts.slice(0, 3)

  return (
    <section className="rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(180deg,#16171d_0%,#13151a_50%,#120f15_100%)] p-5 text-white sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/55">Timeline</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Upcoming tracked matches</h2>
        </div>
      </div>

      <ul
        data-testid="watch-alert-list"
        className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {displayedAlerts.map((alert) => {
          const isSelected = alert.matchId === selectedMatchId

          return (
          <li
            key={alert.alertId}
            className={[
              'rounded-3xl border bg-white/[0.05] p-[18px] backdrop-blur-[10px] transition',
              isSelected
                ? 'border-[rgb(150_29_55/0.7)] shadow-[0_0_0_2px_rgb(150_29_55/0.25)]'
                : 'border-white/[0.08] hover:border-white/20',
            ].join(' ')}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => onSelectMatch?.(alert.matchId)}
            >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55">
              {alert.eventName ?? alert.matchId}
            </p>
            <p className="mt-3 text-xl font-black leading-tight tracking-[-0.03em] text-white">
              {alert.label}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5" data-testid="watch-alert-entry-teams">
              {(alert.allTeamKeys ?? alert.trackedTeamsInMatch).map((teamKeyOrId) => {
                const teamNumber = normalizeTeamNumber(teamKeyOrId)
                const alliance = alert.subscribedTeamAlliances?.[teamNumber]

                const chipClass =
                  alliance === 'red'
                    ? 'border border-white/20 bg-[linear-gradient(135deg,rgb(180_30_40),rgb(220_50_65))] text-white'
                    : alliance === 'blue'
                    ? 'border border-white/20 bg-[linear-gradient(135deg,rgb(25_70_180),rgb(40_100_220))] text-white'
                    : 'border border-white/10 bg-[rgb(255_255_255_/_7%)] text-white/75'

                return (
                  <span
                    key={`${alert.alertId}-${teamNumber}`}
                    className={`rounded-full px-2.5 py-1 text-[12px] font-extrabold tracking-[0.04em] ${chipClass}`}
                  >
                    {teamNumber}
                  </span>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={[
                  'inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]',
                  alert.urgency === 'now'
                    ? 'border border-[rgb(150_29_55/0.5)] bg-[rgb(150_29_55/0.25)] text-white'
                    : alert.urgency === 'soon'
                    ? 'border border-amber-400/40 bg-amber-400/20 text-amber-100'
                    : 'border border-white/15 bg-white/10 text-white/90',
                ].join(' ')}
              >
                {formatTimeUntil(alert.startTime, referenceTime)}
              </span>
            </div>
            </button>
          </li>
          )
        })}
      </ul>
    </section>
  )
}
