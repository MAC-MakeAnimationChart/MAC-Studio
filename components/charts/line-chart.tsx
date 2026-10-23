import { LineChart as LineIcon } from 'lucide-react'
import { Axes, cartesian } from './cartesian'
import { ChartFrame, SeriesLegend, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

export function LineChart({ spec, data }: ChartComponentProps) {
  const layout = frameLayout(spec, {
    legendRow: spec.legend && !!data.seriesName,
    axisLabels: true,
    labels: data.labels,
  })
  const g = cartesian(spec, data, layout)

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '선 차트'}>
      <SeriesLegend spec={spec} layout={layout} name={data.seriesName} color={spec.color} />
      <Axes spec={spec} data={data} layout={layout} g={g} />
      <polyline fill="none" stroke={spec.color} strokeWidth="2.5" strokeLinejoin="round" points={data.values.map((v, i) => `${g.x(i)},${g.y(v)}`).join(' ')} />
      {data.values.map((v, i) => (
        <circle key={i} cx={g.x(i)} cy={g.y(v)} r="4" fill={spec.bg} stroke={spec.color} strokeWidth="2" />
      ))}
    </ChartFrame>
  )
}

export const lineChart: ChartDefinition = {
  type: '선 차트',
  en: 'Line chart',
  desc: '시간에 따른 변화',
  icon: LineIcon,
  tint: 'bg-[#E6F3ED]',
  // a line's order is its meaning, so sorting is not offered
  supports: { barWidth: false, axes: true, sortable: false },
  Component: LineChart,
}
