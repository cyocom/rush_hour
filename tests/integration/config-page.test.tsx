import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../../src/app/App'

describe('config page', () => {
  beforeEach(() => {
    sessionStorage.clear()
    window.history.pushState({}, '', '/#/config')
  })

  it('adds and removes teams', () => {
    render(<App />)

    const input = screen.getByLabelText(/Team identifier/i)
    fireEvent.change(input, { target: { value: 'frc254' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('FRC254')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.queryByText('FRC254')).not.toBeInTheDocument()
  })

  it('supports keyboard fallback reordering', () => {
    render(<App />)

    const input = screen.getByLabelText(/Team identifier/i)
    fireEvent.change(input, { target: { value: 'frc254' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.change(input, { target: { value: 'frc1678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    const upButtons = screen.getAllByRole('button', { name: 'Up' })
    fireEvent.click(upButtons[1])

    const rows = screen.getAllByText(/Priority #/)
    expect(rows[0].textContent).toContain('Priority #1')
  })
})
