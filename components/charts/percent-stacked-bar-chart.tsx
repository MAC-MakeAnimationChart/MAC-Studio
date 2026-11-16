import { ChartColumnStacked } from 'lucide-react'
import { StackedBarChart } from './stacked-bar-chart'
import type { ChartComponentProps, ChartDefinition } from './types'

// Same drawing as the stacked bar chart, with every bar scaled to 100%
export function PercentStackedBarChart(props: ChartComponentProps) {
  return <StackedBarChart {...props} percent />
}

export const percentStackedBarChart: ChartDefinition = {
  type: '100% 누적 막대 차트',
  en: '100% stacked bar chart',
  desc: '항목별 구성 비율 비교',
  icon: ChartColumnStacked,
  tint: 'bg-[#E6EEFF]',
  // sorting by value uses the first series (its raw value, not its share)
  supports: { barWidth: true, sliceColors: false, axes: true, sortable: true, multiSeries: true },
  Component: PercentStackedBarChart,
}
