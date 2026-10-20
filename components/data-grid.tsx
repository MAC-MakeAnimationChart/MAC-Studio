"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ChartSpec } from "@/lib/chart-spec";
import { numericColumns, type Dataset } from "@/lib/csv";

const MAX_EDIT_ROWS = 500;

// A, B, ... Z, AA, AB ... like a spreadsheet
const columnLetter = (i: number) => {
  let n = i;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

type Props = {
  dataset: Dataset;
  spec: ChartSpec;
  onDataset: (ds: Dataset) => void;
  onSpec: (spec: ChartSpec) => void;
};

// Spreadsheet-style view of the uploaded file. Cells are editable, and clicking row numbers
// picks which rows the chart draws (click = first row, shift+click = last row).
export function DataGrid({ dataset, spec, onDataset, onSpec }: Props) {
  const numCols = numericColumns(dataset);
  const total = dataset.rows.length;
  const start = spec.rowStart;
  const end = Math.min(spec.rowEnd ?? total, total);
  const rangeIsAll = start === 1 && end === total;
  const visible = Math.min(total, MAX_EDIT_ROWS);

  const editCell = (r: number, c: number, value: string) =>
    onDataset({
      ...dataset,
      rows: dataset.rows.map((row, i) =>
        i === r ? row.map((v, j) => (j === c ? value : v)) : row,
      ),
    });
  const editHeader = (c: number, value: string) =>
    onDataset({
      ...dataset,
      headers: dataset.headers.map((h, i) => (i === c ? value : h)),
    });
  const addRow = () =>
    onDataset({
      ...dataset,
      rows: [
        ...dataset.rows,
        dataset.headers.map((_, j) => (j === 0 ? "" : "0")),
      ],
    });
  const addColumn = () =>
    onDataset({
      ...dataset,
      headers: [...dataset.headers, `열${dataset.headers.length + 1}`],
      rows: dataset.rows.map((r) => [...r, "0"]),
    });
  const deleteRow = (r: number) =>
    onDataset({ ...dataset, rows: dataset.rows.filter((_, i) => i !== r) });

  const pickRow = (r: number, shift: boolean) => {
    const n = r + 1;
    if (!shift)
      return onSpec({
        ...spec,
        rowStart: n,
        rowEnd: spec.rowEnd !== null && spec.rowEnd < n ? null : spec.rowEnd,
      });
    const first = Math.min(start, n);
    const last = Math.max(start, n);
    onSpec({ ...spec, rowStart: first, rowEnd: last >= total ? null : last });
  };

  const cell = "border border-[color:var(--c-border-e3e6f0)]";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 text-[12px]">
          <span className="font-bold text-[color:var(--c-text-0c1b4c)]">
            차트로 그릴 영역: {rangeIsAll ? "전체" : `${start}~${end}행`} · 이름{" "}
            {columnLetter(spec.labelCol)}열 · 값 {columnLetter(spec.valueCol)}열
          </span>
          <span className="text-[color:var(--c-text-99a1b1)]">
            행 번호를 누르면 시작 행, Shift를 누르고 누르면 끝 행이 정해져요.
            값을 고치면 차트에 바로 반영돼요.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!rangeIsAll && (
            <button
              onClick={() => onSpec({ ...spec, rowStart: 1, rowEnd: null })}
              className="rounded-lg border border-[color:var(--c-border-e4e7ee)] px-3 py-2 text-[12px] font-bold text-[color:var(--c-text-667087)] hover:bg-[color:var(--c-bg-fafbfc)]"
            >
              전체 행 사용
            </button>
          )}
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 rounded-lg border border-[color:var(--c-border-e4e7ee)] px-3 py-2 text-[12px] font-bold text-[color:var(--c-text-667087)] hover:bg-[color:var(--c-bg-fafbfc)]"
          >
            <Plus size={13} /> 열 추가
          </button>
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 rounded-lg border border-[color:var(--c-border-e4e7ee)] px-3 py-2 text-[12px] font-bold text-[color:var(--c-text-667087)] hover:bg-[color:var(--c-bg-fafbfc)]"
          >
            <Plus size={13} /> 행 추가
          </button>
        </div>
      </div>

      <div className="max-h-[68vh] overflow-auto rounded-lg border border-[color:var(--c-border-e3e6f0)] bg-[color:var(--c-bg-ffffff)]">
        <table className="border-collapse text-left text-[12px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[color:var(--c-bg-f1f3f9)] text-center text-[11px] font-bold text-[color:var(--c-text-7b8497)]">
              <th className={`${cell} w-12 min-w-12`} />
              {dataset.headers.map((_, c) => (
                <th
                  key={c}
                  className={`${cell} px-2 py-1 ${c === spec.labelCol || c === spec.valueCol ? "bg-[color:var(--c-bg-e3ecff)] text-[color:var(--c-text-1f44b3)]" : ""}`}
                >
                  {columnLetter(c)}
                  {c === spec.labelCol && (
                    <span className="ml-1 font-medium">이름</span>
                  )}
                  {c === spec.valueCol && (
                    <span className="ml-1 font-medium">값</span>
                  )}
                </th>
              ))}
              <th className="w-10" />
            </tr>
            <tr className="bg-[color:var(--c-bg-fafafc)]">
              <th
                className={`${cell} text-center text-[10px] font-medium text-[color:var(--c-text-9aa1b8)]`}
              >
                제목
              </th>
              {dataset.headers.map((h, c) => (
                <th key={c} className={`${cell} p-0`}>
                  <input
                    value={h}
                    onChange={(e) => editHeader(c, e.target.value)}
                    aria-label={`${columnLetter(c)}열 이름`}
                    className="w-full min-w-[96px] bg-transparent px-2 py-1.5 font-bold text-[color:var(--c-text-0c1b4c)] outline-none focus:bg-[color:var(--c-bg-ffffff)] focus:ring-1 focus:ring-[color:var(--c-border-4f7cf5)]"
                  />
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {dataset.rows.slice(0, visible).map((row, r) => {
              const inRange = r + 1 >= start && r + 1 <= end;
              return (
                <tr
                  key={r}
                  className={
                    inRange
                      ? "bg-[color:var(--c-bg-f3f7ff)]"
                      : "bg-[color:var(--c-bg-ffffff)] text-[color:var(--c-text-9aa1b8)]"
                  }
                >
                  <th
                    className={`${cell} bg-[color:var(--c-bg-f1f3f9)] p-0 text-center`}
                  >
                    <button
                      onClick={(e) => pickRow(r, e.shiftKey)}
                      aria-label={`${r + 1}행 (눌러서 시작 행으로, Shift+눌러서 끝 행으로)`}
                      title="누르면 시작 행, Shift+누르면 끝 행"
                      className={`w-full px-2 py-1.5 text-[11px] font-bold ${inRange ? "text-[color:var(--c-text-1f44b3)]" : "text-[color:var(--c-text-9aa1b8)]"} hover:bg-[color:var(--c-bg-e3ecff)]`}
                    >
                      {r + 1}
                    </button>
                  </th>
                  {dataset.headers.map((h, c) => {
                    const bad =
                      numCols.includes(c) &&
                      (row[c] ?? "") !== "" &&
                      Number.isNaN(Number((row[c] ?? "").replace(/,/g, "")));
                    return (
                      <td key={c} className={`${cell} p-0`}>
                        <input
                          value={row[c] ?? ""}
                          onChange={(e) => editCell(r, c, e.target.value)}
                          aria-label={`${r + 1}행 ${h}`}
                          aria-invalid={bad}
                          className={`w-full min-w-[96px] bg-transparent px-2 py-1.5 outline-none focus:bg-[color:var(--c-bg-ffffff)] focus:ring-1 focus:ring-[color:var(--c-border-4f7cf5)] ${bad ? "bg-[color:var(--c-bg-fff6f4)] ring-1 ring-[color:var(--c-border-e0553a)]" : ""} ${inRange ? "text-[color:var(--c-text-0c1b4c)]" : ""}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-1 text-center">
                    <button
                      onClick={() => deleteRow(r)}
                      className="rounded-md p-1.5 text-[color:var(--c-text-b1b7c4)] hover:bg-[color:var(--c-bg-f5f6fa)] hover:text-[color:var(--c-text-e0553a)]"
                      aria-label={`${r + 1}행 삭제`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {total > visible && (
        <p className="text-[11px] text-[color:var(--c-text-99a1b1)]">
          처음 {visible}행만 보여요. (전체 {total.toLocaleString()}행)
        </p>
      )}
    </div>
  );
}
