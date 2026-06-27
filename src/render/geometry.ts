import type { Lane, Timeline, TimelineEvent } from '../types/timeline'
import { eventEndYear, eventStartYear } from '../lib/time'
import { yearToX } from '../lib/scale'
import { layout } from '../theme'

// Layout constants come from the theme so DOM and canvas stay row-aligned.
export const AXIS_HEIGHT = layout.axisHeight
export const LANE_HEIGHT = layout.laneHeight
export const HEADER_WIDTH = layout.headerWidth

const MIN_SPAN_W = 4

export type Tier = 'high' | 'mid' | 'low'

export function tierOf(importance: number): Tier {
  if (importance >= 80) return 'high'
  if (importance >= 62) return 'mid'
  return 'low'
}

/** Span bar heights and point-marker radii per importance tier. */
export const SPAN_H: Record<Tier, number> = { high: 22, mid: 18, low: 13 }
export const POINT_R: Record<Tier, number> = { high: 5.5, mid: 4.5, low: 3.5 }

export interface LaneRow {
  lane: Lane
  index: number
  top: number
  height: number
  centerY: number
}

export interface EventBox {
  event: TimelineEvent
  tier: Tier
  x: number
  y: number
  w: number
  h: number
  centerY: number
}

export function sortedLanes(doc: Timeline): Lane[] {
  return [...doc.lanes].sort((a, b) => a.order - b.order)
}

export function computeLaneRows(lanes: Lane[]): LaneRow[] {
  return lanes.map((lane, i) => {
    const top = AXIS_HEIGHT + i * LANE_HEIGHT
    return { lane, index: i, top, height: LANE_HEIGHT, centerY: top + LANE_HEIGHT / 2 }
  })
}

/** Screen-space boxes for every event on a placed lane. */
export function computeEventBoxes(
  doc: Timeline,
  rows: LaneRow[],
  ppy: number,
  panX: number,
): EventBox[] {
  const rowByLane = new Map(rows.map((r) => [r.lane.id, r]))
  const boxes: EventBox[] = []
  for (const e of doc.events) {
    const row = rowByLane.get(e.laneId)
    if (!row) continue
    const tier = tierOf(e.importance)
    if (e.kind === 'point') {
      const r = POINT_R[tier]
      const cx = yearToX(eventStartYear(e), ppy, panX)
      boxes.push({ event: e, tier, x: cx - r, y: row.centerY - r, w: r * 2, h: r * 2, centerY: row.centerY })
    } else {
      const h = SPAN_H[tier]
      const x0 = yearToX(eventStartYear(e), ppy, panX)
      const x1 = yearToX(eventEndYear(e), ppy, panX)
      boxes.push({
        event: e,
        tier,
        x: x0,
        y: row.centerY - h / 2,
        w: Math.max(MIN_SPAN_W, x1 - x0),
        h,
        centerY: row.centerY,
      })
    }
  }
  return boxes
}

/** Topmost-drawn box under a point, with touch padding. */
export function hitTest(boxes: EventBox[], px: number, py: number): EventBox | null {
  const pad = 8
  for (let i = boxes.length - 1; i >= 0; i--) {
    const b = boxes[i]
    if (px >= b.x - pad && px <= b.x + b.w + pad && py >= b.y - pad && py <= b.y + b.h + pad) {
      return b
    }
  }
  return null
}
