import { Sun } from 'lucide-react'
import { inkFor, paletteFrom, shade } from '@/lib/chart-palette'
import { ChartFrame, LegendRow, PLOT_H, SvgText, W, frameLayout, textWidth } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

// Ring radii as shares of the outer radius: a small hole, the upper level, then the items
const HOLE = 0.26
const SPLIT = 0.58

type Arc = { a0: number; a1: number; r0: number; r1: number; fill: string; label: string }

// One ring segment from angle a0 to a1 (radians, 0 = up, clockwise) between radii r0 and r1.
function arcPath(cx: number, cy: number, { a0, a1, r0, r1 }: Arc) {
  const p = (r: number, a: number) => `${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`
  // a whole circle can't be one arc command, so draw it as two rings cut out by evenodd
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    const circle = (r: number) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`
    return `${circle(r1)} ${circle(r0)}`
  }
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`
}

// Groups (biggest first) with their items (biggest first). Without a group column every item is its own group.
function arrange(groups: string[], labels: string[], values: number[]) {
  const names = [...new Set(groups)]
  return names
    .map((name) => {
      const members = groups
        .map((g, i) => (g === name ? i : -1))
        .filter((i) => i >= 0 && values[i] > 0)
        .sort((a, b) => values[b] - values[a])
      return { name, members, total: members.reduce((a, i) => a + values[i], 0) }
    })
    .filter((g) => g.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((g) => ({ ...g, items: g.members.map((i) => ({ label: labels[i], value: values[i] })) }))
}

export function SunburstChart({ spec, data }: ChartComponentProps) {
  const grouped = data.groups.some((g) => g !== '')
  const layout = frameLayout(spec, { legendRow: spec.legend && grouped, axisLabels: false })
  const palette = paletteFrom(spec.color)
  const size = spec.textSize
  const R = PLOT_H / 2 - 2
  const cx = W / 2
  const cy = layout.plotTop + PLOT_H / 2
  const groups = arrange(data.groups, data.labels, data.values)
  const total = groups.reduce((a, g) => a + g.total, 0)
  const turn = (v: number) => (total > 0 ? (v / total) * Math.PI * 2 : 0)

  const inner: Arc[] = []
  const outer: Arc[] = []
  groups.forEach((g, gi) => {
    const a0 = turn(groups.slice(0, gi).reduce((a, x) => a + x.total, 0))
    const fill = palette[gi % palette.length]
    if (grouped) inner.push({ a0, a1: a0 + turn(g.total), r0: R * HOLE, r1: R * SPLIT, fill, label: g.name })
    g.items.forEach((item, k) => {
      const b0 = a0 + turn(g.items.slice(0, k).reduce((a, x) => a + x.value, 0))
      // with groups the items share their group's hue, lighter one after another; without (one group
      // holding every item), each item gets its own palette color like a donut slice
      const itemFill = grouped ? shade(fill, Math.min(18 + k * 12, 60)) : palette[k % palette.length]
      outer.push({ a0: b0, a1: b0 + turn(item.value), r0: grouped ? R * SPLIT : R * HOLE, r1: R, fill: itemFill, label: item.label })
    })
  })

  // a name goes in the middle of its segment, only when the segment is wide and thick enough for it
  const label = (arc: Arc, i: number) => {
    const mid = (arc.a0 + arc.a1) / 2
    const r = (arc.r0 + arc.r1) / 2
    const room = Math.min((arc.a1 - arc.a0) * r, (arc.r1 - arc.r0) * 1.6)
    if (textWidth(arc.label, size) + 6 > room || arc.r1 - arc.r0 < size + 4) return null
    return (
      <SvgText key={`t${i}`} x={cx + r * Math.sin(mid)} y={cy - r * Math.cos(mid) + size * 0.35} size={size} bold={spec.textBold} fill={inkFor(arc.fill).text} anchor="middle" maxWidth={room}>
        {arc.label}
      </SvgText>
    )
  }

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '선버스트 차트'}>
      {grouped && <LegendRow spec={spec} layout={layout} items={inner.map((a) => ({ name: a.label, color: a.fill }))} />}
      {[...inner, ...outer].map((arc, i) => (
        <path key={i} d={arcPath(cx, cy, arc)} fill={arc.fill} fillRule="evenodd" stroke={spec.bg} strokeWidth="1.5" />
      ))}
      {[...inner, ...outer].map(label)}
    </ChartFrame>
  )
}

export const sunburstChart: ChartDefinition = {
  type: '선버스트 차트',
  en: 'Sunburst chart',
  desc: '묶음과 항목의 비율을 고리로',
  icon: Sun,
  tint: 'bg-[#FFF0E5]',
  // sorting decides which items "show N" keeps; the rings are always drawn biggest first
  supports: { barWidth: false, sliceColors: false, axes: false, sortable: true, hierarchy: true },
  Component: SunburstChart,
}
