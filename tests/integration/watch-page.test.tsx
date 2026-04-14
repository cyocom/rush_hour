import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../../src/app/App'
import { SESSION_STORAGE_KEY } from '../../src/domain/services/sessionPreferences'

describe('watch page', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('shows guidance with no teams configured', () => {
    window.history.pushState({}, '', '/watch')
    render(<App />)

    expect(screen.getByTestId('watch-stream-panel')).toBeInTheDocument()
    expect(screen.getByText(/No teams configured/i)).toBeInTheDocument()
  })

  it('shows alerts when teams are seeded', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        trackedTeams: [
          { teamId: 'frc254', displayName: 'FRC254', priorityRank: 1, createdAt: new Date().toISOString() },
        ],
        lastUpdatedAt: new Date().toISOString(),
        schemaVersion: 'v1',
      }),
    )

    window.history.pushState({}, '', '/watch')
    render(<App />)

    expect(screen.getByTestId('watch-alert-list')).toBeInTheDocument()
  })
})
