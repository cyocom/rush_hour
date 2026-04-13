import { useMemo, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { writeSessionPreferences, readSessionPreferences } from '../domain/services/sessionPreferences'
import { normalizePriorityRanks } from '../domain/validation/teams'
import type { TrackedTeam } from '../domain/models/watch'
import { createAppRouter } from './router'
import { WatchPreferencesContext } from './watchPreferencesContext'

function createTrackedTeam(teamId: string, nextRank: number): TrackedTeam {
  return {
    teamId,
    displayName: teamId.toUpperCase(),
    priorityRank: nextRank,
    createdAt: new Date().toISOString(),
  }
}

export function App() {
  const [trackedTeams, setTrackedTeams] = useState<TrackedTeam[]>(() => readSessionPreferences().trackedTeams)

  const value = useMemo(() => ({
    trackedTeams,
    addTeam: (teamId: string) => {
      setTrackedTeams((prev) => {
        const next = [...prev, createTrackedTeam(teamId, prev.length + 1)]
        const normalized = normalizePriorityRanks(next)
        writeSessionPreferences(normalized)
        return normalized
      })
    },
    removeTeam: (teamId: string) => {
      setTrackedTeams((prev) => {
        const next = prev.filter((team) => team.teamId !== teamId)
        const normalized = normalizePriorityRanks(next)
        writeSessionPreferences(normalized)
        return normalized
      })
    },
    reorderTeam: (fromIndex: number, toIndex: number) => {
      setTrackedTeams((prev) => {
        if (fromIndex === toIndex || toIndex < 0 || toIndex >= prev.length) {
          return prev
        }

        const next = [...prev]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        const normalized = normalizePriorityRanks(next)
        writeSessionPreferences(normalized)
        return normalized
      })
    },
  }), [trackedTeams])

  const router = useMemo(() => createAppRouter(), [])

  return (
    <WatchPreferencesContext.Provider value={value}>
      <RouterProvider router={router} />
    </WatchPreferencesContext.Provider>
  )
}
