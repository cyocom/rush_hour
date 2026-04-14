import { useMemo, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { writeSessionPreferences, readSessionPreferences } from '../domain/services/sessionPreferences'
import { readPersistentPreferences, writePersistentPreferences } from '../domain/services/persistentPreferences'
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

function syncToPersistent(teams: TrackedTeam[]): void {
  writePersistentPreferences({
    subscribedTeams: teams.map((t) => ({ teamId: t.teamId, addedAt: t.createdAt })),
  })
}

export function App() {
  const [trackedTeams, setTrackedTeams] = useState<TrackedTeam[]>(() => {
    const session = readSessionPreferences()
    if (session.trackedTeams.length > 0) return session.trackedTeams
    // Seed from localStorage on a fresh session so teams persist across reloads
    const persistent = readPersistentPreferences()
    if (persistent.subscribedTeams.length > 0) {
      const seeded = persistent.subscribedTeams.map((st, i) => ({
        teamId: st.teamId,
        displayName: st.teamId.toUpperCase(),
        priorityRank: i + 1,
        createdAt: st.addedAt,
      }))
      writeSessionPreferences(seeded)
      return seeded
    }
    return []
  })

  const value = useMemo(() => ({
    trackedTeams,
    addTeam: (teamId: string) => {
      setTrackedTeams((prev) => {
        const next = [...prev, createTrackedTeam(teamId, prev.length + 1)]
        const normalized = normalizePriorityRanks(next)
        writeSessionPreferences(normalized)
        syncToPersistent(normalized)
        return normalized
      })
    },
    removeTeam: (teamId: string) => {
      setTrackedTeams((prev) => {
        const next = prev.filter((team) => team.teamId !== teamId)
        const normalized = normalizePriorityRanks(next)
        writeSessionPreferences(normalized)
        syncToPersistent(normalized)
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
        syncToPersistent(normalized)
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
