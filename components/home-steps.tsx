"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  Sparkles,
  SlidersHorizontal,
  Upload,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

// The "5 steps" section as a pinned scene: the section is tall, its content sticks to the screen,
// and scrolling through the extra height moves from step 1 to step 5. One passive scroll listener,
// no library. Used from md up and only when motion is allowed; the home page shows a plain card
// grid otherwise.
const STEPS: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: "데이터셋 업로드", desc: "CSV 또는 XLSX를 올려요.", icon: Upload },
  { title: "차트 선택", desc: "차트를 하나 골라요.", icon: BarChart3 },
  { title: "변환", desc: "기본값으로 자동 설정돼요.", icon: Sparkles },
  {
    title: "차트 수정",
    desc: "제목, 색상, 범례를 다듬어요.",
    icon: SlidersHorizontal,
  },
  { title: "추출하기", desc: "JPG, PNG, TIFF로 내려받아요.", icon: Download },
];

const HEADER = 69; // sticky site header height in px

export function HomeSteps() {
  const scene = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      // how far the pinned area has travelled through the extra scroll distance, 0..1
      const distance = r.height - (window.innerHeight - HEADER);
      if (distance <= 0) return;
      const p = Math.min(1, Math.max(0, (HEADER - r.top) / distance));
      setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // clicking a step scrolls to the middle of its stretch
  const goTo = (index: number) => {
    const el = scene.current;
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top;
    const distance = el.offsetHeight - (window.innerHeight - HEADER);
    window.scrollTo({
      top: top - HEADER + ((index + 0.5) / STEPS.length) * distance,
      behavior: "smooth",
    });
  };

  return (
    <div ref={scene} className="relative h-[calc(100dvh-69px+300vh)]">
      <div className="sticky top-[69px] flex h-[calc(100dvh-69px)] items-center">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-14 px-8 md:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-8">
            <h2 className="text-[38px] font-light tracking-[-0.02em]">
              5단계면 충분해요
            </h2>
            <ol className="flex flex-col gap-1.5">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={i === active ? "step" : undefined}
                    className={`flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left transition-colors duration-300 ${i === active ? "bg-[color:var(--c-bg-ffffff)] shadow-[0_8px_30px_rgba(37,52,89,0.06)]" : "hover:bg-[color:var(--c-bg-ffffff)]/60"}`}
                  >
                    <span
                      className={`font-mono text-[12px] transition-colors duration-300 ${i === active ? "text-[color:var(--c-text-2f66f5)]" : "text-[color:var(--c-text-9aa1b8)]"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`text-[16px] transition-colors duration-300 ${i === active ? "font-bold" : "text-[color:var(--c-text-6b7390)]"}`}
                    >
                      {s.title}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-3.5 text-[14px] text-[color:var(--c-text-2b3352)]">
              <span className="inline-flex items-center rounded-full border border-[color:var(--c-border-f97316)] px-3 py-1 text-[12px] font-medium text-[color:var(--c-text-c2410c)]">
                회원
              </span>
              회원이면 데이터셋 폴더 아래에 차트를 저장하고, 마이페이지에서 다시
              편집할 수 있어요.
            </div>
          </div>

          <div className="relative h-[380px] overflow-hidden rounded-2xl border border-[color:var(--c-border-d6e2fa)] bg-[color:var(--c-bg-ffffff)] shadow-[0_20px_60px_rgba(37,52,89,0.08)]">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const on = i === active;
              return (
                <div
                  key={s.title}
                  aria-hidden={!on}
                  className={`absolute inset-0 flex flex-col justify-center gap-5 p-10 transition-all duration-500 ease-out ${on ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"}`}
                >
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-[color:var(--c-bg-eaf0ff)] text-[color:var(--c-text-2f66f5)]">
                    <Icon size={30} />
                  </div>
                  <div className="font-mono text-[13px] text-[color:var(--c-text-2f66f5)]">
                    STEP {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="text-[32px] font-light tracking-[-0.02em]">
                    {s.title}
                  </div>
                  <p className="text-[16px] leading-[1.8] text-[color:var(--c-text-4a5272)]">
                    {s.desc}
                  </p>
                </div>
              );
            })}
            <div
              className="absolute inset-x-10 bottom-8 flex gap-1.5"
              aria-hidden
            >
              {STEPS.map((s, i) => (
                <span
                  key={s.title}
                  className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= active ? "bg-[color:var(--c-bg-2f66f5)]" : "bg-[color:var(--c-bg-e3e6f0)]"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
