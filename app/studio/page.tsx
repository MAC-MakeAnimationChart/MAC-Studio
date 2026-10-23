"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CloudUpload,
  FileSpreadsheet,
  Lock,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { DataCheck } from "@/components/data-check";
import { useUser } from "@/lib/auth";
import { CHARTS } from "@/components/charts/registry";
import {
  decodeText,
  parseCsv,
  sampleDataset,
  type Dataset,
  type Encoding,
} from "@/lib/csv";
import { hasBlockingIssue, inspectDataset } from "@/lib/data-check";
import { parseXlsx } from "@/lib/excel";
import { FREE_UPLOAD_MB, MEMBER_UPLOAD_MB } from "@/lib/limits";
import {
  hydrateWorkspace,
  loadDataset,
  selectChart,
  useWorkspace,
} from "@/lib/workspace";

// Extensions alone make Android (Galaxy) show the camera / photo shortcuts first. Listing the
// MIME types too tells the system picker these are documents, so it opens the file browser.
const UPLOAD_ACCEPT = [
  ".csv",
  ".xlsx",
  "text/csv",
  "text/comma-separated-values",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");

const card =
  "rounded-lg border border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)] shadow-[0_8px_30px_rgba(37,52,89,0.03)]";
const primaryBtn =
  "flex items-center gap-2 rounded-lg bg-[color:var(--c-bg-2f66f5)] px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-[#2F66F5]/20 transition hover:bg-[color:var(--c-bg-2757d6)] disabled:opacity-50 disabled:shadow-none";

export default function StudioPage() {
  const user = useUser();
  const member = user !== null;
  const uploadLimitMb = member ? MEMBER_UPLOAD_MB : FREE_UPLOAD_MB;
  const router = useRouter();
  const { dataset, chart } = useWorkspace();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [encoding, setEncoding] = useState<Encoding | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrateWorkspace();
  }, []);

  const onDataset = (ds: Dataset, enc?: Encoding) => {
    loadDataset(ds);
    setEncoding(enc);
    setError("");
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    const isXlsx = lower.endsWith(".xlsx");
    if (!isXlsx && !lower.endsWith(".csv"))
      return setError(
        "CSV 또는 XLSX 파일만 지원해요. (.xls는 .xlsx로 저장해 주세요)",
      );
    if (file.size > uploadLimitMb * 1024 * 1024) {
      return setError(
        `파일이 ${uploadLimitMb} MB를 넘어요.${member ? "" : ` 회원가입하면 ${MEMBER_UPLOAD_MB} MB까지 올릴 수 있어요.`}`,
      );
    }
    try {
      if (isXlsx) {
        onDataset(await parseXlsx(file));
      } else {
        const { text, encoding: enc } = decodeText(await file.arrayBuffer());
        onDataset(parseCsv(text, file.name), enc);
      }
      // Straight to the data check, which explains anything that won't chart well.
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일을 읽을 수 없어요.");
    }
  };

  // Errors found by the data check (e.g. no numeric column) hold the user at step 2.
  const blocked = useMemo(
    () =>
      dataset ? hasBlockingIssue(inspectDataset(dataset, { encoding })) : false,
    [dataset, encoding],
  );

  const next = () => {
    if (step === 1) {
      if (!dataset)
        return setError("먼저 데이터를 업로드하거나 샘플 데이터를 선택하세요.");
      setError("");
      return setStep(2);
    }
    if (step === 2) {
      if (blocked)
        return setError(
          "빨간 항목을 먼저 고쳐 주세요. 고치기 버튼이 없으면 표를 고쳐서 다시 올려 주세요.",
        );
      setError("");
      return setStep(3);
    }
    if (!chart) return setError("차트를 하나 선택하세요.");
    router.push("/studio/loading");
  };

  return (
    <main className="mx-auto max-w-[960px] px-6 pb-20 pt-10 text-[color:var(--c-text-0c1b4c)] sm:px-10">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-[-0.03em]">스튜디오</h1>
        <p className="mt-2 text-[13px] text-[color:var(--c-text-7b8497)]">
          데이터를 올리고 차트를 고르면, 변환과 수정은 편집 화면에서 이어져요.
        </p>
      </div>

      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="진행 단계">
        {["데이터셋 업로드", "데이터 확인", "차트 선택", "편집 · 추출"].map(
          (label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = n < step;
            const clickable = n === 1 || (n <= 3 && dataset !== null);
            return (
              <li key={label}>
                <button
                  onClick={() => clickable && setStep(n)}
                  disabled={!clickable}
                  aria-current={active ? "step" : undefined}
                  className={`flex w-full flex-col items-center gap-2 rounded-lg border px-2 py-3 text-center transition sm:flex-row sm:justify-center sm:gap-2.5 ${active ? "border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-f3f7ff)]" : "border-[color:var(--c-border-e5e8f0)] bg-[color:var(--c-bg-ffffff)]"} ${n === 4 ? "opacity-50" : clickable ? "hover:border-[color:var(--c-border-d0d6ee)]" : "opacity-50"}`}
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${active || done ? "bg-[color:var(--c-bg-2f66f5)] text-white" : "bg-[color:var(--c-bg-f1f2f6)] text-[color:var(--c-text-a2a9b8)]"}`}
                  >
                    {done ? <Check size={13} /> : n}
                  </span>
                  <span
                    className={`text-[11px] font-bold sm:text-[12px] ${active ? "text-[color:var(--c-text-1f44b3)]" : "text-[color:var(--c-text-7b8497)]"}`}
                  >
                    {label}
                  </span>
                </button>
              </li>
            );
          },
        )}
      </ol>

      {step === 1 && (
        <div className={`${card} p-6 sm:p-8`}>
          <h2 className="text-[17px] font-bold">1. 데이터셋 업로드</h2>
          <p className="mt-1 mb-6 text-[12px] text-[color:var(--c-text-99a1b1)]">
            첫 열은 항목 이름, 나머지 열은 숫자 데이터로 준비해 주세요.{" "}
            <Link
              href="/guide"
              className="font-bold text-[color:var(--c-text-2f66f5)] hover:underline"
            >
              어떤 표가 좋은가요?
            </Link>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept={UPLOAD_ACCEPT}
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files[0]);
            }}
            className={`flex w-full flex-col items-center justify-center rounded-lg border border-dashed py-12 transition ${dataset ? "border-[color:var(--c-border-73c999)] bg-[color:var(--c-bg-f2fbf6)]" : "border-[color:var(--c-border-cdd3e0)] bg-[color:var(--c-bg-fbfcfe)] hover:border-[color:var(--c-border-6c95f7)] hover:bg-[color:var(--c-bg-f8f9ff)]"}`}
          >
            <div
              className={`mb-3 flex size-12 items-center justify-center rounded-full ${dataset ? "bg-[color:var(--c-bg-d8f3e4)] text-[color:var(--c-text-43aa77)]" : "bg-[color:var(--c-bg-eaf0ff)] text-[color:var(--c-text-2f66f5)]"}`}
            >
              {dataset ? (
                <FileSpreadsheet size={22} />
              ) : (
                <CloudUpload size={22} />
              )}
            </div>
            <div className="text-[13px] font-bold">
              {dataset
                ? `${dataset.name} 업로드 완료`
                : "파일을 끌어다 놓거나 클릭해 업로드"}
            </div>
            <div className="mt-1 text-[11px] text-[color:var(--c-text-a0a8b8)]">
              {dataset
                ? `${dataset.rows.length}행 · ${dataset.headers.length}열 · 클릭해 다른 파일 선택`
                : `CSV, XLSX 파일 · 최대 ${uploadLimitMb} MB`}
            </div>
          </button>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[color:var(--c-bg-edf0f4)]" />
            <span className="text-[10px] font-bold text-[color:var(--c-text-b1b7c4)]">
              또는
            </span>
            <div className="h-px flex-1 bg-[color:var(--c-bg-edf0f4)]" />
          </div>
          <button
            onClick={() => {
              onDataset(sampleDataset);
              setStep(2);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--c-border-e4e7ee)] py-3 text-[12px] font-bold text-[color:var(--c-text-667087)] transition hover:bg-[color:var(--c-bg-fafbfc)]"
          >
            <Plus size={15} /> 샘플 데이터로 시작하기
          </button>
          <p className="mt-5 flex items-center gap-2 text-[11px] text-[color:var(--c-text-8891a5)]">
            <ShieldCheck
              size={14}
              className="shrink-0 text-[color:var(--c-text-43aa77)]"
            />{" "}
            파일은 서버로 전송되지 않고, 내 브라우저 안에서만 처리돼요.
          </p>
        </div>
      )}

      {step === 2 && dataset && (
        <div className={`${card} p-6 sm:p-8`}>
          <DataCheck
            key={dataset.name}
            dataset={dataset}
            encoding={encoding}
            onChange={(ds) => onDataset(ds, encoding)}
          />
        </div>
      )}

      {step === 3 && dataset && (
        <div className={`${card} p-6 sm:p-8`}>
          <h2 className="text-[17px] font-bold">3. 차트 선택</h2>
          <p className="mt-1 mb-6 text-[12px] text-[color:var(--c-text-99a1b1)]">
            {dataset.name}로 만들 차트를 하나 고르세요. 차트는 한 번에 하나씩
            만들고, 저장하면 이 데이터셋 폴더 아래에 쌓여요.
          </p>
          <div
            role="radiogroup"
            aria-label="차트 유형"
            className="grid gap-3 md:grid-cols-3"
          >
            {CHARTS.map((def) => {
              const { type: name, desc, icon: Icon, tint } = def;
              const selected = chart?.type === name;
              return (
                <button
                  key={name}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setError("");
                    selectChart(name);
                  }}
                  className={`flex items-center gap-4 rounded-lg border p-4 text-left transition ${selected ? "border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-f3f7ff)] ring-1 ring-[color:var(--c-border-4f7cf5)]" : "border-[color:var(--c-border-edf0f4)] hover:border-[color:var(--c-border-d8ddec)]"}`}
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
                  <div className="flex-1">
                    <div className="text-[13px] font-bold">{name}</div>
                    <div className="mt-0.5 text-[11px] text-[color:var(--c-text-9ca4b4)]">
                      {desc}
                    </div>
                  </div>
                  <div
                    className={`size-4 shrink-0 rounded-full border ${selected ? "border-[5px] border-[color:var(--c-border-2f66f5)]" : "border-[color:var(--c-border-d3d8e2)]"}`}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-4 flex items-center gap-2 text-[11px] text-[color:var(--c-text-a0a8b8)]">
            <Lock size={12} /> 나머지 Studio 차트는 순서대로 열려요.
            Expert(유료)에서는 더 많은 차트를 제공할 예정이에요.
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 px-1 text-[12px] font-semibold text-[color:var(--c-text-e0553a)]"
        >
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setStep((n) => Math.max(1, n - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 rounded-lg border border-[color:var(--c-border-e4e7ee)] bg-[color:var(--c-bg-ffffff)] px-5 py-3 text-[13px] font-bold text-[color:var(--c-text-667087)] transition hover:bg-[color:var(--c-bg-fafbfc)] disabled:opacity-50"
        >
          이전
        </button>
        <button onClick={next} className={primaryBtn}>
          {step < 3 ? "다음" : "변환하고 편집하기"} <ArrowRight size={15} />
        </button>
      </div>
    </main>
  );
}
