"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { LoadingCard } from "@/components/loading-card";
import { LOADING_MS } from "@/lib/loading";
import { hydrateWorkspace, useWorkspace } from "@/lib/workspace";

const STEPS = ["데이터를 읽는 중", "차트를 구성하는 중", "편집 화면을 여는 중"];

// Shown between "make the chart" / "open a saved chart" and the editor. The ad lives here.
export default function LoadingPage() {
  const router = useRouter();
  const { dataset, chart, origin, hydrated } = useWorkspace();
  const [elapsed, setElapsed] = useState(0);
  const ready = hydrated && dataset !== null && chart !== null;

  useEffect(() => {
    hydrateWorkspace();
  }, []);

  // Nothing to open (e.g. the page was reached directly): go back and start from the beginning.
  useEffect(() => {
    if (hydrated && !ready) router.replace("/studio");
  }, [hydrated, ready, router]);

  useEffect(() => {
    if (!ready) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const ms = Date.now() - startedAt;
      setElapsed(ms);
      if (ms >= LOADING_MS) {
        clearInterval(timer);
        router.replace("/studio/editor");
      }
    }, 100);
    return () => clearInterval(timer);
  }, [ready, router]);

  const progress = Math.min(1, elapsed / LOADING_MS);
  const active = Math.min(
    STEPS.length - 1,
    Math.floor(progress * STEPS.length),
  );

  return (
    <main className="mx-auto flex min-h-[calc(100vh-68px)] max-w-[560px] flex-col items-center justify-center gap-6 px-6 py-12 text-[color:var(--c-text-0c1b4c)]">
      <LoadingCard
        visible={ready}
        title={
          origin === "mypage"
            ? "저장한 차트를 불러오고 있어요"
            : "차트를 만들고 있어요"
        }
        description="잠시만 기다려 주세요."
      >
        <div className="flex w-full max-w-[300px] flex-col gap-3">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--c-bg-e3e6f0)]"
            role="progressbar"
            aria-label="불러오는 중"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className="h-full rounded-full bg-[color:var(--c-bg-2f66f5)] transition-[width] duration-100 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <ol className="flex flex-col gap-2 text-left text-[12px]">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={`flex items-center gap-2 ${i <= active ? "text-[color:var(--c-text-0c1b4c)]" : "text-[color:var(--c-text-b1b7c4)]"}`}
              >
                <span
                  className={`flex size-4 items-center justify-center rounded-full text-white ${i < active ? "bg-[color:var(--c-bg-2f66f5)]" : i === active ? "border-2 border-[color:var(--c-border-2f66f5)]" : "border border-[color:var(--c-border-d6dae6)]"}`}
                >
                  {i < active && <Check size={10} strokeWidth={3} />}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>
      </LoadingCard>

      <AdSlot />
    </main>
  );
}
