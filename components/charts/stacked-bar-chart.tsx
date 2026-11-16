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

export function StackedBarChart({ spec, data }: ChartComponentProps) {
  const { series } = data
  const layout = frameLayout(spec, { legendRow: spec.legend, axisLabels: true, labels: data.labels })
  const columns = stackSegments(series, data.labels.length)
  // the axis reaches the top of the tallest pile, and below 0 when some values are negative
  const edges = columns.flatMap((c) => c.map((s) => s.to))
  const g = cartesian(spec, { ...data, values: edges }, layout, 24, true)
  const bar = g.step * (spec.barWidth / 100)
  const colors = seriesColors(spec, series.length).map((c) => shade(c, spec.barShade))

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '누적 막대 차트'}>
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
