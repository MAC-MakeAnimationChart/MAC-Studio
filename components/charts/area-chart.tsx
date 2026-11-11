import { ChartArea } from 'lucide-react'
import { Axes, cartesian } from './cartesian'
import { ChartFrame, SeriesLegend, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

// Light enough that the grid shows through, dark enough to read as a filled shape
const FILL_OPACITY = 0.22

export function AreaChart({ spec, data }: ChartComponentProps) {
  const layout = frameLayout(spec, {
    legendRow: spec.legend && !!data.seriesName,
    axisLabels: true,
    labels: data.labels,
  })
  const g = cartesian(spec, data, layout)
  const points = data.values.map((v, i) => `${g.x(i)},${g.y(v)}`)
  const n = data.values.length
  // the line plus a drop to the axis at both ends closes the filled shape
  const area = n ? [`${g.x(0)},${layout.plotBottom}`, ...points, `${g.x(n - 1)},${layout.plotBottom}`].join(' ') : ''

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '면적 차트'}>
      <SeriesLegend spec={spec} layout={layout} name={data.seriesName} color={spec.color} />
      <Axes spec={spec} data={data} layout={layout} g={g} />
      <polygon points={area} fill={spec.color} fillOpacity={FILL_OPACITY} />
      <polyline fill="none" stroke={spec.color} strokeWidth="2.5" strokeLinejoin="round" points={points.join(' ')} />
    </ChartFrame>
  )
}

export const areaChart: ChartDefinition = {
  type: '면적 차트',
  en: 'Area chart',
  desc: '시간에 따른 양의 변화',
  icon: ChartArea,
  tint: 'bg-[#E6F3ED]',
  // like a line, the row order is the time order, so sorting is not offered
  supports: { barWidth: false, sliceColors: false, axes: true, sortable: false },
  Component: AreaChart,
}
