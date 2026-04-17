import type { WebcastOption } from '../../domain/models/schedule'

interface StreamOverlayInfo {
  matchLabel: string
  teams: string[]
  timeToMatch: string
}

interface WebcastPanelProps {
  webcast: WebcastOption | null
  hasActiveEvents: boolean
  overlayInfo?: StreamOverlayInfo | null
  showOfflineFallbackMessage?: boolean
  showStaleStatusWarning?: boolean
  statusChangeMessage?: string | null
}

const STREAM_MIN_HEIGHT = 'clamp(620px, 75vh, 1120px)'

export function WebcastPanel({
  webcast,
  hasActiveEvents,
  overlayInfo = null,
  showOfflineFallbackMessage = false,
  showStaleStatusWarning = false,
  statusChangeMessage = null,
}: WebcastPanelProps) {
  if (!webcast) {
    return (
      <div
        data-testid="watch-stream-panel"
        className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(180deg,#16171d_0%,#13151a_50%,#120f15_100%)] p-8 text-white"
           style={{ minHeight: STREAM_MIN_HEIGHT }}
      >
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center"
             style={{ minHeight: STREAM_MIN_HEIGHT }}>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/50">
            {hasActiveEvents ? 'Stream' : 'No active event'}
          </p>
          <p className="text-2xl font-black tracking-tight">
            {hasActiveEvents ? 'No webcast available' : 'No active event found'}
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-white/60">
            {hasActiveEvents
              ? 'This event does not have a registered webcast. Check The Blue Alliance for stream links.'
              : 'None of your subscribed teams have an event running at the current effective time.'}
          </p>
        </div>
      </div>
    )
  }

  if (webcast.platform === 'unsupported') {
    return (
      <div
        data-testid="watch-stream-panel"
        className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(180deg,#16171d_0%,#13151a_50%,#120f15_100%)] p-8 text-white"
           style={{ minHeight: STREAM_MIN_HEIGHT }}
      >
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center"
             style={{ minHeight: STREAM_MIN_HEIGHT }}>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/50">Stream</p>
          <p className="text-2xl font-black tracking-tight">Stream provider not supported</p>
          <p className="text-sm text-white/60">
            Platform: <span className="font-bold">{webcast.channel}</span>
          </p>
          <a
            href={webcast.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold transition hover:bg-white/20"
          >
            Open stream ↗
          </a>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="watch-stream-panel" className="relative overflow-hidden rounded-[2rem] border border-white/[0.08]">
      <iframe
        src={webcast.embedUrl ?? undefined}
        title={webcast.label}
        allow="autoplay; fullscreen"
        allowFullScreen
        className="block w-full border-0"
        style={{ aspectRatio: '16 / 9', minHeight: STREAM_MIN_HEIGHT }}
      />

      {overlayInfo && (
        <div
          data-testid="watch-stream-overlay"
          className="pointer-events-none absolute left-3 top-3 max-w-[80%] rounded-xl border border-white/20 bg-black/55 px-3 py-2 text-white backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/65">
              Currently shown
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">
              {overlayInfo.timeToMatch}
            </p>
          </div>
          <p className="mt-1 text-sm font-black leading-tight tracking-[-0.02em]">
            {overlayInfo.matchLabel}
          </p>
          <p className="mt-1 text-xs text-white/80">
            Teams: {overlayInfo.teams.join(', ')}
          </p>
        </div>
      )}

      {(showOfflineFallbackMessage || showStaleStatusWarning || statusChangeMessage) && (
        <div className="absolute bottom-3 left-3 right-3 grid gap-2 rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
          {showOfflineFallbackMessage && (
            <p data-testid="watch-offline-fallback-message" className="font-bold">
              No streams are currently online. Showing available streams marked offline.
            </p>
          )}
          {showStaleStatusWarning && (
            <p data-testid="watch-stale-status-warning" className="text-white/80">
              Some stream statuses may be stale.
            </p>
          )}
          {statusChangeMessage && (
            <p data-testid="watch-status-change-message" className="text-white">
              {statusChangeMessage}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
