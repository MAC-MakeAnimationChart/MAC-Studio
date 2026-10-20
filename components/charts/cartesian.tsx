import type { ChartData } from '@/lib/chart-data'
import { inkFor } from '@/lib/chart-palette'
import type { ChartSpec } from '@/lib/chart-spec'
import { PLOT_H, SvgText, W, textWidth, type Layout } from './frame'

// Axes shared by the charts that plot values against categories (bar, line, ...).
function niceMax(max: number) {
  if (max <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(max))
  const n = max / pow
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
}

export function cartesian(spec: ChartSpec, data: ChartData, layout: Layout) {
  const max = niceMax(Math.max(...data.values, 0))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
  const tickLabels = ticks.map((t) => (max < 10 ? String(Math.round(t * 10) / 10) : Math.round(t).toLocaleString()))
  const left = 12 + Math.max(...tickLabels.map((l) => textWidth(l, spec.textSize))) + 8
  const right = 24
  const count = Math.max(data.labels.length, 1)
  const step = (W - left - right) / count
  const widest = Math.max(0, ...data.labels.map((l) => textWidth(l, spec.textSize)))
  return {
    max,
    ticks,
    tickLabels,
    left,
    right,
    step,
    labelStep: Math.max(1, Math.ceil((widest + 8) / step)),
    x: (i: number) => left + step * i + step / 2,
    y: (v: number) => layout.plotBottom - (Math.max(v, 0) / max) * PLOT_H,
  }
}

export type Cartesian = ReturnType<typeof cartesian>

export function Axes({ spec, data, layout, g }: { spec: ChartSpec; data: ChartData; layout: Layout; g: Cartesian }) {
  const ink = inkFor(spec.bg)
  return (
    <g>
      {g.ticks.map((t, i) => (
        <g key={t}>
          <line x1={g.left} x2={W - g.right} y1={g.y(t)} y2={g.y(t)} stroke={ink.grid} />
          <SvgText x={g.left - 8} y={g.y(t) + spec.textSize * 0.35} size={spec.textSize} bold={spec.textBold} fill={ink.muted} anchor="end" maxWidth={g.left}>
            {g.tickLabels[i]}
          </SvgText>
        </g>
      ))}
      {data.labels.map((label, i) =>
        i % g.labelStep === 0 ? (
          <SvgText key={i} x={g.x(i)} y={layout.plotBottom + spec.textSize + 6} size={spec.textSize} bold={spec.textBold} fill={ink.muted} anchor="middle" maxWidth={g.step * g.labelStep}>
            {label}
          </SvgText>
        ) : null,
      )}
    </g>
  )
}
