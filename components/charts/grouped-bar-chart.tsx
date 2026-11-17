import { ChartColumnBig } from 'lucide-react'
import { seriesColors } from '@/lib/chart-colors'
import { shade } from '@/lib/chart-palette'
import { Axes, cartesian } from './cartesian'
import { ChartFrame, LegendRow, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

// Small space between bars of one group, as a share of a bar, so touching colors stay apart
const INNER_GAP = 0.08

export function GroupedBarChart({ spec, data }: ChartComponentProps) {
  const { series } = data
  const layout = frameLayout(spec, { legendRow: spec.legend, axisLabels: true, labels: data.labels })
  // the axis has to reach the tallest bar of any series
  const g = cartesian(spec, { ...data, values: series.flatMap((s) => s.values) }, layout)
  const group = g.step * (spec.barWidth / 100)
  const slot = group / Math.max(series.length, 1)
  const bar = slot * (series.length > 1 ? 1 - INNER_GAP : 1)
  const colors = seriesColors(spec, series.length).map((c) => shade(c, spec.barShade))

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '그룹 막대 차트'}>
      <LegendRow spec={spec} layout={layout} items={series.map((s, k) => ({ name: s.name, color: colors[k] }))} />
      <Axes spec={spec} data={data} layout={layout} g={g} />
      {series.map((s, k) =>
        s.values.map((v, i) => {
          const x = g.x(i) - group / 2 + slot * k + (slot - bar) / 2
          return <rect key={`${k}-${i}`} x={x} y={g.y(v)} width={bar} height={layout.plotBottom - g.y(v)} rx={Math.min(3, bar / 2)} fill={colors[k]} />
        }),
      )}
    </ChartFrame>
  )
}

export const groupedBarChart: ChartDefinition = {
  type: '그룹 막대 차트',
  en: 'Grouped bar chart',
  desc: '항목별로 여러 값을 나란히 비교',
  icon: ChartColumnBig,
  tint: 'bg-[#E6EEFF]',
  // sorting by value uses the first series
  supports: { barWidth: true, sliceColors: false, axes: true, sortable: true, multiSeries: true },
  Component: GroupedBarChart,
}
