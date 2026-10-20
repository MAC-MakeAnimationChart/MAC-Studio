import { PieChart as PieIcon } from 'lucide-react'
import { inkFor, paletteFrom } from '@/lib/chart-palette'
import { ChartFrame, PLOT_H, SvgText, W, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

export function PieChart({ spec, data }: ChartComponentProps) {
  const layout = frameLayout(spec, { legendRow: false, axisLabels: false })
  const ink = inkFor(spec.bg)
  const colors = paletteFrom(spec.color)
  const total = data.values.reduce((a, b) => a + Math.max(b, 0), 0) || 1
  const fracs = data.values.map((v) => Math.max(v, 0) / total)
  const starts = fracs.map((_, i) => fracs.slice(0, i).reduce((a, b) => a + b, 0))

  const r = Math.min(PLOT_H / 2, 100)
  const cx = spec.legend ? 200 : W / 2
  const cy = layout.plotTop + PLOT_H / 2

  const slices = fracs.map((frac, i) => {
    const a0 = -Math.PI / 2 + starts[i] * Math.PI * 2
    const a1 = a0 + frac * Math.PI * 2
    const large = a1 - a0 > Math.PI ? 1 : 0
    const p = (a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`
    const d =
      frac >= 0.9999
        ? `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`
        : `M ${cx} ${cy} L ${p(a0)} A ${r} ${r} 0 ${large} 1 ${p(a1)} Z`
    return { d, frac, color: colors[i % colors.length], label: data.labels[i] }
  })

  const rowH = spec.legendSize + 10
  const rows = Math.min(slices.length, Math.max(1, Math.floor(PLOT_H / rowH)))
  const legendTop = cy - (rows * rowH) / 2
  const box = Math.round(spec.legendSize * 0.85)

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '원형 차트'}>
      {slices.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} stroke={spec.bg} strokeWidth="2" />
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

export const pieChart: ChartDefinition = {
  type: '원형 차트',
  en: 'Pie chart',
  desc: '전체에서 차지하는 비율',
  icon: PieIcon,
  tint: 'bg-[#FFF0E5]',
  supports: { barWidth: false, axes: false, topByValue: true },
  Component: PieChart,
}
