import type { ChartData } from '@/lib/chart-data'
import { inkFor } from '@/lib/chart-palette'
import type { ChartSpec } from '@/lib/chart-spec'
import { Axes, cartesian } from './cartesian'
import { extent } from './distribution'
import { SvgText, W, axisLabelHeight, frameLayout, textWidth, type Layout } from './frame'

// Shared by the charts that place points on two number axes (scatter, bubble).
const RIGHT = 24
const MAX_POINT_LABELS = 100

// `pad` is the room kept around the outermost points, as a share of the data range.
function padded(values: number[], pad: number): [number, number] {
  const [lo, hi] = extent(values)
  const room = (hi - lo) * pad
  // padding alone should not put a negative tick under data that has no negatives
  return [lo >= 0 ? Math.max(0, lo - room) : lo - room, hi + room]
}

// Layout, both scales and the data the shared Axes component draws from.
// `headroom` is space above the plot for marks that stick out past the top value (bubbles).
export function xyScales(spec: ChartSpec, data: ChartData, pad = 0, headroom = 0) {
  const xRange = data.values.length ? padded(data.x, pad) : [0, 1]
  const yRange = data.values.length ? padded(data.values, pad) : [0, 1]
  const nameRow = spec.textSize + 8
  // the x scale is worked out first, because the height of its labels is part of the layout
  const xScale = cartesian(spec, { ...data, labels: [], values: xRange }, frameLayout(spec, { legendRow: false, axisLabels: false }), RIGHT, false, { zeroBased: false })
  const base = frameLayout(spec, { legendRow: true, axisLabels: true, labels: xScale.tickLabels })
  // one more line under the tick labels for the name of the x axis
  const layout: Layout = {
    ...base,
    H: base.H + headroom + nameRow,
    plotTop: base.plotTop + headroom,
    plotBottom: base.plotBottom + headroom,
    footerY: base.footerY === null ? null : base.footerY + headroom + nameRow,
  }
  // the row above the plot holds the y name, and the legend on charts that have one
  const nameY = base.plotTop - 10
  const xNameY = layout.plotBottom + axisLabelHeight(spec, xScale.tickLabels) + spec.textSize - 4
  const axisData: ChartData = { ...data, labels: xScale.tickLabels, values: yRange }
  const y = cartesian(spec, axisData, layout, RIGHT, false, { zeroBased: false })
  const width = W - y.left - RIGHT
  const px = (v: number) => y.left + ((v - xScale.min) / (xScale.max - xScale.min)) * width
  const step = width / Math.max(1, xScale.ticks.length - 1)
  const widest = Math.max(0, ...xScale.tickLabels.map((l) => textWidth(l, spec.textSize)))
  const room = spec.xLabelDir === 'horizontal' ? widest + 8 : spec.textSize * 1.7
  const g = { ...y, step, x: (i: number) => px(xScale.ticks[i]), labelStep: Math.max(1, Math.ceil(room / step)) }
  return { layout, axisData, g, px, py: y.y, nameY, xNameY }
}

// Grid, tick labels and the two column names, so it is clear which axis is which.
export function XYAxes({ spec, data, scales, nameWidth }: { spec: ChartSpec; data: ChartData; scales: ReturnType<typeof xyScales>; nameWidth?: number }) {
  const ink = inkFor(spec.bg)
  const { layout, axisData, g, nameY, xNameY } = scales
  return (
    <g>
      <Axes spec={spec} data={axisData} layout={layout} g={g} />
      <SvgText x={12} y={nameY} size={spec.textSize} bold={spec.textBold} fill={ink.text} maxWidth={nameWidth}>
        {`↑ ${data.seriesName}`}
      </SvgText>
      <SvgText x={W - RIGHT} y={xNameY} size={spec.textSize} bold={spec.textBold} fill={ink.text} anchor="end">
        {`${data.xName} →`}
      </SvgText>
    </g>
  )
}

// The name of each point beside it; skipped when there are too many to read.
export function PointLabels({ spec, points }: { spec: ChartSpec; points: { x: number; y: number; r: number; label: string }[] }) {
  const ink = inkFor(spec.bg)
  if (!spec.pointLabels || points.length > MAX_POINT_LABELS) return null
  return (
    <g>
      {points.map((p, i) => {
        // flip to the left side near the right edge of the chart
        const flip = p.x + p.r + 4 + textWidth(p.label, spec.textSize) > W
        return (
          <SvgText key={i} x={flip ? p.x - p.r - 4 : p.x + p.r + 4} y={p.y + spec.textSize * 0.35} size={spec.textSize} fill={ink.text} anchor={flip ? 'end' : 'start'} maxWidth={140}>
            {p.label}
          </SvgText>
        )
      })}
    </g>
  )
}
