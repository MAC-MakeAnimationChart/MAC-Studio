// Base colors for charts. The first entry is the Studio brand blue.
export const BASE_COLORS = ['#2F66F5', '#55bb86', '#f1a56d', '#4aa3c8', '#c05ab0', '#8b93a6']

export const DEFAULT_COLOR = BASE_COLORS[0]
export const DEFAULT_BG = '#FFFFFF'

export const COLOR_PRESETS = [
  { name: '파랑', value: '#2F66F5' },
  { name: '초록', value: '#55bb86' },
  { name: '주황', value: '#f1a56d' },
  { name: '하늘', value: '#4aa3c8' },
  { name: '자홍', value: '#c05ab0' },
]

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
