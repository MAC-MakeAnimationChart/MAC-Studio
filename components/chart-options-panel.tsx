"use client";

import type { ReactNode } from "react";
import { COLOR_PRESETS, DEFAULT_BG } from "@/lib/chart-palette";
import type { Align, ChartSpec, TextStyle } from "@/lib/chart-spec";
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
  const topByValue = def.supports.topByValue;
  const topOn = spec.topN !== null;

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
        <div className="flex flex-col gap-1.5">
          <span className={caption}>표시 개수 (비우면 전부)</span>
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
        {topOn && topByValue && (
          <Field label="고르는 기준">
            <select
              value={spec.topMode}
              onChange={(e) =>
                set({ topMode: e.target.value as ChartSpec["topMode"] })
              }
              className={field}
            >
              <option value="first">앞에서부터</option>
              <option value="top">값이 큰 순서</option>
            </select>
          </Field>
        )}
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
