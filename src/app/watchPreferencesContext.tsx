import { createContext, useContext } from 'react'
import type { TrackedTeam } from '../domain/models/watch'

export interface WatchPreferencesState {
  trackedTeams: TrackedTeam[]
  addTeam: (teamId: string) => void
  removeTeam: (teamId: string) => void
  reorderTeam: (fromIndex: number, toIndex: number) => void
}

export const WatchPreferencesContext = createContext<WatchPreferencesState | null>(null)

export function useWatchPreferences(): WatchPreferencesState {
  const context = useContext(WatchPreferencesContext)
  if (!context) {
    throw new Error('WatchPreferencesContext is missing provider')
  }

  return context
}
