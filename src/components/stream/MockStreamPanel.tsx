export function MockStreamPanel() {
  return (
    <section
      data-testid="watch-stream-panel"
      className="rounded-panel border border-[var(--rh-border)] bg-[var(--rh-secondary)] p-4 text-white shadow-panel"
      aria-label="Live stream panel"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--rh-primary-ink)]">Mock stream</p>
      <h2 className="mt-2 text-xl font-semibold">Field Stream A</h2>
      <p className="mt-1 text-sm text-white/80">Static placeholder stream panel for match watching.</p>
    </section>
  )
}
