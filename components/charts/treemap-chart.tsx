import { LayoutGrid } from 'lucide-react'
import { inkFor, paletteFrom, shade } from '@/lib/chart-palette'
import { ChartFrame, LegendRow, PLOT_H, SvgText, W, frameLayout, textWidth } from './frame'
import type { ChartComponentProps, ChartDefinition } from './types'

const SIDE = 24
type Box = { x: number; y: number; w: number; h: number }

// The worst (largest) width/height ratio of a row of areas laid along a side of length `side`.
function worstRatio(areas: number[], side: number) {
  const sum = areas.reduce((a, b) => a + b, 0)
  const max = Math.max(...areas)
  const min = Math.min(...areas)
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min))
}

// Squarified treemap (Bruls et al.): biggest first, each row along the shorter side of what is left,
// adding to a row while that keeps its boxes closer to squares. Boxes come back in the input order;
// values of 0 or less get an empty box.
function squarify(values: number[], box: Box): Box[] {
  const out: Box[] = values.map(() => ({ x: box.x, y: box.y, w: 0, h: 0 }))
  const total = values.reduce((a, v) => a + Math.max(v, 0), 0)
  if (total <= 0 || box.w <= 0 || box.h <= 0) return out
  const scale = (box.w * box.h) / total
  const order = values
    .map((_, i) => i)
    .filter((i) => values[i] > 0)
    .sort((a, b) => values[b] - values[a])
  let { x, y, w, h } = box
  let next = 0
  while (next < order.length) {
    const side = Math.min(w, h)
    const row = [order[next]]
    let areas = [values[order[next]] * scale]
    next++
    while (next < order.length) {
      const grown = [...areas, values[order[next]] * scale]
      if (worstRatio(grown, side) > worstRatio(areas, side)) break
      row.push(order[next])
      areas = grown
      next++
    }
    const thick = areas.reduce((a, b) => a + b, 0) / side
    let along = 0
    row.forEach((idx, k) => {
      const len = areas[k] / thick
      out[idx] = w >= h ? { x, y: y + along, w: thick, h: len } : { x: x + along, y, w: len, h: thick }
      along += len
    })
    if (w >= h) {
      x += thick
      w -= thick
    } else {
      y += thick
      h -= thick
    }
  }
  return out
}

type Tile = Box & { label: string; value: number; fill: string }
type GroupTile = Box & { name: string; fill: string; header: boolean }

// Groups in the order they first appear, each with its items' indexes and its total.
function groupItems(groups: string[], values: number[]) {
  const names = [...new Set(groups)]
  return names.map((name) => {
    const members = groups.map((g, i) => (g === name ? i : -1)).filter((i) => i >= 0)
    return { name, members, total: members.reduce((a, i) => a + Math.max(values[i], 0), 0) }
  })
}

export function TreemapChart({ spec, data }: ChartComponentProps) {
  const grouped = data.groups.some((g) => g !== '')
  const layout = frameLayout(spec, { legendRow: spec.legend && grouped, axisLabels: false })
  const plot: Box = { x: SIDE, y: layout.plotTop, w: W - SIDE * 2, h: PLOT_H }
  const palette = paletteFrom(spec.color)
  const size = spec.textSize
  const header = size + 10

  const tiles: Tile[] = []
  const groupTiles: GroupTile[] = []
  if (grouped) {
    const groups = groupItems(data.groups, data.values)
    const boxes = squarify(
      groups.map((g) => g.total),
      plot,
    )
    groups.forEach((group, gi) => {
      const box = boxes[gi]
      const fill = palette[gi % palette.length]
      // a header strip with the group name, when the group is big enough to spare it
      const hasHeader = box.h > header * 2.5 && box.w > textWidth(group.name, size) + 12
      groupTiles.push({ ...box, name: group.name, fill, header: hasHeader })
      const inner = hasHeader ? { ...box, y: box.y + header, h: box.h - header } : box
      const itemBoxes = squarify(
        group.members.map((i) => data.values[i]),
        inner,
      )
      // items of one group share its hue, a little lighter one after another so neighbors stay apart
      group.members.forEach((i, k) => tiles.push({ ...itemBoxes[k], label: data.labels[i], value: data.values[i], fill: shade(fill, Math.min(k * 12, 48)) }))
    })
  } else {
    const boxes = squarify(data.values, plot)
    data.values.forEach((v, i) => tiles.push({ ...boxes[i], label: data.labels[i], value: v, fill: palette[i % palette.length] }))
  }

  return (
    <ChartFrame spec={spec} layout={layout} ariaLabel={spec.title || '트리맵'}>
      {grouped && <LegendRow spec={spec} layout={layout} items={groupTiles.map((g) => ({ name: g.name, color: g.fill }))} />}
      {groupTiles.map((g, i) => (
        <g key={`g${i}`}>
          <rect x={g.x} y={g.y} width={g.w} height={g.h} fill={shade(g.fill, -15)} stroke={spec.bg} strokeWidth="2" />
          {g.header && (
            <SvgText x={g.x + 6} y={g.y + size + 4} size={size} bold fill={inkFor(shade(g.fill, -15)).text} maxWidth={g.w - 12}>
              {g.name}
            </SvgText>
          )}
        </g>
      ))}
      {tiles.map((t, i) => {
        if (t.w <= 0 || t.h <= 0) return null
        const ink = inkFor(t.fill).text
        const value = t.value.toLocaleString()
        // write only what fits: the name, then the value under it
        const showLabel = t.w > Math.min(textWidth(t.label, size), 40) + 10 && t.h > size + 8
        const showValue = showLabel && t.h > size * 2 + 14 && t.w > textWidth(value, size) + 12
        return (
          <g key={i}>
            <rect x={t.x} y={t.y} width={t.w} height={t.h} fill={t.fill} stroke={spec.bg} strokeWidth="1" />
            {showLabel && (
              <SvgText x={t.x + 6} y={t.y + size + 4} size={size} bold={spec.textBold} fill={ink} maxWidth={t.w - 12}>
                {t.label}
              </SvgText>
            )}
            {showValue && (
              <SvgText x={t.x + 6} y={t.y + size * 2 + 8} size={size} fill={ink} maxWidth={t.w - 12}>
                {value}
              </SvgText>
            )}
          </g>
        )
      })}
    </ChartFrame>
  )
}

export const treemapChart: ChartDefinition = {
  type: '트리맵',
  en: 'Treemap',
  desc: '크기를 면적으로, 묶음별 구성',
  icon: LayoutGrid,
  tint: 'bg-[#FFF0E5]',
  // sorting decides which items "show N" keeps; the boxes are always laid out biggest first
  supports: { barWidth: false, sliceColors: false, axes: false, sortable: true, hierarchy: true },
  Component: TreemapChart,
}
