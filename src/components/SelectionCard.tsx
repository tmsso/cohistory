import { useTimelineStore } from '../store/timelineStore'
import { formatHDate } from '../lib/time'
import { CATEGORY_LABEL, categoryColor, resolveCategory } from '../categories'

/** DOM overlay card for the currently-selected event (DESIGN.md §5). */
export function SelectionCard() {
  const doc = useTimelineStore((s) => s.doc)
  const selectedId = useTimelineStore((s) => s.selectedId)
  const select = useTimelineStore((s) => s.select)

  const ev = doc.events.find((e) => e.id === selectedId)
  if (!ev) return null

  const lane = doc.lanes.find((l) => l.id === ev.laneId)
  const category = resolveCategory(ev)
  const when =
    ev.kind === 'point'
      ? formatHDate(ev.date)
      : `${formatHDate(ev.start)} – ${formatHDate(ev.end)}`

  return (
    <div className="fixed inset-x-3 bottom-3 z-10 rounded-2xl border border-line2 bg-panel/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            <span className="truncate">{lane?.title}</span>
            <span className="text-ink-faint">·</span>
            <span className="tabular-nums text-ink-faint normal-case">{when}</span>
          </div>
          <h2 className="mt-1 text-[15px] font-semibold leading-tight text-ink">{ev.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-faint">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-line px-1.5 py-0.5 font-medium text-ink-muted">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: categoryColor(category) }}
              />
              {CATEGORY_LABEL[category]}
            </span>
            <span className="rounded-md bg-line px-1.5 py-0.5 font-medium text-ink-muted">
              {ev.kind}
            </span>
            <span className="tabular-nums">importance {ev.importance}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => select(null)}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 shrink-0 rounded-lg px-2 py-1 text-ink-muted transition-colors hover:bg-line hover:text-ink"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
