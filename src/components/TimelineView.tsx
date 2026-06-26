import { useTimelineStore } from '../store/timelineStore'
import { AXIS_HEIGHT, LANE_HEIGHT } from '../render/geometry'
import { LaneHeaders } from './LaneHeaders'
import { TimelineCanvas } from './TimelineCanvas'

/** Sticky lane headers + horizontally-pannable canvas content (DESIGN.md §5). */
export function TimelineView() {
  const laneCount = useTimelineStore((s) => s.doc.lanes.length)
  const contentHeight = AXIS_HEIGHT + laneCount * LANE_HEIGHT

  return (
    <div className="flex w-full" style={{ height: contentHeight }}>
      <LaneHeaders />
      <div className="relative min-w-0 flex-1 overflow-hidden bg-slate-900">
        <TimelineCanvas />
      </div>
    </div>
  )
}
