import { CHART_TYPES } from '@/components/charts/registry'

// Studio chart list, in the order of MAC_그래프_목록.pdf (Studio: 28 charts).
// `available` is derived from the chart registry (components/charts/registry.ts), so a new chart
// shows up as "이용 가능" as soon as it is registered.
export type CatalogItem = { no: number; ko: string; en: string; group: string; available: boolean }

const items: [string, string, string][] = [
  ['막대 차트', 'Bar chart', '비교'],
  ['그룹 막대 차트', 'Grouped bar chart', '비교'],
  ['누적 막대 차트', 'Stacked bar chart', '비교'],
  ['100% 누적 막대 차트', '100% stacked bar chart', '비교'],
  ['선 차트', 'Line chart', '추세'],
  ['면적 차트', 'Area chart', '추세'],
  ['누적 면적 차트', 'Stacked area chart', '추세'],
  ['원형 차트', 'Pie chart', '구성'],
  ['도넛 차트', 'Donut chart', '구성'],
  ['산점도', 'Scatter plot', '관계'],
  ['버블 차트', 'Bubble chart', '관계'],
  ['히스토그램', 'Histogram', '분포'],
  ['밀도 그래프', 'Density plot', '분포'],
  ['박스 플롯', 'Box plot', '분포'],
  ['바이올린 플롯', 'Violin plot', '분포'],
  ['스트립 플롯', 'Strip plot', '분포'],
  ['오차 막대 차트', 'Bar chart with error bars', '비교'],
  ['히트맵', 'Heatmap', '관계'],
  ['상관 행렬 그래프', 'Correlation matrix plot', '관계'],
  ['트리맵', 'Treemap', '구성'],
  ['선버스트 차트', 'Sunburst chart', '구성'],
  ['생키 다이어그램', 'Sankey diagram', '흐름'],
  ['폭포 차트', 'Waterfall chart', '흐름'],
  ['레이더 차트', 'Radar chart', '비교'],
  ['세계 지도 단계구분도', 'World choropleth map', '지도·일정'],
  ['파레토 차트', 'Pareto chart', '비교'],
  ['간트 차트', 'Gantt chart', '지도·일정'],
  ['바 차트 레이스', 'Bar chart race', '추세'],
]

export const STUDIO_CATALOG: CatalogItem[] = items.map(([ko, en, group], i) => ({
  no: i + 1,
  ko,
  en,
  group,
  available: CHART_TYPES.includes(ko),
}))

export const EXPERT_CHART_COUNT = 100
