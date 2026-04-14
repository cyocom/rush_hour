import type { NextMatchInfo } from '../../domain/models/schedule'

interface NextMatchBarProps {
  next: NextMatchInfo
}

export function NextMatchBar({ next }: NextMatchBarProps) {
  if (next.status === 'none' || !next.entry) return null

  const { status, entry, minutesUntil } = next
  const teams = entry.subscribedTeamsInMatch.join(', ')

  const timeLabel =
    status === 'in-progress'
      ? 'Now playing'
      : minutesUntil !== null && minutesUntil === 0
      ? 'Starting now'
      : minutesUntil !== null
      ? `in ${minutesUntil} min`
      : ''

  const headingLabel =
    status === 'in-progress' ? 'Now playing' : status === 'soon' ? 'Up next — soon' : 'Next match'

  const barStyles: Record<string, string> = {
    'in-progress':
      'border-[rgb(150_29_55/0.5)] bg-[rgb(150_29_55/0.12)] text-white animate-pulse',
    soon: 'border-amber-500/40 bg-amber-500/10 text-white',
    upcoming: 'border-white/10 bg-white/5 text-white',
    none: '',
  }

  return (
    <div
      aria-live="polite"
      aria-label={status === 'in-progress' ? 'Match in progress' : 'Next match info'}
      data-testid="watch-next-match-bar"
      className={[
        'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3',
        barStyles[status] ?? barStyles.upcoming,
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
          {headingLabel}
        </span>
        <span className="text-base font-bold tracking-tight">{entry.matchLabel}</span>
        {teams && (
          <span className="text-sm font-semibold opacity-70">
            Team{entry.subscribedTeamsInMatch.length !== 1 ? 's' : ''} {teams}
          </span>
        )}
      </div>
      {timeLabel && (
        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em]',
            status === 'in-progress'
              ? 'bg-[rgb(150_29_55)] text-white'
              : status === 'soon'
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-white/10 text-white/70',
          ].join(' ')}
        >
          {timeLabel}
        </span>
      )}
    </div>
  )
}
