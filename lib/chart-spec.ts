import { DEFAULT_BG, DEFAULT_COLOR } from './chart-palette'
import { numericColumns, type Dataset } from './csv'

export type Align = 'left' | 'center' | 'right'
export type TextStyle = { size: number; bold: boolean; align: Align }

// Everything the user can set on one chart. Charts that don't use a field simply ignore it
// (see `supports` on each chart definition in components/charts).
export type ChartSpec = {
  id: string
  type: string

  // data: which columns, which rows, how many
  labelCol: number
  valueCol: number
  rowStart: number // 1-based, inclusive
  rowEnd: number | null // 1-based, inclusive; null = through the last row
  topN: number | null // null = show everything in range
  topMode: 'first' | 'top' // first N rows, or the N largest values
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
}

export const titleDefaults: TextStyle = { size: 16, bold: true, align: 'center' }
export const subtitleDefaults: TextStyle = { size: 12, bold: false, align: 'center' }

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
export const defaultLegend = (type: string) => type === 'pie'

export function createChartSpec(id: string, type: string, dataset: Dataset): ChartSpec {
  const valueCol = numericColumns(dataset)[0] ?? 1
  return {
    id,
    type,
    labelCol: 0,
    valueCol,
    rowStart: 1,
    rowEnd: null,
    topN: null,
    topMode: 'first',
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
  }
}

const LEGACY_THEME_COLORS = ['#2F66F5', '#55bb86', '#f1a56d', '#4aa3c8', '#c05ab0']

// Charts saved before an option existed (or with the old color `theme` index) get its default.
export function normalizeChart(raw: Partial<ChartSpec> & { id: string; type: string; theme?: number }): ChartSpec {
  const base = createChartSpec(raw.id, raw.type, { name: '', headers: [], rows: [] })
  const { theme, ...rest } = raw
  return {
    ...base,
    ...rest,
    valueCol: rest.valueCol ?? 1,
    title: rest.title ?? '',
    color: rest.color ?? LEGACY_THEME_COLORS[theme ?? 0] ?? DEFAULT_COLOR,
    titleStyle: { ...titleDefaults, ...rest.titleStyle },
    subtitleStyle: { ...subtitleDefaults, ...rest.subtitleStyle },
  }
}
