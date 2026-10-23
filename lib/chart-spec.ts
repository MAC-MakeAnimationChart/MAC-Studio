import { DEFAULT_FONT } from './chart-fonts'
import { DEFAULT_BG, DEFAULT_COLOR } from './chart-palette'
import { numericColumns, type Dataset } from './csv'

export type Align = 'left' | 'center' | 'right'
export type TextStyle = { size: number; bold: boolean; align: Align }

// How the rows are put in order before "show N" cuts the list.
export type RowSort = 'none' | 'valueDesc' | 'valueAsc' | 'nameAsc' | 'nameDesc'
// Direction of the x-axis labels.
export type LabelDir = 'horizontal' | 'vertical' | 'diagonal'
// Extra space around the chart, in px. The canvas grows by this much on each side.
export type Margin = {
  top: number
  right: number
  bottom: number
  left: number
}

// Everything the user can set on one chart. Charts that don't use a field simply ignore it
// (see `supports` on each chart definition in components/charts).
export type ChartSpec = {
  id: string
  type: string

  // data: which columns, which rows, how many
  labelCol: number
  valueCol: number
  rowMode: 'range' | 'manual' // which rows are in play: a start..end range, or rows ticked one by one
  rowStart: number // 1-based, inclusive (range mode)
  rowEnd: number | null // 1-based, inclusive; null = through the last row (range mode)
  picked: number[] // 1-based row numbers (manual mode)
  sort: RowSort
  topN: number | null // null = show everything; otherwise the first N after sorting
  groupOthers: boolean // fold the rest into "기타" when topN is on

  // text
  title: string
  titleStyle: TextStyle
  subtitle: string
  subtitleStyle: TextStyle
  footer: string // data source line at the bottom of the chart

  // look
  color: string
  bg: string
  barWidth: number // percent of each category's width, bar charts only
  barShade: number // -50 (darker) .. +50 (lighter), bar charts only
  textSize: number // axis labels
  textBold: boolean
  legend: boolean
  legendSize: number
  legendBold: boolean
  xLabelDir: LabelDir // axis charts only
  margin: Margin
  font: string // id from lib/chart-fonts.ts
  sliceColors: Record<string, string> // category label -> color, for charts that color each category (pie)
  colorSeries: string // above 10 categories: 'mixed' or one palette hex shown dark to light
}

export const titleDefaults: TextStyle = {
  size: 16,
  bold: true,
  align: 'center',
}
export const marginDefaults: Margin = { top: 0, right: 0, bottom: 0, left: 0 }
export const subtitleDefaults: TextStyle = {
  size: 12,
  bold: false,
  align: 'center',
}

// "월별 방문자" from the item column "월" and the value column "방문자"; "Visitors by Month" for
// non-Korean headers. The title follows the column choice until the user types their own.
export function autoTitle(dataset: Dataset, labelCol: number, valueCol: number) {
  const label = dataset.headers[labelCol]?.trim() ?? ''
  const value = dataset.headers[valueCol]?.trim() ?? ''
  if (!label || !value) return value || label
  if (/[가-힣]$/.test(label)) return `${label}별 ${value}`
  return `${value} by ${label}`
}

// A single series needs no legend (the title says what it is); pies list their slices.
export const defaultLegend = (type: string) => type === '원형 차트'

export function createChartSpec(id: string, type: string, dataset: Dataset): ChartSpec {
  const valueCol = numericColumns(dataset)[0] ?? 1
  return {
    id,
    type,
    labelCol: 0,
    valueCol,
    rowMode: 'range',
    rowStart: 1,
    rowEnd: null,
    picked: [],
    sort: 'none',
    topN: null,
    groupOthers: false,
    title: autoTitle(dataset, 0, valueCol),
    titleStyle: { ...titleDefaults },
    subtitle: '',
    subtitleStyle: { ...subtitleDefaults },
    footer: '',
    color: DEFAULT_COLOR,
    bg: DEFAULT_BG,
    barWidth: 60,
    barShade: 0,
    textSize: 11,
    textBold: false,
    legend: defaultLegend(type),
    legendSize: 12,
    legendBold: false,
    xLabelDir: 'horizontal',
    margin: { ...marginDefaults },
    font: DEFAULT_FONT,
    sliceColors: {},
    colorSeries: 'mixed',
  }
}

const LEGACY_THEME_COLORS = ['#2F66F5', '#55bb86', '#f1a56d', '#4aa3c8', '#c05ab0']

// Charts saved before an option existed (or with the old color `theme` index) get its default.
export function normalizeChart(raw: Partial<ChartSpec> & { id: string; type: string; theme?: number }): ChartSpec {
  const base = createChartSpec(raw.id, raw.type, {
    name: '',
    headers: [],
    rows: [],
  })
  // `topMode: 'top'` (N largest values) became "sort by value, then show N"
  const { theme, topMode, ...rest } = raw as typeof raw & { topMode?: string }
  const legacySort: RowSort | undefined = topMode === 'top' && !rest.sort ? 'valueDesc' : undefined
  return {
    ...base,
    ...rest,
    sort: rest.sort ?? legacySort ?? base.sort,
    margin: { ...marginDefaults, ...rest.margin },
    valueCol: rest.valueCol ?? 1,
    title: rest.title ?? '',
    color: rest.color ?? LEGACY_THEME_COLORS[theme ?? 0] ?? DEFAULT_COLOR,
    titleStyle: { ...titleDefaults, ...rest.titleStyle },
    subtitleStyle: { ...subtitleDefaults, ...rest.subtitleStyle },
  }
}
