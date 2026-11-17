import { ChartColumnStacked } from 'lucide-react'
import { seriesColors } from '@/lib/chart-colors'
import type { Series } from '@/lib/chart-data'
import { shade } from '@/lib/chart-palette'
import { Axes, cartesian } from './cartesian'
import { ChartFrame, LegendRow, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

type Segment = { series: number; from: number; to: number }

// Each category's bar is its series piled up in order: positive values upward from 0, negative ones
// downward from 0, so a negative never hides behind a positive.
function stackSegments(series: Series[], count: number) {
  const columns: Segment[][] = []
  for (let i = 0; i < count; i++) {
    let up = 0
    let down = 0
    const column: Segment[] = []
    series.forEach((s, k) => {
      const v = s.values[i] ?? 0
      if (v >= 0) {
        column.push({ series: k, from: up, to: up + v })
        up += v
      } else {
        column.push({ series: k, from: down, to: down + v })
        down += v
      }
    })
    columns.push(column)
  }
  return columns
}

// Each category's values as its share of that category's total, in %. A share of a whole has no
// negative part, so negatives count as 0. A category whose total is 0 gets an empty bar.
function toPercent(series: Series[], count: number): Series[] {
  const totals = Array.from({ length: count }, (_, i) => series.reduce((sum, s) => sum + Math.max(s.values[i] ?? 0, 0), 0))
  return series.map((s) => ({ ...s, values: s.values.map((v, i) => (totals[i] > 0 ? (Math.max(v, 0) / totals[i]) * 100 : 0)) }))
}

// `percent` draws every bar as 100% (the 100% stacked bar chart shares this component).
export function StackedBarChart({ spec, data, percent = false }: ChartComponentProps & { percent?: boolean }) {
  const count = data.labels.length
  const series = percent ? toPercent(data.series, count) : data.series
  const layout = frameLayout(spec, { legendRow: spec.legend, axisLabels: true, labels: data.labels })
  const columns = stackSegments(series, count)
  // the axis reaches the top of the tallest pile, and below 0 when some values are negative;
  // in percent mode it is always 0-100%
  const edges = percent ? [100] : columns.flatMap((c) => c.map((s) => s.to))
  const axis = cartesian(spec, { ...data, values: edges }, layout, 24, !percent)
  const g = percent ? { ...axis, tickLabels: axis.tickLabels.map((l) => `${l}%`) } : axis
  const bar = g.step * (spec.barWidth / 100)
  const colors = seriesColors(spec, series.length).map((c) => shade(c, spec.barShade))

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || (percent ? '100% 누적 막대 차트' : '누적 막대 차트')}>
      <LegendRow spec={spec} layout={layout} items={series.map((s, k) => ({ name: s.name, color: colors[k] }))} />
      <Axes spec={spec} data={data} layout={layout} g={g} />
      {columns.map((column, i) =>
        column.map((seg) => {
          const top = g.y(Math.max(seg.from, seg.to))
          const height = g.y(Math.min(seg.from, seg.to)) - top
          if (height <= 0) return null
          // a thin line of the background color keeps neighboring pieces apart
          return <rect key={`${i}-${seg.series}`} x={g.x(i) - bar / 2} y={top} width={bar} height={height} fill={colors[seg.series]} stroke={spec.bg} strokeWidth="1" />
        }),
      )}
    </ChartFrame>
  )
}

export const stackedBarChart: ChartDefinition = {
  type: '누적 막대 차트',
  en: 'Stacked bar chart',
  desc: '항목별 합계와 구성을 함께',
  icon: ChartColumnStacked,
  tint: 'bg-[#E6EEFF]',
  // sorting by value uses the first series
  supports: { barWidth: true, sliceColors: false, axes: true, sortable: true, multiSeries: true },
  Component: StackedBarChart,
}
