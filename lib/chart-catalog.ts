import { CHART_TYPES } from '@/components/charts/registry'

// Studio chart list, in the order of MAC_그래프_목록.pdf (Studio: 28 charts).
// `available` is derived from the chart registry (components/charts/registry.ts), so a new chart
// shows up as "이용 가능" as soon as it is registered.
//
// `family` is how charts are grouped for people choosing one (home page, chart picker). It follows
// the usual way of sorting chart types by what they look like.
export const CHART_FAMILIES = ['막대형', '선·면적형', '원형·구성형', '분포형', '관계형', '기타'] as const
export type ChartFamily = (typeof CHART_FAMILIES)[number]

export type CatalogItem = { no: number; ko: string; en: string; family: ChartFamily; available: boolean }

const items: [string, string, ChartFamily][] = [
  ['막대 차트', 'Bar chart', '막대형'],
  ['그룹 막대 차트', 'Grouped bar chart', '막대형'],
  ['누적 막대 차트', 'Stacked bar chart', '막대형'],
  ['100% 누적 막대 차트', '100% stacked bar chart', '막대형'],
  ['선 차트', 'Line chart', '선·면적형'],
  ['면적 차트', 'Area chart', '선·면적형'],
  ['누적 면적 차트', 'Stacked area chart', '선·면적형'],
  ['원형 차트', 'Pie chart', '원형·구성형'],
  ['도넛 차트', 'Donut chart', '원형·구성형'],
  ['산점도', 'Scatter plot', '관계형'],
  ['버블 차트', 'Bubble chart', '관계형'],
  ['히스토그램', 'Histogram', '분포형'],
  ['밀도 그래프', 'Density plot', '분포형'],
  ['박스 플롯', 'Box plot', '분포형'],
  ['바이올린 플롯', 'Violin plot', '분포형'],
  ['스트립 플롯', 'Strip plot', '분포형'],
  ['오차 막대 차트', 'Bar chart with error bars', '막대형'],
  ['히트맵', 'Heatmap', '관계형'],
  ['상관 행렬 그래프', 'Correlation matrix plot', '관계형'],
  ['트리맵', 'Treemap', '원형·구성형'],
  ['선버스트 차트', 'Sunburst chart', '원형·구성형'],
  ['생키 다이어그램', 'Sankey diagram', '기타'],
  ['폭포 차트', 'Waterfall chart', '막대형'],
  ['레이더 차트', 'Radar chart', '기타'],
  ['세계 지도 단계구분도', 'World choropleth map', '기타'],
  ['파레토 차트', 'Pareto chart', '막대형'],
  ['간트 차트', 'Gantt chart', '기타'],
  ['바 차트 레이스', 'Bar chart race', '기타'],
]

export const STUDIO_CATALOG: CatalogItem[] = items.map(([ko, en, family], i) => ({
  no: i + 1,
  ko,
  en,
  family,
  available: CHART_TYPES.includes(ko),
}))

// The catalog split by family, in family order, leaving out families with no chart.
export const catalogByFamily = (): { family: ChartFamily; items: CatalogItem[] }[] =>
  CHART_FAMILIES.map((family) => ({ family, items: STUDIO_CATALOG.filter((c) => c.family === family) })).filter((g) => g.items.length > 0)

export const EXPERT_CHART_COUNT = 100
