# Charts

Each chart type lives in its own file here, so one chart can be fixed or added without touching the others.

```
components/charts/
  registry.ts       the list of charts the studio offers (add new charts here)
  types.ts          ChartDefinition / ChartComponentProps
  chart-view.tsx    <ChartView dataset spec />: prepares the data and draws the right chart
  frame.tsx         shared canvas: title, subtitle, footer, background, single-series legend
  cartesian.tsx     axes shared by charts with categories on x (bar, line, ...)
  bar-chart.tsx     one file per chart: the component + its ChartDefinition
  line-chart.tsx
  pie-chart.tsx
lib/
  chart-spec.ts     ChartSpec: every option a user can set (+ defaults, migration of old saves)
  chart-data.ts     row range, top N and "기타" grouping, shared by all charts
  chart-palette.ts  colors
```

## Adding a chart

1. Create `components/charts/<name>-chart.tsx`. It exports a component that takes `{ spec, data }`
   and returns an SVG (wrap it in `ChartFrame` to get title/subtitle/footer/background for free),
   plus a `ChartDefinition` (name, icon, description, and `supports`).
2. Add the definition to `CHARTS` in `registry.ts`.

That is all. The chart picker, the editor, the options panel (it hides options a chart doesn't
`support`), the mypage thumbnails, and the "이용 가능" badge in the chart list all read the registry.

## Fixing one chart

Only that chart's file needs to change. Shared behavior (title, footer, background, row range,
top N) is in `frame.tsx` and `lib/chart-data.ts`; a change there affects every chart on purpose.

## Adding an option

Add the field and its default to `ChartSpec` in `lib/chart-spec.ts` (old saved charts pick up the
default automatically), add a control in `components/chart-options-panel.tsx`, and read it in the
chart(s) that use it.
