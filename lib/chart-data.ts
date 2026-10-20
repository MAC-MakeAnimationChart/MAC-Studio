import type { ChartSpec } from './chart-spec'
import { toNumber, type Dataset } from './csv'

// What a chart component actually draws: already cut down to the chosen range and top N.
export type ChartData = { labels: string[]; values: number[]; seriesName: string }

export const OTHERS_LABEL = '기타'

export function prepareData(ds: Dataset, spec: ChartSpec, allowTopByValue: boolean): ChartData {
  const start = Math.max(1, spec.rowStart)
  const end = Math.min(ds.rows.length, spec.rowEnd ?? ds.rows.length)
  let items = ds.rows.slice(start - 1, Math.max(start - 1, end)).map((r) => ({
    label: r[spec.labelCol] ?? '',
    value: toNumber(r[spec.valueCol]),
  }))

  const n = spec.topN
  if (n && n > 0 && n < items.length) {
    if (spec.topMode === 'top' && allowTopByValue) {
      const sorted = [...items].sort((a, b) => b.value - a.value)
      const kept = sorted.slice(0, n)
      const rest = sorted.slice(n)
      items = spec.groupOthers && rest.length ? [...kept, { label: OTHERS_LABEL, value: rest.reduce((sum, i) => sum + i.value, 0) }] : kept
    } else {
      const kept = items.slice(0, n)
      const rest = items.slice(n)
      items = spec.groupOthers && rest.length ? [...kept, { label: OTHERS_LABEL, value: rest.reduce((sum, i) => sum + i.value, 0) }] : kept
    }
  }

  return {
    labels: items.map((i) => i.label),
    values: items.map((i) => i.value),
    seriesName: ds.headers[spec.valueCol] ?? '',
  }
}
