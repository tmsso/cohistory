// Mapping between fractional years and screen-x pixels.
// Phase 1 uses a fixed pixels-per-year; Phase 2 will make `ppy` a zoom state.

/** Year that maps to content-x 0 (before pan). Arbitrary origin for the math. */
export const BASE_YEAR = 1800

/** Fixed horizontal scale for Phase 1. */
export const DEFAULT_PPY = 110

/** Year shown at the left edge of the viewport on first load. */
export const START_YEAR = 1846.5

export function yearToX(year: number, ppy: number, panX: number): number {
  return (year - BASE_YEAR) * ppy - panX
}

export function xToYear(x: number, ppy: number, panX: number): number {
  return BASE_YEAR + (x + panX) / ppy
}

export function initialPanX(ppy: number): number {
  return (START_YEAR - BASE_YEAR) * ppy
}
