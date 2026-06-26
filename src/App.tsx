import { useTimelineStore } from './store/timelineStore'
import { TimelineView } from './components/TimelineView'
import { SelectionCard } from './components/SelectionCard'

export default function App() {
  const title = useTimelineStore((s) => s.doc.title)

  return (
    <div className="flex min-h-dvh flex-col bg-slate-900 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h1 className="text-base font-semibold leading-tight">{title}</h1>
          <p className="text-xs text-slate-400">Phase 1 · drag to pan · tap an event</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <TimelineView />
      </main>

      <SelectionCard />
    </div>
  )
}
