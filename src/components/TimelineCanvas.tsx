import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useTimelineStore } from '../store/timelineStore'
import {
  computeEventBoxes,
  computeLaneRows,
  hitTest,
  sortedLanes,
} from '../render/geometry'
import { drawTimeline } from '../render/draw'

const DRAG_THRESHOLD = 4 // px before a press becomes a pan (vs. a tap)

export function TimelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const dragRef = useRef<{ startX: number; startPan: number; moved: boolean } | null>(null)

  // Subscriptions exist to re-render (and thus redraw) on state changes;
  // the draw itself reads fresh state via getState() to avoid stale closures.
  const doc = useTimelineStore((s) => s.doc)
  const ppy = useTimelineStore((s) => s.ppy)
  const panX = useTimelineStore((s) => s.panX)
  const selectedId = useTimelineStore((s) => s.selectedId)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const state = useTimelineStore.getState()
    const rows = computeLaneRows(sortedLanes(state.doc))
    const boxes = computeEventBoxes(state.doc, rows, state.ppy, state.panX)
    drawTimeline(ctx, sizeRef.current, state.ppy, state.panX, rows, boxes, state.selectedId)
  }, [])

  // Size the backing store to the parent in device pixels, then redraw.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas?.parentElement) return
    const parent = canvas.parentElement
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = parent.clientWidth
      const h = parent.clientHeight
      sizeRef.current = { width: w, height: h }
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw()
    })
    ro.observe(parent)
    return () => ro.disconnect()
  }, [draw])

  // Redraw whenever view state changes.
  useEffect(() => {
    draw()
  }, [doc, ppy, panX, selectedId, draw])

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.setPointerCapture(e.pointerId)
    dragRef.current = {
      startX: e.clientX,
      startPan: useTimelineStore.getState().panX,
      moved: false,
    }
  }, [])

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > DRAG_THRESHOLD) d.moved = true
    useTimelineStore.getState().setPanX(d.startPan - dx)
  }, [])

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current
    dragRef.current = null
    canvasRef.current?.releasePointerCapture(e.pointerId)
    if (!d || d.moved) return // it was a pan, not a tap

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const state = useTimelineStore.getState()
    const rows = computeLaneRows(sortedLanes(state.doc))
    const boxes = computeEventBoxes(state.doc, rows, state.ppy, state.panX)
    const hit = hitTest(boxes, px, py)
    state.select(hit ? hit.event.id : null)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  )
}
