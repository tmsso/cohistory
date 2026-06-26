import type { EventBox, LaneRow } from './geometry'
import { AXIS_HEIGHT, LANE_HEIGHT, POINT_R } from './geometry'
import { xToYear, yearToX } from '../lib/scale'
import { formatYear } from '../lib/time'

const COLORS = {
  laneAlt: '#0c1526',
  gridLine: '#1e293b',
  baseline: '#243349',
  axisBg: '#0b1222',
  axisLine: '#1e293b',
  axisText: '#94a3b8',
  point: '#38bdf8',
  span: '#6366f1',
  spanText: '#eef2ff',
  label: '#cbd5e1',
  selected: '#f59e0b',
}

const FONT = '12px ui-sans-serif, system-ui, -apple-system, sans-serif'

export interface DrawDims {
  width: number
  height: number
}

export function drawTimeline(
  ctx: CanvasRenderingContext2D,
  dims: DrawDims,
  ppy: number,
  panX: number,
  rows: LaneRow[],
  boxes: EventBox[],
  selectedId: string | null,
): void {
  const { width, height } = dims
  ctx.clearRect(0, 0, width, height)
  ctx.font = FONT
  ctx.textBaseline = 'middle'

  drawLaneBands(ctx, width, rows)
  drawGrid(ctx, dims, ppy, panX, rows)

  for (const b of boxes) {
    const selected = b.event.id === selectedId
    if (b.event.kind === 'span') drawSpan(ctx, b, selected)
    else drawPoint(ctx, b, selected)
  }

  drawAxis(ctx, dims, ppy, panX)
}

function drawLaneBands(ctx: CanvasRenderingContext2D, width: number, rows: LaneRow[]): void {
  for (let i = 0; i < rows.length; i++) {
    if (i % 2 === 1) {
      ctx.fillStyle = COLORS.laneAlt
      ctx.fillRect(0, rows[i].top, width, LANE_HEIGHT)
    }
  }
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

  ctx.lineWidth = 1
  ctx.strokeStyle = COLORS.gridLine
  ctx.beginPath()
  for (let y = yStart; y <= yEnd; y++) {
    const x = Math.round(yearToX(y, ppy, panX)) + 0.5
    ctx.moveTo(x, AXIS_HEIGHT)
    ctx.lineTo(x, height)
  }
  ctx.stroke()

  ctx.strokeStyle = COLORS.baseline
  ctx.beginPath()
  for (const r of rows) {
    const yb = Math.round(r.top + r.height) + 0.5
    ctx.moveTo(0, yb)
    ctx.lineTo(width, yb)
  }
  ctx.stroke()
}

/** Pick a year label step so labels stay ~minPx apart. */
function niceStep(ppy: number, minPx: number): number {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]
  for (const s of steps) if (s * ppy >= minPx) return s
  return 1000
}

function drawAxis(
  ctx: CanvasRenderingContext2D,
  dims: DrawDims,
  ppy: number,
  panX: number,
): void {
  const { width } = dims
  ctx.fillStyle = COLORS.axisBg
  ctx.fillRect(0, 0, width, AXIS_HEIGHT)
  ctx.strokeStyle = COLORS.axisLine
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, AXIS_HEIGHT + 0.5)
  ctx.lineTo(width, AXIS_HEIGHT + 0.5)
  ctx.stroke()

  const step = niceStep(ppy, 56)
  const yStart = Math.floor(xToYear(0, ppy, panX))
  const yEnd = Math.ceil(xToYear(width, ppy, panX))

  ctx.fillStyle = COLORS.axisText
  ctx.strokeStyle = COLORS.axisText
  ctx.textAlign = 'center'
  for (let y = Math.ceil(yStart / step) * step; y <= yEnd; y += step) {
    const x = yearToX(y, ppy, panX)
    ctx.globalAlpha = 0.45
    ctx.beginPath()
    ctx.moveTo(Math.round(x) + 0.5, AXIS_HEIGHT - 8)
    ctx.lineTo(Math.round(x) + 0.5, AXIS_HEIGHT)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillText(formatYear(y), x, AXIS_HEIGHT / 2 - 1)
  }
  ctx.textAlign = 'left'
}

function drawSpan(ctx: CanvasRenderingContext2D, b: EventBox, selected: boolean): void {
  ctx.beginPath()
  ctx.roundRect(b.x, b.y, b.w, b.h, 4)
  ctx.fillStyle = selected ? COLORS.selected : COLORS.span
  ctx.fill()

  if (b.w > 48) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(b.x, b.y, b.w, b.h)
    ctx.clip()
    ctx.fillStyle = COLORS.spanText
    ctx.fillText(b.event.title, b.x + 6, b.centerY)
    ctx.restore()
  } else {
    ctx.fillStyle = COLORS.label
    ctx.fillText(b.event.title, b.x + b.w + 6, b.centerY)
  }
}

function drawPoint(ctx: CanvasRenderingContext2D, b: EventBox, selected: boolean): void {
  const cx = b.x + b.w / 2
  ctx.beginPath()
  ctx.arc(cx, b.centerY, POINT_R, 0, Math.PI * 2)
  ctx.fillStyle = selected ? COLORS.selected : COLORS.point
  ctx.fill()
  ctx.fillStyle = selected ? COLORS.selected : COLORS.label
  ctx.fillText(b.event.title, cx + POINT_R + 5, b.centerY)
}
