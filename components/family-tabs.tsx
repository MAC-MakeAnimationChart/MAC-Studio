"use client";

import {
  CHART_FAMILIES,
  STUDIO_CATALOG,
  type ChartFamily,
} from "@/lib/chart-catalog";

export type FamilyFilter = "전체" | ChartFamily;

// The row of category buttons above a chart list: 전체 · 막대형 · 선·면적형 · ... with how many
// charts each holds. Used by the home page list and the studio chart picker.
export function FamilyTabs({
  value,
  onChange,
}: {
  value: FamilyFilter;
  onChange: (value: FamilyFilter) => void;
}) {
  const tabs: FamilyFilter[] = ["전체", ...CHART_FAMILIES];
  const count = (tab: FamilyFilter) =>
    tab === "전체"
      ? STUDIO_CATALOG.length
      : STUDIO_CATALOG.filter((c) => c.family === tab).length;

  return (
    <div role="group" aria-label="차트 분류" className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const on = value === tab;
        return (
          <button
            key={tab}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(tab)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${on ? "border-[color:var(--c-border-2f66f5)] bg-[color:var(--c-bg-2f66f5)] text-white" : "border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-4a5272)] hover:border-[color:var(--c-border-c7d6fa)]"}`}
          >
            {tab}{" "}
            <span
              className={
                on ? "text-white/80" : "text-[color:var(--c-text-9aa1b8)]"
              }
            >
              {count(tab)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
