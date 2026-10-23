import type { ChartSpec } from './chart-spec'
import { toNumber, type Dataset } from './csv'

// What a chart component actually draws: already cut down to the chosen rows, order and top N.
export type ChartData = {
  labels: string[]
  values: number[]
  seriesName: string
}

export const OTHERS_LABEL = '기타'

type Item = { label: string; value: number }

const byName = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' })

// Pipeline: pick rows (range or ticked) -> put in order -> keep the first N (and fold the rest into
// "기타" if asked). `allowSort` is false for charts where row order is the meaning (line charts).
export function prepareData(ds: Dataset, spec: ChartSpec, allowSort: boolean): ChartData {
  let rows: string[][]
  if (spec.rowMode === 'manual') {
    const picked = [...new Set(spec.picked)].filter((n) => n >= 1 && n <= ds.rows.length).sort((a, b) => a - b)
    rows = picked.map((n) => ds.rows[n - 1])
  } else {
    const start = Math.max(1, spec.rowStart)
    const end = Math.min(ds.rows.length, spec.rowEnd ?? ds.rows.length)
    rows = ds.rows.slice(start - 1, Math.max(start - 1, end))
  }

  let items: Item[] = rows.map((r) => ({
    label: r[spec.labelCol] ?? '',
    value: toNumber(r[spec.valueCol]),
  }))

  if (allowSort && spec.sort !== 'none') {
    const order: Record<Exclude<typeof spec.sort, 'none'>, (a: Item, b: Item) => number> = {
      valueDesc: (a, b) => b.value - a.value,
      valueAsc: (a, b) => a.value - b.value,
      nameAsc: (a, b) => byName.compare(a.label, b.label),
      nameDesc: (a, b) => byName.compare(b.label, a.label),
    }
    items = [...items].sort(order[spec.sort])
  }

  const n = spec.topN
  if (n && n > 0 && n < items.length) {
    const kept = items.slice(0, n)
    const rest = items.slice(n)
    items =
      spec.groupOthers && rest.length
        ? [
            ...kept,
            {
              label: OTHERS_LABEL,
              value: rest.reduce((sum, i) => sum + i.value, 0),
            },
          ]
        : kept
  }

  return {
    labels: items.map((i) => i.label),
    values: items.map((i) => i.value),
    seriesName: ds.headers[spec.valueCol] ?? '',
  }
}
