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
