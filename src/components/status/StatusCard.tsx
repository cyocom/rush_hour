import type { ReactNode } from 'react'

interface StatusCardProps {
  title: string
  body: string
  action?: ReactNode
}

export function StatusCard({ title, body, action }: StatusCardProps) {
  return (
    <section className="rounded-panel border border-dashed border-[var(--rh-border)] bg-white p-4" aria-live="polite">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--rh-muted)]">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </section>
  )
}
