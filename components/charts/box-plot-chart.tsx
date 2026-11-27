import { RectangleVertical } from 'lucide-react'
import { inkFor, shade } from '@/lib/chart-palette'
import { Axes, cartesian } from './cartesian'
import { extent, groupValues, quantile, uniqueDots } from './distribution'
import { ChartFrame, SeriesLegend, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

const MAX_BOX = 80

// Quartiles, and whiskers that reach the farthest value within 1.5 box heights (Tukey);
// anything beyond is drawn as a separate dot.
function boxStats(sorted: number[]) {
  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const reach = (q3 - q1) * 1.5
  const inside = sorted.filter((v) => v >= q1 - reach && v <= q3 + reach)
  // with interpolated quartiles the nearest inside value can fall within the box; a whisker never does
  const low = Math.min(q1, inside[0] ?? q1)
  const high = Math.max(q3, inside[inside.length - 1] ?? q3)
  return { q1, median, q3, low, high, outliers: sorted.filter((v) => v < low || v > high) }
}

export function BoxPlotChart({ spec, data }: ChartComponentProps) {
  const ink = inkFor(spec.bg)
  const groups = groupValues(data)
  const layout = frameLayout(spec, {
    legendRow: spec.legend && !!data.seriesName,
    axisLabels: true,
    labels: groups.names,
  })
  const axisData = { ...data, labels: groups.names, values: extent(data.values) }
  const g = cartesian(spec, axisData, layout, 24, false, { zeroBased: false })
  const box = Math.min(g.step * (spec.barWidth / 100), MAX_BOX)
  const fill = shade(spec.color, spec.barShade)

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '박스 플롯'}>
      <SeriesLegend spec={spec} layout={layout} name={data.seriesName} color={fill} />
      <Axes spec={spec} data={axisData} layout={layout} g={g} />
      {groups.values.map((values, i) => {
        const s = boxStats(values)
        const x = g.x(i)
        return (
          <g key={i}>
            <g stroke={fill} strokeWidth="1.5">
              <line x1={x} x2={x} y1={g.y(s.high)} y2={g.y(s.q3)} />
              <line x1={x} x2={x} y1={g.y(s.q1)} y2={g.y(s.low)} />
              <line x1={x - box / 4} x2={x + box / 4} y1={g.y(s.high)} y2={g.y(s.high)} />
              <line x1={x - box / 4} x2={x + box / 4} y1={g.y(s.low)} y2={g.y(s.low)} />
              <rect x={x - box / 2} y={g.y(s.q3)} width={box} height={Math.max(1, g.y(s.q1) - g.y(s.q3))} fill={fill} fillOpacity="0.3" />
            </g>
            <line x1={x - box / 2} x2={x + box / 2} y1={g.y(s.median)} y2={g.y(s.median)} stroke={ink.text} strokeWidth="2" />
            {uniqueDots(s.outliers.map((v) => ({ x, y: g.y(v) }))).map((d, k) => (
              <circle key={k} cx={d.x} cy={d.y} r="2.5" fill="none" stroke={fill} strokeWidth="1.5" />
            ))}
          </g>
        )
      })}
    </ChartFrame>
  )
}

export const boxPlotChart: ChartDefinition = {
  type: '박스 플롯',
  en: 'Box plot',
  desc: '그룹별 중앙값과 퍼진 정도',
  icon: RectangleVertical,
  tint: 'bg-[#F0EBFD]',
  supports: { barWidth: true, sliceColors: false, axes: true, sortable: false, observations: 'grouped' },
  Component: BoxPlotChart,
}
