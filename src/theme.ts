// Single source of truth for the visual language.
// The canvas reads these values directly in JS; the DOM mirrors them as
// Tailwind/CSS tokens in index.css (@theme). Keep the two in sync.

export const palette = {
  surface: '#0B0F14', // app background
  panel: '#111722', // app bar / selection card
  headerCol: '#0D131C', // sticky lane-header column
  bandA: '#0B0F14', // lane background (even)
  bandB: '#0F1620', // lane background (odd, subtle)
  line: '#1C2632', // hairlines / minor gridlines
  line2: '#2A3645', // stronger dividers / major gridlines

  ink: '#E6EDF3', // primary text
  inkMuted: '#93A1B0', // axis ticks, dates, mid labels
  inkFaint: '#66727F', // meta only

  // events — one azure hue, tiered by brightness
  eventHigh: '#6BB1E3',
  eventMid: '#4F90C6',
  eventLow: '#3A6A93',
  point: '#7FC0EA',

  // selection / active — the single warm accent, used sparingly
  accent: '#E8B23A',
  accentSoft: 'rgba(232, 178, 58, 0.20)',
  accentGlow: 'rgba(232, 178, 58, 0.45)',
} as const

export const layout = {
  axisHeight: 40,
  laneHeight: 56,
  headerWidth: 120,
} as const

export const FONT_FAMILY =
  '"Inter Variable", ui-sans-serif, system-ui, -apple-system, sans-serif'

/** Canvas font shorthand for a given weight/size. */
export function font(weight: number, size: number): string {
  return `${weight} ${size}px ${FONT_FAMILY}`
}
