import { create } from 'zustand'
import type { Lane, Timeline } from '../types/timeline'
import { BASE_YEAR, clampPpy, DEFAULT_PPY, fitView, xToYear } from '../lib/scale'
import { demo1848 } from '../data/demo1848'

function inOrder(lanes: Lane[]): Lane[] {
  return [...lanes].sort((a, b) => a.order - b.order)
}

function reindex(lanes: Lane[]): Lane[] {
  return lanes.map((l, i) => ({ ...l, order: i }))
}

interface TimelineState {
  doc: Timeline
  /** pixels per year (horizontal zoom) */
  ppy: number
  /** horizontal pan offset in content pixels */
  panX: number
  /** current canvas content width in CSS px */
  viewportWidth: number
  /** true once the user pans/zooms; suspends auto-fit on resize */
  userTouched: boolean
  selectedId: string | null
  hoveredId: string | null

  setView: (ppy: number, panX: number) => void
  setPanX: (panX: number) => void
  markTouched: () => void
  setViewport: (width: number) => void
  zoomBy: (factor: number) => void
  fitTo: () => void
  select: (id: string | null) => void
  setHovered: (id: string | null) => void

  // lane editing
  reorderLanes: (from: number, to: number) => void
  addLane: () => string
  renameLane: (id: string, title: string) => void
  removeLane: (id: string) => void
}

export const useTimelineStore = create<TimelineState>((set) => ({
  doc: demo1848,
  ppy: DEFAULT_PPY,
  panX: 0,
  viewportWidth: 0,
  userTouched: false,
  selectedId: null,
  hoveredId: null,

  setView: (ppy, panX) => set({ ppy: clampPpy(ppy), panX }),
  setPanX: (panX) => set({ panX }),
  markTouched: () => set((s) => (s.userTouched ? s : { userTouched: true })),

  setViewport: (width) =>
    set((s) => {
      if (width <= 0 || s.userTouched) return { viewportWidth: width }
      const v = fitView(width, s.doc)
      return { viewportWidth: width, ppy: v.ppy, panX: v.panX }
    }),

  zoomBy: (factor) =>
    set((s) => {
      const anchorX = s.viewportWidth / 2
      const year = xToYear(anchorX, s.ppy, s.panX)
      const ppy = clampPpy(s.ppy * factor)
      return { ppy, panX: (year - BASE_YEAR) * ppy - anchorX, userTouched: true }
    }),

  fitTo: () =>
    set((s) => {
      const v = fitView(s.viewportWidth, s.doc)
      return { ppy: v.ppy, panX: v.panX, userTouched: false }
    }),

  select: (selectedId) => set({ selectedId }),
  setHovered: (hoveredId) => set((s) => (s.hoveredId === hoveredId ? s : { hoveredId })),

  reorderLanes: (from, to) =>
    set((s) => {
      const ordered = inOrder(s.doc.lanes)
      if (from < 0 || from >= ordered.length || to < 0 || to >= ordered.length || from === to) {
        return s
      }
      const [moved] = ordered.splice(from, 1)
      ordered.splice(to, 0, moved)
      const byId = new Map(reindex(ordered).map((l) => [l.id, l]))
      return { doc: { ...s.doc, lanes: s.doc.lanes.map((l) => byId.get(l.id) ?? l) } }
    }),

  addLane: () => {
    const id = `lane_${crypto.randomUUID().slice(0, 8)}`
    set((s) => {
      const order = s.doc.lanes.reduce((m, l) => Math.max(m, l.order), -1) + 1
      const lane: Lane = { id, kind: 'region', title: 'New lane', order, parentId: null }
      return { doc: { ...s.doc, lanes: [...s.doc.lanes, lane] } }
    })
    return id
  },

  renameLane: (id, title) =>
    set((s) => ({
      doc: { ...s.doc, lanes: s.doc.lanes.map((l) => (l.id === id ? { ...l, title } : l)) },
    })),

  removeLane: (id) =>
    set((s) => {
      const lanes = reindex(inOrder(s.doc.lanes.filter((l) => l.id !== id)))
      const events = s.doc.events.filter((e) => e.laneId !== id)
      return { doc: { ...s.doc, lanes, events } }
    }),
}))
