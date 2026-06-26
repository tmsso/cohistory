import type { HDate, TimelineEvent } from '../types/timeline'

const DAYS_IN_YEAR = 365.25
const AVG_DAYS_IN_MONTH = 30.4375
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Normalize a date to a single fractional-year value so all zoom/scale math
 * runs on one numeric axis (DESIGN.md §3). Approximation is fine — it only
 * needs to be monotonic and visually correct, not calendar-exact.
 */
export function toFractionalYear(d: HDate): number {
  const month = d.month ?? 1
  const day = d.day ?? 1
  const dayOfYear = (month - 1) * AVG_DAYS_IN_MONTH + (day - 1)
  return d.year + dayOfYear / DAYS_IN_YEAR
}

export function eventStartYear(e: TimelineEvent): number {
  return toFractionalYear(e.kind === 'point' ? e.date : e.start)
}

export function eventEndYear(e: TimelineEvent): number {
  return toFractionalYear(e.kind === 'point' ? e.date : e.end)
}

/** Format an integer year for axis labels (handles BCE). */
export function formatYear(year: number): string {
  const y = Math.round(year)
  return y <= 0 ? `${1 - y} BCE` : String(y)
}

/** Human-readable date for the selection card, respecting precision/circa. */
export function formatHDate(d: HDate): string {
  let s = formatYear(d.year)
  if (d.month) s = `${MONTHS[d.month - 1]} ${s}`
  if (d.month && d.day) s = `${d.day} ${MONTHS[d.month - 1]} ${formatYear(d.year)}`
  return d.circa ? `c. ${s}` : s
}
