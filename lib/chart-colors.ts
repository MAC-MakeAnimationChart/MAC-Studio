import { PALETTE, paletteFrom, shade } from './chart-palette'
import type { ChartSpec } from './chart-spec'

// Charts whose categories each get their own color (pie): the user can always pick a color series for
// the whole chart, and up to this many slices every slice also has its own color picker.
export const MAX_SLICE_PICKERS = 10

export const MIXED_SERIES = 'mixed'

// A series is either the mixed palette (a different hue per slice) or one hue from the palette
// shown from dark to light.
export const COLOR_SERIES = [{ id: MIXED_SERIES, name: '여러 색' }, ...PALETTE.map((c) => ({ id: c.value, name: `${c.name} 계열` }))]

// n colors from dark to light of one hue.
export function ramp(base: string, n: number) {
  if (n <= 1) return [base]
  return Array.from({ length: n }, (_, i) => shade(base, -35 + (100 * i) / (n - 1)))
}

// The color of every drawn category, in order. `labels` are the categories as drawn (after the
// row pick, sort and top N). Per-slice overrides are keyed by label so they survive re-sorting.
export function sliceColors(spec: ChartSpec, labels: string[]) {
  const base = paletteFrom(spec.color)
  const series = spec.colorSeries === MIXED_SERIES ? labels.map((_, i) => base[i % base.length]) : ramp(spec.colorSeries, labels.length)
  // above the limit the series is all there is; up to it, colors picked one by one sit on top
  if (labels.length > MAX_SLICE_PICKERS) return series
  return labels.map((label, i) => spec.sliceColors[label] ?? series[i])
}
