import type { MatchConflict } from '../../domain/models/watch'

interface ConflictListProps {
  conflicts: MatchConflict[]
}

export function ConflictList({ conflicts }: ConflictListProps) {
  return (
    <section className="rounded-panel border border-[var(--rh-border)] bg-white p-4 shadow-panel">
      <h2 className="text-lg font-semibold">Overlap warnings</h2>
      <ul data-testid="watch-conflict-list" className="mt-3 space-y-2" aria-live="polite">
        {conflicts.map((conflict) => (
          <li key={conflict.conflictId} className="rounded-md border border-[var(--rh-primary)] bg-[rgb(150_29_55_/_10%)] p-3">
            <p className="font-semibold">Conflicting matches: {conflict.impactedMatchIds.join(' + ')}</p>
            <p className="text-sm text-[var(--rh-muted)]">Tracked teams: {conflict.impactedTrackedTeams.join(', ')}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
