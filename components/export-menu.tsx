"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Lock } from "lucide-react";
import { useAuthModal } from "@/components/auth-modal";
import type { Dataset } from "@/lib/csv";
import {
  exportCsv,
  exportJpg,
  exportPng,
  exportTiff,
  outputSize,
} from "@/lib/export";

type Format = { id: string; label: string; desc: string };

// Only what Studio can export today. Add a format here when it is actually built.
// Two separate things can be taken out: the finished chart (an image) or the dataset behind it.
const IMAGE_FORMATS: Format[] = [
  { id: "jpg", label: "JPG", desc: "용량이 작은 이미지" },
  { id: "png", label: "PNG", desc: "발표·문서용 이미지" },
  { id: "tiff", label: "TIFF", desc: "인쇄·논문 제출용 이미지" },
];
const DATA_FORMATS: Format[] = [
  { id: "csv", label: "CSV", desc: "표 데이터 (엑셀에서 열려요)" },
];

type Kind = "chart" | "data";
const KINDS: [Kind, string][] = [
  ["chart", "결과물 추출"],
  ["data", "데이터셋 추출"],
];

const DPIS = [300, 600];
const GUEST_MAX_DPI = 300; // 600 dpi is a member feature

type Props = {
  getSvg: () => SVGSVGElement | null;
  dataset: Dataset;
  baseName: string;
  member: boolean;
};

export function ExportMenu({ getSvg, dataset, baseName, member }: Props) {
  const openAuth = useAuthModal();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("chart");
  const [imageFormat, setFormat] = useState("png");
  const format = kind === "data" ? "csv" : imageFormat;
  const formats = kind === "data" ? DATA_FORMATS : IMAGE_FORMATS;
  const [chosenDpi, setDpi] = useState(300);
  const dpi = member ? chosenDpi : Math.min(chosenDpi, GUEST_MAX_DPI);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isImage = format !== "csv";
  const svg = open ? getSvg() : null;
  const size = svg && isImage ? outputSize(svg, dpi) : null;
  const tiffMb =
    size && format === "tiff"
      ? Math.round((size.width * size.height * 3) / 1024 / 1024)
      : null;

  const download = async () => {
    setBusy(true);
    setError("");
    try {
      if (format === "csv") return exportCsv(dataset, baseName);
      const el = getSvg();
      if (!el) return;
      if (format === "jpg") await exportJpg(el, baseName, dpi);
      else if (format === "png") await exportPng(el, baseName, dpi);
      else if (format === "tiff") await exportTiff(el, baseName, dpi);
    } catch (e) {
      setError(e instanceof Error ? e.message : "내보내기에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex items-center gap-1.5 rounded-lg border border-[color:var(--c-border-b9bfd3)] bg-[color:var(--c-bg-ffffff)] px-4 py-2 text-[12px] font-bold text-[color:var(--c-text-0c1b4c)] hover:bg-[color:var(--c-bg-fafafc)]"
      >
        <Download size={14} /> 추출하기
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="추출하기"
          className="absolute right-0 top-full z-30 mt-2 w-[340px] max-w-[calc(100vw-24px)] rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] p-4 shadow-[0_12px_40px_rgba(12,27,76,0.14)]"
        >
          <div
            role="tablist"
            aria-label="추출 대상"
            className="grid grid-cols-2 gap-1 rounded-lg bg-[color:var(--c-bg-f1f3f9)] p-1"
          >
            {KINDS.map(([key, text]) => (
              <button
                key={key}
                role="tab"
                aria-selected={kind === key}
                onClick={() => setKind(key)}
                className={`rounded-md py-1.5 text-[12px] font-bold transition ${kind === key ? "bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-0c1b4c)] shadow-sm" : "text-[color:var(--c-text-7b8497)]"}`}
              >
                {text}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[color:var(--c-text-7b8497)]">
            {kind === "chart"
              ? "지금 보이는 차트를 이미지 파일로 내려받아요."
              : "차트가 아니라, 이 차트를 만든 원본 표를 내려받아요."}
          </p>
          <div className="mt-4 text-[12px] font-bold">파일 형식</div>
          <div
            role="radiogroup"
            aria-label="파일 형식"
            className="mt-2 flex flex-col gap-1.5"
          >
            {formats.map((f) => (
              <button
                key={f.id}
                role="radio"
                aria-checked={format === f.id}
                onClick={() => setFormat(f.id)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${format === f.id ? "border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-f3f7ff)]" : "border-[color:var(--c-border-e3e6f0)] hover:border-[color:var(--c-border-c7d6fa)]"}`}
              >
                <span
                  className={`size-3.5 shrink-0 rounded-full border ${format === f.id ? "border-[4px] border-[color:var(--c-border-2f66f5)]" : "border-[color:var(--c-border-c9cedb)]"}`}
                />
                <span className="w-10 shrink-0 text-[12px] font-bold">
                  {f.label}
                </span>
                <span className="min-w-0 flex-1 text-[11px] text-[color:var(--c-text-7b8497)]">
                  {f.desc}
                </span>
              </button>
            ))}
          </div>

          {isImage && (
            <>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-[12px] font-bold">해상도 (DPI)</div>
              </div>
              <div
                role="radiogroup"
                aria-label="해상도"
                className="mt-2 grid grid-cols-2 gap-1.5"
              >
                {DPIS.map((value) => {
                  const locked = !member && value > GUEST_MAX_DPI;
                  return (
                    <button
                      key={value}
                      role="radio"
                      aria-checked={dpi === value}
                      aria-disabled={locked || !isImage}
                      disabled={!isImage}
                      onClick={() => {
                        if (locked) {
                          setOpen(false);
                          openAuth("signup");
                        } else setDpi(value);
                      }}
                      className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[12px] font-bold transition ${dpi === value && isImage ? "border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-f3f7ff)] text-[color:var(--c-text-1f44b3)]" : "border-[color:var(--c-border-e3e6f0)]"} ${!isImage ? "cursor-not-allowed bg-[color:var(--c-bg-fafafc)] opacity-60" : locked ? "bg-[color:var(--c-bg-fafafc)] text-[color:var(--c-text-9aa1b8)]" : "hover:border-[color:var(--c-border-c7d6fa)]"}`}
                    >
                      {locked && <Lock size={12} />}
                      {value}
                    </button>
                  );
                })}
              </div>
              {!member && isImage && (
                <p className="mt-2 text-[11px] text-[color:var(--c-text-4a5272)]">
                  비회원은 300 DPI까지예요.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      openAuth("signup");
                    }}
                    className="font-bold text-[color:var(--c-text-2f66f5)] hover:underline"
                  >
                    회원가입하면 600 DPI
                  </button>
                  를 쓸 수 있어요.
                </p>
              )}
              <p className="mt-2 text-[11px] leading-[1.6] text-[color:var(--c-text-7b8497)]">
                DPI는 이미지가 얼마나 선명한지를 나타내요. 숫자가 클수록
                선명하지만 파일이 커져요. 보고서·발표는 300, 큰 인쇄물은 600을
                권장해요.
              </p>
              {size && (
                <p className="mt-1.5 text-[11px] text-[color:var(--c-text-4a5272)]">
                  출력 크기 약 {size.width.toLocaleString()} ×{" "}
                  {size.height.toLocaleString()} px
                  {tiffMb ? ` · TIFF는 압축하지 않아 약 ${tiffMb} MB예요` : ""}
                </p>
              )}
            </>
          )}

          <button
            onClick={download}
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[color:var(--c-bg-2f66f5)] py-2.5 text-[13px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)] disabled:opacity-60"
          >
            <Download size={14} /> {busy ? "만드는 중…" : "내려받기"}
          </button>
          {error && (
            <p
              role="alert"
              className="mt-2 text-[11px] font-semibold text-[color:var(--c-text-e0553a)]"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
