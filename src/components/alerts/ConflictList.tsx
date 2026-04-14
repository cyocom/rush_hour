import type { MatchConflict } from '../../domain/models/watch'

interface ConflictListProps {
  conflicts: MatchConflict[]
}

export function ConflictList({ conflicts }: ConflictListProps) {
  return (
    <section className="rh-panel p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="rh-kicker">Priority risk</p>
          <h2 className="rh-section-heading mt-2">Overlap warnings</h2>
        </div>
        <div className="rounded-full bg-[rgb(150_29_55_/_10%)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--rh-primary)]">
          {conflicts.length} conflict{conflicts.length === 1 ? '' : 's'}
        </div>
      </div>
      <ul data-testid="watch-conflict-list" className="mt-5 space-y-3" aria-live="polite">
        {conflicts.map((conflict) => (
          <li key={conflict.conflictId} className="rounded-[1.25rem] border border-[color:var(--rh-primary)] bg-[rgb(150_29_55_/_8%)] p-4">
            <p className="text-base font-bold tracking-[-0.02em]">Conflicting matches: {conflict.impactedMatchIds.join(' + ')}</p>
            <p className="mt-2 text-sm text-[color:var(--rh-muted)]">Tracked teams: {conflict.impactedTrackedTeams.join(', ')}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
              <span className="rounded-full bg-white px-3 py-1 text-[color:var(--rh-primary)]">Priority team {conflict.highestPriorityTeamId ?? 'n/a'}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
