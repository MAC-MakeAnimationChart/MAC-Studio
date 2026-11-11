import { ChartCandlestick } from 'lucide-react'
import { inkFor, shade } from '@/lib/chart-palette'
import { Axes, cartesian } from './cartesian'
import { ChartFrame, SeriesLegend, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

export function ErrorBarChart({ spec, data }: ChartComponentProps) {
  const ink = inkFor(spec.bg)
  const layout = frameLayout(spec, {
    legendRow: spec.legend && !!data.seriesName,
    axisLabels: true,
    labels: data.labels,
  })
  // the axis has to reach the top of the highest error bar, not just the highest bar
  const g = cartesian(spec, { ...data, values: data.values.map((v, i) => v + data.errors[i]) }, layout)
  const bar = g.step * (spec.barWidth / 100)
  const cap = Math.min(bar * 0.5, 16)
  const fill = shade(spec.color, spec.barShade)

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '오차 막대 차트'}>
      <SeriesLegend spec={spec} layout={layout} name={data.seriesName} color={fill} />
      <Axes spec={spec} data={data} layout={layout} g={g} />
      {data.values.map((v, i) => (
        <rect key={i} x={g.x(i) - bar / 2} y={g.y(v)} width={bar} height={layout.plotBottom - g.y(v)} rx={Math.min(4, bar / 2)} fill={fill} />
      ))}
      {data.values.map((v, i) => {
        const e = data.errors[i]
        if (!e) return null
        const x = g.x(i)
        // g.y stops at 0, so a ± that reaches below zero ends at the axis
        const top = g.y(v + e)
        const bottom = g.y(v - e)
        return (
          <g key={i} stroke={ink.text} strokeWidth="1.5" strokeLinecap="round">
            <line x1={x} x2={x} y1={top} y2={bottom} />
            <line x1={x - cap / 2} x2={x + cap / 2} y1={top} y2={top} />
            <line x1={x - cap / 2} x2={x + cap / 2} y1={bottom} y2={bottom} />
          </g>
        )
      })}
    </ChartFrame>
  )
}

export const errorBarChart: ChartDefinition = {
  type: '오차 막대 차트',
  en: 'Bar chart with error bars',
  desc: '평균과 오차 범위(±) 비교',
  icon: ChartCandlestick,
  tint: 'bg-[#E6EEFF]',
  supports: { barWidth: true, sliceColors: false, axes: true, sortable: true, errorBars: true },
  Component: ErrorBarChart,
}
