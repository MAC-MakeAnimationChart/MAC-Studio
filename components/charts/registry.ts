import { barChart } from './bar-chart'
import { donutChart } from './donut-chart'
import { errorBarChart } from './error-bar-chart'
import { lineChart } from './line-chart'
import { paretoChart } from './pareto-chart'
import { pieChart } from './pie-chart'
import type { ChartDefinition } from './types'

// The charts the studio can build, in the order they are offered.
// Adding a chart = create its file next to these, export a ChartDefinition, add it here.
export const CHARTS: ChartDefinition[] = [barChart, lineChart, pieChart, donutChart, paretoChart, errorBarChart]

export const CHART_TYPES = CHARTS.map((c) => c.type)

export const getChart = (type: string): ChartDefinition => CHARTS.find((c) => c.type === type) ?? CHARTS[0]
