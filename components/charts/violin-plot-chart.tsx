import { Hourglass } from 'lucide-react'
import { inkFor, shade } from '@/lib/chart-palette'
import { Axes, cartesian } from './cartesian'
import { density, extent, groupValues, quantile } from './distribution'
import { ChartFrame, SeriesLegend, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

const MAX_VIOLIN = 100

export function ViolinPlotChart({ spec, data }: ChartComponentProps) {
  const ink = inkFor(spec.bg)
  const groups = groupValues(data)
  const layout = frameLayout(spec, {
    legendRow: spec.legend && !!data.seriesName,
    axisLabels: true,
    labels: groups.names,
  })
  const axisData = { ...data, labels: groups.names, values: extent(data.values) }
  const g = cartesian(spec, axisData, layout, 24, false, { zeroBased: false })
  // every violin gets the same widest point, so a small group is as readable as a large one
  const half = Math.min(g.step * (spec.barWidth / 100), MAX_VIOLIN) / 2
  const inner = Math.max(2, Math.min(8, half * 0.25))
  const fill = shade(spec.color, spec.barShade)

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '바이올린 플롯'}>
      <SeriesLegend spec={spec} layout={layout} name={data.seriesName} color={fill} />
      <Axes spec={spec} data={axisData} layout={layout} g={g} />
      {groups.values.map((values, i) => {
        const x = g.x(i)
        // no tail: the shape ends at the smallest and largest value, never at one that cannot happen
        const curve = density(values, spec.smoothing, 0)
        const peak = curve.reduce((max, p) => Math.max(max, p.density), 0) || 1
        const side = (sign: 1 | -1) => curve.map((p) => `${x + sign * (p.density / peak) * half},${g.y(p.value)}`)
        const q1 = quantile(values, 0.25)
        const median = quantile(values, 0.5)
        const q3 = quantile(values, 0.75)
        return (
          <g key={i}>
            {curve.length > 1 && <polygon points={[...side(1), ...side(-1).reverse()].join(' ')} fill={fill} fillOpacity="0.3" stroke={fill} strokeWidth="1.5" strokeLinejoin="round" />}
            {/* quartile box and median, as in a box plot */}
            <rect x={x - inner / 2} y={g.y(q3)} width={inner} height={Math.max(1, g.y(q1) - g.y(q3))} fill={fill} />
            <line x1={x - inner} x2={x + inner} y1={g.y(median)} y2={g.y(median)} stroke={ink.text} strokeWidth="2" />
          </g>
        )
      })}
    </ChartFrame>
  )
}

export const violinPlotChart: ChartDefinition = {
  type: '바이올린 플롯',
  en: 'Violin plot',
  desc: '그룹별 분포의 모양 비교',
  icon: Hourglass,
  tint: 'bg-[#F0EBFD]',
  supports: { barWidth: true, sliceColors: false, axes: true, sortable: false, observations: 'grouped', smoothing: true, shapeName: '바이올린' },
  Component: ViolinPlotChart,
}
