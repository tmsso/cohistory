import { useTimelineStore } from './store/timelineStore'
import { TimelineView } from './components/TimelineView'
import { SelectionCard } from './components/SelectionCard'

export default function App() {
  const title = useTimelineStore((s) => s.doc.title)
  const zoomBy = useTimelineStore((s) => s.zoomBy)
  const fitTo = useTimelineStore((s) => s.fitTo)

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-semibold leading-tight tracking-[-0.01em]">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-[11px] text-ink-muted">
            Pinch to zoom · drag to pan · tap an event
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ToolButton label="Zoom out" onClick={() => zoomBy(1 / 1.6)}>
            −
          </ToolButton>
          <ToolButton label="Zoom in" onClick={() => zoomBy(1.6)}>
            +
          </ToolButton>
          <button
            type="button"
            onClick={fitTo}
            className="h-8 rounded-lg border border-line bg-surface px-2.5 text-[11px] font-semibold tracking-wide text-ink-muted transition-colors hover:border-line2 hover:text-ink active:bg-line"
          >
            FIT
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <TimelineView />
      </main>

      <SelectionCard />
    </div>
  )
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-lg leading-none text-ink-muted transition-colors hover:border-line2 hover:text-ink active:bg-line"
    >
      {children}
    </button>
  )
}
