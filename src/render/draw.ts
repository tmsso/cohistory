import type { EventBox, LaneRow, Tier } from './geometry'
import { AXIS_HEIGHT, LANE_HEIGHT, spanIconLayout } from './geometry'
import { eventAlpha, visibilityThreshold, xToYear, yearToX } from '../lib/scale'
import { formatYear } from '../lib/time'
import { categoryColor } from '../categories'
import { drawCategoryGlyph } from './icons'
import { FONT_FAMILY, font, lighten, palette, withAlpha } from '../theme'

export interface DrawDims {
  width: number
  height: number
}

type MarkerState = 'normal' | 'hover' | 'selected'

const GLYPH_DARK = 'rgba(12, 17, 23, 0.9)'
const LABEL_OUTLINE = 'rgba(8, 12, 17, 0.82)'
const TIER_LABEL: Record<Tier, string> = { high: '#E6EDF3', mid: '#CBD5DF', low: '#CBD5DF' }
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
  drawEraBands(ctx, dims, ppy, panX)
  drawGrid(ctx, dims, ppy, panX, rows)

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

/** Faint alternating vertical bands per major interval so the eye tracks verticals. */
function drawEraBands(ctx: CanvasRenderingContext2D, dims: DrawDims, ppy: number, panX: number): void {
  const { width, height } = dims
  const major = niceStep(ppy, 64)
  const yStart = Math.floor(xToYear(0, ppy, panX) / major) * major
  const yEnd = Math.ceil(xToYear(width, ppy, panX))
  ctx.fillStyle = 'rgba(255, 255, 255, 0.014)'
  for (let y = yStart; y <= yEnd; y += major) {
    if (Math.round(y / major) % 2 !== 0) continue
    const x0 = yearToX(y, ppy, panX)
    const x1 = yearToX(y + major, ppy, panX)
    ctx.fillRect(x0, AXIS_HEIGHT, x1 - x0, height - AXIS_HEIGHT)
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, dims: DrawDims, ppy: number, panX: number, rows: LaneRow[]): void {
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

  ctx.strokeStyle = palette.line
  ctx.beginPath()
  for (const r of rows) {
    const yb = Math.round(r.top + r.height) + 0.5
    ctx.moveTo(0, yb)
    ctx.lineTo(width, yb)
  }
  ctx.stroke()
}

function drawMarker(ctx: CanvasRenderingContext2D, b: EventBox, state: MarkerState, alpha: number): void {
  ctx.globalAlpha = alpha
  if (b.event.kind === 'span') drawSpan(ctx, b, state)
  else drawDot(ctx, b, state)
  ctx.globalAlpha = 1
}

function spanGradient(ctx: CanvasRenderingContext2D, b: EventBox, boost: number): CanvasGradient {
  const base = categoryColor(b.category)
  const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h)
  g.addColorStop(0, lighten(base, (b.tier === 'low' ? 0.06 : 0.2) + boost))
  g.addColorStop(1, boost > 0 ? lighten(base, boost) : base)
  return g
}

function drawSpan(ctx: CanvasRenderingContext2D, b: EventBox, state: MarkerState): void {
  const r = b.h / 2
  const boost = state === 'hover' ? 0.12 : state === 'selected' ? 0.08 : 0

  if (state === 'selected') {
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 9
    ctx.shadowOffsetY = 2
  }
  ctx.beginPath()
  ctx.roundRect(b.x, b.y, b.w, b.h, r)
  ctx.fillStyle = spanGradient(ctx, b, boost)
  ctx.fill()
  if (state === 'selected') ctx.restore()

  // top sheen for depth
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(b.x, b.y, b.w, b.h, r)
  ctx.clip()
  ctx.strokeStyle = withAlpha('#FFFFFF', 0.16)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(b.x + r, b.y + 0.75)
  ctx.lineTo(b.x + b.w - r, b.y + 0.75)
  ctx.stroke()
  ctx.restore()

  if (state === 'selected') {
    ctx.save()
    ctx.shadowColor = palette.accentGlow
    ctx.shadowBlur = 10
    ctx.lineWidth = 1.75
    ctx.strokeStyle = palette.accent
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, b.w, b.h, r)
    ctx.stroke()
    ctx.restore()
  }

  const icon = spanIconLayout(b)
  if (icon.show) drawCategoryGlyph(ctx, b.category, icon.cx, icon.cy, icon.r, GLYPH_DARK)
}

function drawDot(ctx: CanvasRenderingContext2D, b: EventBox, state: MarkerState): void {
  const cx = b.x + b.w / 2
  const r = b.w / 2
  const base = categoryColor(b.category)

  if (state === 'selected') {
    ctx.save()
    ctx.shadowColor = palette.accentGlow
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 1
  }
  const g = ctx.createRadialGradient(cx - r * 0.4, b.centerY - r * 0.4, r * 0.2, cx, b.centerY, r)
  g.addColorStop(0, lighten(base, state === 'normal' ? 0.28 : 0.4))
  g.addColorStop(1, base)
  ctx.beginPath()
  ctx.arc(cx, b.centerY, r, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  if (state === 'selected') ctx.restore()

  ctx.lineWidth = 1.5
  ctx.strokeStyle = state === 'selected' ? palette.accent : palette.surface
  ctx.stroke()

  if (r >= 5) drawCategoryGlyph(ctx, b.category, cx, b.centerY, r * 0.6, GLYPH_DARK)
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
      // low-importance labels collapse to icon/tick until zoomed in (or tapped)
      if (!forced && b.tier === 'low' && a < 0.985) continue

      ctx.font = font(TIER_LABEL_WEIGHT[b.tier], TIER_LABEL_SIZE[b.tier])
      const text = b.event.title
      const textW = ctx.measureText(text).width

      const icon = spanIconLayout(b)
      const insideRoom = b.event.kind === 'span' && b.w > textW + (icon.show ? icon.r * 2 + 22 : 16)
      const labelX = insideRoom ? icon.labelStart : b.x + b.w + 6
      const interval: Interval = { lo: Math.min(labelX, b.x) - 4, hi: labelX + textW + 8 }

      if (!forced && (interval.hi > width || overlaps(placed, interval))) continue
      placed.push(interval)

      const color = forced ? palette.accent : insideRoom ? '#EFF4FA' : TIER_LABEL[b.tier]
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

function drawAxis(ctx: CanvasRenderingContext2D, dims: DrawDims, ppy: number, panX: number): void {
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
  const minor = pickMinor(major, ppy)
  const yStart = Math.floor(xToYear(0, ppy, panX))
  const yEnd = Math.ceil(xToYear(width, ppy, panX))

  if (minor > 0) {
    ctx.strokeStyle = palette.line2
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    for (let y = Math.ceil(yStart / minor) * minor; y <= yEnd; y += minor) {
      const x = Math.round(yearToX(y, ppy, panX)) + 0.5
      ctx.moveTo(x, AXIS_HEIGHT - 5)
      ctx.lineTo(x, AXIS_HEIGHT)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  ctx.font = `600 11px ${FONT_FAMILY}`
  ctx.fillStyle = palette.inkMuted
  ctx.strokeStyle = palette.inkMuted
  ctx.textAlign = 'center'
  for (let y = Math.ceil(yStart / major) * major; y <= yEnd; y += major) {
    const x = yearToX(y, ppy, panX)
    ctx.beginPath()
    ctx.moveTo(Math.round(x) + 0.5, AXIS_HEIGHT - 9)
    ctx.lineTo(Math.round(x) + 0.5, AXIS_HEIGHT)
    ctx.stroke()
    ctx.fillText(formatYear(y), x, AXIS_HEIGHT / 2)
  }
  ctx.textAlign = 'left'
}
