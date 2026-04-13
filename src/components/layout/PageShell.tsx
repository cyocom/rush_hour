import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

interface PageShellProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 rounded-panel border border-[var(--rh-border)] bg-[var(--rh-surface-raised)] p-5 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--rh-primary)]">Rushhour Watchdesk</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--rh-secondary)]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--rh-muted)]">{subtitle}</p>
        <nav className="mt-5 flex gap-2" aria-label="Primary">
          <NavLink
            to="/watch"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-[var(--rh-primary)] text-[var(--rh-primary-ink)]' : 'bg-white text-[var(--rh-secondary)]'
              }`
            }
          >
            Watch
          </NavLink>
          <NavLink
            to="/config"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-[var(--rh-primary)] text-[var(--rh-primary-ink)]' : 'bg-white text-[var(--rh-secondary)]'
              }`
            }
          >
            Config
          </NavLink>
        </nav>
      </header>
      {children}
    </div>
  )
}
