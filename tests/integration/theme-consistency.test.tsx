import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../../src/app/App'

describe('theme consistency', () => {
  it('renders shared shell on watch and config routes', () => {
    window.history.pushState({}, '', '/watch')
    const { rerender } = render(<App />)
    expect(screen.getByText(/Rushhour Watchdesk/i)).toBeInTheDocument()

    window.history.pushState({}, '', '/config')
    rerender(<App />)
    expect(screen.getByText(/Rushhour Watchdesk/i)).toBeInTheDocument()
  })
})
