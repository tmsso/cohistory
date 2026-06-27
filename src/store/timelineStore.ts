import { create } from 'zustand'
import type { Timeline } from '../types/timeline'
import { BASE_YEAR, clampPpy, DEFAULT_PPY, fitView, xToYear } from '../lib/scale'
import { demo1848 } from '../data/demo1848'

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
  /** report the canvas width; auto-fits the dataset until the user takes control */
  setViewport: (width: number) => void
  /** zoom by a factor around the viewport center (for toolbar buttons) */
  zoomBy: (factor: number) => void
  /** frame the whole dataset and re-enable auto-fit */
  fitTo: () => void
  select: (id: string | null) => void
  setHovered: (id: string | null) => void
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
}))
