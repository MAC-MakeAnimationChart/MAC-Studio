import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ChartData } from '@/lib/chart-data'
import type { ChartSpec, RowSort } from '@/lib/chart-spec'

export type ChartComponentProps = { spec: ChartSpec; data: ChartData }

// Which options make sense for a chart. The options panel hides the ones a chart doesn't support.
export type ChartSupports = {
  barWidth: boolean // bar thickness slider
  sliceColors: boolean // each category can get its own color (pie)
  axes: boolean // axis label size / bold
  sortable: boolean // ordering rows (by value / name) makes sense (false when row order is the meaning, e.g. time series)
  errorBars?: boolean // a ± column can be picked (error bar chart)
  multiSeries?: boolean // several value columns can be picked, one series each (grouped / stacked bars, ...)
  hierarchy?: boolean // an upper-level column can be picked to group the items (treemap, sunburst)
  // each row is one observation of the value column (distribution charts): no sort or "show N", blank cells are left out.
  // 'grouped' charts draw one shape per distinct label, 'pooled' charts ignore the label column.
  observations?: 'grouped' | 'pooled'
  binWidth?: boolean // the width of the value bins can be set (histogram)
  smoothing?: boolean // how smooth the density curve is can be set (density, violin)
  shapeName?: string // what the barWidth / barShade section calls the shape when it is not a bar
}

// One entry per chart type. To add a chart: write <name>-chart.tsx exporting a definition,
// then add it to registry.ts. Nothing else needs to change.
export type ChartDefinition = {
  type: string // the name stored in saved charts (Korean label)
  en: string
  desc: string
  icon: LucideIcon
  tint: string // tailwind background class for its icon tile
  supports: ChartSupports
  // Rows are always drawn in this order (e.g. pareto: largest first), so "show N" keeps the right ones.
  // Set `supports.sortable` to false with it, since the user's sort would be ignored.
  sort?: Exclude<RowSort, 'none'>
  Component: ComponentType<ChartComponentProps>
}
