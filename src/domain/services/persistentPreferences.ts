import {
  APP_PREFERENCES_SCHEMA_VERSION,
  APP_PREFERENCES_STORAGE_KEY,
  DEFAULT_APP_PREFERENCES,
  type AppPersistentPreferences,
  type SimulationClock,
} from '../models/schedule'

function hasLocalStorage(): boolean {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false
  }

  const storage = window.localStorage as unknown as {
    getItem?: unknown
    setItem?: unknown
  }

  return typeof storage.getItem === 'function' && typeof storage.setItem === 'function'
}

export function readPersistentPreferences(): AppPersistentPreferences {
  if (!hasLocalStorage()) {
    return { ...DEFAULT_APP_PREFERENCES }
  }

  const raw = window.localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)
  if (!raw) {
    return { ...DEFAULT_APP_PREFERENCES }
  }

  try {
    const parsed = JSON.parse(raw) as AppPersistentPreferences

    if (parsed.schemaVersion !== APP_PREFERENCES_SCHEMA_VERSION) {
      return { ...DEFAULT_APP_PREFERENCES }
    }

    return {
      ...DEFAULT_APP_PREFERENCES,
      ...parsed,
      simulationClock: {
        ...DEFAULT_APP_PREFERENCES.simulationClock,
        ...(parsed.simulationClock ?? {}),
      },
    }
  } catch {
    return { ...DEFAULT_APP_PREFERENCES }
  }
}

export function writePersistentPreferences(
  update: Partial<Omit<AppPersistentPreferences, 'simulationClock'>> & {
    simulationClock?: Partial<SimulationClock>
  },
): AppPersistentPreferences {
  const current = readPersistentPreferences()
  const next: AppPersistentPreferences = {
    ...current,
    ...update,
    simulationClock: {
      ...current.simulationClock,
      ...(update.simulationClock ?? {}),
    },
    schemaVersion: APP_PREFERENCES_SCHEMA_VERSION,
  }

  if (hasLocalStorage()) {
    window.localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(next))
  }

  return next
}

export function getEffectiveTime(): Date {
  const prefs = readPersistentPreferences()
  const {
    enabled,
    simulatedISOString,
    running,
    startedAtISOString,
  } = prefs.simulationClock

  if (enabled && simulatedISOString) {
    const base = new Date(simulatedISOString)
    if (!isNaN(base.getTime())) {
      if (running && startedAtISOString) {
        const startedAt = new Date(startedAtISOString)
        if (!isNaN(startedAt.getTime())) {
          const elapsedMs = Date.now() - startedAt.getTime()
          return new Date(base.getTime() + Math.max(0, elapsedMs))
        }
      }
      return base
    }
  }

  return new Date()
}
