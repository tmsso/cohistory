import { useTimelineStore } from '../store/timelineStore'
import { AXIS_HEIGHT, HEADER_WIDTH, LANE_HEIGHT, sortedLanes } from '../render/geometry'

/** Sticky left column of lane titles, row-aligned with the canvas. */
export function LaneHeaders() {
  const doc = useTimelineStore((s) => s.doc)
  const lanes = sortedLanes(doc)

  return (
    <div
      className="shrink-0 border-r border-slate-800 bg-slate-950"
      style={{ width: HEADER_WIDTH }}
    >
      <div style={{ height: AXIS_HEIGHT }} className="border-b border-slate-800" />
      {lanes.map((lane) => (
        <div
          key={lane.id}
          style={{ height: LANE_HEIGHT }}
          className="flex flex-col justify-center gap-0.5 border-b border-slate-800 px-2.5"
        >
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            {lane.kind}
          </span>
          <span className="text-sm font-medium leading-tight text-slate-200">
            {lane.title}
          </span>
        </div>
      ))}
    </div>
  )
}
