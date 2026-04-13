import { useMemo, useState } from 'react'
import { PageShell } from '../../components/layout/PageShell'
import { StatusCard } from '../../components/status/StatusCard'
import { PriorityTeamList } from '../../components/teams/PriorityTeamList'
import { TeamInputForm } from '../../components/teams/TeamInputForm'
import { useWatchPreferences } from '../../app/watchPreferencesContext'
import { normalizeTeamId, validateTeamInput } from '../../domain/validation/teams'

export function ConfigPage() {
  const { trackedTeams, addTeam, removeTeam, reorderTeam } = useWatchPreferences()
  const [error, setError] = useState<string | null>(null)

  const emptyHint = useMemo(
    () => trackedTeams.length === 0,
    [trackedTeams.length],
  )

  const handleAdd = (teamId: string) => {
    const normalized = normalizeTeamId(teamId)
    const validationError = validateTeamInput(normalized, trackedTeams)

    if (validationError) {
      setError(validationError)
      return
    }

    addTeam(normalized)
    setError(null)
  }

  return (
    <PageShell
      title="Config"
      subtitle="Manage your tracked teams and keep priorities in watch-ready order."
    >
      <main className="space-y-4">
        <section className="rounded-panel border border-[var(--rh-border)] bg-[var(--rh-surface-raised)] p-4 shadow-panel">
          <TeamInputForm error={error} onSubmit={handleAdd} />
        </section>

        {emptyHint ? (
          <StatusCard
            title="No teams yet"
            body="Add your first team above to begin building your watch priority list."
          />
        ) : (
          <section className="rounded-panel border border-[var(--rh-border)] bg-[var(--rh-surface-raised)] p-4 shadow-panel">
            <h2 className="text-lg font-semibold">Priority order</h2>
            <p className="mb-3 text-sm text-[var(--rh-muted)]">Drag or use keyboard controls to reorder teams.</p>
            <PriorityTeamList teams={trackedTeams} onRemove={removeTeam} onReorder={reorderTeam} />
          </section>
        )}
      </main>
    </PageShell>
  )
}
