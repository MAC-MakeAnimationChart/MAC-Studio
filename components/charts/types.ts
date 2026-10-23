import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ChartData } from '@/lib/chart-data'
import type { ChartSpec } from '@/lib/chart-spec'

export type ChartComponentProps = { spec: ChartSpec; data: ChartData }

// Which options make sense for a chart. The options panel hides the ones a chart doesn't support.
export type ChartSupports = {
  barWidth: boolean // bar thickness slider
  sliceColors: boolean // each category can get its own color (pie)
  axes: boolean // axis label size / bold
  sortable: boolean // ordering rows (by value / name) makes sense (false when row order is the meaning, e.g. time series)
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
  Component: ComponentType<ChartComponentProps>
}
