"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Undo2,
  Wand2,
} from "lucide-react";
import {
  applyAutoFixes,
  inspectDataset,
  type Issue,
  type Level,
} from "@/lib/data-check";
import { numericColumns, type Dataset, type Encoding } from "@/lib/csv";

const PREVIEW_ROWS = 8;

const levelStyle: Record<
  Level,
  { icon: typeof Info; box: string; iconColor: string }
> = {
  error: {
    icon: AlertCircle,
    box: "border-[color:var(--c-border-e0553a)] bg-[color:var(--c-bg-fff6f4)]",
    iconColor: "text-[color:var(--c-text-e0553a)]",
  },
  warn: {
    icon: AlertTriangle,
    box: "border-[color:var(--c-border-f97316)] bg-[color:var(--c-bg-fafafc)]",
    iconColor: "text-[color:var(--c-text-c2410c)]",
  },
  info: {
    icon: Info,
    box: "border-[color:var(--c-border-c7d6fa)] bg-[color:var(--c-bg-f3f7ff)]",
    iconColor: "text-[color:var(--c-text-2f66f5)]",
  },
};

type Props = {
  dataset: Dataset;
  encoding?: Encoding;
  onChange: (ds: Dataset) => void;
};

// Step between upload and chart choice: shows what was read, points out what would trip the
// chart up, and offers one-click fixes (with undo). Everything runs in the browser.
export function DataCheck({ dataset, encoding, onChange }: Props) {
  const [history, setHistory] = useState<Dataset[]>([]);
  const meta = useMemo(() => ({ encoding }), [encoding]);
  const issues = useMemo(() => inspectDataset(dataset, meta), [dataset, meta]);
  const numCols = useMemo(() => numericColumns(dataset), [dataset]);
  const problems = issues.filter((i) => i.level !== "info");
  const hasAutoFix = issues.some((i) => i.fix?.auto);

  const change = (next: Dataset, message: string) => {
    setHistory((h) => [...h, dataset]);
    onChange(next);
    toast.success(message, { id: "data-fix", duration: 2500 });
  };

  const applyFix = (issue: Issue) => {
    if (issue.fix)
      change(issue.fix.apply(dataset), `고쳤어요: ${issue.fix.label}`);
  };

  const applyAll = () => {
    const { dataset: next, applied } = applyAutoFixes(dataset, meta);
    if (applied.length > 0) change(next, `${applied.length}가지를 고쳤어요`);
  };

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    onChange(prev);
    toast("되돌렸어요", { id: "data-fix", duration: 2000 });
  };

  const preview = dataset.rows.slice(0, PREVIEW_ROWS);
  const kind = (c: number) =>
    c === 0 ? "이름" : numCols.includes(c) ? "숫자" : "글자";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold">2. 데이터 확인</h2>
          <p className="mt-1 text-[12px] text-[color:var(--c-text-99a1b1)]">
            {dataset.name} · {dataset.rows.length.toLocaleString()}행 ·{" "}
            {dataset.headers.length}열. 차트로 바꾸기 전에 표 모양을 점검했어요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={undo}
              className="flex items-center gap-1.5 rounded-lg border border-[color:var(--c-border-e4e7ee)] px-3 py-2 text-[12px] font-bold text-[color:var(--c-text-667087)] hover:bg-[color:var(--c-bg-fafbfc)]"
            >
              <Undo2 size={13} /> 되돌리기
            </button>
          )}
          {hasAutoFix && (
            <button
              onClick={applyAll}
              className="flex items-center gap-1.5 rounded-lg bg-[color:var(--c-bg-2f66f5)] px-3.5 py-2 text-[12px] font-bold text-white hover:bg-[color:var(--c-bg-2757d6)]"
            >
              <Wand2 size={13} /> 추천 고치기 모두 적용
            </button>
          )}
        </div>
      </div>

      {problems.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-[color:var(--c-border-73c999)] bg-[color:var(--c-bg-f2fbf6)] px-4 py-3 text-[13px] font-medium text-[color:var(--c-text-43aa77)]">
          <CheckCircle2 size={17} /> 문제없어요. 이 표로 바로 차트를 만들 수
          있어요.
        </div>
      ) : (
        <p className="text-[12px] font-bold text-[color:var(--c-text-4a5272)]">
          확인이 필요한 곳 {problems.length}개
          {issues.some((i) => i.level === "error")
            ? " · 빨간 항목은 고쳐야 다음으로 갈 수 있어요"
            : " · 그대로 진행해도 돼요"}
        </p>
      )}

      {issues.length > 0 && (
        <ul className="flex flex-col gap-2.5" aria-label="점검 결과">
          {issues.map((issue) => {
            const { icon: Icon, box, iconColor } = levelStyle[issue.level];
            return (
              <li
                key={issue.id}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${box}`}
              >
                <Icon
                  size={17}
                  className={`mt-0.5 shrink-0 ${iconColor}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold">{issue.title}</p>
                  <p className="mt-0.5 text-[12px] leading-[1.7] text-[color:var(--c-text-4a5272)]">
                    {issue.detail}
                  </p>
                </div>
                {issue.fix && (
                  <button
                    onClick={() => applyFix(issue)}
                    className="shrink-0 rounded-lg border border-[color:var(--c-border-b9bfd3)] bg-[color:var(--c-bg-ffffff)] px-3 py-1.5 text-[12px] font-bold text-[color:var(--c-text-0c1b4c)] hover:bg-[color:var(--c-bg-fafafc)]"
                  >
                    {issue.fix.label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="overflow-x-auto rounded-lg border border-[color:var(--c-border-e3e6f0)]">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="bg-[color:var(--c-bg-fafafc)]">
              {dataset.headers.map((h, c) => (
                <th
                  key={c}
                  className="whitespace-nowrap border-b border-[color:var(--c-border-e3e6f0)] px-3 py-2 font-bold"
                >
                  {h || (
                    <span className="font-normal text-[color:var(--c-text-9aa1b8)]">
                      (이름 없음)
                    </span>
                  )}
                  <span
                    className={`ml-2 rounded-full px-1.5 py-px text-[10px] font-medium ${kind(c) === "숫자" ? "bg-[color:var(--c-bg-eaf0ff)] text-[color:var(--c-text-1f44b3)]" : "bg-[color:var(--c-bg-f1f3f9)] text-[color:var(--c-text-7b8497)]"}`}
                  >
                    {kind(c)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, r) => (
              <tr
                key={r}
                className="border-t border-[color:var(--c-border-edf0f5)]"
              >
                {dataset.headers.map((_, c) => (
                  <td key={c} className="whitespace-nowrap px-3 py-1.5">
                    {row[c] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dataset.rows.length > PREVIEW_ROWS && (
        <p className="-mt-3 text-[11px] text-[color:var(--c-text-99a1b1)]">
          앞 {PREVIEW_ROWS}줄만 보여줘요. (전체{" "}
          {dataset.rows.length.toLocaleString()}줄)
        </p>
      )}

      <p className="text-[12px] text-[color:var(--c-text-7b8497)]">
        표 모양이 복잡하다면{" "}
        <Link
          href="/guide"
          className="font-bold text-[color:var(--c-text-2f66f5)] hover:underline"
        >
          데이터 형식 안내
        </Link>
        에서 예시와 AI에 맡기는 방법을 볼 수 있어요.
      </p>
    </div>
  );
}
