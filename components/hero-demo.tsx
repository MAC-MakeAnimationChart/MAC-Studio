"use client";

import { useState } from "react";

const TABS = ["막대 차트", "선 차트", "원형 차트"] as const;
type Tab = (typeof TABS)[number];

import { PALETTE } from "@/lib/chart-palette";

const BLUE = PALETTE[0].value;
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월"];
const XS = [109, 199, 289, 379, 469, 559];
const YS = [160, 118, 140, 86, 98, 58];

function Months() {
  return (
    <g fontSize="11" fill="#7B8497" textAnchor="middle">
      {MONTHS.map((m, i) => (
        <text key={m} x={XS[i]} y={272}>
          {m}
        </text>
      ))}
    </g>
  );
}

function Grid() {
  return (
    <g stroke="#EDF0F5">
      {[250, 190, 130, 70].map((y) => (
        <line key={y} x1="56" x2="616" y1={y} y2={y} />
      ))}
    </g>
  );
}

function Demo({ tab }: { tab: Tab }) {
  if (tab === "막대 차트") {
    return (
      <svg
        viewBox="0 0 640 300"
        className="block h-auto w-full"
        role="img"
        aria-label="막대 차트 예시"
      >
        <text
          x="320"
          y="26"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill="#0C1B4C"
        >
          월별 방문자
        </text>
        <Grid />
        <g fill={BLUE}>
          {XS.map((x, i) => (
            <rect
              key={x}
              x={x - 23}
              y={YS[i]}
              width="46"
              height={250 - YS[i]}
              rx="4"
            />
          ))}
        </g>
        <Months />
      </svg>
    );
  }
  if (tab === "선 차트") {
    return (
      <svg
        viewBox="0 0 640 300"
        className="block h-auto w-full"
        role="img"
        aria-label="선 차트 예시"
      >
        <text
          x="320"
          y="26"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill="#0C1B4C"
        >
          월별 방문자 추이
        </text>
        <Grid />
        <polyline
          fill="none"
          stroke={BLUE}
          strokeWidth="3"
          strokeLinejoin="round"
          points={XS.map((x, i) => `${x},${YS[i]}`).join(" ")}
        />
        <g fill="#FFFFFF" stroke={BLUE} strokeWidth="2.5">
          {XS.map((x, i) => (
            <circle key={x} cx={x} cy={YS[i]} r="5" />
          ))}
        </g>
        <Months />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 640 300"
      className="block h-auto w-full"
      role="img"
      aria-label="원형 차트 예시"
    >
      <text
        x="320"
        y="26"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="#0C1B4C"
      >
        유입 경로 비율
      </text>
      <g transform="translate(200 165)" stroke="#fff" strokeWidth="2">
        <path d="M0 0 L0 -100 A100 100 0 0 1 95.1 30.9 Z" fill={BLUE} />
        <path
          d="M0 0 L95.1 30.9 A100 100 0 0 1 -58.8 80.9 Z"
          fill={PALETTE[1].value}
        />
        <path
          d="M0 0 L-58.8 80.9 A100 100 0 0 1 -95.1 -30.9 Z"
          fill={PALETTE[2].value}
        />
        <path
          d="M0 0 L-95.1 -30.9 A100 100 0 0 1 0 -100 Z"
          fill={PALETTE[3].value}
        />
      </g>
      <g fontSize="12" fill="#4A5272">
        {[
          ["검색 35%", BLUE],
          ["광고 25%", PALETTE[1].value],
          ["추천 22%", PALETTE[2].value],
          ["직접 18%", PALETTE[3].value],
        ].map(([label, color], i) => (
          <g key={label}>
            <rect
              x="380"
              y={130 + i * 24}
              width="10"
              height="10"
              rx="2"
              fill={color}
            />
            <text x="398" y={139 + i * 24}>
              {label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export function HeroDemo() {
  const [tab, setTab] = useState<Tab>("막대 차트");

  return (
    <div className="flex flex-col items-center gap-6 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#0C1B4C_0%,#2F66F5_55%,#4ED3FD_100%)] px-5 pt-7 sm:px-7">
      <div
        role="tablist"
        aria-label="차트 유형 예시"
        className="flex gap-1 rounded-full bg-[color:var(--c-bg-0c1b4c)]/45 p-1"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2 text-[13px] font-medium transition ${tab === t ? "bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-0c1b4c)]" : "text-[color:var(--c-text-dce6ff)] hover:text-white"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex w-full max-w-[1040px] flex-col rounded-t-[10px] bg-[color:var(--c-bg-ffffff)] shadow-[0_20px_60px_rgba(8,16,60,0.35)]">
        <div className="flex items-center justify-between border-b border-[color:var(--c-border-e3e6f0)] px-5 py-3.5">
          <div className="text-[13px] font-medium">
            marketing_data.csv{" "}
            <span className="font-normal text-[color:var(--c-text-6b7390)]">
              · 6행
            </span>
          </div>
          <div className="flex rounded-lg bg-[color:var(--c-bg-f1f3f9)] p-[3px] text-[12px]">
            <span className="rounded-md bg-[color:var(--c-bg-ffffff)] px-3.5 py-1 font-medium">
              차트
            </span>
            <span className="px-3.5 py-1 text-[color:var(--c-text-6b7390)]">
              데이터셋
            </span>
          </div>
          <div className="hidden w-14 sm:block" />
        </div>
        <div className="flex flex-wrap">
          <div className="min-w-0 flex-[3_1_560px] p-5">
            <div
              className="overflow-hidden rounded-md"
              style={{ background: "#FFFFFF" }}
            >
              <Demo tab={tab} />
            </div>
          </div>
          <aside
            className="flex min-w-0 flex-[1_1_220px] flex-col gap-3.5 border-[color:var(--c-border-e3e6f0)] p-5 text-[12px] text-[color:var(--c-text-6b7390)] lg:border-l"
            aria-label="차트 옵션 예시"
          >
            <div className="text-[13px] font-bold text-[color:var(--c-text-0c1b4c)]">
              차트 옵션
            </div>
            <div className="flex flex-col gap-1.5">
              제목
              <div className="rounded-md border border-[color:var(--c-border-e3e6f0)] px-2.5 py-2 font-medium text-[color:var(--c-text-0c1b4c)]">
                월별 방문자
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              값 열
              <div className="rounded-md border border-[color:var(--c-border-e3e6f0)] px-2.5 py-2 font-medium text-[color:var(--c-text-0c1b4c)]">
                방문자
              </div>
            </div>
            <div className="flex flex-col gap-2">
              색상
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((c, i) => (
                  <span
                    key={c.value}
                    title={c.name}
                    className={`size-[22px] rounded-full ${i === 0 ? "border-2 border-[color:var(--c-border-0c1b4c)]" : ""}`}
                    style={{ background: c.value }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-1.5 flex gap-2">
              {["JPG", "PNG", "TIFF"].map((f) => (
                <span
                  key={f}
                  className="rounded-md border border-[color:var(--c-border-e3e6f0)] px-3 py-1.5 font-medium text-[color:var(--c-text-0c1b4c)]"
                >
                  {f}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
