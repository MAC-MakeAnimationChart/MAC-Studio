import { BarChart3 } from 'lucide-react'
import { shade } from '@/lib/chart-palette'
import { Axes, cartesian } from './cartesian'
import { ChartFrame, SeriesLegend, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

export function BarChart({ spec, data }: ChartComponentProps) {
  const layout = frameLayout(spec, {
    legendRow: spec.legend && !!data.seriesName,
    axisLabels: true,
    labels: data.labels,
  })
  const g = cartesian(spec, data, layout)
  const bar = g.step * (spec.barWidth / 100)
  const fill = shade(spec.color, spec.barShade)

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '막대 차트'}>
      <SeriesLegend spec={spec} layout={layout} name={data.seriesName} color={fill} />
      <Axes spec={spec} data={data} layout={layout} g={g} />
      {data.values.map((v, i) => (
        <rect key={i} x={g.x(i) - bar / 2} y={g.y(v)} width={bar} height={layout.plotBottom - g.y(v)} rx={Math.min(4, bar / 2)} fill={fill} />
      ))}
    </ChartFrame>
  )
}

export const barChart: ChartDefinition = {
  type: '막대 차트',
  en: 'Bar chart',
  desc: '항목별 크기 비교',
  icon: BarChart3,
  tint: 'bg-[#E6EEFF]',
  supports: { barWidth: true, axes: true, sortable: true },
  Component: BarChart,
}
