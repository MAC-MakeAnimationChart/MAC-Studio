"use client";

import { useState } from "react";
import { FamilyTabs, type FamilyFilter } from "@/components/family-tabs";
import { HoverPreview } from "@/components/hover-preview";
import type { PreviewNodes } from "@/components/preview-nodes";
import { catalogByFamily } from "@/lib/chart-catalog";

// The "지원하는 차트" list on the home page, grouped by chart family.
export function HomeCharts({ previews }: { previews: PreviewNodes }) {
  const [filter, setFilter] = useState<FamilyFilter>("전체");
  const groups = catalogByFamily().filter(
    (g) => filter === "전체" || g.family === filter,
  );

  return (
    <div className="flex flex-col gap-6">
      <FamilyTabs value={filter} onChange={setFilter} />
      {/* the key restarts the small fade when the category changes */}
      <div key={filter} className="hero-in flex flex-col gap-8">
        {groups.map((g) => (
          <section key={g.family} aria-label={g.family}>
            {filter === "전체" && (
              <h3 className="mb-3 flex items-baseline gap-2 text-[15px] font-bold">
                {g.family}
                <span className="text-[12px] font-normal text-[color:var(--c-text-7b8497)]">
                  {g.items.filter((c) => c.available).length}/{g.items.length}{" "}
                  이용 가능
                </span>
              </h3>
            )}
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {g.items.map((c) => (
                <li key={c.no}>
                  <HoverPreview
                    preview={previews[c.ko]}
                    className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${c.available ? "border-[color:var(--c-border-c7d6fa)] bg-[color:var(--c-bg-f3f7ff)]" : "border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)]"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium">{c.ko}</div>
                      <div className="mt-0.5 truncate text-[11px] text-[color:var(--c-text-7b8497)]">
                        {c.en}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${c.available ? "bg-[color:var(--c-bg-2f66f5)] text-white" : "bg-[color:var(--c-bg-f1f3f9)] text-[color:var(--c-text-6b7390)]"}`}
                    >
                      {c.available ? "이용 가능" : "준비 중"}
                    </span>
                  </HoverPreview>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
