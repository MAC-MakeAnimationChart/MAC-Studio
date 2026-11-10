import { ChartColumnDecreasing } from 'lucide-react'
import { DEFAULT_COLOR, PALETTE, inkFor, shade } from '@/lib/chart-palette'
import { Axes, cartesian } from './cartesian'
import type { ChartSpec } from '@/lib/chart-spec'
import { ChartFrame, PLOT_H, SvgText, W, frameLayout, textWidth, type Layout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

const SIDE = 24
const PERCENT_TICKS = [0, 20, 40, 60, 80, 100]
// The "vital few" line of the 80/20 rule
const VITAL = 80
const ORANGE = PALETTE.find((c) => c.name === '주황')!.value

// The cumulative line needs to stand out from the bars whatever color the user picks for them.
const lineColorFor = (barColor: string) => (barColor.toLowerCase() === ORANGE.toLowerCase() ? DEFAULT_COLOR : ORANGE)

export function ParetoChart({ spec, data }: ChartComponentProps) {
  const ink = inkFor(spec.bg)
  const layout = frameLayout(spec, {
    legendRow: spec.legend,
    axisLabels: true,
    labels: data.labels,
  })
  const right = 8 + textWidth('100%', spec.textSize) + 12
  const g = cartesian(spec, data, layout, right)
  const bar = g.step * (spec.barWidth / 100)
  const fill = shade(spec.color, spec.barShade)
  const lineColor = lineColorFor(spec.color)

  // rows already come largest first (definition `sort`); negatives count as 0, like the bars
  const counted = data.values.map((v) => Math.max(v, 0))
  const total = counted.reduce((a, b) => a + b, 0)
  const cumulative = counted.map((_, i) => (total > 0 ? (counted.slice(0, i + 1).reduce((a, b) => a + b, 0) / total) * 100 : 0))
  const py = (pct: number) => layout.plotBottom - (pct / 100) * PLOT_H
  const axisX = W - right + 8

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '파레토 차트'}>
      <ParetoLegend
        spec={spec}
        layout={layout}
        items={[
          { name: data.seriesName, color: fill, line: false },
          { name: '누적 비율(%)', color: lineColor, line: true },
        ]}
      />
      <Axes spec={spec} data={data} layout={layout} g={g} />
      {PERCENT_TICKS.map((t) => (
        <SvgText key={t} x={axisX} y={py(t) + spec.textSize * 0.35} size={spec.textSize} bold={spec.textBold} fill={ink.muted} maxWidth={right}>
          {`${t}%`}
        </SvgText>
      ))}
      <line x1={g.left} x2={W - right} y1={py(VITAL)} y2={py(VITAL)} stroke={ink.muted} strokeDasharray="4 4" strokeOpacity="0.6" />
      {data.values.map((v, i) => (
        <rect key={i} x={g.x(i) - bar / 2} y={g.y(v)} width={bar} height={layout.plotBottom - g.y(v)} rx={Math.min(4, bar / 2)} fill={fill} />
      ))}
      <polyline fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinejoin="round" points={cumulative.map((p, i) => `${g.x(i)},${py(p)}`).join(' ')} />
      {cumulative.map((p, i) => (
        <circle key={i} cx={g.x(i)} cy={py(p)} r="3.5" fill={spec.bg} stroke={lineColor} strokeWidth="2" />
      ))}
    </ChartFrame>
  )
}

type LegendItem = { name: string; color: string; line: boolean }

// Two entries (bars, cumulative line), right-aligned above the plot like the single-series legend.
function ParetoLegend({ spec, layout, items }: { spec: ChartSpec; layout: Layout; items: LegendItem[] }) {
  if (!spec.legend || layout.legendY === null) return null
  const ink = inkFor(spec.bg)
  const size = spec.legendSize
  const box = Math.round(size * 0.85)
  const shown = items.filter((it) => it.name)
  const widths = shown.map((it) => box + 6 + textWidth(it.name, size))
  const gap = 16
  const start = W - SIDE - (widths.reduce((a, b) => a + b, 0) + gap * (shown.length - 1))
  const y = layout.legendY
  return (
    <g>
      {shown.map((it, i) => {
        const left = start + widths.slice(0, i).reduce((a, b) => a + b + gap, 0)
        return (
          <g key={it.name}>
            {it.line ? (
              <line x1={left} x2={left + box} y1={y - box / 2 + 1} y2={y - box / 2 + 1} stroke={it.color} strokeWidth="2.5" />
            ) : (
              <rect x={left} y={y - box + 1} width={box} height={box} rx="2" fill={it.color} />
            )}
            <SvgText x={left + box + 6} y={y} size={size} bold={spec.legendBold} fill={ink.text} maxWidth={widths[i]}>
              {it.name}
            </SvgText>
          </g>
        )
      })}
    </g>
  )
}

export const paretoChart: ChartDefinition = {
  type: '파레토 차트',
  en: 'Pareto chart',
  desc: '큰 순서 막대 + 누적 비율',
  icon: ChartColumnDecreasing,
  tint: 'bg-[#E6EEFF]',
  // always largest first: that order is what the cumulative line means
  supports: { barWidth: true, sliceColors: false, axes: true, sortable: false },
  sort: 'valueDesc',
  Component: ParetoChart,
}
