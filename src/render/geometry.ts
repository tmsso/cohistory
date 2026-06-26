import type { Lane, Timeline, TimelineEvent } from '../types/timeline'
import { eventStartYear, eventEndYear } from '../lib/time'
import { yearToX } from '../lib/scale'

// Shared layout constants — used by both the canvas and the DOM lane headers,
// so the two columns stay row-aligned.
export const AXIS_HEIGHT = 44
export const LANE_HEIGHT = 64
export const HEADER_WIDTH = 116

export const POINT_R = 6
export const SPAN_H = 20
const MIN_SPAN_W = 3

export interface LaneRow {
  lane: Lane
  top: number
  height: number
  centerY: number
}

export interface EventBox {
  event: TimelineEvent
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
    return { lane, top, height: LANE_HEIGHT, centerY: top + LANE_HEIGHT / 2 }
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
    if (e.kind === 'point') {
      const cx = yearToX(eventStartYear(e), ppy, panX)
      boxes.push({
        event: e,
        x: cx - POINT_R,
        y: row.centerY - POINT_R,
        w: POINT_R * 2,
        h: POINT_R * 2,
        centerY: row.centerY,
      })
    } else {
      const x0 = yearToX(eventStartYear(e), ppy, panX)
      const x1 = yearToX(eventEndYear(e), ppy, panX)
      boxes.push({
        event: e,
        x: x0,
        y: row.centerY - SPAN_H / 2,
        w: Math.max(MIN_SPAN_W, x1 - x0),
        h: SPAN_H,
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
