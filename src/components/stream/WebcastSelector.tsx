import type { StreamAvailability, WebcastOption, WebcastVisibilityMode } from '../../domain/models/schedule'

interface WebcastSelectorProps {
  webcasts: WebcastOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  mode: WebcastVisibilityMode
}

function toAvailabilityLabel(availability: StreamAvailability): string {
  if (availability === 'online') return 'Live'
  if (availability === 'offline') return 'Offline'
  return 'Status unknown'
}

export function WebcastSelector({ webcasts, selectedId, onSelect, mode }: WebcastSelectorProps) {
  if (webcasts.length === 0) return null

  return (
    <div
      role="tablist"
      aria-label="Select webcast"
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none' }}
    >
      {webcasts.map((wc) => {
        const isSelected = wc.id === selectedId
        return (
          <button
            key={wc.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(wc.id)}
            className={[
              'flex-shrink-0 rounded-full border px-4 py-2 text-sm font-bold whitespace-nowrap transition-all',
              isSelected
                ? 'border-[rgb(150_29_55)] bg-[rgb(150_29_55)] text-white shadow-[0_0_20px_rgb(150_29_55/0.35)]'
                : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            <span>{wc.label}</span>
            {mode === 'fallback-show-all' && (
              <span
                className={[
                  'ml-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em]',
                  wc.availability === 'online'
                    ? 'bg-emerald-500/25 text-emerald-100'
                    : wc.availability === 'offline'
                    ? 'bg-rose-500/25 text-rose-100'
                    : 'bg-amber-500/25 text-amber-100',
                ].join(' ')}
              >
                {toAvailabilityLabel(wc.availability)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
