"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { CHARTS } from "@/components/charts/registry";
import { FamilyTabs, type FamilyFilter } from "@/components/family-tabs";
import type { PreviewNodes } from "@/components/preview-nodes";
import { catalogByFamily } from "@/lib/chart-catalog";

// Step 3 of /studio: pick one chart. Every Studio chart is listed under its family; the ones that
// are built can be chosen, the rest show as "준비 중". A side panel shows the example picture of the
// chart under the mouse, or else of the chosen one (so touch screens see it after tapping).
export function ChartPicker({
  selected,
  onSelect,
  previews,
}: {
  selected: string | undefined;
  onSelect: (type: string) => void;
  previews: PreviewNodes;
}) {
  const [filter, setFilter] = useState<FamilyFilter>("전체");
  const [hovered, setHovered] = useState<string | null>(null);
  const groups = catalogByFamily().filter(
    (g) => filter === "전체" || g.family === filter,
  );

  // what the side panel is about: the chart under the mouse, otherwise the chosen one
  const shown = hovered ?? selected ?? null;
  const shownDef = shown ? CHARTS.find((d) => d.type === shown) : undefined;

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-col gap-5">
        <FamilyTabs value={filter} onChange={setFilter} />
        <div
          role="radiogroup"
          aria-label="차트 유형"
          key={filter}
          className="hero-in flex flex-col gap-6"
        >
          {groups.map((g) => (
            <section key={g.family} aria-label={g.family}>
              {filter === "전체" && (
                <h3 className="mb-2.5 flex items-baseline gap-2 text-[13px] font-bold">
                  {g.family}
                  <span className="text-[11px] font-normal text-[color:var(--c-text-9ca4b4)]">
                    {g.items.filter((c) => c.available).length}/{g.items.length}
                  </span>
                </h3>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {g.items.map((item) => {
                  const def = CHARTS.find((d) => d.type === item.ko);
                  // events sit on a wrapper because disabled buttons do not report the mouse
                  const hover = {
                    onPointerEnter: (e: React.PointerEvent) =>
                      e.pointerType === "mouse" && setHovered(item.ko),
                    onPointerLeave: (e: React.PointerEvent) =>
                      e.pointerType === "mouse" && setHovered(null),
                  };
                  if (!def)
                    return (
                      <div key={item.no} {...hover}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={false}
                          disabled
                          className="flex w-full cursor-not-allowed items-center gap-4 rounded-lg border border-dashed border-[color:var(--c-border-e3e6f0)] p-4 text-left opacity-60"
                        >
                          <div className="flex size-11 items-center justify-center rounded-lg bg-[color:var(--c-bg-f1f3f9)]">
                            <Lock
                              size={17}
                              className="text-[color:var(--c-text-9aa1b8)]"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold">
                              {item.ko}
                            </div>
                            <div className="mt-0.5 text-[11px] text-[color:var(--c-text-9ca4b4)]">
                              준비 중
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  const { type: name, desc, icon: Icon, tint } = def;
                  const on = selected === name;
                  return (
                    <div key={item.no} {...hover}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => onSelect(name)}
                        onFocus={(e) =>
                          e.currentTarget.matches(":focus-visible") &&
                          setHovered(name)
                        }
                        onBlur={() => setHovered(null)}
                        className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${on ? "border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-f3f7ff)] ring-1 ring-[color:var(--c-border-4f7cf5)]" : "border-[color:var(--c-border-edf0f4)] hover:border-[color:var(--c-border-d8ddec)]"}`}
                      >
                        <div
                          className={`flex size-11 items-center justify-center rounded-lg ${tint}`}
                        >
                          <Icon
                            size={21}
                            strokeWidth={1.8}
                            className="text-[color:var(--c-text-4e5b79)]"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold">{name}</div>
                          <div className="mt-0.5 text-[11px] text-[color:var(--c-text-9ca4b4)]">
                            {desc}
                          </div>
                        </div>
                        <div
                          className={`size-4 shrink-0 rounded-full border ${on ? "border-[5px] border-[color:var(--c-border-2f66f5)]" : "border-[color:var(--c-border-d3d8e2)]"}`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* on small screens it appears above the list, and only once something is chosen */}
      <aside
        aria-label="차트 미리보기"
        className={`order-first rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-fafafc)] p-4 lg:sticky lg:top-24 lg:order-none ${shown ? "" : "hidden lg:block"}`}
      >
        {shown ? (
          <>
            <div className="text-[13px] font-bold">{shown}</div>
            {shownDef && (
              <div className="mt-0.5 text-[11px] text-[color:var(--c-text-9ca4b4)]">
                {shownDef.desc}
              </div>
            )}
            <div className="mt-3 overflow-hidden rounded-md border border-[color:var(--c-border-edf0f5)]">
              {previews[shown] ?? (
                <div className="flex aspect-[2/1] items-center justify-center bg-[color:var(--c-bg-ffffff)] text-[12px] text-[color:var(--c-text-9ca4b4)]">
                  {shownDef
                    ? "미리보기를 준비하고 있어요"
                    : "준비 중인 차트예요"}
                </div>
              )}
            </div>
            {previews[shown] && (
              <p className="mt-2 text-[11px] leading-[1.6] text-[color:var(--c-text-7b8497)]">
                샘플 데이터로 그린 예시예요. 고르면 내 데이터로 편집 화면에서
                바로 볼 수 있어요.
              </p>
            )}
          </>
        ) : (
          <p className="text-[12px] leading-[1.7] text-[color:var(--c-text-9ca4b4)]">
            차트에 마우스를 올리면 예시가 여기에 보여요.
          </p>
        )}
      </aside>
    </div>
  );
}
