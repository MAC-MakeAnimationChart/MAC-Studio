import type { ChartSpec, RowSort } from './chart-spec'
import { toNumber, type Dataset } from './csv'

// What a chart component actually draws: already cut down to the chosen rows, order and top N.
export type ChartData = {
  labels: string[]
  values: number[]
  errors: number[] // ± of each value from spec.errorCol (error bar charts); all 0 when there is none
  seriesName: string
  // every value column as a series: the first is { seriesName, values } above, the rest come from
  // spec.extraCols (multi-series charts). Single-series charts can keep reading `values`.
  series: Series[]
}

export type Series = { name: string; values: number[] }

export const OTHERS_LABEL = '기타'

type Item = { label: string; value: number; error: number; extras: number[] }

const byName = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' })

// Pipeline: pick rows (range or ticked) -> put in order -> keep the first N (and fold the rest into
// "기타" if asked). `allowSort` is false for charts where row order is the meaning (line charts).
// `fixedSort` is for charts that always use one order (pareto), whatever the user picked.
// Sorting by value uses the first series; "기타" sums each series on its own.
export function prepareData(ds: Dataset, spec: ChartSpec, allowSort: boolean, fixedSort?: RowSort): ChartData {
  const sort = fixedSort ?? (allowSort ? spec.sort : 'none')
  let rows: string[][]
  if (spec.rowMode === 'manual') {
    const picked = [...new Set(spec.picked)].filter((n) => n >= 1 && n <= ds.rows.length).sort((a, b) => a - b)
    rows = picked.map((n) => ds.rows[n - 1])
  } else {
    const start = Math.max(1, spec.rowStart)
    const end = Math.min(ds.rows.length, spec.rowEnd ?? ds.rows.length)
    rows = ds.rows.slice(start - 1, Math.max(start - 1, end))
  }

  // saved specs may name a column that no longer exists (or the value column twice)
  const extraCols = (spec.extraCols ?? []).filter((c, i, all) => c !== spec.valueCol && c >= 0 && c < ds.headers.length && all.indexOf(c) === i)

  let items: Item[] = rows.map((r) => ({
    label: r[spec.labelCol] ?? '',
    value: toNumber(r[spec.valueCol]),
    error: spec.errorCol === null ? 0 : Math.abs(toNumber(r[spec.errorCol])),
    extras: extraCols.map((c) => toNumber(r[c])),
  }))

  if (sort !== 'none') {
    const order: Record<Exclude<RowSort, 'none'>, (a: Item, b: Item) => number> = {
      valueDesc: (a, b) => b.value - a.value,
      valueAsc: (a, b) => a.value - b.value,
      nameAsc: (a, b) => byName.compare(a.label, b.label),
      nameDesc: (a, b) => byName.compare(b.label, a.label),
    }
    items = [...items].sort(order[sort])
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
              // a sum has no meaningful ± from the parts' errors, so "기타" gets no error bar
              error: 0,
              extras: extraCols.map((_, k) => rest.reduce((sum, i) => sum + i.extras[k], 0)),
            },
          ]
        : kept
  }

  const seriesName = ds.headers[spec.valueCol] ?? ''
  const values = items.map((i) => i.value)
  return {
    labels: items.map((i) => i.label),
    values,
    errors: items.map((i) => i.error),
    seriesName,
    series: [{ name: seriesName, values }, ...extraCols.map((c, k) => ({ name: ds.headers[c] ?? '', values: items.map((i) => i.extras[k]) }))],
  }
}
