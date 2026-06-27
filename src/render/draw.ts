import type { EventBox, LaneRow, Tier } from './geometry'
import { AXIS_HEIGHT, LANE_HEIGHT } from './geometry'
import {
  eventAlpha,
  visibilityThreshold,
  xToYear,
  yearToX,
} from '../lib/scale'
import { formatYear } from '../lib/time'
import { FONT_FAMILY, font, palette } from '../theme'

export interface DrawDims {
  width: number
  height: number
}

type MarkerState = 'normal' | 'hover' | 'selected'

const TIER_COLOR: Record<Tier, string> = {
  high: palette.eventHigh,
  mid: palette.eventMid,
  low: palette.eventLow,
}
const TIER_LABEL: Record<Tier, string> = {
  high: '#E6EDF3',
  mid: '#CBD5DF',
  low: '#CBD5DF',
}
const LABEL_OUTLINE = 'rgba(8, 12, 17, 0.82)'
const TIER_LABEL_SIZE: Record<Tier, number> = { high: 12, mid: 11, low: 11 }
const TIER_LABEL_WEIGHT: Record<Tier, number> = { high: 600, mid: 500, low: 500 }

export function drawTimeline(
  ctx: CanvasRenderingContext2D,
  dims: DrawDims,
  ppy: number,
  panX: number,
  rows: LaneRow[],
  boxes: EventBox[],
  selectedId: string | null,
  hoveredId: string | null,
): void {
  const { width, height } = dims
  const threshold = visibilityThreshold(ppy)

  ctx.clearRect(0, 0, width, height)
  ctx.textBaseline = 'middle'

  drawLaneBands(ctx, width, rows)
  drawGrid(ctx, dims, ppy, panX, rows)

  // Markers (bars + dots), then emphasized ones on top.
  const alphaOf = (b: EventBox) =>
    b.event.id === selectedId || b.event.id === hoveredId
      ? 1
      : eventAlpha(b.event.importance, threshold)

  for (const b of boxes) {
    const a = alphaOf(b)
    if (a <= 0.02) continue
    drawMarker(ctx, b, 'normal', a)
  }
  const hoveredBox = hoveredId ? boxes.find((b) => b.event.id === hoveredId) : undefined
  const selectedBox = selectedId ? boxes.find((b) => b.event.id === selectedId) : undefined
  if (hoveredBox && hoveredId !== selectedId) drawMarker(ctx, hoveredBox, 'hover', 1)
  if (selectedBox) drawMarker(ctx, selectedBox, 'selected', 1)

  // Labels with per-lane collision culling (drawn above all markers).
  drawLabels(ctx, width, rows, boxes, threshold, selectedId, hoveredId)

  drawAxis(ctx, dims, ppy, panX)
}

function drawLaneBands(ctx: CanvasRenderingContext2D, width: number, rows: LaneRow[]): void {
  for (const r of rows) {
    ctx.fillStyle = r.index % 2 === 1 ? palette.bandB : palette.bandA
    ctx.fillRect(0, r.top, width, LANE_HEIGHT)
  }
}

function niceStep(ppy: number, minPx: number): number {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]
  for (const s of steps) if (s * ppy >= minPx) return s
  return 1000
}

function pickMinor(major: number, ppy: number): number {
  if ((major / 5) * ppy >= 7) return major / 5
  if ((major / 2) * ppy >= 7) return major / 2
  return 0
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  dims: DrawDims,
  ppy: number,
  panX: number,
  rows: LaneRow[],
): void {
  const { width, height } = dims
  const yStart = Math.floor(xToYear(0, ppy, panX))
  const yEnd = Math.ceil(xToYear(width, ppy, panX))
  const major = niceStep(ppy, 64)
  const minor = pickMinor(major, ppy)

  ctx.lineWidth = 1

  if (minor > 0) {
    ctx.strokeStyle = palette.line
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    for (let y = Math.ceil(yStart / minor) * minor; y <= yEnd; y += minor) {
      const x = Math.round(yearToX(y, ppy, panX)) + 0.5
      ctx.moveTo(x, AXIS_HEIGHT)
      ctx.lineTo(x, height)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  ctx.strokeStyle = palette.line2
  ctx.beginPath()
  for (let y = Math.ceil(yStart / major) * major; y <= yEnd; y += major) {
    const x = Math.round(yearToX(y, ppy, panX)) + 0.5
    ctx.moveTo(x, AXIS_HEIGHT)
    ctx.lineTo(x, height)
  }
  ctx.stroke()

  // lane separators
  ctx.strokeStyle = palette.line
  ctx.beginPath()
  for (const r of rows) {
    const yb = Math.round(r.top + r.height) + 0.5
    ctx.moveTo(0, yb)
    ctx.lineTo(width, yb)
  }
  ctx.stroke()
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  b: EventBox,
  state: MarkerState,
  alpha: number,
): void {
  ctx.globalAlpha = alpha
  if (b.event.kind === 'span') drawSpan(ctx, b, state)
  else drawDot(ctx, b, state)
  ctx.globalAlpha = 1
}

function drawSpan(ctx: CanvasRenderingContext2D, b: EventBox, state: MarkerState): void {
  const r = b.h / 2
  ctx.beginPath()
  ctx.roundRect(b.x, b.y, b.w, b.h, r)
  ctx.fillStyle =
    state === 'selected'
      ? palette.accent
      : state === 'hover'
        ? palette.eventHigh
        : TIER_COLOR[b.tier]
  ctx.fill()
  if (state === 'selected') {
    ctx.save()
    ctx.shadowColor = palette.accentGlow
    ctx.shadowBlur = 10
    ctx.lineWidth = 1.5
    ctx.strokeStyle = palette.accent
    ctx.stroke()
    ctx.restore()
  }
}

function drawDot(ctx: CanvasRenderingContext2D, b: EventBox, state: MarkerState): void {
  const cx = b.x + b.w / 2
  const r = b.w / 2
  if (state === 'selected') {
    ctx.save()
    ctx.shadowColor = palette.accentGlow
    ctx.shadowBlur = 10
  }
  ctx.beginPath()
  ctx.arc(cx, b.centerY, r, 0, Math.PI * 2)
  ctx.fillStyle =
    state === 'selected' ? palette.accent : state === 'hover' ? palette.eventHigh : palette.point
  ctx.fill()
  if (state === 'selected') ctx.restore()
  // thin dark ring to separate from band
  ctx.lineWidth = 1.5
  ctx.strokeStyle = palette.surface
  ctx.stroke()
}

interface Interval {
  lo: number
  hi: number
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  width: number,
  rows: LaneRow[],
  boxes: EventBox[],
  threshold: number,
  selectedId: string | null,
  hoveredId: string | null,
): void {
  const byLane = new Map<string, EventBox[]>()
  for (const b of boxes) {
    const list = byLane.get(b.event.laneId)
    if (list) list.push(b)
    else byLane.set(b.event.laneId, [b])
  }

  for (const row of rows) {
    const list = byLane.get(row.lane.id)
    if (!list) continue
    // Priority: selected/hovered first, then by importance.
    const ordered = [...list].sort((a, b) => {
      const ap = a.event.id === selectedId || a.event.id === hoveredId ? 1 : 0
      const bp = b.event.id === selectedId || b.event.id === hoveredId ? 1 : 0
      if (ap !== bp) return bp - ap
      return b.event.importance - a.event.importance
    })

    const placed: Interval[] = []
    for (const b of ordered) {
      const forced = b.event.id === selectedId || b.event.id === hoveredId
      const a = forced ? 1 : eventAlpha(b.event.importance, threshold)
      if (a <= 0.02) continue

      ctx.font = font(TIER_LABEL_WEIGHT[b.tier], TIER_LABEL_SIZE[b.tier])
      const text = b.event.title
      const textW = ctx.measureText(text).width

      // inside the bar if it's wide enough, else to the right of the marker
      const inside = b.event.kind === 'span' && b.w > textW + 16
      const labelX = inside ? b.x + 8 : b.x + b.w + 6
      const interval: Interval = { lo: Math.min(labelX, b.x) - 4, hi: labelX + textW + 8 }

      // cull labels that would be cut off at the right edge, or collide
      if (!forced && (interval.hi > width || overlaps(placed, interval))) continue
      placed.push(interval)

      const color = forced ? palette.accent : inside ? '#EFF4FA' : TIER_LABEL[b.tier]
      // Outline (not shadow) so labels stay legible over light span bars too.
      ctx.globalAlpha = a
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.strokeStyle = LABEL_OUTLINE
      ctx.strokeText(text, labelX, row.centerY)
      ctx.fillStyle = color
      ctx.fillText(text, labelX, row.centerY)
      ctx.globalAlpha = 1
    }
  }
}

function overlaps(placed: Interval[], next: Interval): boolean {
  for (const p of placed) {
    if (next.lo < p.hi && next.hi > p.lo) return true
  }
  return false
}

function drawAxis(
  ctx: CanvasRenderingContext2D,
  dims: DrawDims,
  ppy: number,
  panX: number,
): void {
  const { width } = dims
  ctx.fillStyle = palette.panel
  ctx.fillRect(0, 0, width, AXIS_HEIGHT)
  ctx.strokeStyle = palette.line2
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, AXIS_HEIGHT + 0.5)
  ctx.lineTo(width, AXIS_HEIGHT + 0.5)
  ctx.stroke()

  const major = niceStep(ppy, 64)
  const yStart = Math.floor(xToYear(0, ppy, panX))
  const yEnd = Math.ceil(xToYear(width, ppy, panX))

  ctx.font = `500 11px ${FONT_FAMILY}`
  ctx.fillStyle = palette.inkMuted
  ctx.strokeStyle = palette.line2
  ctx.textAlign = 'center'
  for (let y = Math.ceil(yStart / major) * major; y <= yEnd; y += major) {
    const x = yearToX(y, ppy, panX)
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.moveTo(Math.round(x) + 0.5, AXIS_HEIGHT - 7)
    ctx.lineTo(Math.round(x) + 0.5, AXIS_HEIGHT)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillText(formatYear(y), x, AXIS_HEIGHT / 2)
  }
  ctx.textAlign = 'left'
}
