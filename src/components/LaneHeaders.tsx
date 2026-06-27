import { useTimelineStore } from '../store/timelineStore'
import { AXIS_HEIGHT, HEADER_WIDTH, LANE_HEIGHT, sortedLanes } from '../render/geometry'

/** Sticky left column of lane titles, row-aligned with the canvas. */
export function LaneHeaders() {
  const doc = useTimelineStore((s) => s.doc)
  const lanes = sortedLanes(doc)

  return (
    <div
      className="shrink-0 border-r border-line bg-headercol"
      style={{ width: HEADER_WIDTH }}
    >
      <div style={{ height: AXIS_HEIGHT }} className="border-b border-line bg-panel" />
      {lanes.map((lane) => (
        <div
          key={lane.id}
          data-testid="lane-header"
          style={{ height: LANE_HEIGHT }}
          className="flex items-center gap-2 border-b border-line px-3"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-event" />
          <span className="line-clamp-2 text-[13px] font-semibold leading-[1.15] text-ink">
            {lane.title}
          </span>
        </div>
      ))}
    </div>
  )
}
