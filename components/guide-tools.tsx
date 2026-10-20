"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { buildPrompt, SAMPLES } from "@/lib/data-guide";

const btn =
  "flex items-center gap-1.5 rounded-lg border border-[color:var(--c-border-b9bfd3)] bg-[color:var(--c-bg-ffffff)] px-3.5 py-2 text-[12px] font-bold text-[color:var(--c-text-0c1b4c)] hover:bg-[color:var(--c-bg-fafafc)]";

export function SampleDownloads() {
  const download = (filename: string, csv: string) => {
    // BOM so Excel opens the Korean text correctly
    const url = URL.createObjectURL(
      new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {SAMPLES.map((s) => (
        <li
          key={s.id}
          className="flex flex-col gap-3 rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] p-5"
        >
          <div>
            <p className="text-[14px] font-bold">{s.name}</p>
            <p className="mt-1 text-[12px] leading-[1.7] text-[color:var(--c-text-7b8497)]">
              {s.desc}
            </p>
          </div>
          <pre className="overflow-x-auto rounded-md bg-[color:var(--c-bg-fafafc)] p-3 text-[11px] leading-[1.6] text-[color:var(--c-text-4a5272)]">
            {s.csv.trim().split("\n").slice(0, 4).join("\n")}
          </pre>
          <button
            onClick={() => download(s.filename, s.csv)}
            className={`${btn} self-start`}
          >
            <Download size={13} /> CSV 내려받기
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PromptCopier({ chartTypes }: { chartTypes: string[] }) {
  const [chart, setChart] = useState<string>("");
  const prompt = buildPrompt(chart || undefined);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("프롬프트를 복사했어요", {
        id: "prompt-copied",
        duration: 2500,
      });
    } catch {
      toast.error("복사하지 못했어요. 아래 글을 직접 선택해서 복사해 주세요.", {
        id: "prompt-copied",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-wrap items-center gap-2"
        role="radiogroup"
        aria-label="차트 종류"
      >
        <span className="mr-1 text-[12px] font-bold text-[color:var(--c-text-667087)]">
          만들 차트
        </span>
        {["", ...chartTypes].map((t) => (
          <button
            key={t || "none"}
            role="radio"
            aria-checked={chart === t}
            onClick={() => setChart(t)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition ${chart === t ? "border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-f3f7ff)] text-[color:var(--c-text-1f44b3)]" : "border-[color:var(--c-border-e3e6f0)] text-[color:var(--c-text-7b8497)] hover:border-[color:var(--c-border-c7d6fa)]"}`}
          >
            {t || "아직 모르겠어요"}
          </button>
        ))}
      </div>
      <div className="relative">
        <textarea
          readOnly
          value={prompt}
          aria-label="AI에 붙여넣을 프롬프트"
          rows={16}
          className="w-full resize-y rounded-lg border border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-fafafc)] p-4 text-[12px] leading-[1.8] text-[color:var(--c-text-2b3352)] outline-none focus:border-[color:var(--c-border-4f7cf5)]"
        />
      </div>
      <button
        onClick={copy}
        className="flex items-center justify-center gap-1.5 self-start rounded-lg bg-[color:var(--c-bg-2f66f5)] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)]"
      >
        <Copy size={14} /> 프롬프트 복사
      </button>
    </div>
  );
}
