// The Studio palette: one list used by the charts (series, slices, color swatches) and by the
// site itself (landing demo), so they always look like the same product. The first entry is
// the brand blue and the default chart color; the order is the order slices are colored in.
export const PALETTE = [
  { name: '파랑', value: '#2F66F5' },
  { name: '하늘', value: '#4ED3FD' },
  { name: '청록', value: '#0EA5A4' },
  { name: '초록', value: '#55BB86' },
  { name: '보라', value: '#7C5CE0' },
  { name: '자홍', value: '#C05AB0' },
  { name: '주황', value: '#F97316' },
  { name: '회색', value: '#8B93A6' },
] as const

export const BASE_COLORS: string[] = PALETTE.map((c) => c.value)
export const COLOR_PRESETS = PALETTE

export const DEFAULT_COLOR = BASE_COLORS[0]
export const DEFAULT_BG = '#FFFFFF'

// Slice / series colors: the chosen color first, then the rest of the base palette.
export const paletteFrom = (color: string) => [color, ...BASE_COLORS.filter((c) => c.toLowerCase() !== color.toLowerCase())]

const luminance = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return 1
  const n = parseInt(m[1], 16)
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}

// Text and grid colors that stay readable on whatever background the user picks.
export function inkFor(bg: string) {
  return luminance(bg) < 0.4
    ? { text: '#F5F7FF', muted: '#B4BBD0', grid: 'rgba(255,255,255,0.16)', ring: bg }
    : { text: '#0C1B4C', muted: '#7B8497', grid: '#EDF0F5', ring: bg }
}

// Lightens (pct > 0) or darkens (pct < 0) a color by mixing it toward white or black.
export function shade(hex: string, pct: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m || pct === 0) return hex
  const n = parseInt(m[1], 16)
  const target = pct > 0 ? 255 : 0
  const k = Math.min(Math.abs(pct), 100) / 100
  const mix = (c: number) => Math.round(c + (target - c) * k)
  const to = (c: number) => mix(c).toString(16).padStart(2, '0')
  return `#${to((n >> 16) & 255)}${to((n >> 8) & 255)}${to(n & 255)}`
}
