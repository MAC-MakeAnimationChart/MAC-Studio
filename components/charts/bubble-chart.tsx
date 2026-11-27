import { CircleDot } from 'lucide-react'
import { shade } from '@/lib/chart-palette'
import { extent } from './distribution'
import { ChartFrame, SeriesLegend, W } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'
import { PointLabels, XYAxes, xyScales } from './xy-chart'

const MAX_RADIUS = 28

export function BubbleChart({ spec, data }: ChartComponentProps) {
  const scales = xyScales(spec, data, 0.1, MAX_RADIUS)
  const largest = extent(data.sizes)[1]
  // the area, not the radius, follows the value; 0 and negative values have no size to draw
  const points = data.values
    .map((v, i) => ({ x: scales.px(data.x[i]), y: scales.py(v), r: data.sizes[i] > 0 ? Math.sqrt(data.sizes[i] / largest) * MAX_RADIUS : 0, label: data.labels[i] }))
    .filter((p) => p.r > 0)
    // large ones first, so the small ones stay on top
    .sort((a, b) => b.r - a.r)
  const fill = shade(spec.color, spec.barShade)

  return (
    <ChartFrame spec={spec} layout={scales.layout} ariaLabel={spec.title || '버블 차트'}>
      <SeriesLegend spec={spec} layout={scales.layout} name={data.sizeName && `원 크기: ${data.sizeName}`} color={fill} />
      <XYAxes spec={spec} data={data} scales={scales} nameWidth={spec.legend ? W / 2 - 24 : undefined} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={fill} fillOpacity="0.5" stroke={fill} strokeWidth="1.5" />
      ))}
      <PointLabels spec={spec} points={points} />
    </ChartFrame>
  )
}

export const bubbleChart: ChartDefinition = {
  type: '버블 차트',
  en: 'Bubble chart',
  desc: '두 숫자의 관계와 크기',
  icon: CircleDot,
  tint: 'bg-[#E4F4F6]',
  supports: { barWidth: false, sliceColors: false, axes: true, sortable: false, observations: 'points', xy: true, sizeColumn: true },
  Component: BubbleChart,
}
