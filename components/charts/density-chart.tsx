import { ChartSpline } from 'lucide-react'
import type { ChartData } from '@/lib/chart-data'
import { shade } from '@/lib/chart-palette'
import { Axes, cartesian, niceStep } from './cartesian'
import { density } from './distribution'
import { ChartFrame, SeriesLegend, W, frameLayout, textWidth } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

const FILL_OPACITY = 0.22
const X_INTERVALS = 6
const RIGHT = 24

// Round numbers inside [lo, hi] for the value axis.
function valueTicks(lo: number, hi: number) {
  const step = niceStep((hi - lo) / X_INTERVALS)
  const first = Math.ceil(lo / step)
  const count = Math.max(0, Math.floor(hi / step) - first + 1)
  // toPrecision rounds away float noise (3 * 0.1)
  return Array.from({ length: count }, (_, i) => Number(((first + i) * step).toPrecision(12)))
}

export function DensityChart({ spec, data }: ChartComponentProps) {
  const curve = density(
    [...data.values].sort((a, b) => a - b),
    spec.smoothing,
    3,
  )
  const lo = curve[0]?.value ?? 0
  const hi = Math.max(curve[curve.length - 1]?.value ?? 1, lo + 1e-9)
  const ticks = valueTicks(lo, hi)
  const tickLabels = ticks.map((t) => t.toLocaleString(undefined, { maximumFractionDigits: 6 }))
  const layout = frameLayout(spec, {
    legendRow: spec.legend && !!data.seriesName,
    axisLabels: true,
    labels: tickLabels,
  })
  const axisData: ChartData = { ...data, labels: tickLabels, values: [curve.reduce((max, p) => Math.max(max, p.density), 0)] }
  const base = cartesian(spec, axisData, layout, RIGHT)
  // the x axis is a number line here, not a row of categories
  const px = (v: number) => base.left + ((v - lo) / (hi - lo)) * (W - base.left - RIGHT)
  const step = ticks.length > 1 ? px(ticks[1]) - px(ticks[0]) : W - base.left - RIGHT
  const widest = Math.max(0, ...tickLabels.map((l) => textWidth(l, spec.textSize)))
  const room = spec.xLabelDir === 'horizontal' ? widest + 8 : spec.textSize * 1.7
  const g = { ...base, step, x: (i: number) => px(ticks[i]), labelStep: Math.max(1, Math.ceil(room / step)) }
  const fill = shade(spec.color, spec.barShade)
  const line = curve.map((p) => `${px(p.value)},${g.y(p.density)}`).join(' ')

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '밀도 그래프'}>
      <SeriesLegend spec={spec} layout={layout} name={data.seriesName} color={fill} />
      <Axes spec={spec} data={axisData} layout={layout} g={g} />
      {curve.length > 1 && (
        <>
          <polygon points={`${px(lo)},${layout.plotBottom} ${line} ${px(hi)},${layout.plotBottom}`} fill={fill} fillOpacity={FILL_OPACITY} />
          <polyline points={line} fill="none" stroke={fill} strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}
    </ChartFrame>
  )
}

export const densityChart: ChartDefinition = {
  type: '밀도 그래프',
  en: 'Density plot',
  desc: '분포를 부드러운 곡선으로',
  icon: ChartSpline,
  tint: 'bg-[#F0EBFD]',
  supports: { barWidth: false, sliceColors: false, axes: true, sortable: false, observations: 'pooled', smoothing: true },
  Component: DensityChart,
}
