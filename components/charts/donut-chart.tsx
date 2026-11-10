import { Donut } from 'lucide-react'
import { sliceColors } from '@/lib/chart-colors'
import { inkFor } from '@/lib/chart-palette'
import { ChartFrame, PLOT_H, SvgText, W, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

// Inner radius as a share of the outer one: thick enough to read the colors, wide enough to look like a ring
const HOLE = 0.58

export function DonutChart({ spec, data }: ChartComponentProps) {
  const layout = frameLayout(spec, { legendRow: false, axisLabels: false })
  const ink = inkFor(spec.bg)
  const colors = sliceColors(spec, data.labels)
  const total = data.values.reduce((a, b) => a + Math.max(b, 0), 0) || 1
  const fracs = data.values.map((v) => Math.max(v, 0) / total)
  const starts = fracs.map((_, i) => fracs.slice(0, i).reduce((a, b) => a + b, 0))

  const r = Math.min(PLOT_H / 2, 100)
  const ri = r * HOLE
  const cx = spec.legend ? 200 : W / 2
  const cy = layout.plotTop + PLOT_H / 2

  const slices = fracs.map((frac, i) => {
    const a0 = -Math.PI / 2 + starts[i] * Math.PI * 2
    const a1 = a0 + frac * Math.PI * 2
    const large = a1 - a0 > Math.PI ? 1 : 0
    const p = (rad: number, a: number) => `${cx + rad * Math.cos(a)} ${cy + rad * Math.sin(a)}`
    // a single 100% slice is a full ring: outer circle and inner circle, the hole cut out by evenodd
    const d =
      frac >= 0.9999
        ? `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${cx - ri} ${cy} a ${ri} ${ri} 0 1 0 ${ri * 2} 0 a ${ri} ${ri} 0 1 0 ${-ri * 2} 0`
        : `M ${p(r, a0)} A ${r} ${r} 0 ${large} 1 ${p(r, a1)} L ${p(ri, a1)} A ${ri} ${ri} 0 ${large} 0 ${p(ri, a0)} Z`
    return { d, frac, color: colors[i], label: data.labels[i] }
  })

  const rowH = spec.legendSize + 10
  const rows = Math.min(slices.length, Math.max(1, Math.floor(PLOT_H / rowH)))
  const legendTop = cy - (rows * rowH) / 2
  const box = Math.round(spec.legendSize * 0.85)

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '도넛 차트'}>
      {slices.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} fillRule="evenodd" stroke={spec.bg} strokeWidth="2" />
      ))}
      {spec.legend &&
        slices.slice(0, rows).map((s, i) => (
          <g key={i}>
            <rect x={370} y={legendTop + i * rowH + 1} width={box} height={box} rx="2" fill={s.color} />
            <SvgText x={370 + box + 8} y={legendTop + i * rowH + spec.legendSize} size={spec.legendSize} bold={spec.legendBold} fill={ink.text} maxWidth={W - 370 - box - 32}>
              {`${s.label} ${(s.frac * 100).toFixed(1)}%`}
            </SvgText>
          </g>
        ))}
    </ChartFrame>
  )
}

export const donutChart: ChartDefinition = {
  type: '도넛 차트',
  en: 'Donut chart',
  desc: '가운데가 빈 원형, 비율 비교',
  icon: Donut,
  tint: 'bg-[#FDECF3]',
  supports: { barWidth: false, sliceColors: true, axes: false, sortable: true },
  Component: DonutChart,
}
