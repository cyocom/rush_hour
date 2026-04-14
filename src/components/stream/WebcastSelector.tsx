import type { WebcastOption } from '../../domain/models/schedule'

interface WebcastSelectorProps {
  webcasts: WebcastOption[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function WebcastSelector({ webcasts, selectedId, onSelect }: WebcastSelectorProps) {
  if (webcasts.length <= 1) return null

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
            {wc.label}
          </button>
        )
      })}
    </div>
  )
}
