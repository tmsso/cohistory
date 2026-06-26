import { create } from 'zustand'
import type { Timeline } from '../types/timeline'
import { DEFAULT_PPY, initialPanX } from '../lib/scale'
import { demo1848 } from '../data/demo1848'

interface TimelineState {
  doc: Timeline
  /** pixels per year (fixed in Phase 1) */
  ppy: number
  /** horizontal pan offset in content pixels */
  panX: number
  selectedId: string | null
  setPanX: (panX: number) => void
  select: (id: string | null) => void
}

export const useTimelineStore = create<TimelineState>((set) => ({
  doc: demo1848,
  ppy: DEFAULT_PPY,
  panX: initialPanX(DEFAULT_PPY),
  selectedId: null,
  setPanX: (panX) => set({ panX }),
  select: (selectedId) => set({ selectedId }),
}))
