import type { ReactNode } from "react";
import { ChartView } from "@/components/charts/chart-view";
import { CHARTS } from "@/components/charts/registry";
import { createChartSpec } from "@/lib/chart-spec";
import { sampleDataset } from "@/lib/sample-data";

// Chart type -> its example picture, already drawn. Call this from a SERVER component (a page): it
// runs once when the site is built, and the client components that show previews (HoverPreview,
// ChartPicker) only receive the finished result. Keep it free of anything per-request.
//
// A picture exists for every chart that is built (registered in components/charts/registry.ts) and
// has example data in lib/sample-data.ts, so a new chart gets its preview with no extra step.
export type PreviewNodes = Record<string, ReactNode>;

export function renderPreviews(): PreviewNodes {
  const nodes: PreviewNodes = {};
  for (const def of CHARTS) {
    const dataset = sampleDataset(def.type);
    if (!dataset) continue;
    const spec = createChartSpec("preview", def.type, dataset);
    nodes[def.type] = <ChartView dataset={dataset} spec={spec} />;
  }
  return nodes;
}
