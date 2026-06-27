import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useTimelineStore } from '../store/timelineStore'
import { computeEventBoxes, computeLaneRows, hitTest, sortedLanes } from '../render/geometry'
import { drawTimeline } from '../render/draw'
import { BASE_YEAR, clampPpy, xToYear } from '../lib/scale'

const DRAG_THRESHOLD = 4
const DOUBLE_TAP_MS = 280

const store = useTimelineStore

export function TimelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const dragRef = useRef<{ startX: number; startPan: number; moved: boolean } | null>(null)
  const pinchRef = useRef<{ startDist: number; startPpy: number; anchorYear: number } | null>(null)
  const tweenRef = useRef<number | null>(null)
  const lastTap = useRef<{ t: number; x: number; y: number }>({ t: 0, x: 0, y: 0 })

  const doc = store((s) => s.doc)
  const ppy = store((s) => s.ppy)
  const panX = store((s) => s.panX)
  const selectedId = store((s) => s.selectedId)
  const hoveredId = store((s) => s.hoveredId)

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const s = store.getState()
    const rows = computeLaneRows(sortedLanes(s.doc))
    const boxes = computeEventBoxes(s.doc, rows, s.ppy, s.panX)
    drawTimeline(ctx, sizeRef.current, s.ppy, s.panX, rows, boxes, s.selectedId, s.hoveredId)
  }, [])

  // Size to parent in device pixels; the store auto-fits until the user takes control.
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
      store.getState().setViewport(w)
      draw()
    })
    ro.observe(parent)
    return () => ro.disconnect()
  }, [draw])

  // Redraw on state change and once webfonts are ready.
  useEffect(() => {
    draw()
  }, [doc, ppy, panX, selectedId, hoveredId, draw])
  useEffect(() => {
    let alive = true
    document.fonts.ready.then(() => {
      if (alive) draw()
    })
    return () => {
      alive = false
    }
  }, [draw])

  const cancelTween = () => {
    if (tweenRef.current != null) cancelAnimationFrame(tweenRef.current)
    tweenRef.current = null
  }
  const animateView = useCallback((targetPpy: number, targetPanX: number) => {
    cancelTween()
    const sPpy = store.getState().ppy
    const sPanX = store.getState().panX
    const t0 = performance.now()
    const dur = 200
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      store.getState().setView(sPpy + (targetPpy - sPpy) * e, sPanX + (targetPanX - sPanX) * e)
      if (k < 1) tweenRef.current = requestAnimationFrame(step)
    }
    tweenRef.current = requestAnimationFrame(step)
  }, [])

  const zoomAround = useCallback(
    (factor: number, anchorX: number) => {
      store.getState().markTouched()
      const s = store.getState()
      const year = xToYear(anchorX, s.ppy, s.panX)
      const targetPpy = clampPpy(s.ppy * factor)
      animateView(targetPpy, (year - BASE_YEAR) * targetPpy - anchorX)
    },
    [animateView],
  )

  // wheel zoom (ctrl/trackpad-pinch) / horizontal pan
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cancelTween()
      const rect = canvas.getBoundingClientRect()
      const s = store.getState()
      s.markTouched()
      if (e.ctrlKey) {
        const x = e.clientX - rect.left
        const year = xToYear(x, s.ppy, s.panX)
        const ppyNext = clampPpy(s.ppy * Math.exp(-e.deltaY * 0.01))
        s.setView(ppyNext, (year - BASE_YEAR) * ppyNext - x)
      } else {
        const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        s.setPanX(s.panX + dx)
      }
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])

  const rect = () => canvasRef.current?.getBoundingClientRect()
  const toCanvas = (clientX: number, clientY: number) => {
    const r = rect()
    return { x: clientX - (r?.left ?? 0), y: clientY - (r?.top ?? 0) }
  }

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.setPointerCapture(e.pointerId)
    cancelTween()
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const n = pointers.current.size
    if (n === 1) {
      dragRef.current = { startX: e.clientX, startPan: store.getState().panX, moved: false }
    } else if (n === 2) {
      dragRef.current = null
      const [a, b] = [...pointers.current.values()]
      const midX = toCanvas((a.x + b.x) / 2, 0).x
      const s = store.getState()
      pinchRef.current = {
        startDist: Math.hypot(a.x - b.x, a.y - b.y),
        startPpy: s.ppy,
        anchorYear: xToYear(midX, s.ppy, s.panX),
      }
    }
  }, [])

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }
    const n = pointers.current.size

    if (n >= 2 && pinchRef.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const midX = toCanvas((a.x + b.x) / 2, 0).x
      const { startDist, startPpy, anchorYear } = pinchRef.current
      const next = clampPpy(startPpy * (dist / startDist))
      const s = store.getState()
      s.markTouched()
      s.setView(next, (anchorYear - BASE_YEAR) * next - midX)
      return
    }

    if (n === 1 && dragRef.current) {
      const d = dragRef.current
      const dx = e.clientX - d.startX
      const s = store.getState()
      if (Math.abs(dx) > DRAG_THRESHOLD) {
        d.moved = true
        s.markTouched()
      }
      s.setPanX(d.startPan - dx)
      return
    }

    if (n === 0 && e.pointerType === 'mouse') {
      const p = toCanvas(e.clientX, e.clientY)
      const s = store.getState()
      const rows = computeLaneRows(sortedLanes(s.doc))
      const boxes = computeEventBoxes(s.doc, rows, s.ppy, s.panX)
      const hit = hitTest(boxes, p.x, p.y)
      s.setHovered(hit ? hit.event.id : null)
    }
  }, [])

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const wasDrag = dragRef.current
      pointers.current.delete(e.pointerId)
      canvasRef.current?.releasePointerCapture(e.pointerId)
      const remaining = pointers.current.size

      if (pinchRef.current && remaining < 2) {
        pinchRef.current = null
        if (remaining === 1) {
          const [p] = [...pointers.current.values()]
          dragRef.current = { startX: p.x, startPan: store.getState().panX, moved: true }
        }
        return
      }

      if (wasDrag && remaining === 0) {
        dragRef.current = null
        if (wasDrag.moved) return
        const p = toCanvas(e.clientX, e.clientY)
        const now = performance.now()
        const lt = lastTap.current
        if (now - lt.t < DOUBLE_TAP_MS && Math.hypot(p.x - lt.x, p.y - lt.y) < 28) {
          lastTap.current = { t: 0, x: 0, y: 0 }
          zoomAround(1.9, p.x)
          return
        }
        lastTap.current = { t: now, x: p.x, y: p.y }
        const s = store.getState()
        const rows = computeLaneRows(sortedLanes(s.doc))
        const boxes = computeEventBoxes(s.doc, rows, s.ppy, s.panX)
        const hit = hitTest(boxes, p.x, p.y)
        s.select(hit ? hit.event.id : null)
      }
    },
    [zoomAround],
  )

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => store.getState().setHovered(null)}
    />
  )
}
