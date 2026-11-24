import { areaChart } from './area-chart'
import { barChart } from './bar-chart'
import { donutChart } from './donut-chart'
import { errorBarChart } from './error-bar-chart'
import { groupedBarChart } from './grouped-bar-chart'
import { lineChart } from './line-chart'
import { paretoChart } from './pareto-chart'
import { percentStackedBarChart } from './percent-stacked-bar-chart'
import { pieChart } from './pie-chart'
import { stackedAreaChart } from './stacked-area-chart'
import { stackedBarChart } from './stacked-bar-chart'
import { waterfallChart } from './waterfall-chart'
import { sunburstChart } from './sunburst-chart'
import { treemapChart } from './treemap-chart'
import type { ChartDefinition } from './types'

// The charts the studio can build, in the order they are offered.
// Adding a chart = create its file next to these, export a ChartDefinition, add it here.
export const CHARTS: ChartDefinition[] = [
  barChart,
  groupedBarChart,
  stackedBarChart,
  percentStackedBarChart,
  lineChart,
  areaChart,
  stackedAreaChart,
  pieChart,
  donutChart,
  treemapChart,
  sunburstChart,
  paretoChart,
  errorBarChart,
  waterfallChart,
]

export const CHART_TYPES = CHARTS.map((c) => c.type)

export const getChart = (type: string): ChartDefinition => CHARTS.find((c) => c.type === type) ?? CHARTS[0]
