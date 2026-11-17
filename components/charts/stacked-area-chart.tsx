import { ChartArea } from 'lucide-react'
import { seriesColors } from '@/lib/chart-colors'
import type { Series } from '@/lib/chart-data'
import { Axes, cartesian } from './cartesian'
import { ChartFrame, LegendRow, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

// Solid enough that each layer reads as its own color, light enough that the top lines stand out
const FILL_OPACITY = 0.55

// The running top of each layer at each point: layer k sits on layers 0..k-1. Negatives count as 0,
// since a layer can't be thinner than nothing.
function stackTops(series: Series[], count: number) {
  return series.map((_, k) => Array.from({ length: count }, (_, i) => series.slice(0, k + 1).reduce((sum, s) => sum + Math.max(s.values[i] ?? 0, 0), 0)))
}

export function StackedAreaChart({ spec, data }: ChartComponentProps) {
  const { series } = data
  const count = data.labels.length
  const layout = frameLayout(spec, { legendRow: spec.legend, axisLabels: true, labels: data.labels })
  const tops = stackTops(series, count)
  // the axis reaches the top of the whole pile (the last layer)
  const g = cartesian(spec, { ...data, values: tops[tops.length - 1] ?? [] }, layout)
  const colors = seriesColors(spec, series.length)
  const line = (ys: number[]) => ys.map((v, i) => `${g.x(i)},${g.y(v)}`)

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '누적 면적 차트'}>
      <LegendRow spec={spec} layout={layout} items={series.map((s, k) => ({ name: s.name, color: colors[k] }))} />
      <Axes spec={spec} data={data} layout={layout} g={g} />
      {count > 0 &&
        tops.map((top, k) => {
          // each layer is the band between its own top and the top of the layer under it (the axis for the first)
          const bottom = k === 0 ? top.map(() => 0) : tops[k - 1]
          const band = [...line(top), ...line(bottom).reverse()].join(' ')
          return <polygon key={k} points={band} fill={colors[k]} fillOpacity={FILL_OPACITY} />
        })}
      {count > 0 && tops.map((top, k) => <polyline key={k} fill="none" stroke={colors[k]} strokeWidth="2" strokeLinejoin="round" points={line(top).join(' ')} />)}
    </ChartFrame>
  )
}

export const stackedAreaChart: ChartDefinition = {
  type: '누적 면적 차트',
  en: 'Stacked area chart',
  desc: '시간에 따른 합계와 구성 변화',
  icon: ChartArea,
  tint: 'bg-[#E6F3ED]',
  // like a line, the row order is the time order, so sorting is not offered
  supports: { barWidth: false, sliceColors: false, axes: true, sortable: false, multiSeries: true },
  Component: StackedAreaChart,
}
