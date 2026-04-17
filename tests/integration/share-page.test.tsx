import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SharePage } from '../../src/pages/SharePage/SharePage'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as shareUrlModule from '../../src/domain/services/shareUrl'
import * as persistentPreferencesModule from '../../src/domain/services/persistentPreferences'

// Mock the services
vi.mock('../../src/domain/services/shareUrl')
vi.mock('../../src/domain/services/persistentPreferences')

function renderWithRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/share/:payload" element={<SharePage />} />
        <Route path="*" element={<SharePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SharePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders confirmation details for valid payload', () => {
    vi.mocked(shareUrlModule.decodeSharePayload).mockReturnValue({
      teams: ['frc254', 'frc1678'],
      apiKey: 'test-key-123',
    })

    renderWithRoute('/share/test-encoded-payload')

    expect(screen.getByText('Import shared configuration?')).toBeInTheDocument()
    expect(screen.getByText('frc254')).toBeInTheDocument()
    expect(screen.getByText('frc1678')).toBeInTheDocument()
    expect(screen.getByText('TBA API key included')).toBeInTheDocument()
  })

  it('shows warning when no API key is included', () => {
    vi.mocked(shareUrlModule.decodeSharePayload).mockReturnValue({
      teams: ['frc254'],
      apiKey: null,
    })

    renderWithRoute('/share/test-encoded-payload')

    expect(screen.getByText('No API key included, teams only')).toBeInTheDocument()
  })

  it('allows skipping API key import', () => {
    vi.mocked(shareUrlModule.decodeSharePayload).mockReturnValue({
      teams: ['frc254', 'frc1678'],
      apiKey: 'test-key-123',
    })

    renderWithRoute('/share/test-encoded-payload')

    const skipCheckbox = screen.getByRole('checkbox', { name: /skip importing the api key/i })
    fireEvent.click(skipCheckbox)

    expect(skipCheckbox).toBeChecked()
  })

  it('writes preferences when import is accepted', () => {
    vi.mocked(shareUrlModule.decodeSharePayload).mockReturnValue({
      teams: ['frc254', 'frc1678'],
      apiKey: 'imported-key',
    })

    renderWithRoute('/share/test-encoded-payload')

    fireEvent.click(screen.getByRole('button', { name: 'Import' }))

    expect(persistentPreferencesModule.writePersistentPreferences).toHaveBeenCalledTimes(1)
    expect(persistentPreferencesModule.writePersistentPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        subscribedTeams: expect.arrayContaining([
          expect.objectContaining({ teamId: 'frc254' }),
          expect.objectContaining({ teamId: 'frc1678' }),
        ]),
        tbaApiKey: 'imported-key',
      }),
    )
  })

  it('omits API key when skip checkbox is selected before import', () => {
    vi.mocked(shareUrlModule.decodeSharePayload).mockReturnValue({
      teams: ['frc254'],
      apiKey: 'imported-key',
    })

    renderWithRoute('/share/test-encoded-payload')

    const skipCheckbox = screen.getByRole('checkbox', { name: /skip importing the api key/i })
    fireEvent.click(skipCheckbox)
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))

    expect(persistentPreferencesModule.writePersistentPreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        tbaApiKey: '',
      }),
    )
  })

  it('renders nothing when payload cannot be decoded', () => {
    vi.mocked(shareUrlModule.decodeSharePayload).mockReturnValue(null)

    const { container } = renderWithRoute('/share/malformed-payload')

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when payload param is missing', () => {
    vi.mocked(shareUrlModule.decodeSharePayload).mockReturnValue(null)

    const { container } = renderWithRoute('/share')

    expect(container).toBeEmptyDOMElement()
  })
})
