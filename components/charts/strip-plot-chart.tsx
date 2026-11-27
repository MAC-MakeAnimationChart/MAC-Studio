import { Grip } from 'lucide-react'
import { shade } from '@/lib/chart-palette'
import { Axes, cartesian } from './cartesian'
import { extent, groupValues, uniqueDots } from './distribution'
import { ChartFrame, SeriesLegend, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

const MAX_JITTER = 28

export function StripPlotChart({ spec, data }: ChartComponentProps) {
  const groups = groupValues(data)
  const layout = frameLayout(spec, {
    legendRow: spec.legend && !!data.seriesName,
    axisLabels: true,
    labels: groups.names,
  })
  const axisData = { ...data, labels: groups.names, values: extent(data.values) }
  const g = cartesian(spec, axisData, layout, 24, false, { zeroBased: false })
  const jitter = Math.min(g.step * 0.3, MAX_JITTER)
  // spread sideways by the golden ratio: looks scattered but is the same on every render
  const dots = uniqueDots(groups.values.flatMap((values, i) => values.map((v, k) => ({ x: g.x(i) + (((k * 0.618034) % 1) * 2 - 1) * jitter, y: g.y(v) }))))
  const fill = shade(spec.color, spec.barShade)

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '스트립 플롯'}>
      <SeriesLegend spec={spec} layout={layout} name={data.seriesName} color={fill} />
      <Axes spec={spec} data={axisData} layout={layout} g={g} />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="3" fill={fill} fillOpacity="0.7" />
      ))}
    </ChartFrame>
  )
}

export const stripPlotChart: ChartDefinition = {
  type: '스트립 플롯',
  en: 'Strip plot',
  desc: '그룹별 값 하나하나의 위치',
  icon: Grip,
  tint: 'bg-[#F0EBFD]',
  supports: { barWidth: false, sliceColors: false, axes: true, sortable: false, observations: 'grouped' },
  Component: StripPlotChart,
}
