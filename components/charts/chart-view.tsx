import { prepareData } from '@/lib/chart-data'
import type { ChartSpec } from '@/lib/chart-spec'
import type { Dataset } from '@/lib/csv'
import { getChart } from './registry'

// The one component the app uses to draw a chart: dataset + spec in, SVG out.
export function ChartView({ dataset, spec }: { dataset: Dataset; spec: ChartSpec }) {
  const def = getChart(spec.type)
  const data = prepareData(dataset, spec, def.supports.sortable)
  const { Component } = def
  return <Component spec={spec} data={data} />
}
