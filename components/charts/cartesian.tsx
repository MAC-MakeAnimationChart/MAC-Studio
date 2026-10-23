import type { ChartData } from '@/lib/chart-data'
import { inkFor } from '@/lib/chart-palette'
import type { ChartSpec } from '@/lib/chart-spec'
import { MAX_ROTATED_LABEL, PLOT_H, SvgText, W, textWidth, type Layout } from './frame'

// Axes shared by the charts that plot values against categories (bar, line, ...).
// Like d3's scale.nice(): about 4 intervals with a round step (1, 2, 2.5, 5 x 10^n), and the top
// of the axis is the first tick at or above the data. Max 2,900 -> 0..3,000 in steps of 1,000.
const TARGET_INTERVALS = 4

function niceScale(dataMax: number) {
  if (dataMax <= 0) return { step: 1, max: 1 }
  const raw = dataMax / TARGET_INTERVALS
  const pow = 10 ** Math.floor(Math.log10(raw))
  const n = raw / pow
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow
  // round away float noise before ceil so an exact multiple does not gain a tick
  const intervals = Math.ceil(Math.round((dataMax / step) * 1e6) / 1e6)
  return { step, max: step * intervals }
}

export function cartesian(spec: ChartSpec, data: ChartData, layout: Layout) {
  const scale = niceScale(Math.max(...data.values, 0))
  const max = scale.max
  const tickCount = Math.round(max / scale.step)
  const decimals = scale.step >= 1 ? (Number.isInteger(scale.step) ? 0 : 1) : Math.ceil(-Math.log10(scale.step))
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Number((i * scale.step).toFixed(decimals)))
  const tickLabels = ticks.map((t) =>
    t.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  )
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
    // horizontal labels need their width; rotated ones only their line height
    labelStep: Math.max(1, Math.ceil((spec.xLabelDir === 'horizontal' ? widest + 8 : spec.textSize * (spec.xLabelDir === 'vertical' ? 1.3 : 1.7)) / step)),
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
      {data.labels.map((label, i) => {
        if (i % g.labelStep !== 0) return null
        if (spec.xLabelDir === 'horizontal')
          return (
            <SvgText key={i} x={g.x(i)} y={layout.plotBottom + spec.textSize + 6} size={spec.textSize} bold={spec.textBold} fill={ink.muted} anchor="middle" maxWidth={g.step * g.labelStep}>
              {label}
            </SvgText>
          )
        // rotated: the end of the text sits just under its tick and the text runs down-left
        const vertical = spec.xLabelDir === 'vertical'
        return (
          <SvgText
            key={i}
            x={g.x(i) + spec.textSize * (vertical ? 0.35 : 0.3)}
            y={layout.plotBottom + 8}
            size={spec.textSize}
            bold={spec.textBold}
            fill={ink.muted}
            anchor="end"
            maxWidth={MAX_ROTATED_LABEL}
            rotate={vertical ? -90 : -45}
          >
            {label}
          </SvgText>
        )
      })}
    </g>
  )
}
