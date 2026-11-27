import type { ChartData } from '@/lib/chart-data'

// Shared by the distribution charts (histogram, box plot, ...), where each row is one observation.

// The values of each group (the label column), groups in the order they first appear.
export function groupValues(data: ChartData) {
  const groups = new Map<string, number[]>()
  data.labels.forEach((label, i) => {
    const name = label.trim() || '(비어 있음)'
    const list = groups.get(name)
    if (list) list.push(data.values[i])
    else groups.set(name, [data.values[i]])
  })
  return { names: [...groups.keys()], values: [...groups.values()].map((v) => v.sort((a, b) => a - b)) }
}

// Smallest and largest value. A loop, because Math.min(...values) overflows the stack on large files.
export function extent(values: number[]): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (const v of values) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  return lo <= hi ? [lo, hi] : [0, 0]
}

// Linear interpolation between the two closest ranks (the same as Excel's QUARTILE.INC). `sorted` ascending.
export function quantile(sorted: number[], p: number) {
  const at = (sorted.length - 1) * p
  const below = Math.floor(at)
  const above = Math.min(below + 1, sorted.length - 1)
  return sorted[below] + (sorted[above] - sorted[below]) * (at - below)
}

// Dots that would land on the same spot are drawn once, so a large file does not make a huge SVG.
export function uniqueDots(dots: { x: number; y: number }[]) {
  const seen = new Set<string>()
  return dots.filter(({ x, y }) => {
    const key = `${Math.round(x / 2)},${Math.round(y / 2)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const MIN_GRID = 256
const MAX_GRID = 2048

// Silverman's rule of thumb. `sorted` ascending.
function bandwidth(sorted: number[]) {
  const n = sorted.length
  const mean = sorted.reduce((sum, v) => sum + v, 0) / n
  const sd = Math.sqrt(sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / Math.max(1, n - 1))
  const iqr = (quantile(sorted, 0.75) - quantile(sorted, 0.25)) / 1.34
  // all values equal: any width will do, in proportion to the value so it stays visible
  const spread = Math.min(sd, iqr) || sd || Math.abs(mean) * 0.1 || 1
  return 0.9 * spread * n ** -0.2
}

// Smoothed distribution (Gaussian kernel density) as points along the value axis. `smoothing` is a
// percent of the automatic bandwidth. `tail` is how far past the data the curve runs, in bandwidths.
// Values are first shared out over a grid, so the cost does not grow with values x points.
export function density(sorted: number[], smoothing: number, tail: number) {
  if (!sorted.length) return []
  let h = (bandwidth(sorted) * smoothing) / 100
  const lo = sorted[0] - h * tail
  const hi = sorted[sorted.length - 1] + h * tail
  if (!(hi > lo)) return [{ value: lo, density: 1 / (h * Math.sqrt(2 * Math.PI)) }]
  const size = Math.min(MAX_GRID, Math.max(MIN_GRID, Math.ceil(((hi - lo) / h) * 4)))
  const dx = (hi - lo) / (size - 1)
  // an extreme outlier can stretch the grid past the bandwidth; keep the curve from falling between points
  h = Math.max(h, dx)
  const counts = new Float64Array(size)
  for (const v of sorted) {
    const at = Math.min(size - 1, Math.max(0, (v - lo) / dx))
    const below = Math.floor(at)
    counts[below] += 1 - (at - below)
    if (below + 1 < size) counts[below + 1] += at - below
  }
  const reach = Math.ceil((4 * h) / dx)
  const kernel = Array.from({ length: reach + 1 }, (_, k) => Math.exp(-0.5 * ((k * dx) / h) ** 2))
  const scale = 1 / (sorted.length * h * Math.sqrt(2 * Math.PI))
  return Array.from({ length: size }, (_, i) => {
    let sum = 0
    for (let j = Math.max(0, i - reach); j <= Math.min(size - 1, i + reach); j++) sum += counts[j] * kernel[Math.abs(i - j)]
    return { value: lo + i * dx, density: sum * scale }
  })
}
