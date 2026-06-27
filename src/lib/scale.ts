// Mapping between fractional years and screen-x pixels, plus the zoom model.
// `ppy` (pixels per year) is the horizontal zoom state.

import type { Timeline } from '../types/timeline'
import { eventEndYear, eventStartYear } from './time'

/** Year that maps to content-x 0 (before pan). Arbitrary origin for the math. */
export const BASE_YEAR = 1800

/** Zoom bounds: from ~a century across a phone to ~months across a phone. */
export const MIN_PPY = 6
export const MAX_PPY = 1400
export const DEFAULT_PPY = 110

export function clampPpy(ppy: number): number {
  return Math.min(MAX_PPY, Math.max(MIN_PPY, ppy))
}

export function yearToX(year: number, ppy: number, panX: number): number {
  return (year - BASE_YEAR) * ppy - panX
}

export function xToYear(x: number, ppy: number, panX: number): number {
  return BASE_YEAR + (x + panX) / ppy
}

/**
 * Level-of-detail: the minimum importance an event needs to be fully visible
 * at a given zoom. Zoomed out → only high-importance survives; zoom in → 0.
 */
export function visibilityThreshold(ppy: number): number {
  const t =
    (Math.log(ppy) - Math.log(MIN_PPY)) / (Math.log(220) - Math.log(MIN_PPY))
  const k = Math.min(1, Math.max(0, t))
  return 88 * (1 - k)
}

/** Soft fade for an event around the visibility threshold (0..1). */
export function eventAlpha(importance: number, threshold: number): number {
  const fade = 10
  const a = (importance - (threshold - fade)) / (fade * 2)
  return Math.min(1, Math.max(0, a))
}

/** ppy + panX that frame the whole dataset within `width` content pixels. */
export function fitView(width: number, doc: Timeline): { ppy: number; panX: number } {
  if (doc.events.length === 0 || width <= 0) {
    return { ppy: DEFAULT_PPY, panX: (1846.5 - BASE_YEAR) * DEFAULT_PPY }
  }
  let min = Infinity
  let max = -Infinity
  for (const e of doc.events) {
    min = Math.min(min, eventStartYear(e))
    max = Math.max(max, eventEndYear(e))
  }
  const pad = (max - min) * 0.06 + 0.4
  const span = max - min + pad * 2
  const ppy = clampPpy(width / span)
  const panX = (min - pad - BASE_YEAR) * ppy
  return { ppy, panX }
}
