import type { ReactNode } from 'react'
import { inkFor } from '@/lib/chart-palette'
import type { Align, ChartSpec } from '@/lib/chart-spec'

// Shared by every chart: canvas size, the title / subtitle / footer, background and legend swatch.
export const W = 640
export const PLOT_H = 200
const SIDE = 24
// System fonts on purpose: exported PNG/TIFF/SVG can't carry the site's web font, so the preview
// uses the same stack to match what gets downloaded.
const FONT = "system-ui, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif"

// Rough text width: CJK glyphs are about one em wide, Latin about half.
export const textWidth = (text: string, size: number) =>
  [...text].reduce((w, ch) => w + (ch.charCodeAt(0) > 255 ? size : size * 0.55), 0)

export type Layout = {
  H: number
  titleY: number | null
  subtitleY: number | null
  legendY: number | null
  plotTop: number
  plotBottom: number
  footerY: number | null
}

type LayoutOptions = { legendRow: boolean; axisLabels: boolean }

// Heights grow with the text, so the plot area stays the same size whatever the user adds.
export function frameLayout(spec: ChartSpec, { legendRow, axisLabels }: LayoutOptions): Layout {
  let y = 18
  let titleY: number | null = null
  let subtitleY: number | null = null
  let legendY: number | null = null
  if (spec.title) {
    y += spec.titleStyle.size
    titleY = y
    y += 6
  }
  if (spec.subtitle) {
    y += spec.subtitleStyle.size
    subtitleY = y
    y += 6
  }
  y += 10
  if (legendRow) {
    y += spec.legendSize
    legendY = y
    y += 10
  }
  const plotTop = y
  const plotBottom = plotTop + PLOT_H
  y = plotBottom + (axisLabels ? spec.textSize + 14 : 14)
  let footerY: number | null = null
  if (spec.footer) {
    footerY = y + 14
    y += 30
  }
  return { H: Math.round(y + 6), titleY, subtitleY, legendY, plotTop, plotBottom, footerY }
}

const anchorX = (align: Align) => (align === 'left' ? SIDE : align === 'right' ? W - SIDE : W / 2)
const anchor = (align: Align) => (align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle')

type SvgTextProps = {
  x: number
  y: number
  size: number
  bold?: boolean
  fill: string
  anchor?: 'start' | 'middle' | 'end'
  maxWidth?: number
  children: string
}

// Text that squeezes itself to fit instead of running off the chart.
export function SvgText({ x, y, size, bold, fill, anchor: textAnchor = 'start', maxWidth = W - SIDE * 2, children }: SvgTextProps) {
  const tooWide = textWidth(children, size) > maxWidth
  return (
    <text x={x} y={y} fontSize={size} fontWeight={bold ? 700 : 400} fill={fill} textAnchor={textAnchor} textLength={tooWide ? maxWidth : undefined} lengthAdjust={tooWide ? 'spacingAndGlyphs' : undefined}>
      {children}
    </text>
  )
}

type FrameProps = { spec: ChartSpec; layout: Layout; ariaLabel: string; children: ReactNode }

export function ChartFrame({ spec, layout, ariaLabel, children }: FrameProps) {
  const ink = inkFor(spec.bg)
  return (
    <svg viewBox={`0 0 ${W} ${layout.H}`} className="block h-auto w-full" role="img" aria-label={ariaLabel} fontFamily={FONT}>
      <rect width={W} height={layout.H} fill={spec.bg} />
      {spec.title && layout.titleY !== null && (
        <SvgText x={anchorX(spec.titleStyle.align)} y={layout.titleY} size={spec.titleStyle.size} bold={spec.titleStyle.bold} fill={ink.text} anchor={anchor(spec.titleStyle.align)}>
          {spec.title}
        </SvgText>
      )}
      {spec.subtitle && layout.subtitleY !== null && (
        <SvgText x={anchorX(spec.subtitleStyle.align)} y={layout.subtitleY} size={spec.subtitleStyle.size} bold={spec.subtitleStyle.bold} fill={ink.muted} anchor={anchor(spec.subtitleStyle.align)}>
          {spec.subtitle}
        </SvgText>
      )}
      {children}
      {spec.footer && layout.footerY !== null && (
        <SvgText x={SIDE} y={layout.footerY} size={11} fill={ink.muted}>
          {spec.footer}
        </SvgText>
      )}
    </svg>
  )
}

// One swatch + name, right-aligned above the plot (bar and line charts have a single series).
export function SeriesLegend({ spec, layout, name, color }: { spec: ChartSpec; layout: Layout; name: string; color: string }) {
  if (!spec.legend || !name || layout.legendY === null) return null
  const ink = inkFor(spec.bg)
  const size = spec.legendSize
  const box = Math.round(size * 0.85)
  const w = textWidth(name, size) + box + 8
  const left = W - SIDE - w
  return (
    <g>
      <rect x={left} y={layout.legendY - box + 1} width={box} height={box} rx="2" fill={color} />
      <SvgText x={left + box + 8} y={layout.legendY} size={size} bold={spec.legendBold} fill={ink.text} maxWidth={w}>
        {name}
      </SvgText>
    </g>
  )
}
