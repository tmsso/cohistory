import { useTimelineStore } from '../store/timelineStore'
import { formatHDate } from '../lib/time'

/** DOM overlay card for the currently-selected event (DESIGN.md §5). */
export function SelectionCard() {
  const doc = useTimelineStore((s) => s.doc)
  const selectedId = useTimelineStore((s) => s.selectedId)
  const select = useTimelineStore((s) => s.select)

  const ev = doc.events.find((e) => e.id === selectedId)
  if (!ev) return null

  const lane = doc.lanes.find((l) => l.id === ev.laneId)
  const when =
    ev.kind === 'point'
      ? formatHDate(ev.date)
      : `${formatHDate(ev.start)} – ${formatHDate(ev.end)}`

  return (
    <div className="fixed inset-x-3 bottom-3 z-10 rounded-xl border border-slate-700 bg-slate-800/95 p-3 shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xs text-slate-400">
            {lane?.title} · {when}
          </div>
          <div className="text-sm font-semibold text-slate-100">{ev.title}</div>
          <div className="mt-1 text-xs text-slate-500">
            {ev.kind} · importance {ev.importance}
          </div>
        </div>
        <button
          type="button"
          onClick={() => select(null)}
          aria-label="Dismiss"
          className="shrink-0 rounded-md px-2 py-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
