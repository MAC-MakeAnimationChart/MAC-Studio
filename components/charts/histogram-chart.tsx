import { ChartColumnBig } from 'lucide-react'
import type { ChartData } from '@/lib/chart-data'
import { shade } from '@/lib/chart-palette'
import { Axes, cartesian, niceStep } from './cartesian'
import { extent } from './distribution'
import { ChartFrame, SeriesLegend, W, frameLayout } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

const MAX_BINS = 100

// Bins of one width, starting on a multiple of it, so the edges are round numbers (40, 50, 60, ...).
// Without a width from the user, it is picked to give about log2(n) + 1 bins (Sturges).
function bins(values: number[], binWidth: number | null) {
  const [lo, hi] = extent(values)
  const span = hi - lo || 1
  let width = binWidth && binWidth > 0 ? binWidth : niceStep(span / (Math.ceil(Math.log2(Math.max(values.length, 2))) + 1))
  // a width far too small for the data would make thousands of bars
  if (span / width > MAX_BINS - 1) width = niceStep(span / (MAX_BINS - 1))
  // round away float noise (0.1 + 0.2) before flooring and in the edge labels
  const clean = (v: number) => Number(v.toPrecision(12))
  const start = clean(Math.floor(clean(lo / width)) * width)
  const count = Math.max(1, Math.ceil(clean((hi - start) / width)))
  const counts = Array.from({ length: count }, () => 0)
  // the last bin includes its upper edge, so the largest value is not left out
  for (const v of values) counts[Math.min(count - 1, Math.max(0, Math.floor(clean((v - start) / width))))] += 1
  const edges = Array.from({ length: count + 1 }, (_, i) => clean(start + i * width).toLocaleString(undefined, { maximumFractionDigits: 6 }))
  return { counts, edges }
}

export function HistogramChart({ spec, data }: ChartComponentProps) {
  const { counts, edges } = bins(data.values, spec.binWidth)
  const layout = frameLayout(spec, {
    legendRow: spec.legend && !!data.seriesName,
    axisLabels: true,
    labels: edges,
  })
  const countData: ChartData = { ...data, labels: edges, values: data.values.length ? counts : [] }
  const base = cartesian(spec, countData, layout, 24, false, { integer: true })
  // labels sit on the bin edges, not in the middle of a category
  const step = (W - base.left - base.right) / counts.length
  const widthOfLabel = base.labelStep * base.step
  const g = { ...base, step, x: (i: number) => base.left + step * i, labelStep: Math.max(1, Math.ceil(widthOfLabel / step)) }
  const fill = shade(spec.color, spec.barShade)

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '히스토그램'}>
      <SeriesLegend spec={spec} layout={layout} name={data.seriesName} color={fill} />
      <Axes spec={spec} data={countData} layout={layout} g={g} />
      {data.values.length > 0 && counts.map((c, i) => <rect key={i} x={g.x(i)} y={g.y(c)} width={step} height={layout.plotBottom - g.y(c)} fill={fill} stroke={spec.bg} strokeWidth={Math.min(1, step / 4)} />)}
    </ChartFrame>
  )
}

export const histogramChart: ChartDefinition = {
  type: '히스토그램',
  en: 'Histogram',
  desc: '값이 어느 구간에 몰려 있는지',
  icon: ChartColumnBig,
  tint: 'bg-[#F0EBFD]',
  supports: { barWidth: false, sliceColors: false, axes: true, sortable: false, observations: 'pooled', binWidth: true },
  Component: HistogramChart,
}
