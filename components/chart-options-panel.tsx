"use client";

import { useMemo, useState, type ReactNode } from "react";
import { COLOR_PRESETS, DEFAULT_BG } from "@/lib/chart-palette";
import { prepareData } from "@/lib/chart-data";
import { CHART_FONTS } from "@/lib/chart-fonts";
import {
  COLOR_SERIES,
  MAX_SLICE_PICKERS,
  ramp,
  sliceColors,
} from "@/lib/chart-colors";
import type {
  Align,
  ChartSpec,
  LabelDir,
  RowSort,
  TextStyle,
} from "@/lib/chart-spec";
import { numericColumns, type Dataset } from "@/lib/csv";
import type { ChartDefinition } from "@/components/charts/types";

const field =
  "w-full rounded-lg border border-[color:var(--c-border-e4e7ee)] bg-[color:var(--c-bg-ffffff)] px-2.5 py-1.5 text-[12px] font-medium text-[color:var(--c-text-0c1b4c)] outline-none focus:border-[color:var(--c-border-4f7cf5)]";
const caption = "text-[11px] font-bold text-[color:var(--c-text-99a1b1)]";

function Section({
  title,
  children,
  open = false,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details
      open={open}
      className="group border-t border-[color:var(--c-border-edf0f5)] py-3 first:border-t-0 first:pt-0"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-[12px] font-bold text-[color:var(--c-text-0c1b4c)] [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-[10px] text-[color:var(--c-text-9aa1b8)] transition group-open:rotate-180">
          ▼
        </span>
      </summary>
      <div className="mt-2.5 flex flex-col gap-3">{children}</div>
    </details>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={caption}>{label}</span>
      {children}
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={`${caption} flex justify-between`}>
        {label}
        <span className="font-medium text-[color:var(--c-text-4a5272)]">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#2F66F5]"
      />
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[12px] font-medium text-[color:var(--c-text-4a5272)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[#2F66F5]"
      />
      {label}
    </label>
  );
}

const LABEL_DIRS: { value: LabelDir; label: string }[] = [
  { value: "horizontal", label: "가로" },
  { value: "vertical", label: "세로" },
  { value: "diagonal", label: "대각선" },
];

const ALIGNS: { value: Align; label: string }[] = [
  { value: "left", label: "왼쪽" },
  { value: "center", label: "가운데" },
  { value: "right", label: "오른쪽" },
];

// Size, bold and position for one line of text. Each line (대제목, 중제목) gets its own.
function TextStyleControls({
  style,
  min,
  max,
  onChange,
}: {
  style: TextStyle;
  min: number;
  max: number;
  onChange: (s: TextStyle) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-[color:var(--c-bg-fafafc)] p-2.5">
      <Slider
        label="글자 크기"
        value={style.size}
        min={min}
        max={max}
        unit="px"
        onChange={(size) => onChange({ ...style, size })}
      />
      <Check
        label="굵게"
        checked={style.bold}
        onChange={(bold) => onChange({ ...style, bold })}
      />
      <div
        role="radiogroup"
        aria-label="위치"
        className="grid grid-cols-3 gap-1"
      >
        {ALIGNS.map((a) => (
          <button
            key={a.value}
            type="button"
            role="radio"
            aria-checked={style.align === a.value}
            onClick={() => onChange({ ...style, align: a.value })}
            className={`rounded-md border py-1 text-[11px] font-bold ${style.align === a.value ? "border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-f3f7ff)] text-[color:var(--c-text-1f44b3)]" : "border-[color:var(--c-border-e3e6f0)] text-[color:var(--c-text-7b8497)] hover:bg-[color:var(--c-bg-ffffff)]"}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const PICK_PAGE_SIZE = 20;

// Tick rows one by one. Only one page (20 rows) is drawn at a time, so a dataset with thousands of
// rows opens instantly; "select all / clear" still act on every row, not just the visible page.
function RowPicker({
  dataset,
  labelCol,
  valueCol,
  picked,
  onChange,
}: {
  dataset: Dataset;
  labelCol: number;
  valueCol: number;
  picked: number[];
  onChange: (picked: number[]) => void;
}) {
  const rows = dataset.rows;
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / PICK_PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const from = current * PICK_PAGE_SIZE;
  const shown = rows.slice(from, from + PICK_PAGE_SIZE);
  const pickedSet = useMemo(() => new Set(picked), [picked]);

  const toggle = (n: number) =>
    onChange(pickedSet.has(n) ? picked.filter((x) => x !== n) : [...picked, n]);
  const pageNumbers = shown.map((_, i) => from + i + 1);
  const allOnPage = pageNumbers.every((n) => pickedSet.has(n));

  const link =
    "font-bold text-[color:var(--c-text-2f66f5)] hover:underline disabled:text-[color:var(--c-text-9aa1b8)] disabled:no-underline";
  const pagerBtn =
    "rounded-md border border-[color:var(--c-border-e3e6f0)] px-2 py-1 text-[11px] font-bold text-[color:var(--c-text-4a5272)] hover:bg-[color:var(--c-bg-fafafc)] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={`${caption} flex flex-wrap items-center justify-between gap-x-2`}
      >
        차트에 넣을 행 ({picked.length}/{rows.length})
        <span className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(rows.map((_, i) => i + 1))}
            className={link}
          >
            전체 선택
          </button>
          <button type="button" onClick={() => onChange([])} className={link}>
            선택 해제
          </button>
        </span>
      </span>
      <ul className="rounded-lg border border-[color:var(--c-border-e3e6f0)] p-1">
        <li>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[11px] font-bold text-[color:var(--c-text-7b8497)] hover:bg-[color:var(--c-bg-fafafc)]">
            <input
              type="checkbox"
              checked={allOnPage}
              onChange={() =>
                onChange(
                  allOnPage
                    ? picked.filter((n) => !pageNumbers.includes(n))
                    : [...new Set([...picked, ...pageNumbers])],
                )
              }
              className="size-3.5 accent-[#2F66F5]"
            />
            이 페이지 전체
          </label>
        </li>
        {shown.map((row, i) => {
          const n = from + i + 1;
          return (
            <li key={n}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[12px] hover:bg-[color:var(--c-bg-fafafc)]">
                <input
                  type="checkbox"
                  checked={pickedSet.has(n)}
                  onChange={() => toggle(n)}
                  className="size-3.5 accent-[#2F66F5]"
                />
                <span className="w-7 shrink-0 text-right text-[10px] text-[color:var(--c-text-9aa1b8)]">
                  {n}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {row[labelCol] || "(비어 있음)"}
                </span>
                <span className="shrink-0 text-[11px] text-[color:var(--c-text-7b8497)]">
                  {row[valueCol]}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage(current - 1)}
            disabled={current === 0}
            className={pagerBtn}
          >
            이전
          </button>
          <span className="text-[11px] text-[color:var(--c-text-7b8497)]">
            {current + 1} / {pages} 페이지
          </span>
          <button
            type="button"
            onClick={() => setPage(current + 1)}
            disabled={current >= pages - 1}
            className={pagerBtn}
          >
            다음
          </button>
        </div>
      )}
      {picked.length === 0 && (
        <span className="text-[11px] font-bold text-[color:var(--c-text-e0553a)]">
          행을 하나 이상 골라 주세요.
        </span>
      )}
    </div>
  );
}

// Colors for charts that color each category (pie). Up to MAX_SLICE_PICKERS categories every one
// has its own picker; with more, one color series is chosen for the whole chart.
function SliceColors({
  spec,
  labels,
  onChange,
}: {
  spec: ChartSpec;
  labels: string[];
  onChange: (patch: Partial<ChartSpec>) => void;
}) {
  const colors = sliceColors(spec, labels);

  const many = labels.length > MAX_SLICE_PICKERS;
  const seriesPicker = (
    <div className="flex flex-col gap-1.5">
      <span className={caption}>
        {many
          ? `색상 계열 (항목이 ${MAX_SLICE_PICKERS}개를 넘어서 계열로 골라요)`
          : "색상 계열 (고르면 모든 항목에 한 번에 적용돼요)"}
      </span>
      <div
        role="radiogroup"
        aria-label="색상 계열"
        className="flex flex-col gap-1"
      >
        {COLOR_SERIES.map((series) => {
          const on = spec.colorSeries.toLowerCase() === series.id.toLowerCase();
          const sample =
            series.id === "mixed"
              ? colorsForMixed(spec.color)
              : ramp(series.id, 8);
          return (
            <button
              key={series.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() =>
                // a series replaces the colors picked one by one
                onChange({ colorSeries: series.id, sliceColors: {} })
              }
              className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left ${on ? "border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-f3f7ff)]" : "border-[color:var(--c-border-e3e6f0)] hover:bg-[color:var(--c-bg-fafafc)]"}`}
            >
              <span className="flex h-4 w-24 shrink-0 overflow-hidden rounded">
                {sample.map((c, i) => (
                  <span
                    key={i}
                    className="h-full flex-1"
                    style={{ background: c }}
                  />
                ))}
              </span>
              <span className="text-[12px] font-bold">{series.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (many) return seriesPicker;

  if (labels.length === 0) {
    return (
      <p className="text-[11px] text-[color:var(--c-text-99a1b1)]">
        차트에 들어간 행이 없어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {seriesPicker}
      <div className="flex flex-col gap-1.5">
        <span className={caption}>항목별 색 (눌러서 직접 고르기)</span>
        <ul className="flex flex-col gap-1">
          {labels.map((label, i) => {
            const custom = spec.sliceColors[label] !== undefined;
            return (
              <li key={`${i}-${label}`}>
                <div className="flex items-center gap-2.5 rounded-lg border border-[color:var(--c-border-e3e6f0)] px-2 py-1.5">
                  <input
                    type="color"
                    value={colors[i]}
                    onChange={(e) =>
                      onChange({
                        sliceColors: {
                          ...spec.sliceColors,
                          [label]: e.target.value,
                        },
                      })
                    }
                    aria-label={`${label} 색`}
                    className="size-6 shrink-0 cursor-pointer rounded-md border border-[color:var(--c-border-e4e7ee)] bg-[color:var(--c-bg-ffffff)] p-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                    {label || "(비어 있음)"}
                  </span>
                  {custom && (
                    <button
                      type="button"
                      onClick={() => {
                        const rest = { ...spec.sliceColors };
                        delete rest[label];
                        onChange({ sliceColors: rest });
                      }}
                      className="shrink-0 text-[11px] font-bold text-[color:var(--c-text-2f66f5)] hover:underline"
                    >
                      기본색
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// A short preview of the mixed palette (the hues a pie cycles through).
const colorsForMixed = (first: string) =>
  [
    first,
    ...COLOR_PRESETS.map((c) => c.value).filter(
      (c) => c.toLowerCase() !== first.toLowerCase(),
    ),
  ].slice(0, 8);

type Props = {
  spec: ChartSpec;
  dataset: Dataset;
  def: ChartDefinition;
  onChange: (spec: ChartSpec) => void;
};

export function ChartOptionsPanel({ spec, dataset, def, onChange }: Props) {
  const set = (patch: Partial<ChartSpec>) => onChange({ ...spec, ...patch });
  const numCols = numericColumns(dataset);
  const rows = dataset.rows.length;
  const sortable = def.supports.sortable;
  const topOn = spec.topN !== null;
  // the categories as drawn: after the row pick, sort and top N
  const labels = prepareData(dataset, spec, sortable).labels;

  return (
    <div className="flex flex-col">
      <Section title="데이터" open>
        <Field label="항목 이름 열">
          <select
            value={spec.labelCol}
            onChange={(e) => set({ labelCol: Number(e.target.value) })}
            className={field}
          >
            {dataset.headers.map((h, i) => (
              <option key={i} value={i}>
                {h || `열 ${i + 1}`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="값 열">
          <select
            value={spec.valueCol}
            onChange={(e) => set({ valueCol: Number(e.target.value) })}
            className={field}
          >
            {numCols.map((i) => (
              <option key={i} value={i}>
                {dataset.headers[i] || `열 ${i + 1}`}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className={caption}>행 선택</span>
          <div
            role="radiogroup"
            aria-label="행 고르는 방식"
            className="grid grid-cols-2 gap-1"
          >
            {(
              [
                ["range", "범위로 고르기"],
                ["manual", "직접 선택"],
              ] as const
            ).map(([mode, text]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={spec.rowMode === mode}
                onClick={() => set({ rowMode: mode })}
                className={`rounded-md border py-1.5 text-[11px] font-bold ${spec.rowMode === mode ? "border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-f3f7ff)] text-[color:var(--c-text-1f44b3)]" : "border-[color:var(--c-border-e3e6f0)] text-[color:var(--c-text-7b8497)] hover:bg-[color:var(--c-bg-fafafc)]"}`}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
        {spec.rowMode === "range" ? (
          <div className="flex flex-col gap-1.5">
            <span className={caption}>
              행 범위 (데이터셋 탭에서 행 번호를 눌러도 돼요)
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={rows}
                value={spec.rowStart}
                aria-label="시작 행"
                onChange={(e) =>
                  set({
                    rowStart: Math.min(
                      Math.max(1, Number(e.target.value) || 1),
                      spec.rowEnd ?? rows,
                    ),
                  })
                }
                className={field}
              />
              <span className="text-[11px] text-[color:var(--c-text-9aa1b8)]">
                ~
              </span>
              <input
                type="number"
                min={1}
                max={rows}
                value={spec.rowEnd ?? rows}
                aria-label="끝 행"
                onChange={(e) =>
                  set({
                    rowEnd: Math.min(
                      rows,
                      Math.max(spec.rowStart, Number(e.target.value) || rows),
                    ),
                  })
                }
                className={field}
              />
            </div>
            {(spec.rowStart !== 1 || spec.rowEnd !== null) && (
              <button
                type="button"
                onClick={() => set({ rowStart: 1, rowEnd: null })}
                className="self-start text-[11px] font-bold text-[color:var(--c-text-2f66f5)] hover:underline"
              >
                전체 행으로
              </button>
            )}
          </div>
        ) : (
          <RowPicker
            dataset={dataset}
            labelCol={spec.labelCol}
            valueCol={spec.valueCol}
            picked={spec.picked}
            onChange={(picked) => set({ picked })}
          />
        )}
        {sortable && (
          <Field label="정렬">
            <select
              value={spec.sort}
              onChange={(e) => set({ sort: e.target.value as RowSort })}
              className={field}
            >
              <option value="none">데이터 순서 그대로</option>
              <option value="valueDesc">값 큰 순 (내림차순)</option>
              <option value="valueAsc">값 작은 순 (오름차순)</option>
              <option value="nameAsc">이름 순 (가나다·ABC)</option>
              <option value="nameDesc">이름 역순</option>
            </select>
          </Field>
        )}
        <div className="flex flex-col gap-1.5">
          <span className={caption}>
            표시 개수 (정렬 순서대로 앞에서부터, 비우면 전부)
          </span>
          <input
            type="number"
            min={1}
            placeholder="전체"
            value={spec.topN ?? ""}
            aria-label="표시 개수"
            onChange={(e) =>
              set({
                topN:
                  e.target.value === ""
                    ? null
                    : Math.max(1, Number(e.target.value) || 1),
              })
            }
            className={field}
          />
        </div>
        {topOn && (
          <Check
            label="나머지는 ‘기타’로 묶기"
            checked={spec.groupOthers}
            onChange={(groupOthers) => set({ groupOthers })}
          />
        )}
      </Section>

      <Section title="제목" open>
        <Field label="대제목">
          <input
            value={spec.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="대제목"
            className={field}
          />
        </Field>
        <TextStyleControls
          style={spec.titleStyle}
          min={12}
          max={40}
          onChange={(titleStyle) => set({ titleStyle })}
        />
        <Field label="중제목">
          <input
            value={spec.subtitle}
            onChange={(e) => set({ subtitle: e.target.value })}
            placeholder="중제목 (선택)"
            className={field}
          />
        </Field>
        <TextStyleControls
          style={spec.subtitleStyle}
          min={9}
          max={28}
          onChange={(subtitleStyle) => set({ subtitleStyle })}
        />
      </Section>

      <Section title="색상">
        {def.supports.sliceColors ? (
          <SliceColors
            spec={spec}
            labels={labels}
            onChange={(patch) => set(patch)}
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className={caption}>차트 색</span>
            <div
              role="radiogroup"
              aria-label="차트 색"
              className="flex flex-wrap items-center gap-2"
            >
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={
                    spec.color.toLowerCase() === c.value.toLowerCase()
                  }
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => set({ color: c.value })}
                  className={`size-7 rounded-full border-2 ${spec.color.toLowerCase() === c.value.toLowerCase() ? "border-[color:var(--c-border-0c1b4c)]" : "border-[color:var(--c-border-ffffff)] ring-1 ring-[color:var(--c-border-e4e7ee)]"}`}
                  style={{ background: c.value }}
                />
              ))}
              <input
                type="color"
                value={spec.color}
                onChange={(e) => set({ color: e.target.value })}
                aria-label="직접 고른 차트 색"
                title="직접 고르기"
                className="size-7 cursor-pointer rounded-full border border-[color:var(--c-border-e4e7ee)] bg-[color:var(--c-bg-ffffff)] p-0"
              />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <span className={caption}>배경 색</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={spec.bg}
              onChange={(e) => set({ bg: e.target.value })}
              aria-label="배경 색"
              className="size-7 cursor-pointer rounded-md border border-[color:var(--c-border-e4e7ee)] bg-[color:var(--c-bg-ffffff)] p-0"
            />
            <span className="text-[11px] text-[color:var(--c-text-7b8497)]">
              {spec.bg.toUpperCase()}
            </span>
            {spec.bg.toLowerCase() !== DEFAULT_BG.toLowerCase() && (
              <button
                type="button"
                onClick={() => set({ bg: DEFAULT_BG })}
                className="text-[11px] font-bold text-[color:var(--c-text-2f66f5)] hover:underline"
              >
                흰색으로
              </button>
            )}
          </div>
        </div>
      </Section>

      {def.supports.barWidth && (
        <Section title="막대">
          <Slider
            label="막대 두께 (남는 폭이 간격이 돼요)"
            value={spec.barWidth}
            min={20}
            max={100}
            unit="%"
            onChange={(barWidth) => set({ barWidth })}
          />
          <Slider
            label="명암 (왼쪽은 어둡게, 오른쪽은 밝게)"
            value={spec.barShade}
            min={-50}
            max={50}
            onChange={(barShade) => set({ barShade })}
          />
        </Section>
      )}

      {def.supports.axes && (
        <Section title="축 글자">
          <Slider
            label="글자 크기"
            value={spec.textSize}
            min={8}
            max={20}
            unit="px"
            onChange={(textSize) => set({ textSize })}
          />
          <Check
            label="굵게"
            checked={spec.textBold}
            onChange={(textBold) => set({ textBold })}
          />
          <div className="flex flex-col gap-1.5">
            <span className={caption}>X축 글자 방향</span>
            <div
              role="radiogroup"
              aria-label="X축 글자 방향"
              className="grid grid-cols-3 gap-1"
            >
              {LABEL_DIRS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  role="radio"
                  aria-checked={spec.xLabelDir === d.value}
                  onClick={() => set({ xLabelDir: d.value })}
                  className={`rounded-md border py-1 text-[11px] font-bold ${spec.xLabelDir === d.value ? "border-[color:var(--c-border-4f7cf5)] bg-[color:var(--c-bg-f3f7ff)] text-[color:var(--c-text-1f44b3)]" : "border-[color:var(--c-border-e3e6f0)] text-[color:var(--c-text-7b8497)] hover:bg-[color:var(--c-bg-fafafc)]"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section title="범례">
        <Check
          label="범례 표시"
          checked={spec.legend}
          onChange={(legend) => set({ legend })}
        />
        {spec.legend && (
          <>
            <Slider
              label="글자 크기"
              value={spec.legendSize}
              min={9}
              max={20}
              unit="px"
              onChange={(legendSize) => set({ legendSize })}
            />
            <Check
              label="굵게"
              checked={spec.legendBold}
              onChange={(legendBold) => set({ legendBold })}
            />
          </>
        )}
      </Section>

      <Section title="글꼴">
        <Field label="차트 안의 모든 글자">
          <select
            value={spec.font}
            onChange={(e) => set({ font: e.target.value })}
            className={field}
          >
            {CHART_FONTS.map((f) => (
              <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-[11px] leading-[1.6] text-[color:var(--c-text-99a1b1)]">
          내 컴퓨터에 설치된 글꼴이 쓰여요. 내려받은 이미지도 지금 보이는 글꼴
          그대로예요.
        </p>
      </Section>

      <Section title="여백">
        {(
          [
            ["top", "위"],
            ["bottom", "아래"],
            ["left", "왼쪽"],
            ["right", "오른쪽"],
          ] as const
        ).map(([side, text]) => (
          <Slider
            key={side}
            label={`${text} 여백`}
            value={spec.margin[side]}
            min={0}
            max={120}
            unit="px"
            onChange={(v) => set({ margin: { ...spec.margin, [side]: v } })}
          />
        ))}
        <p className="text-[11px] leading-[1.6] text-[color:var(--c-text-99a1b1)]">
          여백을 늘리면 차트는 그대로이고 캔버스(이미지) 크기가 커져요.
        </p>
      </Section>

      <Section title="데이터 출처">
        <Field label="차트 아래에 표시할 문구">
          <input
            value={spec.footer}
            onChange={(e) => set({ footer: e.target.value })}
            placeholder="예: 출처: 통계청, 2025"
            className={field}
          />
        </Field>
      </Section>
    </div>
  );
}
