import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useTimelineStore } from '../store/timelineStore'
import { AXIS_HEIGHT, HEADER_WIDTH, LANE_HEIGHT, sortedLanes } from '../render/geometry'

const LONG_PRESS_MS = 220
const CANCEL_MOVE = 10

interface DragState {
  id: string
  from: number
  grabDy: number
  top: number // current top within the rows region (px)
  target: number
}

/** Sticky lane headers with drag-to-reorder, rename, and remove. */
export function LaneHeaders() {
  const doc = useTimelineStore((s) => s.doc)
  const reorderLanes = useTimelineStore((s) => s.reorderLanes)
  const renameLane = useTimelineStore((s) => s.renameLane)
  const removeLane = useTimelineStore((s) => s.removeLane)
  const addLane = useTimelineStore((s) => s.addLane)

  const lanes = sortedLanes(doc)
  const rowsRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const pressTimer = useRef<number | null>(null)
  const pressStart = useRef<{ x: number; y: number } | null>(null)

  const rowsTop = () => rowsRef.current?.getBoundingClientRect().top ?? 0
  const clampIndex = (i: number) => Math.max(0, Math.min(lanes.length - 1, i))

  const begin = (from: number, id: string, clientY: number) => {
    const top = from * LANE_HEIGHT
    setDrag({ id, from, grabDy: clientY - rowsTop() - top, top, target: from })
  }

  const clearPress = () => {
    if (pressTimer.current != null) clearTimeout(pressTimer.current)
    pressTimer.current = null
    pressStart.current = null
  }

  const onRowPointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    from: number,
    id: string,
  ) => {
    if (editing) return
    const target = e.target as HTMLElement
    const fromHandle = !!target.closest('[data-handle]')
    e.currentTarget.setPointerCapture(e.pointerId)
    if (fromHandle) {
      begin(from, id, e.clientY)
      return
    }
    // long-press elsewhere on the row
    pressStart.current = { x: e.clientX, y: e.clientY }
    pressTimer.current = window.setTimeout(() => begin(from, id, e.clientY), LONG_PRESS_MS)
  }

  const onRowPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) {
      if (pressStart.current) {
        const moved =
          Math.abs(e.clientX - pressStart.current.x) + Math.abs(e.clientY - pressStart.current.y)
        if (moved > CANCEL_MOVE) clearPress()
      }
      return
    }
    const top = e.clientY - rowsTop() - drag.grabDy
    const target = clampIndex(Math.floor((top + LANE_HEIGHT / 2) / LANE_HEIGHT))
    setDrag({ ...drag, top, target })
  }

  const onRowPointerUp = () => {
    clearPress()
    if (drag) {
      reorderLanes(drag.from, drag.target)
      setDrag(null)
    }
  }

  const startAdd = () => {
    const id = addLane()
    setEditing(id)
  }

  return (
    <div
      className="relative shrink-0 border-r border-line bg-headercol"
      style={{ width: HEADER_WIDTH }}
    >
      <div style={{ height: AXIS_HEIGHT }} className="border-b border-line bg-panel" />

      <div ref={rowsRef} className="relative">
        {lanes.map((lane, i) => {
          const isDragging = drag?.id === lane.id
          return (
            <div
              key={lane.id}
              data-testid="lane-header"
              data-lane-id={lane.id}
              style={{ height: LANE_HEIGHT, touchAction: 'none' }}
              className={`group flex items-center gap-1.5 border-b border-line px-2 ${
                isDragging ? 'opacity-30' : ''
              }`}
              onPointerDown={(e) => onRowPointerDown(e, i, lane.id)}
              onPointerMove={onRowPointerMove}
              onPointerUp={onRowPointerUp}
              onPointerCancel={onRowPointerUp}
            >
              <span
                data-handle
                aria-label="Drag to reorder"
                className="cursor-grab touch-none select-none px-0.5 text-ink-faint active:cursor-grabbing"
              >
                ⠿
              </span>
              {editing === lane.id ? (
                <input
                  autoFocus
                  defaultValue={lane.title}
                  onPointerDown={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    renameLane(lane.id, e.target.value.trim() || lane.title)
                    setEditing(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setEditing(null)
                  }}
                  className="min-w-0 flex-1 rounded border border-line2 bg-surface px-1 py-0.5 text-[13px] text-ink outline-none"
                />
              ) : (
                <button
                  type="button"
                  onDoubleClick={() => setEditing(lane.id)}
                  className="line-clamp-2 min-w-0 flex-1 text-left text-[13px] font-semibold leading-[1.15] text-ink"
                >
                  {lane.title}
                </button>
              )}
              <button
                type="button"
                aria-label={`Remove ${lane.title}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => removeLane(lane.id)}
                className="shrink-0 rounded px-1 text-sm leading-none text-ink-faint opacity-0 transition-opacity hover:text-ink focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-60"
              >
                ✕
              </button>
            </div>
          )
        })}

        {drag && (
          <>
            <div
              className="pointer-events-none absolute inset-x-1 z-10 h-0.5 rounded bg-accent"
              style={{ top: drag.target * LANE_HEIGHT - 1 }}
            />
            <div
              className="pointer-events-none absolute inset-x-1 z-20 flex items-center gap-1.5 rounded-lg border border-accent/70 bg-panel px-2 shadow-2xl"
              style={{
                height: LANE_HEIGHT - 6,
                top: drag.top + 3,
              }}
            >
              <span className="text-ink-faint">⠿</span>
              <span className="line-clamp-2 text-[13px] font-semibold leading-[1.15] text-ink">
                {doc.lanes.find((l) => l.id === drag.id)?.title}
              </span>
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={startAdd}
        className="flex h-9 w-full items-center gap-1.5 border-b border-line px-3 text-[12px] font-medium text-ink-muted transition-colors hover:bg-line/40 hover:text-ink"
      >
        <span className="text-base leading-none">+</span> Add lane
      </button>
    </div>
  )
}
