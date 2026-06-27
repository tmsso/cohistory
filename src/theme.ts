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

  point: '#7FC0EA',

  // selection / active — the single warm accent, used sparingly
  accent: '#E8B23A',
  accentSoft: 'rgba(232, 178, 58, 0.20)',
  accentGlow: 'rgba(232, 178, 58, 0.50)',
} as const

// Event categories — one muted family at matched chroma so it stays harmonious.
export const categoryColors: Record<string, string> = {
  war: '#CC6B61',
  revolution: '#D2924C',
  politics: '#6F8CD1',
  treaty: '#57A992',
  disaster: '#A972B5',
  science: '#54A9C9',
  religion: '#C2A24E',
  exploration: '#82AD5B',
  economy: '#C58A6B',
  general: '#8593A6',
}

export const layout = {
  axisHeight: 40,
  laneHeight: 56,
  headerWidth: 124,
} as const

export const FONT_FAMILY =
  '"Inter Variable", ui-sans-serif, system-ui, -apple-system, sans-serif'

/** Canvas font shorthand for a given weight/size. */
export function font(weight: number, size: number): string {
  return `${weight} ${size}px ${FONT_FAMILY}`
}

// --- small color helpers (canvas accepts any CSS color string) ---
const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)))

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function lighten(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex)
  const f = (c: number) => clampByte(c + (255 - c) * amt)
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`
}

export function darken(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex)
  const f = (c: number) => clampByte(c * (1 - amt))
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`
}

export function withAlpha(hex: string, a: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
