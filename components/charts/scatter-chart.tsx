import { ChartScatter } from 'lucide-react'
import { shade } from '@/lib/chart-palette'
import { uniqueDots } from './distribution'
import { ChartFrame } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'
import { PointLabels, XYAxes, xyScales } from './xy-chart'

const RADIUS = 4.5

export function ScatterChart({ spec, data }: ChartComponentProps) {
  const scales = xyScales(spec, data, 0.03)
  const points = data.values.map((v, i) => ({ x: scales.px(data.x[i]), y: scales.py(v), r: RADIUS, label: data.labels[i] }))
  const fill = shade(spec.color, spec.barShade)

  return (
    <ChartFrame spec={spec} layout={scales.layout} ariaLabel={spec.title || '산점도'}>
      <XYAxes spec={spec} data={data} scales={scales} />
      {uniqueDots(points).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={RADIUS} fill={fill} fillOpacity="0.75" />
      ))}
      <PointLabels spec={spec} points={points} />
    </ChartFrame>
  )
}

export const scatterChart: ChartDefinition = {
  type: '산점도',
  en: 'Scatter plot',
  desc: '두 숫자의 관계',
  icon: ChartScatter,
  tint: 'bg-[#E4F4F6]',
  supports: { barWidth: false, sliceColors: false, axes: true, sortable: false, observations: 'points', xy: true, noLegend: true },
  Component: ScatterChart,
}
