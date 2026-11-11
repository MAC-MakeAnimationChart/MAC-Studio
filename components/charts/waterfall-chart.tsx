import { ChartNoAxesColumnIncreasing } from 'lucide-react'
import { PALETTE, accentFor, inkFor, shade } from '@/lib/chart-palette'
import { Axes, cartesian } from './cartesian'
import { ChartFrame, LegendRow, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

const TOTAL_LABEL = '합계'
const TOTAL_COLOR = PALETTE[7].value // gray: the end result, neither an increase nor a decrease

export function WaterfallChart({ spec, data }: ChartComponentProps) {
  const ink = inkFor(spec.bg)
  const labels = [...data.labels, TOTAL_LABEL]
  const layout = frameLayout(spec, { legendRow: spec.legend, axisLabels: true, labels })

  // each row moves the running total; bar i spans from the total before it to the total after it
  const ends = data.values.map((_, i) => data.values.slice(0, i + 1).reduce((a, b) => a + b, 0))
  const starts = [0, ...ends.slice(0, -1)]
  const total = ends[ends.length - 1] ?? 0

  // the axis covers every bar edge (and 0), so it goes below zero when the running total does
  const g = cartesian(spec, { ...data, labels, values: [0, ...ends] }, layout, 24, true)
  const bar = g.step * (spec.barWidth / 100)
  const up = shade(spec.color, spec.barShade)
  const down = shade(accentFor(spec.color), spec.barShade)
  const totalFill = shade(TOTAL_COLOR, spec.barShade)

  const bars = [...data.values.map((v, i) => ({ from: starts[i], to: ends[i], fill: v < 0 ? down : up })), { from: 0, to: total, fill: totalFill }]

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '폭포 차트'}>
      <LegendRow
        spec={spec}
        layout={layout}
        items={[
          { name: '증가', color: up },
          { name: '감소', color: down },
          { name: TOTAL_LABEL, color: totalFill },
        ]}
      />
      <Axes spec={spec} data={{ ...data, labels }} layout={layout} g={g} />
      {bars.map((b, i) => {
        const top = g.y(Math.max(b.from, b.to))
        // a change of 0 still gets a hairline so the step is visible
        const height = Math.max(1, g.y(Math.min(b.from, b.to)) - top)
        return <rect key={i} x={g.x(i) - bar / 2} y={top} width={bar} height={height} rx={Math.min(3, bar / 2, height / 2)} fill={b.fill} />
      })}
      {/* dashed steps joining the end of each bar to the start of the next */}
      {bars.slice(0, -1).map((b, i) => (
        <line key={i} x1={g.x(i) + bar / 2} x2={g.x(i + 1) - bar / 2} y1={g.y(b.to)} y2={g.y(b.to)} stroke={ink.muted} strokeDasharray="3 3" />
      ))}
    </ChartFrame>
  )
}

export const waterfallChart: ChartDefinition = {
  type: '폭포 차트',
  en: 'Waterfall chart',
  desc: '증감이 쌓여 가는 과정',
  icon: ChartNoAxesColumnIncreasing,
  tint: 'bg-[#E6EEFF]',
  // each step builds on the one before it, so the row order is the meaning
  supports: { barWidth: true, sliceColors: false, axes: true, sortable: false },
  Component: WaterfallChart,
}
